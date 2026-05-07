export type TeamMember = {
  name: string;
  role: string;
  initials: string;
  bio: string;
};

export const TEAM: TeamMember[] = [
  {
    name: "Vibhaas Singh",
    role: "CEO & Group Chairman",
    initials: "VS",
    bio: "Drives the strategic vision behind Kerning AI's ontology-led approach. Leads cross-continent partnerships across India, the EU, and the UK.",
  },
  {
    name: "Kartikeya Bakshi",
    role: "Chief Operating Officer",
    initials: "KB",
    bio: "Owns delivery and partner success. Translates complex back-of-house workflows into measurable AI deployments at hospitality, factory, and institutional scale.",
  },
  {
    name: "Saurabh Singh",
    role: "Chief Technology Officer",
    initials: "SS",
    bio: "Architects the ontology, the agents, and the platform. Specialises in real-time sensor fusion, edge inference, and sovereign-deployable systems.",
  },
  {
    name: "Vivek Tripathi",
    role: "Chief Marketing Officer",
    initials: "VT",
    bio: "Builds the brand and demand engine. Connects technical capability to operator language, telling the Industry 5.0 story across regions.",
  },
];
