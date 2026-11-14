export const WORK_SECTORS = [
  "All",
  "Manufacturing",
  "Interiors",
  "Travel",
  "Professional services",
  "Food",
  "Water and energy",
] as const;

export type WorkSector = (typeof WORK_SECTORS)[number];

export type WorkProject = {
  id: string;
  name: string;
  sector: Exclude<WorkSector, "All">;
  summary: string;
  /** What Nisc Cloud did. Nothing beyond what was confirmed. */
  role: "Designed and hosted" | "Designed";
  href: string;
  image: string;
  /** Logos sit inside the frame. Photographs fill it. */
  fit: "cover" | "contain";
  /** Shown together on the unfiltered page. */
  family?: "ashut";
};

export const WORK_PROJECTS: readonly WorkProject[] = [
  {
    id: "ashut",
    name: "Ashut",
    sector: "Manufacturing",
    summary: "Furniture, racking and shop fittings for homes, offices, schools and warehouses.",
    role: "Designed and hosted",
    href: "https://ashut.com",
    image: "/work/ashut.jpg",
    fit: "cover",
    family: "ashut",
  },
  {
    id: "ashut-plastics",
    name: "Ashut Plastics",
    sector: "Manufacturing",
    summary: "Plastic packaging for food, oil, chemicals and other industries.",
    role: "Designed and hosted",
    href: "https://ashutplastics.com",
    image: "/work/ashut-plastics.png",
    fit: "contain",
    family: "ashut",
  },
  {
    id: "luxewrap",
    name: "Luxewrap",
    sector: "Interiors",
    summary: "Vinyl wraps for homes and commercial spaces.",
    role: "Designed and hosted",
    href: "https://luxewrap.co.ke",
    image: "/work/luxewrap.avif",
    fit: "cover",
    family: "ashut",
  },
  {
    id: "wild-whispers",
    name: "Wild Whispers",
    sector: "Travel",
    summary: "Private safaris in Kenya and Tanzania.",
    role: "Designed and hosted",
    href: "https://wild-whispers.com",
    image: "/work/wild-whispers.jpg",
    fit: "cover",
  },
  {
    id: "cruises",
    name: "Cruises by Holiday Bazaar",
    sector: "Travel",
    summary: "Cruise bookings, planned from Nairobi.",
    role: "Designed and hosted",
    href: "https://cruises.co.ke",
    image: "/work/cruises.jpg",
    fit: "cover",
  },
  {
    id: "jm-consult",
    name: "JM Consult",
    sector: "Professional services",
    summary: "Valuation of plant, machinery and equipment.",
    role: "Designed and hosted",
    href: "https://jmainapme.co.ke",
    image: "/work/jm-consult.avif",
    fit: "cover",
  },
  {
    id: "food-and-us",
    name: "Food & Us",
    sector: "Food",
    summary: "A nutrition brand. We designed the site.",
    role: "Designed",
    href: "https://foodandus.co.ke",
    image: "/work/food-and-us.jpg",
    fit: "cover",
  },
  {
    id: "trelan",
    name: "Trelan Engineering",
    sector: "Water and energy",
    summary: "Boreholes, water systems and solar installation.",
    role: "Designed and hosted",
    href: "https://trelanengineering.co.ke",
    image: "/work/trelan.avif",
    fit: "cover",
  },
];
