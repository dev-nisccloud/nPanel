/**
 * CRM Companies Router
 * 
 * Handles all company-related operations with:
 * - Agency-only access
 * - Full CRUD operations
 * - Activity logging
 * - Proper error handling
 * - Input validation
 */

import { and, db, desc, eq, ilike, or, sql } from "@npanel/db";
import { nanoid } from "nanoid";
import { z } from "zod";

import {
  crmActivity,
  crmActivityLog,
  crmCompany,
  crmContact,
  crmDeal,
  crmNote,
  crmTask,
} from "@npanel/db/schema";
import { protectedProcedure, router } from "../../trpc";

import {
  getAuthenticatedUser,
  assertCanAccessResource,
  throwNotFound,
  handleDatabaseOperation,
  validatePagination,
  buildPaginationMetadata,
  readCount,
  throwOperationFailed,
} from "./lib/permissions";

import {
  createCompanySchema,
  updateCompanySchema,
  listCompaniesSchema,
  idSchema,
} from "./lib/schemas";

import {
  logCreation,
  logUpdate,
  logDeletion,
  generateChanges,
} from "./lib/activity-log";

export const companiesRouter = router({
  /**
   * List companies with filters, search, and pagination
   */
  list: protectedProcedure
    .input(listCompaniesSchema)
    .query(async ({ ctx, input }) => {
      getAuthenticatedUser(ctx);
      const { page, limit } = validatePagination(input);
      
      return handleDatabaseOperation(async () => {
        // Build where conditions
        const conditions = [];
        
        // Search across name, website, email
        if (input.search) {
          conditions.push(
            or(
              ilike(crmCompany.name, `%${input.search}%`),
              ilike(crmCompany.website, `%${input.search}%`),
              ilike(crmCompany.email, `%${input.search}%`)
            )
          );
        }
        
        // Filter by industry
        if (input.industry) {
          conditions.push(eq(crmCompany.industry, input.industry));
        }
        
        // Filter by size
        if (input.size) {
          conditions.push(eq(crmCompany.size, input.size));
        }
        
        // Filter by owner
        if (input.ownerId) {
          conditions.push(eq(crmCompany.ownerId, input.ownerId));
        }
        
        // Filter by active status
        if (input.isActive !== undefined) {
          conditions.push(eq(crmCompany.isActive, input.isActive));
        }
        
        const whereClause = conditions.length > 0 ? and(...conditions) : undefined;
        
        // Execute query with relations
        const companies = await db.query.crmCompany.findMany({
          where: whereClause,
          with: {
            owner: {
              columns: {
                id: true,
                name: true,
                email: true,
              },
            },
            createdBy: {
              columns: {
                id: true,
                name: true,
              },
            },
            tags: {
              with: {
                tag: true,
              },
            },
            contacts: {
              columns: {
                id: true,
                fullName: true,
                email: true,
              },
              limit: 5,
            },
            deals: {
              columns: {
                id: true,
                name: true,
                amount: true,
              },
              limit: 5,
            },
          },
          orderBy: [desc(crmCompany.updatedAt)],
          limit,
          offset: (page - 1) * limit,
        });
        
        // Get total count
        const [countRow] = await db
          .select({ count: sql<number>`count(*)::int` })
          .from(crmCompany)
          .where(whereClause);
        
        return {
          data: companies,
          pagination: buildPaginationMetadata({ page, limit, total: readCount(countRow) }),
        };
      }, "list companies");
    }),

  /**
   * Get single company by ID with full details
   */
  get: protectedProcedure
    .input(z.object({ id: idSchema }))
    .query(async ({ ctx, input }) => {
      getAuthenticatedUser(ctx);
      
      return handleDatabaseOperation(async () => {
        const company = await db.query.crmCompany.findFirst({
          where: eq(crmCompany.id, input.id),
          with: {
            owner: {
              columns: {
                id: true,
                name: true,
                email: true,
                role: true,
              },
            },
            createdBy: {
              columns: {
                id: true,
                name: true,
              },
            },
            contacts: {
              with: {
                tags: {
                  with: {
                    tag: true,
                  },
                },
              },
              orderBy: [desc(crmContact.updatedAt)],
            },
            deals: {
              with: {
                stage: true,
                pipeline: true,
                primaryContact: {
                  columns: {
                    id: true,
                    fullName: true,
                  },
                },
              },
              orderBy: [desc(crmDeal.updatedAt)],
            },
            activities: {
              with: {
                createdBy: {
                  columns: {
                    id: true,
                    name: true,
                  },
                },
              },
              orderBy: [desc(crmActivity.createdAt)],
              limit: 20,
            },
            tasks: {
              with: {
                assignedTo: {
                  columns: {
                    id: true,
                    name: true,
                  },
                },
              },
              where: eq(crmTask.status, "todo"),
              orderBy: [desc(crmTask.dueDate)],
              limit: 10,
            },
            notes: {
              with: {
                createdBy: {
                  columns: {
                    id: true,
                    name: true,
                  },
                },
              },
              orderBy: [desc(crmNote.isPinned), desc(crmNote.createdAt)],
              limit: 10,
            },
            tags: {
              with: {
                tag: true,
              },
            },
          },
        });
        
        if (!company) {
          throwNotFound("Company");
        }
        
        return company;
      }, "get company");
    }),

  /**
   * Create new company
   */
  create: protectedProcedure
    .input(createCompanySchema)
    .mutation(async ({ ctx, input }) => {
      const user = getAuthenticatedUser(ctx);
      
      return handleDatabaseOperation(async () => {
        const { ownerId, ...data } = input;
        
        // Create company
        const [company] = await db
          .insert(crmCompany)
          .values({
            id: nanoid(),
            ...data,
            customFields: data.customFields || {},
            isActive: true,
            createdById: user.id,
            ownerId: ownerId || user.id,
          })
          .returning();
        if (!company) throwOperationFailed("create company");
        
        // Log activity
        await logCreation({
          db: db,
          entityType: "company",
          entityId: company.id,
          entityName: company.name,
          userId: user.id,
          ctx,
        });
        
        return company;
      }, "create company");
    }),

  /**
   * Update company
   */
  update: protectedProcedure
    .input(updateCompanySchema)
    .mutation(async ({ ctx, input }) => {
      const user = getAuthenticatedUser(ctx);
      
      return handleDatabaseOperation(async () => {
        const { id, ...updates } = input;
        
        // Get current company
        const current = await db.query.crmCompany.findFirst({
          where: eq(crmCompany.id, id),
        });
        
        if (!current) {
          throwNotFound("Company");
        }
        
        // Check access
        assertCanAccessResource({
          userId: user.id,
          ownerId: current.ownerId,
          role: user.role,
          resourceType: "company",
        });
        
        // Update company
        const [updated] = await db
          .update(crmCompany)
          .set(updates)
          .where(eq(crmCompany.id, id))
          .returning();
        if (!updated) throwOperationFailed("update company");
        
        // Log changes
        const changes = generateChanges(current, updates);
        if (changes.length > 0) {
          await logUpdate({
            db: db,
            entityType: "company",
            entityId: id,
            entityName: updated.name,
            changes,
            userId: user.id,
            ctx,
          });
        }
        
        return updated;
      }, "update company");
    }),

  /**
   * Delete company (soft delete)
   */
  delete: protectedProcedure
    .input(z.object({ id: idSchema }))
    .mutation(async ({ ctx, input }) => {
      const user = getAuthenticatedUser(ctx);
      
      return handleDatabaseOperation(async () => {
        // Get current company
        const company = await db.query.crmCompany.findFirst({
          where: eq(crmCompany.id, input.id),
        });
        
        if (!company) {
          throwNotFound("Company");
        }
        
        // Check access
        assertCanAccessResource({
          userId: user.id,
          ownerId: company.ownerId,
          role: user.role,
          resourceType: "company",
        });
        
        // Soft delete by setting isActive to false
        await db
          .update(crmCompany)
          .set({ isActive: false })
          .where(eq(crmCompany.id, input.id));
        
        // Log deletion
        await logDeletion({
          db: db,
          entityType: "company",
          entityId: input.id,
          entityName: company.name,
          userId: user.id,
          ctx,
        });
        
        return { success: true };
      }, "delete company");
    }),

  /**
   * Restore deleted company
   */
  restore: protectedProcedure
    .input(z.object({ id: idSchema }))
    .mutation(async ({ ctx, input }) => {
      const user = getAuthenticatedUser(ctx);
      
      return handleDatabaseOperation(async () => {
        // Get company
        const company = await db.query.crmCompany.findFirst({
          where: eq(crmCompany.id, input.id),
        });
        
        if (!company) {
          throwNotFound("Company");
        }
        
        // Check access
        assertCanAccessResource({
          userId: user.id,
          ownerId: company.ownerId,
          role: user.role,
          resourceType: "company",
        });
        
        // Restore by setting isActive to true
        const [restored] = await db
          .update(crmCompany)
          .set({ isActive: true })
          .where(eq(crmCompany.id, input.id))
          .returning();
        
        // Log restoration
        await db.insert(crmActivityLog).values({
          id: nanoid(),
          entityType: "company",
          entityId: input.id,
          action: "restored",
          description: `Company "${company.name}" restored`,
          createdById: user.id,
          ipAddress: ctx.ipAddress,
        });
        
        return restored;
      }, "restore company");
    }),

  /**
   * Get company activity timeline
   */
  getActivityTimeline: protectedProcedure
    .input(
      z.object({
        id: idSchema,
        page: z.number().int().min(1).default(1),
        limit: z.number().int().min(1).max(100).default(20),
      })
    )
    .query(async ({ ctx, input }) => {
      getAuthenticatedUser(ctx);
      const { page, limit } = input;
      
      return handleDatabaseOperation(async () => {
        // Get company
        const company = await db.query.crmCompany.findFirst({
          where: eq(crmCompany.id, input.id),
        });
        
        if (!company) {
          throwNotFound("Company");
        }
        
        // Get activity logs
        const logs = await db.query.crmActivityLog.findMany({
          where: and(
            eq(crmActivityLog.entityType, "company"),
            eq(crmActivityLog.entityId, input.id)
          ),
          with: {
            createdBy: {
              columns: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
          orderBy: [desc(crmActivityLog.createdAt)],
          limit,
          offset: (page - 1) * limit,
        });
        
        // Get total count
        const [countRow] = await db
          .select({ count: sql<number>`count(*)::int` })
          .from(crmActivityLog)
          .where(
            and(
              eq(crmActivityLog.entityType, "company"),
              eq(crmActivityLog.entityId, input.id)
            )
          );
        
        return {
          data: logs,
          pagination: buildPaginationMetadata({ page, limit, total: readCount(countRow) }),
        };
      }, "get company activity timeline");
    }),

  /**
   * Get industries for filtering
   */
  getIndustries: protectedProcedure
    .query(async ({ ctx }) => {
      getAuthenticatedUser(ctx);
      
      return handleDatabaseOperation(async () => {
        const industries = await db
          .selectDistinct({ industry: crmCompany.industry })
          .from(crmCompany)
          .where(
            and(
              eq(crmCompany.isActive, true),
              sql`${crmCompany.industry} IS NOT NULL`
            )
          )
          .orderBy(crmCompany.industry);
        
        return industries.map((i: { industry: string | null }) => i.industry).filter(Boolean);
      }, "get industries");
    }),

  /**
   * Get company sizes for filtering
   */
  getSizes: protectedProcedure
    .query(async ({ ctx }) => {
      getAuthenticatedUser(ctx);
      
      return handleDatabaseOperation(async () => {
        const sizes = await db
          .selectDistinct({ size: crmCompany.size })
          .from(crmCompany)
          .where(
            and(
              eq(crmCompany.isActive, true),
              sql`${crmCompany.size} IS NOT NULL`
            )
          )
          .orderBy(crmCompany.size);
        
        return sizes.map((s: { size: string | null }) => s.size).filter(Boolean);
      }, "get company sizes");
    }),
});
