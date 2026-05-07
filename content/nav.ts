export const PRIMARY_NAV = [
  { label: "Solutions", href: "/services" },
  { label: "Industries", href: "/industries" },
  { label: "About", href: "/about" },
  { label: "Insights", href: "/insights" },
  { label: "Contact", href: "/contact" },
] as const;

export const FOOTER_NAV = {
  Company: [
    { label: "About", href: "/about" },
    { label: "Insights", href: "/insights" },
    { label: "Contact", href: "/contact" },
  ],
  Solutions: [
    { label: "Operational Ontology", href: "/services/operational-ontology" },
    { label: "Agentic Workflows", href: "/services/agentic-workflows" },
    { label: "Predictive Maintenance", href: "/services/predictive-maintenance" },
    { label: "Energy & Emissions", href: "/services/energy-utility-emissions" },
    { label: "Hygiene & Compliance", href: "/services/hygiene-safety-compliance" },
    { label: "Decision Intelligence", href: "/services/decision-intelligence" },
  ],
  Industries: [
    { label: "Hospitality", href: "/industries/hospitality" },
    { label: "Manufacturing", href: "/industries/manufacturing" },
    { label: "Institutional & F&B", href: "/industries/institutional" },
  ],
} as const;

export const LEGAL_NAV = [
  { label: "Privacy Policy", href: "/privacy" },
  { label: "Accessibility", href: "/accessibility" },
] as const;
