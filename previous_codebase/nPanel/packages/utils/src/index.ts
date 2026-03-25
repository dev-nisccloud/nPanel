export function stripSpecialCharacters(inputString: string) {
  // Remove special characters and spaces, keep alphanumeric, hyphens/underscores, and dots
  return inputString
    .replace(/[^a-zA-Z0-9-_\s.]/g, "") // Remove special chars except hyphen/underscore/dot
    .replace(/\s+/g, "-") // Replace spaces with hyphens
    .toLowerCase(); // Convert to lowercase for consistency
}

export {
  getExtensionFromMimeType,
  ensureFileExtension,
} from "./mime-to-extension";

// TLD Extensions utilities
export {
  getAllTldExtensions,
  getPopularTlds,
  getBusinessTlds,
  getEducationTlds,
  getInternationalTlds,
  getTechnologyTlds,
  getSocialPersonalTlds,
  getProfessionalServicesTlds,
  getMediaEntertainmentTlds,
  getEcommerceShoppingTlds,
  getIndustrySectorTlds,
  getLifestyleHobbiesTlds,
  getCountryCodeTlds,
  searchTldExtensions,
  getTldExtensionsByCategory,
  isValidTldExtension,
  formatTldWithDot,
  removeDotPrefix,
  getTldCount,
  getRandomTlds,
  TLD_EXTENSIONS,
  POPULAR_TLDS,
  BUSINESS_TLDS,
  EDUCATION_TLDS,
  INTERNATIONAL_TLDS,
  TECHNOLOGY_TLDS,
  SOCIAL_PERSONAL_TLDS,
  PROFESSIONAL_SERVICES_TLDS,
  MEDIA_ENTERTAINMENT_TLDS,
  ECOMMERCE_SHOPPING_TLDS,
  INDUSTRY_SECTOR_TLDS,
  LIFESTYLE_HOBBIES_TLDS,
  COUNTRY_CODE_TLDS,
  type TldExtension,
  type TldCategory,
} from "./tld-extensions";