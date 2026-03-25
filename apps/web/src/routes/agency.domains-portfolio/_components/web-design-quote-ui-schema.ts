import { z } from "zod";

/**
 * UI-layer schemas and transformation for the web design quote form.
 * Independent from API and DBÃ¢â‚¬â€no shared types. Maps form values to the
 * payload shape expected by the API (contract defined here, not imported).
 */

// ---------------------------------------------------------------------------
// UI enums (form dropdown values; mapped to API when sending)
// ---------------------------------------------------------------------------

export const UI_PROJECT_TYPE = {
  NEW_WEBSITE: "new_website",
  REDESIGN: "redesign",
  ECOMMERCE: "ecommerce",
  LANDING_PAGE: "landing_page",
  WEB_APP: "web_app",
  OTHER: "other",
} as const;

export type UiProjectType = (typeof UI_PROJECT_TYPE)[keyof typeof UI_PROJECT_TYPE];

export const UI_PROJECT_TYPE_OPTIONS: { value: UiProjectType; label: string }[] = [
  { value: UI_PROJECT_TYPE.NEW_WEBSITE, label: "New website" },
  { value: UI_PROJECT_TYPE.REDESIGN, label: "Website redesign" },
  { value: UI_PROJECT_TYPE.ECOMMERCE, label: "EÃ¢â‚¬â€˜commerce / online store" },
  { value: UI_PROJECT_TYPE.LANDING_PAGE, label: "Landing page" },
  { value: UI_PROJECT_TYPE.WEB_APP, label: "Web application" },
  { value: UI_PROJECT_TYPE.OTHER, label: "Other" },
];

/** API project type values (sent to tRPC). Must match API schema. */
export type ApiProjectType = "NEW_WEBSITE" | "REDESIGN" | "ECOMMERCE" | "LANDING_PAGE" | "WEB_APP" | "OTHER";

/** Map UI project type to API project type (values sent to API). */
const UI_TO_API_PROJECT_TYPE: Record<UiProjectType, ApiProjectType> = {
  [UI_PROJECT_TYPE.NEW_WEBSITE]: "NEW_WEBSITE",
  [UI_PROJECT_TYPE.REDESIGN]: "REDESIGN",
  [UI_PROJECT_TYPE.ECOMMERCE]: "ECOMMERCE",
  [UI_PROJECT_TYPE.LANDING_PAGE]: "LANDING_PAGE",
  [UI_PROJECT_TYPE.WEB_APP]: "WEB_APP",
  [UI_PROJECT_TYPE.OTHER]: "OTHER",
};

// ---------------------------------------------------------------------------
// Form validation schema (UI-only)
// ---------------------------------------------------------------------------

export const webDesignQuoteFormSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().min(1, "Email is required").email("Enter a valid email"),
  phone: z.string().min(1, "Phone number is required"),
  companyName: z.string().min(1, "Company name is required"),
  domain: z.string().optional(),
  projectType: z.string().min(1, "Project type is required"),
  projectDescription: z
    .string()
    .min(1, "Describe your project so we can provide an accurate quote"),
  budget: z.string().min(1, "Budget range is required"),
  timeline: z.preprocess(
    (val) => {
      if (val === undefined || val === null || val === "") return undefined;
      if (val instanceof Date) return val;
      if (typeof val === "string") {
        const date = new Date(val);
        return isNaN(date.getTime()) ? undefined : date;
      }
      return undefined;
    },
    z.date().optional()
  ),
});

export type WebDesignQuoteFormValues = z.infer<typeof webDesignQuoteFormSchema>;

// ---------------------------------------------------------------------------
// API create payload shape (UI-defined contract; not imported from API)
// ---------------------------------------------------------------------------

export type WebDesignQuoteCreatePayload = {
  name: string;
  email: string;
  phone: string;
  companyName: string;
  domain?: string;
  projectType: ApiProjectType;
  projectDescription: string;
  budget: string;
  targetLaunchDate?: Date;
};

/** Transform form values to the payload shape sent to the API. */
export function transformFormToCreatePayload(
  form: WebDesignQuoteFormValues
): WebDesignQuoteCreatePayload {
  const projectType =
    UI_TO_API_PROJECT_TYPE[form.projectType as UiProjectType] ?? "OTHER";
  return {
    name: form.name,
    email: form.email,
    phone: form.phone,
    companyName: form.companyName,
    domain: form.domain?.trim() || undefined,
    projectType,
    projectDescription: form.projectDescription,
    budget: form.budget,
    targetLaunchDate: form.timeline,
  };
}
