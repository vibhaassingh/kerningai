/**
 * Compliance — geometric shield bisected by an audit checkline. The
 * inner tick sits on a horizontal rule (the regulatory baseline), the
 * shield outline is angular and machined, not bubbly.
 */
export function ComplianceGlyph() {
  return (
    <g
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="square"
      strokeLinejoin="miter"
      fill="none"
    >
      {/* Shield outline — straight-edged hex */}
      <path d="M12 2 L20 5 L20 12 L12 22 L4 12 L4 5 Z" />
      {/* Audit baseline */}
      <line x1="7" y1="11" x2="17" y2="11" />
      {/* Compliance tick on the baseline */}
      <path d="M9 11 L11 13.5 L15 8.5" strokeWidth="1.5" />
    </g>
  );
}
