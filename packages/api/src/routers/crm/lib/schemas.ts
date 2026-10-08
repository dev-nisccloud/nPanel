/**
 * CRM Validation Schemas
 * 
 * Centralized Zod schemas for input validation across all CRM endpoints
 */

import { z } from "zod";

// ========================================
// Common Schemas
// ========================================

export const idSchema = z.string().min(1, "ID is required");

export const paginationSchema = z.object({
  page: z.number().int().min(1).default(1),
  limit: z.number().int().min(1).max(100).default(20),
});

export const searchSchema = z.object({
  search: z.string().optional(),
  ...paginationSchema.shape,
});

export const customFieldsSchema = z.record(z.string(), z.any()).optional();

/** Accepts a Date or an ISO string. JSON transport does not preserve Date instances. */
export const optionalDateSchema = z.preprocess((value) => {
  if (value === "" || value === undefined) return undefined;
  if (value === null) return null;
  return value;
}, z.union([z.coerce.date(), z.null()]).optional());

export const dateRangeSchema = z.object({
  from: optionalDateSchema,
  to: optionalDateSchema,
});

// ========================================
// Company Schemas
// ========================================

export const createCompanySchema = z.object({
  name: z.string().min(1, "Company name is required").max(255),
  website: z.string().url("Invalid URL").optional().nullable(),
  industry: z.string().max(100).optional().nullable(),
  size: z.string().max(50).optional().nullable(),
  description: z.string().max(2000).optional().nullable(),
  
  // Contact Information
  email: z.string().email("Invalid email").optional().nullable(),
  phone: z.string().max(50).optional().nullable(),
  
  // Address
  addressLine1: z.string().max(255).optional().nullable(),
  addressLine2: z.string().max(255).optional().nullable(),
  city: z.string().max(100).optional().nullable(),
  state: z.string().max(100).optional().nullable(),
  country: z.string().max(100).optional().nullable(),
  postalCode: z.string().max(20).optional().nullable(),
  
  // Social Links
  linkedinUrl: z.string().url("Invalid URL").optional().nullable(),
  twitterUrl: z.string().url("Invalid URL").optional().nullable(),
  facebookUrl: z.string().url("Invalid URL").optional().nullable(),
  
  // Financial
  annualRevenue: z.string().optional().nullable(),
  
  // Custom fields
  customFields: customFieldsSchema,
  
  // Assignment
  ownerId: z.string().optional(),
});

export const updateCompanySchema = createCompanySchema.partial().extend({
  id: idSchema,
});

export const listCompaniesSchema = z.object({
  ...searchSchema.shape,
  industry: z.string().optional(),
  size: z.string().optional(),
  ownerId: z.string().optional(),
  isActive: z.boolean().optional(),
  tags: z.array(z.string()).optional(),
});

// ========================================
// Contact Schemas
// ========================================

export const createContactSchema = z.object({
  firstName: z.string().min(1, "First name is required").max(100),
  lastName: z.string().min(1, "Last name is required").max(100),
  title: z.string().max(100).optional().nullable(),
  
  // Company
  companyId: z.string().optional().nullable(),
  
  // Contact Information
  email: z.string().email("Invalid email").optional().nullable(),
  phone: z.string().max(50).optional().nullable(),
  mobilePhone: z.string().max(50).optional().nullable(),
  whatsapp: z.string().max(50).optional().nullable(),
  
  // Address
  addressLine1: z.string().max(255).optional().nullable(),
  addressLine2: z.string().max(255).optional().nullable(),
  city: z.string().max(100).optional().nullable(),
  state: z.string().max(100).optional().nullable(),
  country: z.string().max(100).optional().nullable(),
  postalCode: z.string().max(20).optional().nullable(),
  
  // Social Links
  linkedinUrl: z.string().url("Invalid URL").optional().nullable(),
  twitterUrl: z.string().url("Invalid URL").optional().nullable(),
  facebookUrl: z.string().url("Invalid URL").optional().nullable(),
  
  // Professional Info
  department: z.string().max(100).optional().nullable(),
  seniority: z.string().max(50).optional().nullable(),
  
  // Lead Information
  leadSource: z.string().max(100).optional().nullable(),
  leadStatus: z.string().max(50).optional().nullable(),
  
  // Custom fields
  customFields: customFieldsSchema,
  
  // Assignment
  ownerId: z.string().optional(),
});

export const updateContactSchema = createContactSchema.partial().extend({
  id: idSchema,
});

export const listContactsSchema = z.object({
  ...searchSchema.shape,
  companyId: z.string().optional(),
  withoutCompany: z.boolean().optional(),
  ownerId: z.string().optional(),
  leadStatus: z.string().optional(),
  leadSource: z.string().optional(),
  isActive: z.boolean().optional(),
  tags: z.array(z.string()).optional(),
});

// ========================================
// Deal Schemas
// ========================================

export const createDealSchema = z.object({
  name: z.string().min(1, "Deal name is required").max(255),
  description: z.string().max(2000).optional().nullable(),
  
  // Relationships
  companyId: z.string().optional().nullable(),
  primaryContactId: z.string().optional().nullable(),
  
  // Pipeline & Stage
  pipelineId: z.string().min(1, "Pipeline is required"),
  stageId: z.string().min(1, "Stage is required"),
  
  // Financial
  amount: z.string().optional().nullable(),
  currency: z.string().max(10).default("KES"),
  probability: z.number().int().min(0).max(100).optional().nullable(),
  
  // Dates
  expectedCloseDate: optionalDateSchema,
  
  // Custom fields
  customFields: customFieldsSchema,
  
  // Assignment
  ownerId: z.string().optional(),
});

export const updateDealSchema = createDealSchema.partial().extend({
  id: idSchema,
});

export const updateDealStageSchema = z.object({
  id: idSchema,
  stageId: z.string().min(1, "Stage is required"),
  reason: z.string().optional(),
});

export const closeDealSchema = z.object({
  id: idSchema,
  isWon: z.boolean(),
  lostReason: z.string().optional(),
  actualCloseDate: optionalDateSchema,
});

export const listDealsSchema = z.object({
  ...searchSchema.shape,
  companyId: z.string().optional(),
  contactId: z.string().optional(),
  pipelineId: z.string().optional(),
  stageId: z.string().optional(),
  ownerId: z.string().optional(),
  isActive: z.boolean().optional(),
  isClosed: z.boolean().optional(),
  isWon: z.boolean().optional(),
  expectedCloseDateFrom: optionalDateSchema,
  expectedCloseDateTo: optionalDateSchema,
  amountMin: z.number().optional(),
  amountMax: z.number().optional(),
  tags: z.array(z.string()).optional(),
});

// ========================================
// Activity Schemas
// ========================================

export const activityTypeSchema = z.enum([
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

export const createActivitySchema = z.object({
  activityType: activityTypeSchema,
  subject: z.string().min(1, "Subject is required").max(255),
  description: z.string().max(5000).optional().nullable(),
  
  // Relationships
  contactId: z.string().optional().nullable(),
  companyId: z.string().optional().nullable(),
  dealId: z.string().optional().nullable(),
  
  // Details
  duration: z.number().int().positive().optional().nullable(),
  location: z.string().max(255).optional().nullable(),
  
  // Dates
  scheduledAt: optionalDateSchema,
  
  // Participants
  participants: z.array(z.object({
    userId: z.string().optional(),
    email: z.string().email().optional(),
    name: z.string().optional(),
    role: z.string().optional(),
  })).optional(),
  
  // Outcome
  outcome: z.string().max(1000).optional().nullable(),
  
  // Custom fields
  customFields: customFieldsSchema,
});

export const updateActivitySchema = createActivitySchema.partial().extend({
  id: idSchema,
});

export const completeActivitySchema = z.object({
  id: idSchema,
  outcome: z.string().max(1000).optional(),
  completedAt: optionalDateSchema,
});

export const listActivitiesSchema = z.object({
  ...searchSchema.shape,
  contactId: z.string().optional(),
  companyId: z.string().optional(),
  dealId: z.string().optional(),
  activityType: activityTypeSchema.optional(),
  isCompleted: z.boolean().optional(),
  scheduledFrom: optionalDateSchema,
  scheduledTo: optionalDateSchema,
  createdById: z.string().optional(),
});

// ========================================
// Task Schemas
// ========================================

export const taskStatusSchema = z.enum(["todo", "in_progress", "completed", "cancelled"]);
export const taskPrioritySchema = z.enum(["low", "medium", "high", "urgent"]);

export const createTaskSchema = z.object({
  title: z.string().min(1, "Title is required").max(255),
  description: z.string().max(5000).optional().nullable(),
  
  // Status & Priority
  status: taskStatusSchema.default("todo"),
  priority: taskPrioritySchema.default("medium"),
  
  // Relationships
  contactId: z.string().optional().nullable(),
  companyId: z.string().optional().nullable(),
  dealId: z.string().optional().nullable(),
  
  // Assignment
  assignedToId: z.string().min(1, "Assignee is required"),
  
  // Dates
  dueDate: optionalDateSchema,
  reminderAt: optionalDateSchema,
  
  // Custom fields
  customFields: customFieldsSchema,
});

export const updateTaskSchema = createTaskSchema.partial().extend({
  id: idSchema,
});

export const updateTaskStatusSchema = z.object({
  id: idSchema,
  status: taskStatusSchema,
});

export const listTasksSchema = z.object({
  ...searchSchema.shape,
  contactId: z.string().optional(),
  companyId: z.string().optional(),
  dealId: z.string().optional(),
  assignedToId: z.string().optional(),
  status: taskStatusSchema.optional(),
  priority: taskPrioritySchema.optional(),
  dueDateFrom: optionalDateSchema,
  dueDateTo: optionalDateSchema,
  createdById: z.string().optional(),
});

// ========================================
// Note Schemas
// ========================================

export const createNoteSchema = z.object({
  content: z.string().min(1, "Note content is required").max(10000),
  
  // Relationships
  contactId: z.string().optional().nullable(),
  companyId: z.string().optional().nullable(),
  dealId: z.string().optional().nullable(),
  
  // Pinned
  isPinned: z.boolean().default(false),
});

export const updateNoteSchema = z.object({
  id: idSchema,
  content: z.string().min(1).max(10000),
  isPinned: z.boolean().optional(),
});

export const listNotesSchema = z.object({
  ...paginationSchema.shape,
  contactId: z.string().optional(),
  companyId: z.string().optional(),
  dealId: z.string().optional(),
  isPinned: z.boolean().optional(),
  createdById: z.string().optional(),
});

// ========================================
// Tag Schemas
// ========================================

export const createTagSchema = z.object({
  name: z.string().min(1, "Tag name is required").max(50),
  color: z.string().regex(/^#[0-9A-F]{6}$/i, "Invalid color hex").optional().nullable(),
  description: z.string().max(255).optional().nullable(),
});

export const updateTagSchema = createTagSchema.partial().extend({
  id: idSchema,
});

export const addTagToEntitySchema = z.object({
  entityType: z.enum(["company", "contact", "deal"]),
  entityId: idSchema,
  tagId: idSchema,
});

export const removeTagFromEntitySchema = addTagToEntitySchema;

export const listTagsSchema = searchSchema;

export const assignTagSchema = z.object({
  tagId: idSchema,
});

// ========================================
// Custom Field Schemas
// ========================================

export const fieldTypeSchema = z.enum([
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

export const entityTypeSchema = z.enum(["contact", "company", "deal", "activity", "task"]);

export const createCustomFieldDefinitionSchema = z.object({
  entityType: entityTypeSchema,
  fieldName: z.string().min(1).max(100).regex(/^[a-z_][a-z0-9_]*$/, "Field name must be lowercase with underscores"),
  fieldLabel: z.string().min(1).max(255),
  fieldType: fieldTypeSchema,
  description: z.string().max(500).optional().nullable(),
  isRequired: z.boolean().default(false),
  displayOrder: z.number().int().default(0),
  fieldConfig: z.record(z.string(), z.any()).optional(),
  aiConfig: z.record(z.string(), z.any()).optional(),
});

export const updateCustomFieldDefinitionSchema = createCustomFieldDefinitionSchema.partial().extend({
  id: idSchema,
});

export const listCustomFieldDefinitionsSchema = z.object({
  entityType: entityTypeSchema.optional(),
  isActive: z.boolean().optional(),
});

// ========================================
// Pipeline Schemas
// ========================================

export const createPipelineSchema = z.object({
  name: z.string().min(1, "Pipeline name is required").max(100),
  description: z.string().max(500).optional().nullable(),
  isDefault: z.boolean().default(false),
  displayOrder: z.number().int().default(0),
});

export const updatePipelineSchema = createPipelineSchema.partial().extend({
  id: idSchema,
});

export const createPipelineStageSchema = z.object({
  pipelineId: idSchema,
  name: z.string().min(1, "Stage name is required").max(100),
  description: z.string().max(500).optional().nullable(),
  probability: z.number().int().min(0).max(100).default(0),
  displayOrder: z.number().int().default(0),
  color: z.string().regex(/^#[0-9A-F]{6}$/i, "Invalid color hex").optional().nullable(),
  aiConfig: z.record(z.string(), z.any()).optional(),
});

export const updatePipelineStageSchema = createPipelineStageSchema.partial().extend({
  id: idSchema,
});

export const reorderStagesSchema = z.object({
  pipelineId: idSchema,
  stageIds: z.array(idSchema).min(1, "At least one stage is required"),
});

export const listPipelinesSchema = paginationSchema;
export const createStageSchema = createPipelineStageSchema;
export const updateStageSchema = updatePipelineStageSchema;
