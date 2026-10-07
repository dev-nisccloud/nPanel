import { and, asc, db, eq } from "@npanel/db";
import { crmCustomFieldDefinition } from "@npanel/db/schema";
import { nanoid } from "nanoid";
import { z } from "zod";

import { protectedProcedure, router } from "../../trpc";
import {
  assertCanAccessResource,
  getAuthenticatedUser,
  handleDatabaseOperation,
  throwNotFound,
  throwOperationFailed,
} from "./lib/permissions";
import {
  createCustomFieldDefinitionSchema,
  idSchema,
  listCustomFieldDefinitionsSchema,
  updateCustomFieldDefinitionSchema,
} from "./lib/schemas";

export const customFieldsRouter = router({
  list: protectedProcedure.input(listCustomFieldDefinitionsSchema).query(async ({ ctx, input }) => {
    getAuthenticatedUser(ctx);

    return handleDatabaseOperation(async () => {
      const conditions = [];
      if (input.entityType) conditions.push(eq(crmCustomFieldDefinition.entityType, input.entityType));
      if (input.isActive !== undefined) {
        conditions.push(eq(crmCustomFieldDefinition.isActive, input.isActive));
      }
      const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

      const data = await db.query.crmCustomFieldDefinition.findMany({
        where: whereClause,
        orderBy: [asc(crmCustomFieldDefinition.displayOrder), asc(crmCustomFieldDefinition.fieldLabel)],
      });

      return { data };
    }, "list custom fields");
  }),

  create: protectedProcedure.input(createCustomFieldDefinitionSchema).mutation(async ({ ctx, input }) => {
    const user = getAuthenticatedUser(ctx);

    return handleDatabaseOperation(async () => {
      const [field] = await db
        .insert(crmCustomFieldDefinition)
        .values({
          id: nanoid(),
          ...input,
          isActive: true,
          isSystem: false,
          createdById: user.id,
        })
        .returning();
      if (!field) throwOperationFailed("create custom field");
      return field;
    }, "create custom field");
  }),

  update: protectedProcedure.input(updateCustomFieldDefinitionSchema).mutation(async ({ ctx, input }) => {
    const user = getAuthenticatedUser(ctx);
    const { id, ...data } = input;

    return handleDatabaseOperation(async () => {
      const existing = await db.query.crmCustomFieldDefinition.findFirst({
        where: eq(crmCustomFieldDefinition.id, id),
      });
      if (!existing) throwNotFound("Custom field");

      assertCanAccessResource({
        userId: user.id,
        ownerId: existing.createdById,
        role: user.role,
        resourceType: "custom field",
      });

      const [updated] = await db
        .update(crmCustomFieldDefinition)
        .set(data)
        .where(eq(crmCustomFieldDefinition.id, id))
        .returning();
      if (!updated) throwOperationFailed("update custom field");
      return updated;
    }, "update custom field");
  }),

  delete: protectedProcedure.input(z.object({ id: idSchema })).mutation(async ({ ctx, input }) => {
    const user = getAuthenticatedUser(ctx);

    return handleDatabaseOperation(async () => {
      const existing = await db.query.crmCustomFieldDefinition.findFirst({
        where: eq(crmCustomFieldDefinition.id, input.id),
      });
      if (!existing) throwNotFound("Custom field");

      assertCanAccessResource({
        userId: user.id,
        ownerId: existing.createdById,
        role: user.role,
        resourceType: "custom field",
      });

      await db.delete(crmCustomFieldDefinition).where(eq(crmCustomFieldDefinition.id, input.id));
      return { success: true };
    }, "delete custom field");
  }),
});
