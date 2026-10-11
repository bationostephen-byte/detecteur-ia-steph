import { useMemo, useRef, useState } from "react";
import { trpc } from "@/providers/trpc";
import ScoreGauge from "@/components/ScoreGauge";
import FeatureBar from "@/components/FeatureBar";
import { MAX_TEXT_LENGTH } from "@contracts/detector";
import { ScanText, Eraser, AlertTriangle, Quote, FlaskConical, BookOpen, ShieldAlert } from "lucide-react";

// ---------------------------------------------------------------------------
// Exemples intégrés pour la démonstration
// ---------------------------------------------------------------------------

const SAMPLE_AI = `L'intelligence artificielle joue un rôle crucial dans la transformation du secteur éducatif moderne. En effet, elle permet de personnaliser les parcours d'apprentissage en fonction des besoins spécifiques de chaque élève. De plus, les plateformes adaptatives analysent en temps réel les performances des apprenants afin d'ajuster les contenus proposés. Il est important de noter que ces technologies ne remplacent pas les enseignants, mais les accompagnent dans leurs missions quotidiennes. Par ailleurs, l'automatisation des tâches administratives libère un temps précieux pour l'accompagnement pédagogique individualisé. Dans ce contexte, il convient de souligner que la formation des enseignants constitue un enjeu majeur. Ainsi, les établissements doivent investir dans des programmes adaptés aux réalités du terrain. En conclusion, l'intelligence artificielle offre des perspectives prometteuses, à condition d'être déployée de manière réfléchie et éthique.`;

const SAMPLE_HUMAN = `Hier, je suis retourné dans le village de ma grand-mère. Rien n'a changé. La boulangerie sent toujours le pain chaud à six heures du matin, et le vieux monsieur Ferrand arrose ses géraniums comme si sa vie en dépendait. J'ai retrouvé mon vélo d'enfant dans la grange, rouillé, la selle crevée. Ça m'a fichu un coup. Mamie m'a fait sa fameuse aligot — trop de fromage, jamais assez sel, parfait. On a parlé de tout et de rien jusqu'à minuit. Le matin, les chèvres du voisin m'ont réveillé à cinq heures. Cinq heures ! Je déteste ces bêtes. Et pourtant, en partant, j'ai pleuré comme un gamin. Pourquoi est-ce que je n'y vais pas plus souvent ? La réponse m'échappe. En tout cas, j'y retourne en août. C'est promis.`;

const VERDICT_STYLES = {
  humain: { bg: "var(--mint)", label: "Probablement humain" },
  incertain: { bg: "var(--brick)", label: "Incertain" },
  ia: { bg: "var(--alert)", label: "Probablement IA" },
} as const;

const METHOD_FEATURES = [
  ["Burstiness", "Les humains alternent phrases courtes et longues ; les IA produisent des longueurs régulières."],
  ["Perplexité lexicale", "Les LLM choisissent les mots les plus probables : peu de mots rares, vocabulaire prévisible."],
  ["Connecteurs LLM", "« De plus », « il est important de noter », « en conclusion » : formules surreprésentées dans les textes générés."],
  ["Débuts de phrases", "La répétition mécanique des mêmes amorces trahit un générateur automatique."],
  ["Diversité lexicale", "Les IA maintiennent une diversité uniformément élevée, contrairement à l'écriture naturelle."],
  ["Ponctuation", "Une ponctuation réduite au point et à la virgule est un signal fréquent des textes générés."],
  ["Répétitions", "Les trigrammes (suites de 3 mots) répétés révèlent une formulation mécanique."],
  ["Longueur des mots", "Un registre uniformément soutenu, sans relâchement, est caractéristique des LLM."],
  ["Paragraphes", "Des paragraphes de longueur quasi identique indiquent une structure mécanique."],
] as const;

export default function Home() {
  const [text, setText] = useState("");
  const analyze = trpc.detector.analyze.useMutation();
  const resultRef = useRef<HTMLDivElement>(null);

  const wordCount = useMemo(
    () => (text.match(/[\p{L}\p{N}''-]+/gu) ?? []).length,
    [text]
  );

  const result = analyze.data;
  const canAnalyze = text.trim().length > 0 && text.length <= MAX_TEXT_LENGTH && !analyze.isPending;

  const runAnalysis = () => {
    analyze.mutate(
      { text },
      {
        onSuccess: () => {
          setTimeout(() => resultRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 80);
        },
      }
    );
  };

  return (
    <div className="min-h-screen">
      {/* ------------------------------------------------------------------ */}
      {/* En-tête */}
      {/* ------------------------------------------------------------------ */}
      <header className="border-b border-line">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <ScanText className="w-5 h-5" strokeWidth={2.2} aria-hidden />
            <span className="font-mono-data text-sm font-semibold tracking-eyebrow uppercase">
              Détecteur IA Steph
            </span>
          </div>
          <span className="hidden sm:inline-flex items-center gap-2 rounded-full border border-line px-3 py-1.5 font-mono-data text-xs text-ink-2">
            <span className="w-2 h-2 rounded-full bg-chart pulse-dot" aria-hidden />
            analyse statistique · FR / EN
          </span>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 sm:px-6 pb-24">
        {/* ---------------------------------------------------------------- */}
        {/* Hero */}
        {/* ---------------------------------------------------------------- */}
        <section className="pt-12 sm:pt-16 pb-10">
          <h1 className="font-serif-display text-[clamp(40px,7vw,64px)] leading-[1.02] tracking-tight">
            Ce texte est-il écrit par un humain…{" "}
            <em className="italic">ou par une machine ?</em>
          </h1>
          <p className="mt-5 text-base sm:text-lg leading-relaxed text-ink-2 max-w-2xl">
            Collez un devoir, un article ou un essai. Le détecteur mesure{" "}
            <strong className="font-semibold text-ink">9 signaux statistiques</strong> —
            burstiness, perplexité lexicale, connecteurs typiques des LLM — et estime la
            probabilité que le texte soit généré par IA.
          </p>
          <p className="mt-3 font-mono-data text-xs tracking-eyebrow uppercase text-ink-3">
            Précision cible : 60–70 % · projet académique · aucun texte conservé
          </p>
        </section>

        {/* ---------------------------------------------------------------- */}
        {/* Analyseur */}
        {/* ---------------------------------------------------------------- */}
        <section aria-label="Zone d'analyse">
          <div className="rounded-2xl bg-paper-2 border border-line shadow-paper overflow-hidden">
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Collez ici le texte à analyser (minimum ~80 mots pour une estimation fiable)…"
              className="w-full min-h-56 sm:min-h-64 p-5 bg-transparent resize-y outline-none text-[15px] leading-relaxed placeholder:text-ink-3 focus:ring-2 focus:ring-[var(--brick)] focus:ring-inset"
              maxLength={MAX_TEXT_LENGTH + 1000}
              aria-label="Texte à analyser"
            />
            <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-3 border-t border-line">
              <span className="font-mono-data text-xs text-ink-3 tabular-nums">
                {wordCount} mot{wordCount > 1 ? "s" : ""} · {text.length} caractères
                {text.length > MAX_TEXT_LENGTH && (
                  <span className="text-alert font-semibold"> — limite de {MAX_TEXT_LENGTH} dépassée</span>
                )}
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setText("")}
                  disabled={text.length === 0}
                  className="interactive inline-flex items-center gap-1.5 min-h-11 px-4 rounded-full border border-line font-mono-data text-xs uppercase tracking-eyebrow text-ink-2 disabled:opacity-40"
                >
                  <Eraser className="w-3.5 h-3.5" aria-hidden />
                  Effacer
                </button>
                <button
                  type="button"
                  onClick={runAnalysis}
                  disabled={!canAnalyze}
                  className="interactive inline-flex items-center gap-2 min-h-11 px-6 rounded-full bg-chart font-semibold text-sm disabled:opacity-40 shadow-paper"
                >
                  <FlaskConical className="w-4 h-4" aria-hidden />
                  {analyze.isPending ? "Analyse en cours…" : "Analyser le texte"}
                </button>
              </div>
            </div>
          </div>

          {/* Exemples */}
          <div className="mt-3 flex flex-wrap gap-2 text-xs">
            <span className="text-ink-3 py-1.5">Essayer avec :</span>
            <button
              type="button"
              onClick={() => setText(SAMPLE_AI)}
              className="interactive min-h-9 px-3.5 rounded-full bg-paper-2 border border-line text-ink-2"
            >
              un texte type IA
            </button>
            <button
              type="button"
              onClick={() => setText(SAMPLE_HUMAN)}
              className="interactive min-h-9 px-3.5 rounded-full bg-paper-2 border border-line text-ink-2"
            >
              un texte type humain
            </button>
          </div>

          {analyze.isError && (
            <div role="alert" className="mt-4 flex items-start gap-2.5 rounded-xl border border-line bg-paper-2 p-4 text-sm">
              <AlertTriangle className="w-4 h-4 mt-0.5 text-alert shrink-0" aria-hidden />
              <p>
                <strong className="font-semibold">L'analyse a échoué.</strong>{" "}
                {analyze.error.message}
              </p>
            </div>
          )}
        </section>

        {/* ---------------------------------------------------------------- */}
        {/* Résultats */}
        {/* ---------------------------------------------------------------- */}
        {result && (
          <section ref={resultRef} aria-label="Résultats de l'analyse" className="mt-12 scroll-mt-6">
            <h2 className="font-serif-display text-3xl sm:text-4xl tracking-tight">
              Verdict <em className="italic">de l'analyse</em>
            </h2>

            <div className="mt-6 rounded-2xl bg-paper-2 border border-line shadow-paper p-6 sm:p-8">
              <div className="flex flex-col sm:flex-row items-center gap-6 sm:gap-10">
                <ScoreGauge score={result.score} verdict={result.verdict} />
                <div className="flex-1 text-center sm:text-left">
                  <span
                    className="inline-block rounded-full px-4 py-1.5 text-sm font-semibold"
                    style={{
                      backgroundColor: VERDICT_STYLES[result.verdict].bg,
                      color: result.verdict === "ia" ? "var(--paper)" : "var(--ink)",
                    }}
                  >
                    {result.verdictLabel}
                  </span>
                  <p className="mt-4 text-sm leading-relaxed text-ink-2">
                    Le score indique la probabilité estimée que le texte soit généré par une IA :
                    0 = très probablement humain, 100 = très probablement IA.
                  </p>
                  <dl className="mt-4 grid grid-cols-3 gap-3 font-mono-data text-center">
                    <div className="rounded-lg bg-paper px-2 py-3 border border-line">
                      <dt className="text-[10px] uppercase tracking-eyebrow text-ink-3">Mots</dt>
                      <dd className="text-xl font-semibold tabular-nums mt-1">{result.wordCount}</dd>
                    </div>
                    <div className="rounded-lg bg-paper px-2 py-3 border border-line">
                      <dt className="text-[10px] uppercase tracking-eyebrow text-ink-3">Phrases</dt>
                      <dd className="text-xl font-semibold tabular-nums mt-1">{result.sentenceCount}</dd>
                    </div>
                    <div className="rounded-lg bg-paper px-2 py-3 border border-line">
                      <dt className="text-[10px] uppercase tracking-eyebrow text-ink-3">Langue</dt>
                      <dd className="text-xl font-semibold tabular-nums mt-1 uppercase">{result.language}</dd>
                    </div>
                  </dl>
                </div>
              </div>

              {result.lowConfidence && (
                <div className="mt-5 flex items-start gap-2.5 rounded-xl bg-brick/25 border border-line p-4 text-sm">
                  <ShieldAlert className="w-4 h-4 mt-0.5 shrink-0" aria-hidden />
                  <p>
                    Texte court (&lt; 80 mots) : les signaux statistiques sont trop peu nombreux,
                    la fiabilité de cette estimation est <strong>réduite</strong>.
                  </p>
                </div>
              )}
            </div>

            {/* Détail des caractéristiques */}
            {result.features.length > 0 && (
              <div className="mt-6 rounded-2xl bg-paper-2 border border-line shadow-paper px-6 sm:px-8 py-4">
                <h3 className="font-mono-data text-xs uppercase tracking-eyebrow text-ink-3 pt-3 pb-1">
                  Détail des 9 caractéristiques
                </h3>
                {result.features.map((f) => (
                  <FeatureBar key={f.key} feature={f} />
                ))}
              </div>
            )}

            {/* Phrases signalées */}
            {result.flaggedSentences.length > 0 && (
              <div className="mt-6 rounded-2xl bg-paper-2 border border-line shadow-paper p-6 sm:p-8">
                <h3 className="flex items-center gap-2 font-mono-data text-xs uppercase tracking-eyebrow text-ink-3">
                  <Quote className="w-3.5 h-3.5" aria-hidden />
                  Phrases les plus « prévisibles »
                </h3>
                <ul className="mt-4 space-y-4">
                  {result.flaggedSentences.map((s, i) => (
                    <li key={i} className="border-l-2 border-[var(--alert)] pl-4">
                      <p className="font-serif-display text-base sm:text-lg leading-snug italic">
                        « {s.text.length > 220 ? s.text.slice(0, 220) + "…" : s.text} »
                      </p>
                      <p className="mt-1 font-mono-data text-xs text-ink-3">
                        prévisibilité : {Math.round(s.predictability * 100)} %
                      </p>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Avertissement */}
            <div className="mt-6 flex items-start gap-2.5 rounded-xl border border-line p-4 text-xs leading-relaxed text-ink-2">
              <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" aria-hidden />
              <p>{result.disclaimer}</p>
            </div>
          </section>
        )}

        {/* ---------------------------------------------------------------- */}
        {/* Méthodologie */}
        {/* ---------------------------------------------------------------- */}
        <section aria-label="Méthodologie" className="mt-16">
          <h2 className="font-serif-display text-3xl sm:text-4xl tracking-tight flex items-center gap-3">
            <BookOpen className="w-7 h-7 shrink-0" aria-hidden />
            Comment <em className="italic">ça marche</em>
          </h2>
          <p className="mt-4 text-sm sm:text-base leading-relaxed text-ink-2">
            Le moteur n'utilise aucun modèle externe : il extrait neuf caractéristiques
            statistiques du texte — les mêmes familles de signaux que les travaux de
            référence (GLTR, perplexité &amp; burstiness) — puis les combine en un score
            pondéré de 0 à 100.
          </p>
          <ol className="mt-6 divide-y divide-[var(--line)] border-y border-line">
            {METHOD_FEATURES.map(([name, desc], i) => (
              <li key={name} className="py-4 flex gap-4">
                <span className="font-mono-data text-sm text-ink-3 tabular-nums pt-0.5 w-6 shrink-0">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <div>
                  <h3 className="text-sm font-semibold">{name}</h3>
                  <p className="mt-1 text-sm leading-relaxed text-ink-2">{desc}</p>
                </div>
              </li>
            ))}
          </ol>

          <div className="mt-8 rounded-2xl bg-paper-2 border border-line shadow-paper p-6">
            <h3 className="font-semibold text-sm uppercase tracking-eyebrow font-mono-data">
              Limites connues
            </h3>
            <ul className="mt-3 space-y-2 text-sm leading-relaxed text-ink-2 list-disc pl-5">
              <li>Textes courts (&lt; 80 mots) : signaux insuffisants, estimation peu fiable.</li>
              <li>Textes paraphrasés ou traduits : les signaux stylométriques s'estompent.</li>
              <li>Écriture humaine très académique : peut être classée « IA » à tort (faux positif).</li>
              <li>Langues autres que FR/EN : analyse dégradée.</li>
              <li>Aucun détecteur n'atteint 100 % — ce résultat est un indice, jamais une preuve.</li>
            </ul>
          </div>
        </section>
      </main>

      {/* ------------------------------------------------------------------ */}
      {/* Pied de page */}
      {/* ------------------------------------------------------------------ */}
      <footer className="border-t border-line">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-6 flex flex-col sm:flex-row items-center justify-between gap-2 font-mono-data text-xs text-ink-3">
          <span>Détecteur IA Steph — projet académique (Master)</span>
          <span>9 signaux · FR/EN · précision cible 60–70 %</span>
        </div>
      </footer>
    </div>
  );
}
