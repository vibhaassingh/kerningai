export type Testimonial = {
  quote: string;
  author: string;
  role: string;
};

export const TESTIMONIALS: Testimonial[] = [
  {
    quote:
      "Kerning AI completely transformed how we handle content and client workflows. What used to take days now happens in minutes. It feels like we've added a 10× smarter team member without adding headcount.",
    author: "Payton Hillman",
    role: "Director of Operations",
  },
  {
    quote:
      "From automated reservations to guest feedback analysis, Kerning AI helped us reduce human error and boost efficiency. It's like having a silent operations wizard behind the scenes.",
    author: "Max Johnson",
    role: "General Manager",
  },
  {
    quote:
      "We plugged Kerning AI into our daily marketing ops and never looked back. Campaigns run smoother, reporting is instant, and our team finally has time to focus on strategy instead of spreadsheets.",
    author: "Chloe Wilson",
    role: "Head of Marketing",
  },
];
