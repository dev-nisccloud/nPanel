/**
 * Client logos approved for publication (usage confirmed by Nisc Cloud, 7 Nov 2026).
 * Add a logo here only after the client has agreed to be shown.
 * `white` is a white silhouette for dark or coloured backgrounds (near-white areas become transparent).
 * `ratio` is the image width ÷ height, used to give every logo a similar visual weight.
 * `-hd` files are 4x cleaned upscales of low-resolution originals (originals kept); replace them when the client supplies vector or high-resolution artwork.
 */
export const CLIENT_LOGOS = [
  { name: "Amarom", logo: "/clients/amarom2-hd.png", white: "/clients/amarom2-hd-white.png", ratio: 592 / 196 },
  { name: "Defen Group", logo: "/clients/defen-group-logo-hd.png", white: "/clients/defen-group-logo-hd-white.png", ratio: 600 / 146 },
  { name: "Liveright", logo: "/clients/liveright-logo-trim.png", white: "/clients/liveright-logo-trim-white.png", ratio: 209 / 200 },
  { name: "MMA", logo: "/clients/mma-logo-hd.png", white: "/clients/mma-logo-hd-white.png", ratio: 960 / 190 },
  { name: "Stanjo", logo: "/clients/stanjo-trim.png", white: "/clients/stanjo-trim-white.png", ratio: 372 / 200 },
  { name: "Epitome", logo: "/clients/epitome-logo-trim.png", white: "/clients/epitome-logo-trim-white.png", ratio: 469 / 200 },
  { name: "Luxewrap", logo: "/clients/luxewrap-logo-trim.png", white: "/clients/luxewrap-logo-trim-white.png", ratio: 579 / 200 },
  { name: "Medplus", logo: "/clients/medplus-logo-hd.png", white: "/clients/medplus-logo-hd-white.png", ratio: 600 / 215 },
  { name: "Farma24", logo: "/clients/farma24-logo-hd.png", white: "/clients/farma24-logo-hd-white.png", ratio: 600 / 93 },
  { name: "Ashut", logo: "/clients/ashut-logo-trim.png", white: "/clients/ashut-logo-trim-white.png", ratio: 169 / 200 },
  { name: "Trelanbrams", logo: "/clients/trelanbrams-logo-trim.png", white: "/clients/trelanbrams-logo-trim-white.png", ratio: 617 / 200 },
  { name: "Datini", logo: "/clients/datini-logo-trim.png", white: "/clients/datini-logo-trim-white.png", ratio: 465 / 200 },
  { name: "HB", logo: "/clients/hb-logo-hd.png", white: "/clients/hb-logo-hd-white.png", ratio: 319 / 390 },
  { name: "Cruises Bob", logo: "/clients/cruisesbob-logo-trim.png", white: "/clients/cruisesbob-logo-trim-white.png", ratio: 352 / 200 },
  { name: "Insaac", logo: "/clients/insaac2-hd.png", white: "/clients/insaac2-hd-white.png", ratio: 435 / 272 },
  { name: "2tokee", logo: "/clients/2tokee-trim.png", white: "/clients/2tokee-trim-white.png", ratio: 547 / 200 },
  { name: "APL", logo: "/clients/apl-logo-trim.png", white: "/clients/apl-logo-trim-white.png", ratio: 143 / 200 },
] as const;

export type ClientLogo = (typeof CLIENT_LOGOS)[number];
