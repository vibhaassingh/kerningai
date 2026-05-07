/**
 * Energy — stark lightning bolt sliced through a metric scale.
 * Reads as audited consumption — the bolt is decisive, the scale
 * underneath it is the bill the CFO can sign off.
 */
export function EnergyGlyph() {
  return (
    <g
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="square"
      strokeLinejoin="miter"
      fill="none"
    >
      {/* Lightning bolt — angular, no curves */}
      <path d="M13 2 L5 13 L10 13 L9 22 L17 11 L12 11 L13 2 Z" />
      {/* Metric ticks running along the right edge — the audited scale */}
      <line x1="20" y1="4" x2="22" y2="4" />
      <line x1="20" y1="9" x2="22" y2="9" />
      <line x1="20" y1="14" x2="22" y2="14" />
      <line x1="20" y1="19" x2="22" y2="19" />
    </g>
  );
}
