const NISC_WEBSITE_CDN = "https://storage.nisccloud.com/npanel-uploads/nisc-website";

/** CDN URL for a file in npanel-uploads/nisc-website (handles spaces in filenames). */
export function niscWebsiteImage(filename: string) {
  return `${NISC_WEBSITE_CDN}/${encodeURIComponent(filename)}`;
}
