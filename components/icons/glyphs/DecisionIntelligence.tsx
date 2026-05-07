/**
 * Decision Intelligence — concentric crosshair / target. Two
 * concentric squares (not circles — sharper, more measurement-rig),
 * a dead-centre dot, and full-bleed crosshair rules. The metric the
 * CFO and the line lead both read.
 */
export function DecisionIntelligenceGlyph() {
  return (
    <g
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="square"
      strokeLinejoin="miter"
      fill="none"
    >
      {/* Crosshair rules */}
      <line x1="2" y1="12" x2="22" y2="12" />
      <line x1="12" y1="2" x2="12" y2="22" />
      {/* Outer reticle */}
      <rect x="5" y="5" width="14" height="14" />
      {/* Inner reticle */}
      <rect x="9" y="9" width="6" height="6" />
      {/* Centre dot */}
      <circle cx="12" cy="12" r="1.2" fill="currentColor" stroke="none" />
    </g>
  );
}
