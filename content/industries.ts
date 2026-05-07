export type Industry = {
  slug: string;
  number: string;
  name: string;
  headline: string;
  summary: string;
  pillars: { title: string; body: string }[];
};

export const INDUSTRIES: Industry[] = [
  {
    slug: "hospitality",
    number: "01",
    name: "Hospitality",
    headline: "Hotels, restaurants, and venues that run on intelligence.",
    summary:
      "Operational intelligence in the back-of-house and beyond — kitchens, refrigeration, ventilation, and the brigade that keeps it all moving. Live across hospitality groups and institutional F&B operators.",
    pillars: [
      {
        title: "Brigade",
        body: "Shift-aware workflows for the line lead, the chef, and the maintenance engineer. Multilingual on the floor by default.",
      },
      {
        title: "Plate",
        body: "Plate-level P&L and recipe intelligence — the same number the CFO and the chef read.",
      },
      {
        title: "Asset",
        body: "Equipment ontology across ovens, chillers, hoods, and gas lines. Failure modes called before service.",
      },
    ],
  },
  {
    slug: "manufacturing",
    number: "02",
    name: "Manufacturing",
    headline: "From sensor to insight, on the factory floor.",
    summary:
      "Connected operations for plants and production lines — quality vision, throughput modelling, and the energy intelligence that turns the works into a system the manager can run on a tablet.",
    pillars: [
      {
        title: "Quality",
        body: "Computer-vision defect detection and statistical process control on every shift.",
      },
      {
        title: "Throughput",
        body: "Bottleneck modelling and predictive scheduling to lift OEE without capex.",
      },
      {
        title: "Energy",
        body: "Plant-level consumption analytics and load shifting against tariff windows.",
      },
    ],
  },
  {
    slug: "institutional",
    number: "03",
    name: "Institutional & F&B",
    headline: "Scale operations, sovereign data.",
    summary:
      "Multi-site institutional F&B and large-format operators — campus dining, healthcare, defence kitchens. Sovereign-deployable, audit-trailed by default.",
    pillars: [
      {
        title: "Sovereign",
        body: "Air-gapped, on-prem, and sovereign-cloud installations. Data resides in the customer's jurisdiction.",
      },
      {
        title: "Compliance",
        body: "FSMS, ISO, GMP and regulator-grade evidence — generated continuously, not reconstructed at audit.",
      },
      {
        title: "Multilingual",
        body: "Hindi, Tamil, English, and beyond — the language a workflow runs in is the operator's choice, not ours.",
      },
    ],
  },
];
