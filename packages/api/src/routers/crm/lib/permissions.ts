/**
 * CRM Permission & Authorization Utilities
 * 
 * Provides:
 * - Agency-only access controls
 * - Permission checking
 * - Error handling helpers
 */

import { TRPCError } from "@trpc/server";
import type { Context } from "../../../trpc";

// Agency roles that have access to CRM
const AGENCY_ROLES = new Set([
  "AGENCY_USER",
  "AGENCY_ADMIN",
  "AGENCY_SUPER_ADMIN",
]);

// CRM menu permission keys
export const CRM_PERMISSIONS = {
  VIEW: "/agency/crm",
  COMPANIES: "/agency/crm/companies",
  CONTACTS: "/agency/crm/contacts",
  DEALS: "/agency/crm/deals",
  ACTIVITIES: "/agency/crm/activities",
  TASKS: "/agency/crm/tasks",
  NOTES: "/agency/crm/notes",
  TAGS: "/agency/crm/tags",
  CUSTOM_FIELDS: "/agency/crm/custom-fields",
  PIPELINES: "/agency/crm/pipelines",
  ANALYTICS: "/agency/crm/analytics",
  SETTINGS: "/agency/crm/settings",
  SYNC: "/agency/crm/sync",
  AI: "/agency/crm/ai",
} as const;

/**
 * Check if user has an agency role
 */
export function isAgencyUser(role: string | null | undefined): boolean {
  return AGENCY_ROLES.has(role ?? "");
}

/**
 * Assert user has agency role or throw
 */
export function assertAgencyUser(role: string | null | undefined): asserts role is string {
  if (!isAgencyUser(role)) {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "Only agency users can access the CRM module.",
      cause: "user_not_agency",
    });
  }
}

/**
 * Assert user is authenticated
 */
export function assertAuthenticated(ctx: Context): asserts ctx is Context & {
  session: NonNullable<Context["session"]>;
} {
  if (!ctx.session?.user) {
    throw new TRPCError({
      code: "UNAUTHORIZED",
      message: "Authentication required",
      cause: "no_session",
    });
  }
}

/**
 * Get authenticated user from context or throw
 */
export function getAuthenticatedUser(ctx: Context) {
  assertAuthenticated(ctx);
  assertAgencyUser(ctx.session.user.role);
  
  return {
    id: ctx.session.user.id,
    email: ctx.session.user.email,
    name: ctx.session.user.name,
    role: ctx.session.user.role as string,
  };
}

/**
 * Check if user has admin role
 */
export function isAgencyAdmin(role: string | null | undefined): boolean {
  return role === "AGENCY_ADMIN" || role === "AGENCY_SUPER_ADMIN";
}

/**
 * Assert user has admin role
 */
export function assertAgencyAdmin(role: string | null | undefined): asserts role is "AGENCY_ADMIN" | "AGENCY_SUPER_ADMIN" {
  if (!isAgencyAdmin(role)) {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "This action requires admin privileges.",
      cause: "user_not_admin",
    });
  }
}

/**
 * Check if user owns a resource or is admin
 */
export function canAccessResource(params: {
  userId: string;
  ownerId: string;
  role: string;
}): boolean {
  return params.userId === params.ownerId || isAgencyAdmin(params.role);
}

/**
 * Assert user can access a resource
 */
export function assertCanAccessResource(params: {
  userId: string;
  ownerId: string;
  role: string;
  resourceType: string;
}): void {
  if (!canAccessResource(params)) {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: `You don't have permission to access this ${params.resourceType}.`,
      cause: "resource_access_denied",
    });
  }
}

/**
 * Error messages for common scenarios
 */
export const CRM_ERRORS = {
  NOT_FOUND: (entityType: string) => ({
    code: "NOT_FOUND" as const,
    message: `${entityType} not found.`,
  }),
  
  ALREADY_EXISTS: (entityType: string) => ({
    code: "CONFLICT" as const,
    message: `${entityType} already exists.`,
  }),
  
  INVALID_INPUT: (message: string) => ({
    code: "BAD_REQUEST" as const,
    message,
  }),
  
  OPERATION_FAILED: (operation: string) => ({
    code: "INTERNAL_SERVER_ERROR" as const,
    message: `Failed to ${operation}. Please try again.`,
  }),
  
  DEPENDENCY_EXISTS: (entityType: string, dependency: string) => ({
    code: "CONFLICT" as const,
    message: `Cannot delete ${entityType} because it has associated ${dependency}.`,
  }),
} as const;

/**
 * Throw a standardized not found error
 */
export function throwNotFound(entityType: string): never {
  const error = CRM_ERRORS.NOT_FOUND(entityType);
  throw new TRPCError(error);
}

/**
 * Throw a standardized already exists error
 */
export function throwAlreadyExists(entityType: string): never {
  const error = CRM_ERRORS.ALREADY_EXISTS(entityType);
  throw new TRPCError(error);
}

/**
 * Throw a standardized invalid input error
 */
export function throwInvalidInput(message: string): never {
  const error = CRM_ERRORS.INVALID_INPUT(message);
  throw new TRPCError(error);
}

/**
 * Throw a standardized operation failed error
 */
export function throwOperationFailed(operation: string): never {
  const error = CRM_ERRORS.OPERATION_FAILED(operation);
  throw new TRPCError(error);
}

/**
 * Throw a dependency exists error
 */
export function throwDependencyExists(entityType: string, dependency: string): never {
  const error = CRM_ERRORS.DEPENDENCY_EXISTS(entityType, dependency);
  throw new TRPCError(error);
}

/**
 * Safely handle database operations with proper error mapping
 */
export async function handleDatabaseOperation<T>(
  operation: () => Promise<T>,
  errorContext: string
): Promise<T> {
  try {
    return await operation();
  } catch (error) {
    console.error(`CRM Database Error [${errorContext}]:`, error);
    
    // Map specific database errors to user-friendly messages
    if (error instanceof Error) {
      if (error.message.includes("foreign key constraint")) {
        throw new TRPCError({
          code: "CONFLICT",
          message: "Cannot complete this operation due to related records.",
          cause: "foreign_key_constraint",
        });
      }
      
      if (error.message.includes("unique constraint")) {
        throw new TRPCError({
          code: "CONFLICT",
          message: "A record with this information already exists.",
          cause: "unique_constraint",
        });
      }
    }
    
    // Default error
    throw new TRPCError({
      code: "INTERNAL_SERVER_ERROR",
      message: `Database operation failed: ${errorContext}`,
      cause: error,
    });
  }
}

/**
 * Validate pagination parameters
 */
export function validatePagination(params: { page?: number; limit?: number }) {
  const page = params.page ?? 1;
  const limit = params.limit ?? 20;
  
  if (page < 1) {
    throwInvalidInput("Page must be greater than 0");
  }
  
  if (limit < 1 || limit > 100) {
    throwInvalidInput("Limit must be between 1 and 100");
  }
  
  return { page, limit };
}

/**
 * Build pagination metadata
 */
export function readCount(row: { count: number } | undefined) {
  return row?.count ?? 0;
}

export function buildPaginationMetadata(params: {
  page: number;
  limit: number;
  total: number;
}) {
  const { page, limit, total } = params;
  const totalPages = Math.ceil(total / limit);
  
  return {
    page,
    limit,
    total,
    totalPages,
    hasMore: page < totalPages,
    hasPrevious: page > 1,
  };
}
