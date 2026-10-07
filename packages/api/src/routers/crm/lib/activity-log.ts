/**
 * CRM Activity Logging Utilities
 * 
 * Provides helpers for tracking all CRM changes in the activity log
 */

import { nanoid } from "nanoid";
import type { Context } from "../../../trpc";

export type EntityType = "contact" | "company" | "deal" | "activity" | "task";

export interface ActivityLogChange {
  field: string;
  oldValue: any;
  newValue: any;
}

export interface LogActivityParams {
  db: any; // DrizzleDB instance
  entityType: EntityType;
  entityId: string;
  action: string;
  description?: string;
  changes?: ActivityLogChange[];
  metadata?: Record<string, any>;
  userId: string;
  ipAddress?: string | null;
  userAgent?: string;
}

/**
 * Log an activity to the CRM activity log
 */
export async function logActivity(params: LogActivityParams) {
  const {
    db,
    entityType,
    entityId,
    action,
    description,
    changes,
    metadata,
    userId,
    ipAddress,
    userAgent,
  } = params;

  // Import schema dynamically to avoid circular dependencies
  const { crmActivityLog } = await import("@npanel/db/schema");

  try {
    await db.insert(crmActivityLog).values({
      id: nanoid(),
      entityType,
      entityId,
      action,
      description,
      changes: changes || [],
      metadata: metadata || {},
      ipAddress,
      userAgent,
      createdById: userId,
    });
  } catch (error) {
    // Log but don't fail the operation if activity logging fails
    console.error("Failed to log CRM activity:", error);
  }
}

/**
 * Compare two objects and generate change list
 */
export function generateChanges<T extends Record<string, any>>(
  oldObj: T,
  newObj: Partial<T>,
  fieldsToTrack?: (keyof T)[]
): ActivityLogChange[] {
  const changes: ActivityLogChange[] = [];
  
  const keys = fieldsToTrack || (Object.keys(newObj) as (keyof T)[]);
  
  for (const key of keys) {
    const oldValue = oldObj[key];
    const newValue = newObj[key];
    
    // Skip if values are the same
    if (JSON.stringify(oldValue) === JSON.stringify(newValue)) {
      continue;
    }
    
    // Skip undefined/null to undefined/null
    if ((oldValue === undefined || oldValue === null) && 
        (newValue === undefined || newValue === null)) {
      continue;
    }
    
    changes.push({
      field: String(key),
      oldValue,
      newValue,
    });
  }
  
  return changes;
}

/**
 * Helper to log a creation event
 */
export async function logCreation(params: {
  db: any;
  entityType: EntityType;
  entityId: string;
  entityName: string;
  userId: string;
  ctx?: Context;
}) {
  await logActivity({
    db: params.db,
    entityType: params.entityType,
    entityId: params.entityId,
    action: "created",
    description: `${capitalize(params.entityType)} "${params.entityName}" created`,
    userId: params.userId,
    ipAddress: params.ctx?.ipAddress,
    userAgent: params.ctx?.req.header("user-agent") || undefined,
  });
}

/**
 * Helper to log an update event
 */
export async function logUpdate(params: {
  db: any;
  entityType: EntityType;
  entityId: string;
  entityName: string;
  changes: ActivityLogChange[];
  userId: string;
  ctx?: Context;
}) {
  if (params.changes.length === 0) {
    return; // Don't log if nothing changed
  }

  await logActivity({
    db: params.db,
    entityType: params.entityType,
    entityId: params.entityId,
    action: "updated",
    description: `${capitalize(params.entityType)} "${params.entityName}" updated`,
    changes: params.changes,
    userId: params.userId,
    ipAddress: params.ctx?.ipAddress,
    userAgent: params.ctx?.req.header("user-agent") || undefined,
  });
}

/**
 * Helper to log a deletion event
 */
export async function logDeletion(params: {
  db: any;
  entityType: EntityType;
  entityId: string;
  entityName: string;
  userId: string;
  ctx?: Context;
}) {
  await logActivity({
    db: params.db,
    entityType: params.entityType,
    entityId: params.entityId,
    action: "deleted",
    description: `${capitalize(params.entityType)} "${params.entityName}" deleted`,
    userId: params.userId,
    ipAddress: params.ctx?.ipAddress,
    userAgent: params.ctx?.req.header("user-agent") || undefined,
  });
}

/**
 * Helper to log a stage change event (for deals)
 */
export async function logStageChange(params: {
  db: any;
  dealId: string;
  dealName: string;
  oldStage: string;
  newStage: string;
  reason?: string;
  userId: string;
  ctx?: Context;
}) {
  await logActivity({
    db: params.db,
    entityType: "deal",
    entityId: params.dealId,
    action: "stage_changed",
    description: `Deal "${params.dealName}" moved from ${params.oldStage} to ${params.newStage}`,
    changes: [
      {
        field: "stage",
        oldValue: params.oldStage,
        newValue: params.newStage,
      },
    ],
    metadata: params.reason ? { reason: params.reason } : undefined,
    userId: params.userId,
    ipAddress: params.ctx?.ipAddress,
    userAgent: params.ctx?.req.header("user-agent") || undefined,
  });
}

/**
 * Helper to log a deal close event
 */
export async function logDealClose(params: {
  db: any;
  dealId: string;
  dealName: string;
  isWon: boolean;
  lostReason?: string;
  userId: string;
  ctx?: Context;
}) {
  await logActivity({
    db: params.db,
    entityType: "deal",
    entityId: params.dealId,
    action: params.isWon ? "closed_won" : "closed_lost",
    description: `Deal "${params.dealName}" ${params.isWon ? "won" : "lost"}`,
    metadata: params.lostReason ? { lostReason: params.lostReason } : undefined,
    userId: params.userId,
    ipAddress: params.ctx?.ipAddress,
    userAgent: params.ctx?.req.header("user-agent") || undefined,
  });
}

/**
 * Helper to log an owner change event
 */
export async function logOwnerChange(params: {
  db: any;
  entityType: EntityType;
  entityId: string;
  entityName: string;
  oldOwnerId: string;
  newOwnerId: string;
  userId: string;
  ctx?: Context;
}) {
  await logActivity({
    db: params.db,
    entityType: params.entityType,
    entityId: params.entityId,
    action: "owner_changed",
    description: `${capitalize(params.entityType)} "${params.entityName}" owner changed`,
    changes: [
      {
        field: "ownerId",
        oldValue: params.oldOwnerId,
        newValue: params.newOwnerId,
      },
    ],
    userId: params.userId,
    ipAddress: params.ctx?.ipAddress,
    userAgent: params.ctx?.req.header("user-agent") || undefined,
  });
}

/**
 * Capitalize first letter
 */
function capitalize(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1);
}
