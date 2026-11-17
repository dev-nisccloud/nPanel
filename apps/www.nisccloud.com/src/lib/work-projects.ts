export const WORK_GROUPS = [
  {
    id: "websites",
    title: "Websites",
    intro: "Sites designed and built to take someone from the first look through to a booking or a purchase.",
  },
  {
    id: "video",
    title: "Video production",
    intro: "Films and reels made to bring people into the showroom.",
  },
  {
    id: "creative",
    title: "Creative design",
    intro: "Campaign creative built around the product.",
  },
] as const;

export type WorkGroupId = (typeof WORK_GROUPS)[number]["id"];

export type WorkReel = {
  id: string;
  title: string;
};

export type WorkProject = {
  id: string;
  client: string;
  job: string;
  paragraphs: readonly string[];
  group: WorkGroupId;
  /** Laptop screen, cropped to the display and its bezel. */
  image?: string;
  imageAlt?: string;
  /** Poster art. Shown smaller than the screens so it stays sharp. */
  poster?: boolean;
  reels?: readonly WorkReel[];
};

export const WORK_PROJECTS: readonly WorkProject[] = [
  {
    id: "cruises",
    client: "Cruises by Holiday Bazaar",
    job: "Website design and development",
    group: "websites",
    image: "/work/cruises-screen.jpg",
    imageAlt: "Cruises by Holiday Bazaar website on a laptop screen, open on a poolside cruise scene",
    paragraphs: [
      "We designed a lifestyle-led website for Cruises by Holiday Bazaar that brings the cruise experience to life through immersive imagery, engaging content and a focus on destinations and experiences. The website guides users from discovering a cruise to making a booking, with an integrated booking platform creating a seamless journey from inspiration to reservation.",
    ],
  },
  {
    id: "trelan",
    client: "Trelan Engineering",
    job: "Brand identity, website design and development",
    group: "websites",
    image: "/work/trelan-screen.jpg",
    imageAlt: "Trelan Engineering website on a laptop screen, open on water and solar solutions",
    paragraphs: [
      "We developed Trelan Engineering’s brand identity from the ground up, including the logo and tagline, creating a distinctive identity that accurately reflects the company’s expertise in borehole drilling and water solutions. We then translated the new brand identity into a professional, user-focused website, establishing a cohesive digital presence that communicates the company’s services and expertise.",
    ],
  },
  {
    id: "ashut-website",
    client: "Ashut Engineers",
    job: "Website design and development",
    group: "websites",
    image: "/work/ashut-screen.jpg",
    imageAlt: "Ashut Engineers furniture store on a laptop screen, showing living room furniture and warehouse racking",
    paragraphs: [
      "We developed an e-commerce platform for Ashut Engineers, making it easy for customers to explore and shop its wide range of furniture solutions. The website offers simple navigation, organised product categories and detailed product information, creating a seamless online shopping experience while showcasing the Ashut brand.",
    ],
  },
  {
    id: "ashut-valentines",
    client: "Ashut Engineers",
    job: "Valentine’s Day clearance sale",
    group: "video",
    reels: [
      {
        id: "DUptlrKisVJ",
        title: "Ashut Engineers Valentine’s clearance film, The One at a Sweet Price",
      },
    ],
    paragraphs: [
      "For Ashut Engineers’ Valentine’s Day Clearance Sale, we developed a campaign that connected the emotion of Valentine’s Day with the excitement of finding the perfect furniture piece at a great price. Built around the concept “The One at a Sweet Price,” the campaign highlighted the clearance offers through a promotional video designed to bring the idea to life and drive customers to the showroom.",
    ],
  },
  {
    id: "ashut-reels",
    client: "Ashut Engineers",
    job: "Furniture promo reels",
    group: "video",
    reels: [
      { id: "DfOuPhVDY4O", title: "Ashut Engineers furniture reel, living room sofa" },
      { id: "DfT7oX4qSTL", title: "Ashut Engineers furniture reel" },
    ],
    paragraphs: [
      "We produce lifestyle-led video content designed to drive customers to the Ashut showroom by helping them envision how furniture can transform their spaces. Rather than simply showcasing products, our videos bring each piece to life through engaging scripts that highlight their design, functionality and value. Our approach is focused on creating desire, inspiring consideration and ultimately encouraging showroom visits and purchases.",
    ],
  },
  {
    id: "luxewrap-valentines",
    client: "Luxewrap",
    job: "Valentine’s Day poster",
    group: "creative",
    poster: true,
    image: "/work/luxewrap%20valentines.png",
    imageAlt: "Luxewrap Valentine’s Day poster for the L2 Chilli Red vinyl wrap, with red petals, heels and a tie on a bedroom floor",
    paragraphs: [
      "Our creative approach is always guided by the brand, ensuring the messaging and visual design match what the brand offers.",
      "For Luxewrap’s Valentine’s Day poster, we used their L2 Chilli Red vinyl wrap, tying its bold red finish to the Valentine’s Day theme. The concept connected the product to the season in a simple and playful way while keeping the product central to the creative.",
    ],
  },
  {
    id: "datini-iwd",
    client: "Datini",
    job: "International Women’s Day",
    group: "creative",
    poster: true,
    image: "/work/datini-iwd.png",
    imageAlt: "Datini International Women’s Day poster, Strength Flows Through Her, with a milk can pouring a figure of a woman",
    paragraphs: [
      "For Datini’s International Women’s Day creative, we developed a concept that connected the occasion to Datini’s product offering, milk cans and used milk as a visual representation of strength, nourishment and the important role women play in families and communities. The concept kept the product central while creating a meaningful connection to the occasion.",
    ],
  },
];
