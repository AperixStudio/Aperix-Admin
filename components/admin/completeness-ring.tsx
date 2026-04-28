interface Props {
  percentage: number;
  size?: number;
}

/** SVG completeness ring. Uses currentColor so callers can theme via CSS. */
export function CompletenessRing({ percentage, size = 44 }: Props) {
  const strokeWidth = 4;
  const radius = (size - strokeWidth) / 2;
  const circ = 2 * Math.PI * radius;
  const offset = circ - (percentage / 100) * circ;

  const tone =
    percentage >= 80 ? "completeness-ok" :
    percentage >= 60 ? "completeness-warn" :
    "completeness-low";

  return (
    <div className={`completeness-ring ${tone}`} style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <circle cx={size / 2} cy={size / 2} r={radius} className="ring-track" strokeWidth={strokeWidth} fill="none" />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          className="ring-progress"
          strokeWidth={strokeWidth}
          fill="none"
          strokeDasharray={circ}
          strokeDashoffset={offset}
          strokeLinecap="round"
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
      </svg>
      <span className="ring-label">{percentage}%</span>
    </div>
  );
}
