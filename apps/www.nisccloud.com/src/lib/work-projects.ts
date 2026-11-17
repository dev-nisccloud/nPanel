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

export type WorkLink = {
  label: string;
  href: string;
};

export type WorkProject = {
  id: string;
  client: string;
  job: string;
  paragraphs: readonly string[];
  group: WorkGroupId;
  image: string;
  imageAlt: string;
  /** Laptop mockups sit on black. The poster fills its frame. */
  frame: "mockup" | "poster";
  links: readonly WorkLink[];
};

export const WORK_PROJECTS: readonly WorkProject[] = [
  {
    id: "cruises",
    client: "Cruises by Holiday Bazaar",
    job: "Website design and development",
    group: "websites",
    image: "/work/cruises-website.png",
    imageAlt: "Cruises by Holiday Bazaar website on a laptop, open on a poolside cruise scene",
    frame: "mockup",
    paragraphs: [
      "We designed a lifestyle-led website for Cruises by Holiday Bazaar that brings the cruise experience to life through immersive imagery, engaging content and a focus on destinations and experiences. The website guides users from discovering a cruise to making a booking, with an integrated booking platform creating a seamless journey from inspiration to reservation.",
    ],
    links: [{ label: "Visit cruises.co.ke", href: "https://cruises.co.ke/" }],
  },
  {
    id: "trelan",
    client: "Trelan Engineering",
    job: "Brand identity, website design and development",
    group: "websites",
    image: "/work/trelan-website.png",
    imageAlt: "Trelan Engineering website on a laptop, open on water and solar solutions",
    frame: "mockup",
    paragraphs: [
      "We developed Trelan Engineering’s brand identity from the ground up, including the logo and tagline, creating a distinctive identity that accurately reflects the company’s expertise in borehole drilling and water solutions. We then translated the new brand identity into a professional, user-focused website, establishing a cohesive digital presence that communicates the company’s services and expertise.",
    ],
    links: [{ label: "Visit trelanengineering.co.ke", href: "https://trelanengineering.co.ke/" }],
  },
  {
    id: "ashut-website",
    client: "Ashut Engineers",
    job: "Website design and development",
    group: "websites",
    image: "/work/ashut-website.png",
    imageAlt: "Ashut Engineers furniture store on a laptop, showing living room furniture and warehouse racking",
    frame: "mockup",
    paragraphs: [
      "We developed an e-commerce platform for Ashut Engineers, making it easy for customers to explore and shop its wide range of furniture solutions. The website offers simple navigation, organised product categories and detailed product information, creating a seamless online shopping experience while showcasing the Ashut brand.",
    ],
    links: [{ label: "Visit ashut.com", href: "https://ashut.com/" }],
  },
  {
    id: "ashut-valentines",
    client: "Ashut Engineers",
    job: "Valentine’s Day clearance sale",
    group: "video",
    image: "/work/ashut-valentines.png",
    imageAlt: "Ashut Engineers Valentine’s clearance film on a laptop, with the line The One at a Sweet Price and up to 60% off",
    frame: "mockup",
    paragraphs: [
      "For Ashut Engineers’ Valentine’s Day Clearance Sale, we developed a campaign that connected the emotion of Valentine’s Day with the excitement of finding the perfect furniture piece at a great price. Built around the concept “The One at a Sweet Price,” the campaign highlighted the clearance offers through a promotional video designed to bring the idea to life and drive customers to the showroom.",
    ],
    links: [
      {
        label: "Watch the promotional video",
        href: "https://www.instagram.com/reel/DUptlrKisVJ/?utm_source=ig_web_copy_link&srtk=MzRlODBiNWFlZA==",
      },
    ],
  },
  {
    id: "ashut-reels",
    client: "Ashut Engineers",
    job: "Furniture promo reels",
    group: "video",
    image: "/work/ashut-furniture-promo.png",
    imageAlt: "An Ashut Engineers furniture reel playing on Instagram, shown on a laptop",
    frame: "mockup",
    paragraphs: [
      "We produce lifestyle-led video content designed to drive customers to the Ashut showroom by helping them envision how furniture can transform their spaces. Rather than simply showcasing products, our videos bring each piece to life through engaging scripts that highlight their design, functionality and value. Our approach is focused on creating desire, inspiring consideration and ultimately encouraging showroom visits and purchases.",
    ],
    links: [
      {
        label: "Watch furniture reel 1",
        href: "https://www.instagram.com/reel/DfOuPhVDY4O/?utm_source=ig_web_copy_link&exln=MzRlODBiNWFlZA==&srtk=MzRlODBiNWFlZA==",
      },
      {
        label: "Watch furniture reel 2",
        href: "https://www.instagram.com/reel/DfT7oX4qSTL/?utm_source=ig_web_copy_link&exln=MzRlODBiNWFlZA==&srtk=MzRlODBiNWFlZA==",
      },
    ],
  },
  {
    id: "luxewrap-valentines",
    client: "Luxewrap",
    job: "Valentine’s Day poster",
    group: "creative",
    image: "/work/luxewrap%20valentines.png",
    imageAlt: "Luxewrap Valentine’s Day poster for the L2 Chilli Red vinyl wrap, with red petals, heels and a tie on a bedroom floor",
    frame: "poster",
    paragraphs: [
      "Our creative approach is always guided by the brand, ensuring the messaging and visual design match what the brand offers.",
      "For Luxewrap’s Valentine’s Day poster, we used their L2 Chilli Red vinyl wrap, tying its bold red finish to the Valentine’s Day theme. The concept connected the product to the season in a simple and playful way while keeping the product central to the creative.",
    ],
    links: [],
  },
];
