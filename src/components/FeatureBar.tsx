import type { FeatureBreakdown } from "@contracts/detector";

/**
 * Barre horizontale représentant une caractéristique statistique.
 * aiLikelihood 0 → encre douce (humain), 1 → rouge brique (IA).
 */
export default function FeatureBar({ feature }: { feature: FeatureBreakdown }) {
  const pct = Math.round(feature.aiLikelihood * 100);
  const weightPct = Math.round(feature.weight * 100);
  const barColor =
    pct >= 66 ? "var(--alert)" : pct >= 40 ? "var(--brick)" : "#3f7d55";

  return (
    <div className="py-3 border-b border-line last:border-b-0">
      <div className="flex items-baseline justify-between gap-3 flex-wrap">
        <span className="text-sm font-medium">{feature.label}</span>
        <span className="font-mono-data text-xs text-ink-3">
          poids {weightPct}% · <span className="font-semibold" style={{ color: barColor }}>{pct}% IA</span>
        </span>
      </div>
      <div className="mt-2 h-2 rounded-full bg-paper-3 overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-500 ease-out"
          style={{ width: `${Math.max(2, pct)}%`, backgroundColor: barColor }}
        />
      </div>
      <p className="mt-1.5 text-xs leading-relaxed text-ink-2">{feature.explanation}</p>
    </div>
  );
}
