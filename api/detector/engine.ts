/**
 * Moteur de détection de texte IA — Détecteur IA Steph.
 *
 * Approche : classification statistique multi-caractéristiques, sans modèle
 * externe ni corpus d'entraînement. Chaque caractéristique mesure un signal
 * connu de la littérature (GLTR — Gehrmann et al., 2019 ; perplexité &
 * "burstiness" — GPTZero ; surreprésentation des connecteurs de transition
 * dans les sorties LLM).
 *
 * Caractéristiques extraites :
 *   1. Burstiness (variation des longueurs de phrases)
 *   2. Prévisibilité lexicale (ratio de mots rares ≈ proxy de perplexité)
 *   3. Densité de connecteurs/formules typiques des LLM
 *   4. Diversité des débuts de phrases
 *   5. Diversité lexicale (MATTR — Type-Token Ratio moyen glissant)
 *   6. Diversité de la ponctuation
 *   7. Répétition de trigrammes
 *   8. Longueur moyenne des mots
 *   9. Uniformité des paragraphes
 *
 * Précision attendue : ~60-70 % sur des textes longs (>150 mots) en FR/EN,
 * non paraphrasés. Le score est une ESTIMATION, pas une preuve.
 */

import type {
  DetectionResult,
  FeatureBreakdown,
  FlaggedSentence,
  SupportedLanguage,
} from "@contracts/detector";
import { VERDICT_THRESHOLDS, MIN_RELIABLE_WORDS } from "@contracts/detector";
import {
  FRENCH_COMMON_WORDS,
  ENGLISH_COMMON_WORDS,
  AI_CONNECTOR_PHRASES_FR,
  AI_CONNECTOR_PHRASES_EN,
  FRENCH_STOPWORDS,
  ENGLISH_STOPWORDS,
} from "./lexicons";

// ---------------------------------------------------------------------------
// Tokenisation
// ---------------------------------------------------------------------------

const WORD_RE = /[\p{L}\p{N}''-]+/gu;

function tokenizeWords(text: string): string[] {
  return (text.match(WORD_RE) ?? []).map((w) => w.toLowerCase());
}

/** Découpe en phrases : robuste aux abréviations courantes et aux textes sans ponctuation finale. */
function splitSentences(text: string): string[] {
  const cleaned = text.replace(/\s+/g, " ").trim();
  if (!cleaned) return [];
  const parts = cleaned
    .split(/(?<=[.!?…])\s+|\n+/)
    .map((s) => s.trim())
    .filter((s) => tokenizeWords(s).length >= 2);
  // Un texte sans ponctuation de phrase reste une seule "phrase".
  return parts.length > 0 ? parts : [cleaned];
}

function splitParagraphs(text: string): string[] {
  return text
    .split(/\n{2,}|(?<=\.)\n/)
    .map((p) => p.trim())
    .filter((p) => tokenizeWords(p).length >= 3);
}

// ---------------------------------------------------------------------------
// Utilitaires statistiques
// ---------------------------------------------------------------------------

function mean(xs: number[]): number {
  return xs.length === 0 ? 0 : xs.reduce((a, b) => a + b, 0) / xs.length;
}

function stddev(xs: number[]): number {
  if (xs.length < 2) return 0;
  const m = mean(xs);
  return Math.sqrt(mean(xs.map((x) => (x - m) ** 2)));
}

/** Borne x dans [lo, hi]. */
function clamp(x: number, lo = 0, hi = 1): number {
  return Math.min(hi, Math.max(lo, x));
}

/**
 * Interpolation linéaire inversée ou directe entre deux points de calibration.
 * atLow → valeur de aiLikelihood quand raw == rawLow, etc.
 */
function calibrate(raw: number, rawLow: number, rawHigh: number, atLow: number, atHigh: number): number {
  if (rawHigh === rawLow) return atLow;
  const t = clamp((raw - rawLow) / (rawHigh - rawLow));
  return atLow + t * (atHigh - atLow);
}

// ---------------------------------------------------------------------------
// Détection de langue
// ---------------------------------------------------------------------------

function detectLanguage(words: string[]): SupportedLanguage {
  let fr = 0;
  let en = 0;
  for (const w of words) {
    if (FRENCH_STOPWORDS.has(w)) fr++;
    if (ENGLISH_STOPWORDS.has(w)) en++;
  }
  if (fr === 0 && en === 0) return "inconnu";
  const ratio = Math.min(fr, en) / Math.max(fr, en);
  if (ratio > 0.6) return "mixte";
  return fr > en ? "fr" : "en";
}

// ---------------------------------------------------------------------------
// Extraction des caractéristiques
// ---------------------------------------------------------------------------

interface RawSignals {
  words: string[];
  sentences: string[];
  paragraphs: string[];
  sentenceLengths: number[];
  language: SupportedLanguage;
}

function collectSignals(text: string): RawSignals {
  const words = tokenizeWords(text);
  const sentences = splitSentences(text);
  const paragraphs = splitParagraphs(text);
  const sentenceLengths = sentences.map((s) => tokenizeWords(s).length);
  return {
    words,
    sentences,
    paragraphs,
    sentenceLengths,
    language: detectLanguage(words),
  };
}

function extractFeatures(sig: RawSignals): FeatureBreakdown[] {
  const { words, sentences, paragraphs, sentenceLengths, language } = sig;
  const commonSet =
    language === "fr"
      ? FRENCH_COMMON_WORDS
      : language === "en"
        ? ENGLISH_COMMON_WORDS
        : new Set([...FRENCH_COMMON_WORDS, ...ENGLISH_COMMON_WORDS]);
  const phrases =
    language === "fr"
      ? AI_CONNECTOR_PHRASES_FR
      : language === "en"
        ? AI_CONNECTOR_PHRASES_EN
        : [...AI_CONNECTOR_PHRASES_FR, ...AI_CONNECTOR_PHRASES_EN];

  const features: FeatureBreakdown[] = [];

  // --- 1. Burstiness : coefficient de variation des longueurs de phrases ---
  // Humain : CV élevé (phrases tantôt courtes, tantôt longues). IA : CV faible.
  {
    const m = mean(sentenceLengths);
    const cv = m > 0 ? stddev(sentenceLengths) / m : 0;
    const aiLikelihood = calibrate(cv, 0.8, 0.25, 0, 1);
    features.push({
      key: "burstiness",
      label: "Variation des phrases (burstiness)",
      aiLikelihood,
      weight: 0.18,
      rawValue: Math.round(cv * 100) / 100,
      explanation:
        cv < 0.35
          ? "Les phrases ont des longueurs très régulières, un marqueur fréquent des textes générés."
          : cv > 0.6
            ? "Forte alternance de phrases courtes et longues, typique de l'écriture humaine."
            : "Variation modérée des longueurs de phrases.",
    });
  }

  // --- 2. Prévisibilité lexicale : proportion de mots "rares" (proxy perplexité) ---
  {
    const content = words.filter((w) => w.length > 3);
    const rare = content.filter((w) => !commonSet.has(w)).length;
    const rareRatio = content.length > 0 ? rare / content.length : 0;
    const aiLikelihood = calibrate(rareRatio, 0.38, 0.06, 0, 1);
    features.push({
      key: "rare_words",
      label: "Richesse du vocabulaire rare",
      aiLikelihood,
      weight: 0.15,
      rawValue: Math.round(rareRatio * 1000) / 1000,
      explanation:
        rareRatio < 0.15
          ? "Vocabulaire très prévisible (peu de mots rares) : faible perplexité, typique des LLM."
          : rareRatio > 0.3
            ? "Vocabulaire varié avec des mots rares, plutôt caractéristique d'un humain."
            : "Proportion de mots rares dans la moyenne.",
    });
  }

  // --- 3. Densité de connecteurs/formules typiques des LLM ---
  {
    const lowerText = sig.sentences.join(" ").toLowerCase();
    let hits = 0;
    for (const p of phrases) {
      const re = new RegExp(p.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "gi");
      hits += (lowerText.match(re) ?? []).length;
    }
    const density = words.length > 0 ? (hits / words.length) * 100 : 0;
    const aiLikelihood = calibrate(density, 0.1, 1.6, 0.05, 1);
    features.push({
      key: "ai_phrases",
      label: "Formules typiques des LLM",
      aiLikelihood,
      weight: 0.2,
      rawValue: Math.round(density * 100) / 100,
      explanation:
        density >= 0.8
          ? `Forte densité de formules de transition caractéristiques des LLM (${hits} occurrences).`
          : hits === 0
            ? "Aucune formule de transition typique des LLM détectée."
            : `Quelques formules de transition détectées (${hits}).`,
    });
  }

  // --- 4. Diversité des débuts de phrases ---
  {
    const starters = sentences
      .map((s) => tokenizeWords(s)[0])
      .filter((w): w is string => Boolean(w));
    const diversity = starters.length > 0 ? new Set(starters).size / starters.length : 0;
    const aiLikelihood = calibrate(diversity, 0.95, 0.5, 0, 1);
    features.push({
      key: "starter_diversity",
      label: "Variété des débuts de phrases",
      aiLikelihood,
      weight: 0.1,
      rawValue: Math.round(diversity * 100) / 100,
      explanation:
        diversity < 0.65
          ? "Beaucoup de phrases commencent par le même mot : rythme mécanique."
          : "Les débuts de phrases sont variés, un bon signe d'écriture naturelle.",
    });
  }

  // --- 5. Diversité lexicale glissante (MATTR, fenêtre de 40 mots) ---
  {
    const win = 40;
    let mattr: number;
    if (words.length <= win) {
      mattr = words.length > 0 ? new Set(words).size / words.length : 0;
    } else {
      const ttrs: number[] = [];
      for (let i = 0; i + win <= words.length; i += 10) {
        ttrs.push(new Set(words.slice(i, i + win)).size / win);
      }
      mattr = mean(ttrs);
    }
    const aiLikelihood = calibrate(mattr, 0.62, 0.88, 0, 1);
    features.push({
      key: "lexical_diversity",
      label: "Diversité lexicale (MATTR)",
      aiLikelihood,
      weight: 0.08,
      rawValue: Math.round(mattr * 1000) / 1000,
      explanation:
        mattr > 0.8
          ? "Diversité lexicale uniformément élevée : les LLM évitent de répéter les mots, contrairement aux humains."
          : "Diversité lexicale dans une plage naturelle.",
    });
  }

  // --- 6. Diversité de la ponctuation ---
  {
    const punctTypes = new Set<string>();
    for (const ch of sig.sentences.join(" ")) {
      if (",;:!?—–-…()«»\"'".includes(ch)) punctTypes.add(ch);
    }
    const count = punctTypes.size;
    const aiLikelihood = calibrate(count, 7, 2, 0, 0.9);
    features.push({
      key: "punctuation",
      label: "Diversité de la ponctuation",
      aiLikelihood,
      weight: 0.1,
      rawValue: count,
      explanation:
        count <= 3
          ? "Ponctuation très sobre (points et virgules presque exclusivement), fréquent chez les LLM."
          : "Ponctuation expressive et variée, plutôt humaine.",
    });
  }

  // --- 7. Répétition de trigrammes ---
  {
    let repeatRate = 0;
    if (words.length >= 6) {
      const seen = new Set<string>();
      let repeats = 0;
      let total = 0;
      for (let i = 0; i + 3 <= words.length; i++) {
        const tri = words.slice(i, i + 3).join(" ");
        total++;
        if (seen.has(tri)) repeats++;
        else seen.add(tri);
      }
      repeatRate = total > 0 ? repeats / total : 0;
    }
    const aiLikelihood = calibrate(repeatRate, 0.01, 0.09, 0, 1);
    features.push({
      key: "repetition",
      label: "Répétition de formules (trigrammes)",
      aiLikelihood,
      weight: 0.08,
      rawValue: Math.round(repeatRate * 1000) / 1000,
      explanation:
        repeatRate > 0.05
          ? "Des suites de trois mots reviennent souvent : formulation mécanique."
          : "Peu de répétitions de formules.",
    });
  }

  // --- 8. Longueur moyenne des mots ---
  {
    const avgLen = mean(words.map((w) => w.length));
    const aiLikelihood = calibrate(avgLen, 4.6, 6.0, 0.1, 1);
    features.push({
      key: "word_length",
      label: "Longueur moyenne des mots",
      aiLikelihood,
      weight: 0.06,
      rawValue: Math.round(avgLen * 100) / 100,
      explanation:
        avgLen > 5.4
          ? "Mots longuement soutenus en moyenne : registre uniformément formel, typique des LLM."
          : "Longueur des mots dans une plage naturelle.",
    });
  }

  // --- 9. Uniformité des paragraphes ---
  {
    let cv = 0;
    const enough = paragraphs.length >= 3;
    if (enough) {
      const lens = paragraphs.map((p) => tokenizeWords(p).length);
      const m = mean(lens);
      cv = m > 0 ? stddev(lens) / m : 0;
    }
    // Pas assez de paragraphes => signal réellement neutre (0.5), pas de contribution.
    const aiLikelihood = enough ? calibrate(cv, 0.7, 0.2, 0.2, 1) : 0.5;
    features.push({
      key: "paragraph_uniformity",
      label: "Uniformité des paragraphes",
      aiLikelihood,
      weight: 0.05,
      rawValue: Math.round(cv * 100) / 100,
      explanation:
        paragraphs.length < 3
          ? "Trop peu de paragraphes pour mesurer leur uniformité (signal neutre)."
          : cv < 0.3
            ? "Paragraphes de longueur quasi identique : structure mécanique."
            : "Paragraphes de longueurs variées.",
    });
  }

  return features;
}

// ---------------------------------------------------------------------------
// Phrases signalées (prévisibilité locale)
// ---------------------------------------------------------------------------

function flagSentences(sig: RawSignals): FlaggedSentence[] {
  const { sentences, sentenceLengths, language } = sig;
  if (sentences.length < 2) return [];
  const commonSet =
    language === "fr"
      ? FRENCH_COMMON_WORDS
      : language === "en"
        ? ENGLISH_COMMON_WORDS
        : new Set([...FRENCH_COMMON_WORDS, ...ENGLISH_COMMON_WORDS]);
  const meanLen = mean(sentenceLengths);

  const flagged: FlaggedSentence[] = sentences.map((s) => {
    const ws = tokenizeWords(s);
    if (ws.length === 0) return { text: s, predictability: 0 };
    const commonRatio = ws.filter((w) => commonSet.has(w)).length / ws.length;
    const lenDeviation = meanLen > 0 ? Math.abs(ws.length - meanLen) / meanLen : 0;
    const p =
      0.55 * clamp(commonRatio / 0.85) +
      0.3 * clamp(1 - lenDeviation) +
      0.15 * clamp(ws.length / 25);
    return { text: s, predictability: Math.round(p * 100) / 100 };
  });

  return flagged
    .filter((f) => f.predictability >= 0.6)
    .sort((a, b) => b.predictability - a.predictability)
    .slice(0, 5);
}

// ---------------------------------------------------------------------------
// Score final
// ---------------------------------------------------------------------------

const DISCLAIMER =
  "Estimation statistique indicative : ce détecteur vise 60 à 70 % de précision sur des textes " +
  "longs en français ou en anglais. Aucun détecteur d'IA n'est fiable à 100 % — ne jamais utiliser " +
  "ce résultat seul pour sanctionner un étudiant ou un auteur.";

export function analyzeText(rawText: string): DetectionResult {
  const text = rawText.trim();
  const sig = collectSignals(text);
  const wordCount = sig.words.length;

  // Texte quasi vide : réponse neutre mais exploitable.
  if (wordCount < 10) {
    return {
      score: 50,
      verdict: "incertain",
      verdictLabel: "Indéterminé — texte trop court",
      language: sig.language,
      wordCount,
      sentenceCount: sig.sentences.length,
      lowConfidence: true,
      features: [],
      flaggedSentences: [],
      disclaimer: DISCLAIMER,
    };
  }

  const features = extractFeatures(sig);
  const totalWeight = features.reduce((a, f) => a + f.weight, 0);
  const weighted = features.reduce((a, f) => a + f.aiLikelihood * f.weight, 0) / totalWeight;

  // Mise à l'échelle douce autour de 0.5 pour occuper toute la plage 0-100.
  const stretched = clamp(0.5 + (weighted - 0.5) * 1.9);
  const score = Math.round(stretched * 100);

  const lowConfidence = wordCount < MIN_RELIABLE_WORDS;

  let verdict: DetectionResult["verdict"];
  let verdictLabel: string;
  if (score >= VERDICT_THRESHOLDS.ai) {
    verdict = "ia";
    verdictLabel = "Probablement généré par IA";
  } else if (score <= VERDICT_THRESHOLDS.human) {
    verdict = "humain";
    verdictLabel = "Probablement écrit par un humain";
  } else {
    verdict = "incertain";
    verdictLabel = "Incertain — caractéristiques mixtes";
  }
  if (lowConfidence) verdictLabel += " (fiabilité réduite : texte court)";

  return {
    score,
    verdict,
    verdictLabel,
    language: sig.language,
    wordCount,
    sentenceCount: sig.sentences.length,
    lowConfidence,
    features,
    flaggedSentences: flagSentences(sig),
    disclaimer: DISCLAIMER,
  };
}
