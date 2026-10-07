/**
 * TypeScript types and utilities for the CRM schema
 * These types help with type safety when working with custom fields and AI insights
 */

// ========================================
// Custom Field Types
// ========================================

export type CrmEntityType = "contact" | "company" | "deal" | "activity" | "task";

export type CrmFieldType =
  | "text"
  | "textarea"
  | "number"
  | "decimal"
  | "boolean"
  | "date"
  | "datetime"
  | "email"
  | "phone"
  | "url"
  | "select"
  | "multiselect"
  | "currency"
  | "percentage"
  | "rating"
  | "file"
  | "user"
  | "relation";

export interface CrmSelectOption {
  value: string;
  label: string;
  color?: string;
}

export interface CrmFieldConfig {
  min?: number;
  max?: number;
  pattern?: string;
  options?: CrmSelectOption[];
  allowMultiple?: boolean;
  defaultValue?: any;
  placeholder?: string;
  helpText?: string;
  [key: string]: any;
}

export interface CrmFieldAiConfig {
  autoEnrich?: boolean;
  enrichmentSource?: string[];
  validation?: string;
  suggestions?: boolean;
  [key: string]: any;
}

// ========================================
// AI Insights Types
// ========================================

export type CrmSentiment = "positive" | "neutral" | "negative";

export interface CrmContactAiInsights {
  summary?: string;
  personality?: string;
  interests?: string[];
  sentiment?: CrmSentiment;
  engagementScore?: number; // 0-100
  nextBestAction?: string;
  enrichedData?: {
    jobTitle?: string;
    company?: string;
    location?: string;
    skills?: string[];
    experience?: string;
    education?: string;
    [key: string]: any;
  };
  lastAnalyzedAt?: string;
  [key: string]: any;
}

export interface CrmCompanyAiInsights {
  summary?: string;
  keyTopics?: string[];
  sentiment?: CrmSentiment;
  nextBestAction?: string;
  enrichedData?: {
    employees?: number;
    fundingStage?: string;
    fundingAmount?: number;
    technologies?: string[];
    competitors?: string[];
    recentNews?: Array<{
      title: string;
      date: string;
      source: string;
      url?: string;
    }>;
    [key: string]: any;
  };
  lastAnalyzedAt?: string;
  [key: string]: any;
}

export interface CrmDealAiInsights {
  winProbability?: number; // 0-100
  dealScore?: number; // 0-100
  riskFactors?: string[];
  opportunities?: string[];
  nextBestAction?: string;
  competitorAnalysis?: {
    competitors?: string[];
    strengths?: string[];
    weaknesses?: string[];
    differentiators?: string[];
  };
  recommendedStage?: string;
  expectedCloseDate?: string;
  healthScore?: number; // 0-100
  engagementLevel?: "high" | "medium" | "low";
  lastAnalyzedAt?: string;
  [key: string]: any;
}

export interface CrmActivityAiInsights {
  summary?: string;
  keyPoints?: string[];
  actionItems?: string[];
  sentiment?: CrmSentiment;
  transcription?: string;
  topics?: string[];
  nextSteps?: string[];
  participants?: Array<{
    name: string;
    role?: string;
    sentiment?: CrmSentiment;
  }>;
  lastAnalyzedAt?: string;
  [key: string]: any;
}

export interface CrmNoteAiInsights {
  summary?: string;
  keyPoints?: string[];
  actionItems?: string[];
  sentiment?: CrmSentiment;
  topics?: string[];
  categories?: string[];
  lastAnalyzedAt?: string;
  [key: string]: any;
}

export interface CrmTaskAiSuggestions {
  suggestedDueDate?: string;
  suggestedPriority?: "low" | "medium" | "high" | "urgent";
  suggestedAssignee?: string;
  reasoning?: string;
  relatedTasks?: string[];
  estimatedDuration?: number; // in minutes
  [key: string]: any;
}

// ========================================
// External Sync Types
// ========================================

export type CrmSyncStatus = "synced" | "pending" | "failed" | "disabled";

export type CrmSyncDirection = "import" | "export" | "bidirectional";

export interface CrmExternalCredentials {
  apiKey?: string;
  accessToken?: string;
  refreshToken?: string;
  instanceUrl?: string;
  clientId?: string;
  clientSecret?: string;
  expiresAt?: string;
  [key: string]: any;
}

export interface CrmExternalSyncSettings {
  syncContacts?: boolean;
  syncCompanies?: boolean;
  syncDeals?: boolean;
  syncActivities?: boolean;
  syncTasks?: boolean;
  syncInterval?: number; // in minutes
  lastSyncAt?: string;
  fieldMappings?: Record<string, string>; // internal field -> external field
  reverseFieldMappings?: Record<string, string>; // external field -> internal field
  filters?: Record<string, any>;
  transformations?: Record<string, string>; // field transformation rules
  [key: string]: any;
}

// ========================================
// Activity Participant Types
// ========================================

export interface CrmActivityParticipant {
  userId?: string;
  email?: string;
  name?: string;
  role?: string;
  status?: "accepted" | "declined" | "tentative" | "pending";
}

// ========================================
// Activity Log Types
// ========================================

export interface CrmActivityLogChange {
  field: string;
  oldValue: any;
  newValue: any;
}

export interface CrmActivityLogMetadata {
  reason?: string;
  source?: string;
  automation?: boolean;
  triggeredBy?: string;
  [key: string]: any;
}

// ========================================
// AI Configuration Types
// ========================================

export interface CrmAiModelSettings {
  provider?: "openai" | "anthropic" | "custom" | string;
  model?: string;
  temperature?: number; // 0-1
  maxTokens?: number;
  topP?: number;
  frequencyPenalty?: number;
  presencePenalty?: number;
  [key: string]: any;
}

export interface CrmAiCustomPrompts {
  contactEnrichment?: string;
  dealScoring?: string;
  nextBestAction?: string;
  activitySummary?: string;
  sentimentAnalysis?: string;
  autoTagging?: string;
  [key: string]: string;
}

// ========================================
// Pipeline Stage AI Config
// ========================================

export interface CrmPipelineStageAiConfig {
  autoActions?: string[]; // Actions to trigger automatically when deal enters this stage
  requiredFields?: string[]; // Fields that must be filled before moving to this stage
  suggestions?: string[]; // AI suggestions for this stage
  autoAdvance?: boolean; // Automatically advance to next stage if conditions met
  autoAdvanceConditions?: Record<string, any>;
  [key: string]: any;
}

// ========================================
// Custom Fields Value Types
// ========================================

export type CrmCustomFieldValue =
  | string
  | number
  | boolean
  | Date
  | string[] // for multiselect
  | null
  | undefined;

export type CrmCustomFields = Record<string, CrmCustomFieldValue>;

// ========================================
// Utility Types
// ========================================

/**
 * Type for creating a new contact
 */
export interface CreateCrmContactInput {
  firstName: string;
  lastName: string;
  email?: string;
  phone?: string;
  companyId?: string;
  title?: string;
  customFields?: CrmCustomFields;
  ownerId: string;
  createdById: string;
}

/**
 * Type for creating a new company
 */
export interface CreateCrmCompanyInput {
  name: string;
  website?: string;
  industry?: string;
  email?: string;
  phone?: string;
  customFields?: CrmCustomFields;
  ownerId: string;
  createdById: string;
}

/**
 * Type for creating a new deal
 */
export interface CreateCrmDealInput {
  name: string;
  companyId?: string;
  primaryContactId?: string;
  pipelineId: string;
  stageId: string;
  amount?: string;
  currency?: string;
  expectedCloseDate?: Date;
  customFields?: CrmCustomFields;
  ownerId: string;
  createdById: string;
}

/**
 * Type for creating a custom field definition
 */
export interface CreateCrmCustomFieldInput {
  entityType: CrmEntityType;
  fieldName: string;
  fieldLabel: string;
  fieldType: CrmFieldType;
  description?: string;
  isRequired?: boolean;
  fieldConfig?: CrmFieldConfig;
  aiConfig?: CrmFieldAiConfig;
  createdById: string;
}

// ========================================
// Query Filter Types
// ========================================

export interface CrmContactFilters {
  search?: string; // Search by name, email, phone
  companyId?: string;
  ownerId?: string;
  leadStatus?: string;
  isActive?: boolean;
  tags?: string[];
  customFields?: Record<string, any>;
}

export interface CrmCompanyFilters {
  search?: string; // Search by name, website
  industry?: string;
  size?: string;
  ownerId?: string;
  isActive?: boolean;
  tags?: string[];
  customFields?: Record<string, any>;
}

export interface CrmDealFilters {
  search?: string; // Search by name
  companyId?: string;
  contactId?: string;
  pipelineId?: string;
  stageId?: string;
  ownerId?: string;
  isActive?: boolean;
  isClosed?: boolean;
  isWon?: boolean;
  expectedCloseDateFrom?: Date;
  expectedCloseDateTo?: Date;
  amountMin?: number;
  amountMax?: number;
  tags?: string[];
  customFields?: Record<string, any>;
}

export interface CrmActivityFilters {
  contactId?: string;
  companyId?: string;
  dealId?: string;
  activityType?: string;
  isCompleted?: boolean;
  scheduledFrom?: Date;
  scheduledTo?: Date;
  createdById?: string;
}

export interface CrmTaskFilters {
  contactId?: string;
  companyId?: string;
  dealId?: string;
  assignedToId?: string;
  status?: string;
  priority?: string;
  dueDateFrom?: Date;
  dueDateTo?: Date;
  createdById?: string;
}

// ========================================
// Sort Types
// ========================================

export type CrmSortOrder = "asc" | "desc";

export interface CrmSortOptions {
  field: string;
  order: CrmSortOrder;
}

// ========================================
// Pagination Types
// ========================================

export interface CrmPaginationOptions {
  page?: number;
  limit?: number;
  cursor?: string;
}

export interface CrmPaginatedResponse<T> {
  data: T[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    hasMore: boolean;
    nextCursor?: string;
  };
}

// ========================================
// Validation Helpers
// ========================================

export const CRM_FIELD_TYPE_VALIDATORS: Record<
  CrmFieldType,
  (value: any) => boolean
> = {
  text: (value) => typeof value === "string",
  textarea: (value) => typeof value === "string",
  number: (value) => typeof value === "number" && Number.isInteger(value),
  decimal: (value) => typeof value === "number",
  boolean: (value) => typeof value === "boolean",
  date: (value) => value instanceof Date || typeof value === "string",
  datetime: (value) => value instanceof Date || typeof value === "string",
  email: (value) =>
    typeof value === "string" && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value),
  phone: (value) => typeof value === "string",
  url: (value) =>
    typeof value === "string" &&
    /^https?:\/\/.+/.test(value),
  select: (value) => typeof value === "string",
  multiselect: (value) =>
    Array.isArray(value) && value.every((v) => typeof v === "string"),
  currency: (value) => typeof value === "number",
  percentage: (value) => typeof value === "number" && value >= 0 && value <= 100,
  rating: (value) =>
    typeof value === "number" && value >= 1 && value <= 5,
  file: (value) => typeof value === "string", // URL or file path
  user: (value) => typeof value === "string", // User ID
  relation: (value) => typeof value === "string", // Entity ID
};

// ========================================
// Constants
// ========================================

export const CRM_ACTIVITY_TYPES = [
  "call",
  "email",
  "meeting",
  "task",
  "note",
  "linkedin_message",
  "whatsapp",
  "sms",
  "custom",
] as const;

export const CRM_TASK_STATUSES = [
  "todo",
  "in_progress",
  "completed",
  "cancelled",
] as const;

export const CRM_TASK_PRIORITIES = [
  "low",
  "medium",
  "high",
  "urgent",
] as const;

export const CRM_SYNC_STATUSES = [
  "synced",
  "pending",
  "failed",
  "disabled",
] as const;

export const CRM_SYNC_DIRECTIONS = [
  "import",
  "export",
  "bidirectional",
] as const;

export const CRM_ENTITY_TYPES = [
  "contact",
  "company",
  "deal",
  "activity",
  "task",
] as const;

export const CRM_FIELD_TYPES = [
  "text",
  "textarea",
  "number",
  "decimal",
  "boolean",
  "date",
  "datetime",
  "email",
  "phone",
  "url",
  "select",
  "multiselect",
  "currency",
  "percentage",
  "rating",
  "file",
  "user",
  "relation",
] as const;

// ========================================
// Helper Functions
// ========================================

/**
 * Validate a custom field value against its definition
 */
export function validateCustomFieldValue(
  fieldType: CrmFieldType,
  value: any,
  fieldConfig?: CrmFieldConfig
): { valid: boolean; error?: string } {
  const validator = CRM_FIELD_TYPE_VALIDATORS[fieldType];
  
  if (!validator) {
    return { valid: false, error: `Unknown field type: ${fieldType}` };
  }
  
  if (value === null || value === undefined) {
    return { valid: true };
  }
  
  if (!validator(value)) {
    return { valid: false, error: `Invalid value for field type: ${fieldType}` };
  }
  
  // Additional validation based on fieldConfig
  if (fieldConfig) {
    if (fieldConfig.min !== undefined && value < fieldConfig.min) {
      return { valid: false, error: `Value must be at least ${fieldConfig.min}` };
    }
    
    if (fieldConfig.max !== undefined && value > fieldConfig.max) {
      return { valid: false, error: `Value must be at most ${fieldConfig.max}` };
    }
    
    if (fieldConfig.pattern && typeof value === "string") {
      const regex = new RegExp(fieldConfig.pattern);
      if (!regex.test(value)) {
        return { valid: false, error: `Value does not match required pattern` };
      }
    }
    
    if (fieldType === "select" && fieldConfig.options) {
      const validValues = fieldConfig.options.map((opt) => opt.value);
      if (!validValues.includes(value)) {
        return { valid: false, error: `Value must be one of: ${validValues.join(", ")}` };
      }
    }
    
    if (fieldType === "multiselect" && fieldConfig.options) {
      const validValues = fieldConfig.options.map((opt) => opt.value);
      const invalidValues = value.filter((v: string) => !validValues.includes(v));
      if (invalidValues.length > 0) {
        return {
          valid: false,
          error: `Invalid values: ${invalidValues.join(", ")}. Must be one of: ${validValues.join(", ")}`,
        };
      }
    }
  }
  
  return { valid: true };
}

/**
 * Generate full name from first and last name
 */
export function generateFullName(firstName: string, lastName: string): string {
  return `${firstName.trim()} ${lastName.trim()}`.trim();
}

/**
 * Calculate expected revenue based on amount and probability
 */
export function calculateExpectedRevenue(
  amount: number,
  probability: number
): number {
  return (amount * probability) / 100;
}

/**
 * Determine if a deal is at risk
 */
export function isDealAtRisk(
  expectedCloseDate: Date,
  stageId: string,
  lastActivityDate?: Date
): boolean {
  const now = new Date();
  const daysUntilClose = Math.ceil(
    (expectedCloseDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
  );
  
  // Deal is closing soon but still in early stages
  if (daysUntilClose <= 7 && stageId.includes("lead")) {
    return true;
  }
  
  // No activity in past 14 days
  if (lastActivityDate) {
    const daysSinceActivity = Math.ceil(
      (now.getTime() - lastActivityDate.getTime()) / (1000 * 60 * 60 * 24)
    );
    if (daysSinceActivity > 14) {
      return true;
    }
  }
  
  return false;
}

/**
 * Format currency value
 */
export function formatCurrency(
  amount: number,
  currency: string = "KES"
): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: currency,
  }).format(amount);
}
