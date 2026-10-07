import { relations } from "drizzle-orm";
import {
  boolean,
  index,
  integer,
  jsonb,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  decimal,
  pgEnum,
} from "drizzle-orm/pg-core";

import { user } from "./auth";

// ========================================
// ENUMS
// ========================================

export const crmEntityTypeEnum = pgEnum("crm_entity_type", [
  "contact",
  "company",
  "deal",
  "activity",
  "task",
]);

export const crmFieldTypeEnum = pgEnum("crm_field_type", [
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
]);

export const crmActivityTypeEnum = pgEnum("crm_activity_type", [
  "call",
  "email",
  "meeting",
  "task",
  "note",
  "linkedin_message",
  "whatsapp",
  "sms",
  "custom",
]);

export const crmDealStageEnum = pgEnum("crm_deal_stage", [
  "lead",
  "qualified",
  "proposal",
  "negotiation",
  "closed_won",
  "closed_lost",
]);

export const crmTaskStatusEnum = pgEnum("crm_task_status", [
  "todo",
  "in_progress",
  "completed",
  "cancelled",
]);

export const crmTaskPriorityEnum = pgEnum("crm_task_priority", [
  "low",
  "medium",
  "high",
  "urgent",
]);

export const crmSyncStatusEnum = pgEnum("crm_sync_status", [
  "synced",
  "pending",
  "failed",
  "disabled",
]);

// ========================================
// CUSTOM FIELDS SYSTEM
// ========================================

/**
 * Define custom fields for any CRM entity
 * This allows users to extend the CRM with their own fields
 */
export const crmCustomFieldDefinition = pgTable(
  "crm_custom_field_definition",
  {
    id: text("id").primaryKey(),
    entityType: crmEntityTypeEnum("entity_type").notNull(),
    fieldName: text("field_name").notNull(), // Internal name (e.g., "favorite_color")
    fieldLabel: text("field_label").notNull(), // Display name (e.g., "Favorite Color")
    fieldType: crmFieldTypeEnum("field_type").notNull(),
    description: text("description"),
    isRequired: boolean("is_required").default(false).notNull(),
    isActive: boolean("is_active").default(true).notNull(),
    isSystem: boolean("is_system").default(false).notNull(), // System fields cannot be deleted
    displayOrder: integer("display_order").default(0).notNull(),
    
    // Field configuration (validation rules, options for select fields, etc.)
    fieldConfig: jsonb("field_config").$type<{
      min?: number;
      max?: number;
      pattern?: string;
      options?: Array<{ value: string; label: string; color?: string }>;
      allowMultiple?: boolean;
      defaultValue?: any;
      placeholder?: string;
      helpText?: string;
      [key: string]: any;
    }>(),
    
    // For AI features
    aiConfig: jsonb("ai_config").$type<{
      autoEnrich?: boolean; // Auto-fill using AI
      enrichmentSource?: string[]; // Sources to use for enrichment
      validation?: string; // AI validation rules
      suggestions?: boolean; // Enable AI suggestions
      [key: string]: any;
    }>(),
    
    createdById: text("created_by_id")
      .notNull()
      .references(() => user.id, { onDelete: "restrict" }),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .$onUpdate(() => new Date())
      .defaultNow()
      .notNull(),
  },
  (table) => [
    uniqueIndex("crm_custom_field_definition_entity_name_unique").on(
      table.entityType,
      table.fieldName,
    ),
    index("crm_custom_field_definition_entity_type_idx").on(table.entityType),
    index("crm_custom_field_definition_is_active_idx").on(table.isActive),
  ],
);

// ========================================
// COMPANIES
// ========================================

export const crmCompany = pgTable(
  "crm_company",
  {
    id: text("id").primaryKey(),
    
    // Basic Information
    name: text("name").notNull(),
    website: text("website"),
    industry: text("industry"),
    size: text("size"), // e.g., "1-10", "11-50", "51-200", etc.
    description: text("description"),
    
    // Contact Information
    email: text("email"),
    phone: text("phone"),
    
    // Address
    addressLine1: text("address_line1"),
    addressLine2: text("address_line2"),
    city: text("city"),
    state: text("state"),
    country: text("country"),
    postalCode: text("postal_code"),
    
    // Social Links
    linkedinUrl: text("linkedin_url"),
    twitterUrl: text("twitter_url"),
    facebookUrl: text("facebook_url"),
    
    // Financial
    annualRevenue: decimal("annual_revenue", { precision: 15, scale: 2 }),
    
    // Status
    isActive: boolean("is_active").default(true).notNull(),
    
    // Custom fields stored as JSONB for flexibility
    customFields: jsonb("custom_fields").$type<Record<string, any>>().default({}).notNull(),
    
    // AI-generated insights
    aiInsights: jsonb("ai_insights").$type<{
      summary?: string;
      keyTopics?: string[];
      sentiment?: "positive" | "neutral" | "negative";
      nextBestAction?: string;
      enrichedData?: Record<string, any>;
      lastAnalyzedAt?: string;
      [key: string]: any;
    }>(),
    
    // External CRM sync
    externalId: text("external_id"), // ID in external CRM
    externalSystem: text("external_system"), // e.g., "salesforce", "hubspot"
    externalData: jsonb("external_data").$type<Record<string, any>>(), // Raw data from external CRM
    syncStatus: crmSyncStatusEnum("sync_status").default("disabled"),
    lastSyncedAt: timestamp("last_synced_at"),
    
    // Metadata
    createdById: text("created_by_id")
      .notNull()
      .references(() => user.id, { onDelete: "restrict" }),
    ownerId: text("owner_id")
      .notNull()
      .references(() => user.id, { onDelete: "restrict" }),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .$onUpdate(() => new Date())
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index("crm_company_name_idx").on(table.name),
    index("crm_company_owner_id_idx").on(table.ownerId),
    index("crm_company_is_active_idx").on(table.isActive),
    index("crm_company_external_id_idx").on(table.externalId),
    index("crm_company_sync_status_idx").on(table.syncStatus),
  ],
);

// ========================================
// CONTACTS
// ========================================

export const crmContact = pgTable(
  "crm_contact",
  {
    id: text("id").primaryKey(),
    
    // Basic Information
    firstName: text("first_name").notNull(),
    lastName: text("last_name").notNull(),
    fullName: text("full_name").notNull(), // Computed/maintained field
    title: text("title"), // Job title
    
    // Company relationship
    companyId: text("company_id").references(() => crmCompany.id, {
      onDelete: "set null",
    }),
    
    // Contact Information
    email: text("email"),
    phone: text("phone"),
    mobilePhone: text("mobile_phone"),
    whatsapp: text("whatsapp"),
    
    // Address
    addressLine1: text("address_line1"),
    addressLine2: text("address_line2"),
    city: text("city"),
    state: text("state"),
    country: text("country"),
    postalCode: text("postal_code"),
    
    // Social Links
    linkedinUrl: text("linkedin_url"),
    twitterUrl: text("twitter_url"),
    facebookUrl: text("facebook_url"),
    
    // Professional Info
    department: text("department"),
    seniority: text("seniority"), // e.g., "C-Level", "VP", "Director", "Manager", etc.
    
    // Lead Information
    leadSource: text("lead_source"), // e.g., "Website", "Referral", "LinkedIn", etc.
    leadStatus: text("lead_status"), // e.g., "New", "Contacted", "Qualified", "Unqualified"
    
    // Status
    isActive: boolean("is_active").default(true).notNull(),
    
    // Custom fields
    customFields: jsonb("custom_fields").$type<Record<string, any>>().default({}).notNull(),
    
    // AI-generated insights
    aiInsights: jsonb("ai_insights").$type<{
      summary?: string;
      personality?: string;
      interests?: string[];
      sentiment?: "positive" | "neutral" | "negative";
      engagementScore?: number;
      nextBestAction?: string;
      enrichedData?: Record<string, any>;
      lastAnalyzedAt?: string;
      [key: string]: any;
    }>(),
    
    // External CRM sync
    externalId: text("external_id"),
    externalSystem: text("external_system"),
    externalData: jsonb("external_data").$type<Record<string, any>>(),
    syncStatus: crmSyncStatusEnum("sync_status").default("disabled"),
    lastSyncedAt: timestamp("last_synced_at"),
    
    // Metadata
    createdById: text("created_by_id")
      .notNull()
      .references(() => user.id, { onDelete: "restrict" }),
    ownerId: text("owner_id")
      .notNull()
      .references(() => user.id, { onDelete: "restrict" }),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .$onUpdate(() => new Date())
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index("crm_contact_full_name_idx").on(table.fullName),
    index("crm_contact_email_idx").on(table.email),
    index("crm_contact_company_id_idx").on(table.companyId),
    index("crm_contact_owner_id_idx").on(table.ownerId),
    index("crm_contact_is_active_idx").on(table.isActive),
    index("crm_contact_lead_status_idx").on(table.leadStatus),
    index("crm_contact_external_id_idx").on(table.externalId),
    index("crm_contact_sync_status_idx").on(table.syncStatus),
  ],
);

// ========================================
// PIPELINES & STAGES
// ========================================

/**
 * Define custom sales pipelines
 */
export const crmPipeline = pgTable(
  "crm_pipeline",
  {
    id: text("id").primaryKey(),
    name: text("name").notNull(),
    description: text("description"),
    isDefault: boolean("is_default").default(false).notNull(),
    isActive: boolean("is_active").default(true).notNull(),
    displayOrder: integer("display_order").default(0).notNull(),
    
    createdById: text("created_by_id")
      .notNull()
      .references(() => user.id, { onDelete: "restrict" }),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .$onUpdate(() => new Date())
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index("crm_pipeline_is_active_idx").on(table.isActive),
    index("crm_pipeline_is_default_idx").on(table.isDefault),
  ],
);

/**
 * Define stages within pipelines
 */
export const crmPipelineStage = pgTable(
  "crm_pipeline_stage",
  {
    id: text("id").primaryKey(),
    pipelineId: text("pipeline_id")
      .notNull()
      .references(() => crmPipeline.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    description: text("description"),
    probability: integer("probability").default(0).notNull(), // Win probability 0-100
    displayOrder: integer("display_order").default(0).notNull(),
    color: text("color"), // For UI visualization
    isActive: boolean("is_active").default(true).notNull(),
    
    // AI configuration for this stage
    aiConfig: jsonb("ai_config").$type<{
      autoActions?: string[]; // Actions to trigger automatically
      requiredFields?: string[]; // Fields required before moving to this stage
      suggestions?: string[]; // AI suggestions for this stage
      [key: string]: any;
    }>(),
    
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .$onUpdate(() => new Date())
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index("crm_pipeline_stage_pipeline_id_idx").on(table.pipelineId),
    index("crm_pipeline_stage_is_active_idx").on(table.isActive),
  ],
);

// ========================================
// DEALS
// ========================================

export const crmDeal = pgTable(
  "crm_deal",
  {
    id: text("id").primaryKey(),
    
    // Basic Information
    name: text("name").notNull(),
    description: text("description"),
    
    // Relationships
    companyId: text("company_id").references(() => crmCompany.id, {
      onDelete: "set null",
    }),
    primaryContactId: text("primary_contact_id").references(() => crmContact.id, {
      onDelete: "set null",
    }),
    
    // Pipeline & Stage
    pipelineId: text("pipeline_id")
      .notNull()
      .references(() => crmPipeline.id, { onDelete: "restrict" }),
    stageId: text("stage_id")
      .notNull()
      .references(() => crmPipelineStage.id, { onDelete: "restrict" }),
    
    // Financial
    amount: decimal("amount", { precision: 15, scale: 2 }),
    currency: text("currency").default("KES").notNull(),
    probability: integer("probability"), // Override stage probability if needed
    expectedRevenue: decimal("expected_revenue", { precision: 15, scale: 2 }), // amount * probability
    
    // Dates
    expectedCloseDate: timestamp("expected_close_date"),
    actualCloseDate: timestamp("actual_close_date"),
    
    // Status
    isActive: boolean("is_active").default(true).notNull(),
    isClosed: boolean("is_closed").default(false).notNull(),
    isWon: boolean("is_won").default(false).notNull(),
    lostReason: text("lost_reason"),
    
    // Custom fields
    customFields: jsonb("custom_fields").$type<Record<string, any>>().default({}).notNull(),
    
    // AI-generated insights
    aiInsights: jsonb("ai_insights").$type<{
      winProbability?: number;
      riskFactors?: string[];
      opportunities?: string[];
      nextBestAction?: string;
      competitorAnalysis?: Record<string, any>;
      dealScore?: number;
      recommendedStage?: string;
      lastAnalyzedAt?: string;
      [key: string]: any;
    }>(),
    
    // External CRM sync
    externalId: text("external_id"),
    externalSystem: text("external_system"),
    externalData: jsonb("external_data").$type<Record<string, any>>(),
    syncStatus: crmSyncStatusEnum("sync_status").default("disabled"),
    lastSyncedAt: timestamp("last_synced_at"),
    
    // Metadata
    createdById: text("created_by_id")
      .notNull()
      .references(() => user.id, { onDelete: "restrict" }),
    ownerId: text("owner_id")
      .notNull()
      .references(() => user.id, { onDelete: "restrict" }),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .$onUpdate(() => new Date())
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index("crm_deal_name_idx").on(table.name),
    index("crm_deal_company_id_idx").on(table.companyId),
    index("crm_deal_primary_contact_id_idx").on(table.primaryContactId),
    index("crm_deal_pipeline_id_idx").on(table.pipelineId),
    index("crm_deal_stage_id_idx").on(table.stageId),
    index("crm_deal_owner_id_idx").on(table.ownerId),
    index("crm_deal_is_active_idx").on(table.isActive),
    index("crm_deal_is_closed_idx").on(table.isClosed),
    index("crm_deal_expected_close_date_idx").on(table.expectedCloseDate),
    index("crm_deal_external_id_idx").on(table.externalId),
    index("crm_deal_sync_status_idx").on(table.syncStatus),
  ],
);

// ========================================
// ACTIVITIES
// ========================================

export const crmActivity = pgTable(
  "crm_activity",
  {
    id: text("id").primaryKey(),
    
    // Activity Type
    activityType: crmActivityTypeEnum("activity_type").notNull(),
    
    // Basic Information
    subject: text("subject").notNull(),
    description: text("description"),
    
    // Relationships - can be linked to multiple entities
    contactId: text("contact_id").references(() => crmContact.id, {
      onDelete: "cascade",
    }),
    companyId: text("company_id").references(() => crmCompany.id, {
      onDelete: "cascade",
    }),
    dealId: text("deal_id").references(() => crmDeal.id, {
      onDelete: "cascade",
    }),
    
    // Activity Details
    duration: integer("duration"), // Duration in minutes
    location: text("location"),
    
    // Dates
    scheduledAt: timestamp("scheduled_at"),
    completedAt: timestamp("completed_at"),
    
    // Participants
    participants: jsonb("participants").$type<Array<{
      userId?: string;
      email?: string;
      name?: string;
      role?: string;
    }>>(),
    
    // Outcome
    outcome: text("outcome"),
    isCompleted: boolean("is_completed").default(false).notNull(),
    
    // Custom fields
    customFields: jsonb("custom_fields").$type<Record<string, any>>().default({}).notNull(),
    
    // AI-generated insights
    aiInsights: jsonb("ai_insights").$type<{
      summary?: string;
      keyPoints?: string[];
      actionItems?: string[];
      sentiment?: "positive" | "neutral" | "negative";
      transcription?: string;
      topics?: string[];
      nextSteps?: string[];
      lastAnalyzedAt?: string;
      [key: string]: any;
    }>(),
    
    // External CRM sync
    externalId: text("external_id"),
    externalSystem: text("external_system"),
    externalData: jsonb("external_data").$type<Record<string, any>>(),
    syncStatus: crmSyncStatusEnum("sync_status").default("disabled"),
    lastSyncedAt: timestamp("last_synced_at"),
    
    // Metadata
    createdById: text("created_by_id")
      .notNull()
      .references(() => user.id, { onDelete: "restrict" }),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .$onUpdate(() => new Date())
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index("crm_activity_contact_id_idx").on(table.contactId),
    index("crm_activity_company_id_idx").on(table.companyId),
    index("crm_activity_deal_id_idx").on(table.dealId),
    index("crm_activity_activity_type_idx").on(table.activityType),
    index("crm_activity_scheduled_at_idx").on(table.scheduledAt),
    index("crm_activity_is_completed_idx").on(table.isCompleted),
    index("crm_activity_created_by_id_idx").on(table.createdById),
    index("crm_activity_external_id_idx").on(table.externalId),
    index("crm_activity_sync_status_idx").on(table.syncStatus),
  ],
);

// ========================================
// TASKS
// ========================================

export const crmTask = pgTable(
  "crm_task",
  {
    id: text("id").primaryKey(),
    
    // Basic Information
    title: text("title").notNull(),
    description: text("description"),
    
    // Status & Priority
    status: crmTaskStatusEnum("status").default("todo").notNull(),
    priority: crmTaskPriorityEnum("priority").default("medium").notNull(),
    
    // Relationships - can be linked to multiple entities
    contactId: text("contact_id").references(() => crmContact.id, {
      onDelete: "cascade",
    }),
    companyId: text("company_id").references(() => crmCompany.id, {
      onDelete: "cascade",
    }),
    dealId: text("deal_id").references(() => crmDeal.id, {
      onDelete: "cascade",
    }),
    
    // Assignment
    assignedToId: text("assigned_to_id")
      .notNull()
      .references(() => user.id, { onDelete: "restrict" }),
    
    // Dates
    dueDate: timestamp("due_date"),
    completedAt: timestamp("completed_at"),
    
    // Reminders
    reminderAt: timestamp("reminder_at"),
    reminderSent: boolean("reminder_sent").default(false).notNull(),
    
    // Custom fields
    customFields: jsonb("custom_fields").$type<Record<string, any>>().default({}).notNull(),
    
    // AI suggestions
    aiSuggestions: jsonb("ai_suggestions").$type<{
      suggestedDueDate?: string;
      suggestedPriority?: string;
      suggestedAssignee?: string;
      reasoning?: string;
      [key: string]: any;
    }>(),
    
    // External CRM sync
    externalId: text("external_id"),
    externalSystem: text("external_system"),
    externalData: jsonb("external_data").$type<Record<string, any>>(),
    syncStatus: crmSyncStatusEnum("sync_status").default("disabled"),
    lastSyncedAt: timestamp("last_synced_at"),
    
    // Metadata
    createdById: text("created_by_id")
      .notNull()
      .references(() => user.id, { onDelete: "restrict" }),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .$onUpdate(() => new Date())
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index("crm_task_contact_id_idx").on(table.contactId),
    index("crm_task_company_id_idx").on(table.companyId),
    index("crm_task_deal_id_idx").on(table.dealId),
    index("crm_task_assigned_to_id_idx").on(table.assignedToId),
    index("crm_task_status_idx").on(table.status),
    index("crm_task_priority_idx").on(table.priority),
    index("crm_task_due_date_idx").on(table.dueDate),
    index("crm_task_created_by_id_idx").on(table.createdById),
    index("crm_task_external_id_idx").on(table.externalId),
    index("crm_task_sync_status_idx").on(table.syncStatus),
  ],
);

// ========================================
// NOTES
// ========================================

export const crmNote = pgTable(
  "crm_note",
  {
    id: text("id").primaryKey(),
    
    // Content
    content: text("content").notNull(),
    
    // Relationships - can be linked to multiple entities
    contactId: text("contact_id").references(() => crmContact.id, {
      onDelete: "cascade",
    }),
    companyId: text("company_id").references(() => crmCompany.id, {
      onDelete: "cascade",
    }),
    dealId: text("deal_id").references(() => crmDeal.id, {
      onDelete: "cascade",
    }),
    
    // Pinned notes stay at top
    isPinned: boolean("is_pinned").default(false).notNull(),
    
    // AI-generated insights from note
    aiInsights: jsonb("ai_insights").$type<{
      summary?: string;
      keyPoints?: string[];
      actionItems?: string[];
      sentiment?: "positive" | "neutral" | "negative";
      topics?: string[];
      [key: string]: any;
    }>(),
    
    // Metadata
    createdById: text("created_by_id")
      .notNull()
      .references(() => user.id, { onDelete: "restrict" }),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .$onUpdate(() => new Date())
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index("crm_note_contact_id_idx").on(table.contactId),
    index("crm_note_company_id_idx").on(table.companyId),
    index("crm_note_deal_id_idx").on(table.dealId),
    index("crm_note_created_by_id_idx").on(table.createdById),
    index("crm_note_is_pinned_idx").on(table.isPinned),
  ],
);

// ========================================
// TAGS SYSTEM
// ========================================

export const crmTag = pgTable(
  "crm_tag",
  {
    id: text("id").primaryKey(),
    name: text("name").notNull().unique(),
    color: text("color"), // For UI visualization
    description: text("description"),
    
    createdById: text("created_by_id")
      .notNull()
      .references(() => user.id, { onDelete: "restrict" }),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    index("crm_tag_name_idx").on(table.name),
  ],
);

// Many-to-many relationships for tags
export const crmCompanyTag = pgTable(
  "crm_company_tag",
  {
    id: text("id").primaryKey(),
    companyId: text("company_id")
      .notNull()
      .references(() => crmCompany.id, { onDelete: "cascade" }),
    tagId: text("tag_id")
      .notNull()
      .references(() => crmTag.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex("crm_company_tag_company_id_tag_id_unique").on(
      table.companyId,
      table.tagId,
    ),
    index("crm_company_tag_company_id_idx").on(table.companyId),
    index("crm_company_tag_tag_id_idx").on(table.tagId),
  ],
);

export const crmContactTag = pgTable(
  "crm_contact_tag",
  {
    id: text("id").primaryKey(),
    contactId: text("contact_id")
      .notNull()
      .references(() => crmContact.id, { onDelete: "cascade" }),
    tagId: text("tag_id")
      .notNull()
      .references(() => crmTag.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex("crm_contact_tag_contact_id_tag_id_unique").on(
      table.contactId,
      table.tagId,
    ),
    index("crm_contact_tag_contact_id_idx").on(table.contactId),
    index("crm_contact_tag_tag_id_idx").on(table.tagId),
  ],
);

export const crmDealTag = pgTable(
  "crm_deal_tag",
  {
    id: text("id").primaryKey(),
    dealId: text("deal_id")
      .notNull()
      .references(() => crmDeal.id, { onDelete: "cascade" }),
    tagId: text("tag_id")
      .notNull()
      .references(() => crmTag.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex("crm_deal_tag_deal_id_tag_id_unique").on(
      table.dealId,
      table.tagId,
    ),
    index("crm_deal_tag_deal_id_idx").on(table.dealId),
    index("crm_deal_tag_tag_id_idx").on(table.tagId),
  ],
);

// ========================================
// ACTIVITY LOG (Audit Trail)
// ========================================

export const crmActivityLog = pgTable(
  "crm_activity_log",
  {
    id: text("id").primaryKey(),
    
    // Entity being tracked
    entityType: crmEntityTypeEnum("entity_type").notNull(),
    entityId: text("entity_id").notNull(),
    
    // Action details
    action: text("action").notNull(), // e.g., "created", "updated", "deleted", "stage_changed"
    description: text("description"),
    
    // Changes
    changes: jsonb("changes").$type<{
      field: string;
      oldValue: any;
      newValue: any;
    }[]>(),
    
    // Metadata
    metadata: jsonb("metadata").$type<Record<string, any>>(),
    ipAddress: text("ip_address"),
    userAgent: text("user_agent"),
    
    createdById: text("created_by_id")
      .notNull()
      .references(() => user.id, { onDelete: "restrict" }),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    index("crm_activity_log_entity_type_idx").on(table.entityType),
    index("crm_activity_log_entity_id_idx").on(table.entityId),
    index("crm_activity_log_action_idx").on(table.action),
    index("crm_activity_log_created_by_id_idx").on(table.createdById),
    index("crm_activity_log_created_at_idx").on(table.createdAt),
  ],
);

// ========================================
// EXTERNAL SYNC CONFIGURATION
// ========================================

/**
 * Configure connections to external CRMs
 */
export const crmExternalSyncConfig = pgTable(
  "crm_external_sync_config",
  {
    id: text("id").primaryKey(),
    
    // External system details
    systemName: text("system_name").notNull(), // e.g., "salesforce", "hubspot", "pipedrive"
    systemDisplayName: text("system_display_name").notNull(),
    
    // Connection settings
    isActive: boolean("is_active").default(false).notNull(),
    syncDirection: text("sync_direction").default("bidirectional").notNull(), // "import", "export", "bidirectional"
    
    // Credentials (encrypted in production)
    credentials: jsonb("credentials").$type<{
      apiKey?: string;
      accessToken?: string;
      refreshToken?: string;
      instanceUrl?: string;
      clientId?: string;
      clientSecret?: string;
      [key: string]: any;
    }>(),
    
    // Sync settings
    syncSettings: jsonb("sync_settings").$type<{
      syncContacts?: boolean;
      syncCompanies?: boolean;
      syncDeals?: boolean;
      syncActivities?: boolean;
      syncInterval?: number; // in minutes
      lastSyncAt?: string;
      fieldMappings?: Record<string, string>;
      filters?: Record<string, any>;
      [key: string]: any;
    }>(),
    
    // Status
    lastSyncedAt: timestamp("last_synced_at"),
    lastSyncStatus: text("last_sync_status"),
    lastSyncError: text("last_sync_error"),
    
    createdById: text("created_by_id")
      .notNull()
      .references(() => user.id, { onDelete: "restrict" }),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .$onUpdate(() => new Date())
      .defaultNow()
      .notNull(),
  },
  (table) => [
    uniqueIndex("crm_external_sync_config_system_name_unique").on(
      table.systemName,
    ),
    index("crm_external_sync_config_is_active_idx").on(table.isActive),
  ],
);

// ========================================
// AI CONFIGURATION
// ========================================

/**
 * Configure AI features for the CRM
 */
export const crmAiConfig = pgTable(
  "crm_ai_config",
  {
    id: text("id").primaryKey(),
    
    // Feature toggles
    enableContactEnrichment: boolean("enable_contact_enrichment").default(false).notNull(),
    enableDealScoring: boolean("enable_deal_scoring").default(false).notNull(),
    enableNextBestAction: boolean("enable_next_best_action").default(false).notNull(),
    enableSentimentAnalysis: boolean("enable_sentiment_analysis").default(false).notNull(),
    enableActivitySummaries: boolean("enable_activity_summaries").default(false).notNull(),
    enableAutoTagging: boolean("enable_auto_tagging").default(false).notNull(),
    
    // AI Model settings
    modelSettings: jsonb("model_settings").$type<{
      provider?: string; // e.g., "openai", "anthropic", "custom"
      model?: string;
      temperature?: number;
      maxTokens?: number;
      [key: string]: any;
    }>(),
    
    // Custom AI prompts
    customPrompts: jsonb("custom_prompts").$type<{
      contactEnrichment?: string;
      dealScoring?: string;
      nextBestAction?: string;
      activitySummary?: string;
      [key: string]: any;
    }>(),
    
    updatedById: text("updated_by_id")
      .notNull()
      .references(() => user.id, { onDelete: "restrict" }),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .$onUpdate(() => new Date())
      .defaultNow()
      .notNull(),
  },
);

// ========================================
// RELATIONS
// ========================================

export const crmCustomFieldDefinitionRelations = relations(
  crmCustomFieldDefinition,
  ({ one }) => ({
    createdBy: one(user, {
      fields: [crmCustomFieldDefinition.createdById],
      references: [user.id],
    }),
  }),
);

export const crmCompanyRelations = relations(crmCompany, ({ one, many }) => ({
  createdBy: one(user, {
    fields: [crmCompany.createdById],
    references: [user.id],
    relationName: "companyCreatedBy",
  }),
  owner: one(user, {
    fields: [crmCompany.ownerId],
    references: [user.id],
    relationName: "companyOwner",
  }),
  contacts: many(crmContact),
  deals: many(crmDeal),
  activities: many(crmActivity),
  tasks: many(crmTask),
  notes: many(crmNote),
  tags: many(crmCompanyTag),
}));

export const crmContactRelations = relations(crmContact, ({ one, many }) => ({
  company: one(crmCompany, {
    fields: [crmContact.companyId],
    references: [crmCompany.id],
  }),
  createdBy: one(user, {
    fields: [crmContact.createdById],
    references: [user.id],
    relationName: "contactCreatedBy",
  }),
  owner: one(user, {
    fields: [crmContact.ownerId],
    references: [user.id],
    relationName: "contactOwner",
  }),
  deals: many(crmDeal),
  activities: many(crmActivity),
  tasks: many(crmTask),
  notes: many(crmNote),
  tags: many(crmContactTag),
}));

export const crmPipelineRelations = relations(crmPipeline, ({ one, many }) => ({
  createdBy: one(user, {
    fields: [crmPipeline.createdById],
    references: [user.id],
  }),
  stages: many(crmPipelineStage),
  deals: many(crmDeal),
}));

export const crmPipelineStageRelations = relations(
  crmPipelineStage,
  ({ one, many }) => ({
    pipeline: one(crmPipeline, {
      fields: [crmPipelineStage.pipelineId],
      references: [crmPipeline.id],
    }),
    deals: many(crmDeal),
  }),
);

export const crmDealRelations = relations(crmDeal, ({ one, many }) => ({
  company: one(crmCompany, {
    fields: [crmDeal.companyId],
    references: [crmCompany.id],
  }),
  primaryContact: one(crmContact, {
    fields: [crmDeal.primaryContactId],
    references: [crmContact.id],
  }),
  pipeline: one(crmPipeline, {
    fields: [crmDeal.pipelineId],
    references: [crmPipeline.id],
  }),
  stage: one(crmPipelineStage, {
    fields: [crmDeal.stageId],
    references: [crmPipelineStage.id],
  }),
  createdBy: one(user, {
    fields: [crmDeal.createdById],
    references: [user.id],
    relationName: "dealCreatedBy",
  }),
  owner: one(user, {
    fields: [crmDeal.ownerId],
    references: [user.id],
    relationName: "dealOwner",
  }),
  activities: many(crmActivity),
  tasks: many(crmTask),
  notes: many(crmNote),
  tags: many(crmDealTag),
}));

export const crmActivityRelations = relations(crmActivity, ({ one }) => ({
  contact: one(crmContact, {
    fields: [crmActivity.contactId],
    references: [crmContact.id],
  }),
  company: one(crmCompany, {
    fields: [crmActivity.companyId],
    references: [crmCompany.id],
  }),
  deal: one(crmDeal, {
    fields: [crmActivity.dealId],
    references: [crmDeal.id],
  }),
  createdBy: one(user, {
    fields: [crmActivity.createdById],
    references: [user.id],
  }),
}));

export const crmTaskRelations = relations(crmTask, ({ one }) => ({
  contact: one(crmContact, {
    fields: [crmTask.contactId],
    references: [crmContact.id],
  }),
  company: one(crmCompany, {
    fields: [crmTask.companyId],
    references: [crmCompany.id],
  }),
  deal: one(crmDeal, {
    fields: [crmTask.dealId],
    references: [crmDeal.id],
  }),
  assignedTo: one(user, {
    fields: [crmTask.assignedToId],
    references: [user.id],
    relationName: "taskAssignedTo",
  }),
  createdBy: one(user, {
    fields: [crmTask.createdById],
    references: [user.id],
    relationName: "taskCreatedBy",
  }),
}));

export const crmNoteRelations = relations(crmNote, ({ one }) => ({
  contact: one(crmContact, {
    fields: [crmNote.contactId],
    references: [crmContact.id],
  }),
  company: one(crmCompany, {
    fields: [crmNote.companyId],
    references: [crmCompany.id],
  }),
  deal: one(crmDeal, {
    fields: [crmNote.dealId],
    references: [crmDeal.id],
  }),
  createdBy: one(user, {
    fields: [crmNote.createdById],
    references: [user.id],
  }),
}));

export const crmTagRelations = relations(crmTag, ({ one, many }) => ({
  createdBy: one(user, {
    fields: [crmTag.createdById],
    references: [user.id],
  }),
  companies: many(crmCompanyTag),
  contacts: many(crmContactTag),
  deals: many(crmDealTag),
}));

export const crmCompanyTagRelations = relations(crmCompanyTag, ({ one }) => ({
  company: one(crmCompany, {
    fields: [crmCompanyTag.companyId],
    references: [crmCompany.id],
  }),
  tag: one(crmTag, {
    fields: [crmCompanyTag.tagId],
    references: [crmTag.id],
  }),
}));

export const crmContactTagRelations = relations(crmContactTag, ({ one }) => ({
  contact: one(crmContact, {
    fields: [crmContactTag.contactId],
    references: [crmContact.id],
  }),
  tag: one(crmTag, {
    fields: [crmContactTag.tagId],
    references: [crmTag.id],
  }),
}));

export const crmDealTagRelations = relations(crmDealTag, ({ one }) => ({
  deal: one(crmDeal, {
    fields: [crmDealTag.dealId],
    references: [crmDeal.id],
  }),
  tag: one(crmTag, {
    fields: [crmDealTag.tagId],
    references: [crmTag.id],
  }),
}));

export const crmActivityLogRelations = relations(crmActivityLog, ({ one }) => ({
  createdBy: one(user, {
    fields: [crmActivityLog.createdById],
    references: [user.id],
  }),
}));

export const crmExternalSyncConfigRelations = relations(
  crmExternalSyncConfig,
  ({ one }) => ({
    createdBy: one(user, {
      fields: [crmExternalSyncConfig.createdById],
      references: [user.id],
    }),
  }),
);

export const crmAiConfigRelations = relations(crmAiConfig, ({ one }) => ({
  updatedBy: one(user, {
    fields: [crmAiConfig.updatedById],
    references: [user.id],
  }),
}));
