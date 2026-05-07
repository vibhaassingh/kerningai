/**
 * Ontology — interconnected graph. Five nodes (one centre, four
 * periphery), each connected to the centre + each periphery to the
 * next, forming a structural pentad. Reads as "single living model
 * the whole company reasons on".
 */
export function OntologyGlyph() {
  return (
    <g
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="square"
      strokeLinejoin="miter"
      fill="none"
    >
      {/* Edges first so node fills sit on top */}
      <line x1="12" y1="12" x2="12" y2="3" />
      <line x1="12" y1="12" x2="21" y2="9" />
      <line x1="12" y1="12" x2="18" y2="20" />
      <line x1="12" y1="12" x2="6" y2="20" />
      <line x1="12" y1="12" x2="3" y2="9" />
      {/* Outer ring */}
      <line x1="12" y1="3" x2="21" y2="9" />
      <line x1="21" y1="9" x2="18" y2="20" />
      <line x1="18" y1="20" x2="6" y2="20" />
      <line x1="6" y1="20" x2="3" y2="9" />
      <line x1="3" y1="9" x2="12" y2="3" />
      {/* Nodes */}
      <circle cx="12" cy="12" r="1.6" fill="currentColor" stroke="none" />
      <circle cx="12" cy="3" r="1.2" />
      <circle cx="21" cy="9" r="1.2" />
      <circle cx="18" cy="20" r="1.2" />
      <circle cx="6" cy="20" r="1.2" />
      <circle cx="3" cy="9" r="1.2" />
    </g>
  );
}
