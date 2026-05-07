export type Commitment = {
  number: string;
  label: string;
  body: string;
};

export const COMMITMENTS: Commitment[] = [
  {
    number: "01",
    label: "Human-in-the-loop",
    body: "Agents propose; humans dispose. Every consequential action is approved by a named person, with a recorded reason, traceable later in the audit.",
  },
  {
    number: "02",
    label: "Augment, don't replace",
    body: "We automate the boring work — clipboard logs, manual reads, paperwork — so the work that requires a human can keep its human.",
  },
  {
    number: "03",
    label: "Sovereign by default",
    body: "Customer data resides in the customer's jurisdiction. Air-gapped, on-prem, or sovereign-cloud installations available without a sales-engineering call.",
  },
  {
    number: "04",
    label: "Resilient operations",
    body: "The platform degrades gracefully — losing a sensor, a model, or an internet link doesn't stop the line. The operator's clipboard keeps working.",
  },
  {
    number: "05",
    label: "Sustainable as standard",
    body: "Energy, water, gas and refrigerant are first-class signals — not a CSR-team add-on. Scope-2 carbon ledgering ships in the base product.",
  },
  {
    number: "06",
    label: "Multilingual on the floor",
    body: "The line lead reads Hindi, the chef reads Tamil, the CFO reads English. The platform speaks all of them — and the language a workflow runs in is the operator's choice, not ours.",
  },
];
