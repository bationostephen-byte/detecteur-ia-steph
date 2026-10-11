/**
 * Jauge circulaire SVG affichant le score IA (0-100).
 * Style « papier & encre » : arc encre sur trace papier-3.
 */
interface ScoreGaugeProps {
  score: number;
  verdict: "humain" | "incertain" | "ia";
}

const VERDICT_COLORS: Record<ScoreGaugeProps["verdict"], string> = {
  humain: "#3f7d55",
  incertain: "#8a6d1f",
  ia: "#b5462f",
};

export default function ScoreGauge({ score, verdict }: ScoreGaugeProps) {
  const size = 200;
  const stroke = 14;
  const r = (size - stroke) / 2;
  const cx = size / 2;
  // Arc de 240° (de -210° à 30°)
  const startAngle = -210;
  const endAngle = 30;
  const span = endAngle - startAngle;

  const polar = (angleDeg: number) => {
    const rad = (angleDeg * Math.PI) / 180;
    return { x: cx + r * Math.cos(rad), y: cx + r * Math.sin(rad) };
  };
  const arcPath = (fromDeg: number, toDeg: number) => {
    const s = polar(fromDeg);
    const e = polar(toDeg);
    const large = toDeg - fromDeg > 180 ? 1 : 0;
    return `M ${s.x} ${s.y} A ${r} ${r} 0 ${large} 1 ${e.x} ${e.y}`;
  };

  const valueAngle = startAngle + (span * Math.min(100, Math.max(0, score))) / 100;
  const color = VERDICT_COLORS[verdict];

  return (
    <div className="relative inline-flex items-center justify-center" role="img" aria-label={`Score de détection IA : ${score} sur 100`}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="w-44 h-44 sm:w-52 sm:h-52">
        {/* Trace de fond */}
        <path d={arcPath(startAngle, endAngle)} fill="none" stroke="var(--paper-3)" strokeWidth={stroke} strokeLinecap="round" />
        {/* Arc de valeur */}
        {score > 0 && (
          <path d={arcPath(startAngle, valueAngle)} fill="none" stroke={color} strokeWidth={stroke} strokeLinecap="round" />
        )}
        {/* Graduations */}
        {[0, 25, 50, 75, 100].map((t) => {
          const a = startAngle + (span * t) / 100;
          const p1 = polar(a);
          const rad = (a * Math.PI) / 180;
          const p2 = { x: cx + (r - stroke - 6) * Math.cos(rad), y: cx + (r - stroke - 6) * Math.sin(rad) };
          return <line key={t} x1={p1.x} y1={p1.y} x2={p2.x} y2={p2.y} stroke="var(--ink-3)" strokeWidth={1.5} opacity={0.6} />;
        })}
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="font-mono-data text-5xl sm:text-6xl font-semibold tabular-nums" style={{ color }}>
          {score}
        </span>
        <span className="font-mono-data text-xs text-ink-3 tracking-eyebrow uppercase mt-1">/ 100</span>
      </div>
    </div>
  );
}
