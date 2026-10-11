/**
 * Contrats partagés du Détecteur IA Steph.
 * Types échangés entre le frontend React et l'API tRPC.
 */

export type DetectionVerdict = "humain" | "incertain" | "ia";

export type SupportedLanguage = "fr" | "en" | "mixte" | "inconnu";

/** Une caractéristique statistique extraite du texte. */
export interface FeatureBreakdown {
  /** Identifiant stable de la caractéristique. */
  key: string;
  /** Nom lisible (français). */
  label: string;
  /**
   * Contribution normalisée au verdict IA, entre 0 et 1.
   * 0 = typiquement humain, 1 = typiquement IA.
   */
  aiLikelihood: number;
  /** Poids de la caractéristique dans le score final (0..1). */
  weight: number;
  /** Valeur brute mesurée (unité propre à chaque feature). */
  rawValue: number;
  /** Explication courte affichable dans l'interface. */
  explanation: string;
}

/** Phrase signalée comme "prévisible" (typique d'un LLM). */
export interface FlaggedSentence {
  text: string;
  /** Indice de prévisibilité 0..1 (plus c'est haut, plus ça ressemble à de l'IA). */
  predictability: number;
}

export interface DetectionResult {
  /** Score global 0..100 : probabilité estimée que le texte soit généré par IA. */
  score: number;
  verdict: DetectionVerdict;
  /** Libellé du verdict prêt à afficher. */
  verdictLabel: string;
  language: SupportedLanguage;
  wordCount: number;
  sentenceCount: number;
  /** true si le texte est trop court pour une analyse fiable (< 80 mots). */
  lowConfidence: boolean;
  features: FeatureBreakdown[];
  flaggedSentences: FlaggedSentence[];
  /** Avertissement méthodologique affiché à l'utilisateur. */
  disclaimer: string;
}

/** Seuils du verdict (partagés front/back pour cohérence d'affichage). */
export const VERDICT_THRESHOLDS = {
  /** score < aiThreshold => "probablement IA"... inversé : score >= aiThreshold => IA */
  ai: 58,
  /** score <= humanThreshold => probablement humain */
  human: 42,
} as const;

export const MIN_RELIABLE_WORDS = 80;
export const MAX_TEXT_LENGTH = 50_000;
