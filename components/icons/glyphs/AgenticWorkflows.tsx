/**
 * Agentic Workflows — sequential logic flow. Two parallel input rails
 * converge at a decision diamond, branch, and re-converge at an
 * output. Reads as branching reasoning under the same governing model.
 */
export function AgenticWorkflowsGlyph() {
  return (
    <g
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="square"
      strokeLinejoin="miter"
      fill="none"
    >
      {/* Input nodes */}
      <rect x="2" y="4" width="4" height="4" />
      <rect x="2" y="16" width="4" height="4" />
      {/* Lead lines into the diamond */}
      <line x1="6" y1="6" x2="10.5" y2="10.5" />
      <line x1="6" y1="18" x2="10.5" y2="13.5" />
      {/* Decision diamond */}
      <path d="M12 8 L16 12 L12 16 L8 12 Z" />
      {/* Branches out */}
      <line x1="16" y1="12" x2="20" y2="6" />
      <line x1="16" y1="12" x2="20" y2="18" />
      {/* Output node */}
      <circle cx="20" cy="6" r="1.4" fill="currentColor" stroke="none" />
      <circle cx="20" cy="18" r="1.4" />
    </g>
  );
}
