/**
 * Predictive Maintenance — telemetry waveform with a marked threshold
 * crossing. The horizontal rule is the operating envelope; the curve
 * crests once and is intercepted by a tick at the moment it'd breach
 * the limit, communicating "we caught it before it broke."
 */
export function PredictiveMaintenanceGlyph() {
  return (
    <g
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="square"
      strokeLinejoin="miter"
      fill="none"
    >
      {/* Bottom rule (operating baseline) */}
      <line x1="2" y1="20" x2="22" y2="20" />
      {/* Threshold rule */}
      <line x1="2" y1="9" x2="22" y2="9" strokeDasharray="2 2" />
      {/* Telemetry waveform (sine-ish) */}
      <path d="M2 16 Q5 16 6.5 14 T11 11 T15.5 14 T19 11 T22 11" />
      {/* Critical-cross marker */}
      <line x1="15.5" y1="6" x2="15.5" y2="12" />
      <circle cx="15.5" cy="9" r="1.6" fill="currentColor" stroke="none" />
    </g>
  );
}
