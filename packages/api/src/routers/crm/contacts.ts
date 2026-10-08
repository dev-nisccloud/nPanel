import { and, db, desc, eq, ilike, isNull, or, sql } from "@npanel/db";
import { crmActivityLog, crmContact, crmContactTag } from "@npanel/db/schema";
import { nanoid } from "nanoid";
import { z } from "zod";

import { protectedProcedure, router } from "../../trpc";
import { logCreation, logDeletion, logUpdate, generateChanges } from "./lib/activity-log";
import {
  assertCanAccessResource,
  buildPaginationMetadata,
  readCount,
  throwOperationFailed,
  getAuthenticatedUser,
  handleDatabaseOperation,
  throwNotFound,
  validatePagination,
} from "./lib/permissions";
import {
  createContactSchema,
  idSchema,
  listContactsSchema,
  updateContactSchema,
} from "./lib/schemas";

function fullName(firstName: string, lastName: string) {
  return `${firstName} ${lastName}`.trim();
}

export const contactsRouter = router({
  list: protectedProcedure.input(listContactsSchema).query(async ({ ctx, input }) => {
    getAuthenticatedUser(ctx);
    const { page, limit } = validatePagination(input);

    return handleDatabaseOperation(async () => {
      const conditions = [];

      if (input.search) {
        conditions.push(
          or(
            ilike(crmContact.fullName, `%${input.search}%`),
            ilike(crmContact.email, `%${input.search}%`),
            ilike(crmContact.phone, `%${input.search}%`),
          ),
        );
      }
      if (input.withoutCompany) conditions.push(isNull(crmContact.companyId));
      else if (input.companyId) conditions.push(eq(crmContact.companyId, input.companyId));
      if (input.ownerId) conditions.push(eq(crmContact.ownerId, input.ownerId));
      if (input.leadStatus) conditions.push(eq(crmContact.leadStatus, input.leadStatus));
      if (input.leadSource) conditions.push(eq(crmContact.leadSource, input.leadSource));
      if (input.isActive !== undefined) conditions.push(eq(crmContact.isActive, input.isActive));
      if (input.tags && input.tags.length > 0) {
        const tagIds = sql.join(
          input.tags.map((tagId) => sql`${tagId}`),
          sql`, `,
        );
        conditions.push(
          sql`${crmContact.id} in (select ${crmContactTag.contactId} from ${crmContactTag} where ${crmContactTag.tagId} in (${tagIds}))`,
        );
      }

      const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

      const data = await db.query.crmContact.findMany({
        where: whereClause,
        with: {
          company: { columns: { id: true, name: true } },
          deals: { columns: { id: true, name: true, amount: true }, limit: 5 },
          tags: { with: { tag: { columns: { id: true, name: true, color: true } } } },
        },
        orderBy: [desc(crmContact.updatedAt)],
        limit,
        offset: (page - 1) * limit,
      });

      const [countRow] = await db
        .select({ count: sql<number>`count(*)::int` })
        .from(crmContact)
        .where(whereClause);

      return {
        data,
        pagination: buildPaginationMetadata({ page, limit, total: readCount(countRow) }),
      };
    }, "list contacts");
  }),

  get: protectedProcedure.input(z.object({ id: idSchema })).query(async ({ ctx, input }) => {
    getAuthenticatedUser(ctx);

    return handleDatabaseOperation(async () => {
      const contact = await db.query.crmContact.findFirst({
        where: eq(crmContact.id, input.id),
        with: {
          company: true,
          deals: { with: { pipeline: true, stage: true } },
          owner: { columns: { id: true, name: true, email: true } },
          tags: { with: { tag: true } },
        },
      });

      if (!contact) throwNotFound("Contact");
      return contact;
    }, "get contact");
  }),

  create: protectedProcedure.input(createContactSchema).mutation(async ({ ctx, input }) => {
    const user = getAuthenticatedUser(ctx);

    return handleDatabaseOperation(async () => {
      const { ownerId, ...data } = input;
      const [contact] = await db
        .insert(crmContact)
        .values({
          id: nanoid(),
          ...data,
          fullName: fullName(data.firstName, data.lastName),
          customFields: data.customFields || {},
          isActive: true,
          createdById: user.id,
          ownerId: ownerId || user.id,
        })
        .returning();
      if (!contact) throwOperationFailed("create contact");

      await logCreation({
        db: db,
        entityType: "contact",
        entityId: contact.id,
        entityName: contact.fullName,
        userId: user.id,
        ctx,
      });

      return contact;
    }, "create contact");
  }),

  update: protectedProcedure.input(updateContactSchema).mutation(async ({ ctx, input }) => {
    const user = getAuthenticatedUser(ctx);
    const { id, ...updates } = input;

    return handleDatabaseOperation(async () => {
      const current = await db.query.crmContact.findFirst({
        where: eq(crmContact.id, id),
      });
      if (!current) throwNotFound("Contact");

      assertCanAccessResource({
        userId: user.id,
        ownerId: current.ownerId,
        role: user.role,
        resourceType: "contact",
      });

      const nextFirst = updates.firstName ?? current.firstName;
      const nextLast = updates.lastName ?? current.lastName;

      const [updated] = await db
        .update(crmContact)
        .set({
          ...updates,
          fullName: fullName(nextFirst, nextLast),
        })
        .where(eq(crmContact.id, id))
        .returning();
      if (!updated) throwOperationFailed("update contact");

      const changes = generateChanges(current, updates);
      if (changes.length > 0) {
        await logUpdate({
          db: db,
          entityType: "contact",
          entityId: id,
          entityName: updated.fullName,
          changes,
          userId: user.id,
          ctx,
        });
      }

      return updated;
    }, "update contact");
  }),

  delete: protectedProcedure.input(z.object({ id: idSchema })).mutation(async ({ ctx, input }) => {
    const user = getAuthenticatedUser(ctx);

    return handleDatabaseOperation(async () => {
      const contact = await db.query.crmContact.findFirst({
        where: eq(crmContact.id, input.id),
      });
      if (!contact) throwNotFound("Contact");

      assertCanAccessResource({
        userId: user.id,
        ownerId: contact.ownerId,
        role: user.role,
        resourceType: "contact",
      });

      await db
        .update(crmContact)
        .set({ isActive: false })
        .where(eq(crmContact.id, input.id));

      await logDeletion({
        db: db,
        entityType: "contact",
        entityId: input.id,
        entityName: contact.fullName,
        userId: user.id,
        ctx,
      });

      return { success: true };
    }, "delete contact");
  }),

  restore: protectedProcedure.input(z.object({ id: idSchema })).mutation(async ({ ctx, input }) => {
    const user = getAuthenticatedUser(ctx);

    return handleDatabaseOperation(async () => {
      const contact = await db.query.crmContact.findFirst({
        where: eq(crmContact.id, input.id),
      });
      if (!contact) throwNotFound("Contact");

      assertCanAccessResource({
        userId: user.id,
        ownerId: contact.ownerId,
        role: user.role,
        resourceType: "contact",
      });

      const [restored] = await db
        .update(crmContact)
        .set({ isActive: true })
        .where(eq(crmContact.id, input.id))
        .returning();

      return restored;
    }, "restore contact");
  }),

  getActivityTimeline: protectedProcedure
    .input(z.object({ id: idSchema }))
    .query(async ({ ctx, input }) => {
      getAuthenticatedUser(ctx);

      return handleDatabaseOperation(async () => {
        const contact = await db.query.crmContact.findFirst({
          where: eq(crmContact.id, input.id),
        });
        if (!contact) throwNotFound("Contact");

        return db.query.crmActivityLog.findMany({
          where: and(
            eq(crmActivityLog.entityType, "contact"),
            eq(crmActivityLog.entityId, input.id),
          ),
          orderBy: [desc(crmActivityLog.createdAt)],
          limit: 100,
          with: {
            createdBy: { columns: { id: true, name: true } },
          },
        });
      }, "get contact activity timeline");
    }),
});
