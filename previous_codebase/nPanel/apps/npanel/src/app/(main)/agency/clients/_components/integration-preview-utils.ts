import type { RouterOutputs } from "@/utils/trpc";

type UserInfo = RouterOutputs["userProfile"]["getUserById"];
type ProfileInfo = RouterOutputs["clients"]["getProfile"];

export interface PleskPreviewData {
  personName: string;
  email: string;
  phone?: string;
  address?: string;
  city?: string;
  state?: string;
  postCode?: string;
  country?: string;
}

export interface OpenProviderPreviewData {
  name: {
    first_name: string;
    last_name: string;
  };
  address: {
    street: string;
    number: string;
    zipcode: string;
    city: string;
    country: string;
    state?: string;
  };
  phone: {
    country_code: string;
    area_code: string;
    subscriber_number: string;
  };
  email: string;
}

export function getPleskPreviewData(userInfo: UserInfo, profileInfo: ProfileInfo | null | undefined): PleskPreviewData | null {
  if (!userInfo || !userInfo.name || !userInfo.email) {
    return null;
  }

  return {
    personName: userInfo.name,
    email: userInfo.email,
    phone: profileInfo?.phone || undefined,
    address: profileInfo?.address || undefined,
    city: profileInfo?.city || undefined,
    state: profileInfo?.state || undefined,
    postCode: profileInfo?.postalCode || undefined,
    country: profileInfo?.country || undefined,
  };
}

export function getOpenProviderPreviewData(userInfo: UserInfo, profileInfo: ProfileInfo | null | undefined): OpenProviderPreviewData | null {
  if (!userInfo || !userInfo.email || !profileInfo) {
    return null;
  }

  if (!profileInfo.firstName || !profileInfo.lastName || !profileInfo.address || 
      !profileInfo.city || !profileInfo.country || !profileInfo.postalCode || !profileInfo.phone) {
    return null;
  }

  // Parse phone number
  const phoneStr = profileInfo.phone;
  const phoneDigits = phoneStr.replace(/\D/g, "");
  let countryCode = "";
  let areaCode = "";
  let subscriberNumber = "";

  if (phoneDigits.startsWith("254")) {
    countryCode = "254";
    const remaining = phoneDigits.slice(3);
    if (remaining.length >= 9) {
      areaCode = remaining.slice(0, 2);
      subscriberNumber = remaining.slice(2);
    } else {
      areaCode = remaining.slice(0, 1);
      subscriberNumber = remaining.slice(1);
    }
  } else if (phoneDigits.length >= 9) {
    countryCode = "254"; // Default to Kenya
    areaCode = phoneDigits.slice(0, 2);
    subscriberNumber = phoneDigits.slice(2);
  } else {
    return null; // Invalid phone format
  }

  // Parse address
  const addressParts = profileInfo.address.split(/\s+/);
  const street = addressParts.slice(0, -1).join(" ") || profileInfo.address;
  const number = addressParts[addressParts.length - 1] || "1";

  // Normalize country code - always use "KE" for Kenya
  // OpenProvider requires ISO 3166-1 alpha-2 country codes
  const addressCountryCode = "KE"; // Always default to Kenya

  return {
    name: {
      first_name: profileInfo.firstName,
      last_name: profileInfo.lastName,
    },
    address: {
      street: street,
      number: number,
      zipcode: profileInfo.postalCode,
      city: profileInfo.city,
      country: addressCountryCode, // Always use "KE" for Kenya
      state: profileInfo.state || undefined,
    },
    phone: {
      country_code: countryCode,
      area_code: areaCode,
      subscriber_number: subscriberNumber,
    },
    email: userInfo.email,
  };
}

