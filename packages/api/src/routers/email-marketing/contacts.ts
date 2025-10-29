import { z } from "zod";
import { TRPCError, type AnyRouter } from "@trpc/server";
import { protectedProcedure, router } from "../../trpc";
import db from "@nPanel/db";

// API-side enums (no DB dependencies)
const ContactStatus = {
  SUBSCRIBED: "SUBSCRIBED",
  UNSUBSCRIBED: "UNSUBSCRIBED",
  BOUNCED: "BOUNCED",
  COMPLAINED: "COMPLAINED",
} as const;


// Helper function to convert API types to Prisma-compatible JSON values
// This bridges the API layer types to Prisma's InputJsonValue type
function toPrismaJson(value: unknown) {
  if (value === null || value === undefined) {
    return null;
  }
  // Cast through 'any' to bridge API types to Prisma types without importing Prisma types in API layer
  return JSON.parse(JSON.stringify(value));
}

// Helper function to generate unique IDs
function generateId(prefix: string): string {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

// Dedicated Zod schemas for contact management
const addContactSchema = z.object({
  audienceId: z.string(),
  email: z.string().email(),
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  customFields: z.record(z.string(), z.unknown()).optional(),
});

const bulkAddContactsSchema = z.object({
  audienceId: z.string(),
  contacts: z.array(z.object({
    email: z.string().email(),
    firstName: z.string().optional(),
    lastName: z.string().optional(),
    customFields: z.record(z.string(), z.unknown()).optional(),
  })),
});

const updateContactSchema = z.object({
  id: z.string(),
  updates: z.object({
    firstName: z.string().optional(),
    lastName: z.string().optional(),
    customFields: z.record(z.string(), z.unknown()).optional(),
  }),
});

const getContactByIdSchema = z.object({
  id: z.string(),
});

const unsubscribeContactSchema = z.object({
  id: z.string(),
});

const deleteContactSchema = z.object({
  id: z.string(),
});

const listContactsSchema = z.object({
  audienceId: z.string(),
  status: z.enum(["SUBSCRIBED", "UNSUBSCRIBED", "BOUNCED", "COMPLAINED"]).optional(),
  limit: z.number().min(1).max(100).default(20),
  offset: z.number().min(0).default(0),
});

const _contactsRouter = router({
  /**
   * Add a single contact to audience
   */
  add: protectedProcedure
    .input(addContactSchema)
    .mutation(async ({ input, ctx }) => {
      const { audienceId, email, firstName, lastName, customFields } = input;
      const userId = ctx.session?.user?.id;

      if (!userId) {
        throw new TRPCError({ code: "UNAUTHORIZED" });
      }

      try {
        // Check if audience exists and user has access
        const audience = await db.audience.findFirst({
          where: {
            id: audienceId,
            OR: [
              { userId },
              { team: { members: { some: { userId } } } },
            ],
          },
        });

        if (!audience) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Audience not found",
          });
        }

        // Check for duplicate email
        const existingContact = await db.audienceContact.findUnique({
          where: {
            audienceId_email: {
              audienceId,
              email,
            },
          },
        });

        if (existingContact) {
          throw new TRPCError({
            code: "CONFLICT",
            message: "Contact with this email already exists in audience",
          });
        }

        // Create contact
        const contactId = generateId('contact');
        const contact = await db.audienceContact.create({
          data: {
            id: contactId,
            audienceId,
            email,
            firstName: firstName || null,
            lastName: lastName || null,
            customFields: customFields ? toPrismaJson(customFields) : null,
            status: ContactStatus.SUBSCRIBED,
            subscribedAt: new Date(),
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        });

        // Update audience total contacts count
        await db.audience.update({
          where: { id: audienceId },
          data: {
            totalContacts: {
              increment: 1,
            },
          },
        });

        // Log activity
        const logId = generateId('activity');
        await db.audienceActivityLog.create({
          data: {
            id: logId,
            userId,
            audienceId,
            action: "ADD_CONTACT",
            description: `Contact ${email} added to audience`,
            metadata: toPrismaJson({
              contactId: contact.id,
              email,
              firstName,
              lastName,
            }),
            createdAt: new Date(),
          },
        });

        return contact;
      } catch (error) {
        console.error("Error adding contact:", error);
        if (error instanceof TRPCError) throw error;
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to add contact",
        });
      }
    }),

  /**
   * Add multiple contacts to audience
   */
  bulkAdd: protectedProcedure
    .input(bulkAddContactsSchema)
    .mutation(async ({ input, ctx }) => {
      const { audienceId, contacts } = input;
      const userId = ctx.session?.user?.id;

      if (!userId) {
        throw new TRPCError({ code: "UNAUTHORIZED" });
      }

      try {
        // Check if audience exists and user has access
        const audience = await db.audience.findFirst({
          where: {
            id: audienceId,
            OR: [
              { userId },
              { team: { members: { some: { userId } } } },
            ],
          },
        });

        if (!audience) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Audience not found",
          });
        }

        // Validate emails
        const emails = contacts.map(c => c.email);
        const duplicateEmails = emails.filter((email, index) => emails.indexOf(email) !== index);
        
        if (duplicateEmails.length > 0) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: `Duplicate emails in request: ${duplicateEmails.join(", ")}`,
          });
        }

        // Check for existing contacts
        const existingContacts = await db.audienceContact.findMany({
          where: {
            audienceId,
            email: {
              in: emails,
            },
          },
          select: {
            email: true,
          },
        });

        const existingEmails = existingContacts.map(c => c.email);
        const newContacts = contacts.filter(c => !existingEmails.includes(c.email));

        if (newContacts.length === 0) {
          throw new TRPCError({
            code: "CONFLICT",
            message: "All contacts already exist in audience",
          });
        }

        // Create new contacts
        const createdContacts = await db.audienceContact.createMany({
          data: newContacts.map((contact, index) => ({
            id: `contact_${Date.now()}_${index}_${Math.random().toString(36).substr(2, 9)}`,
            audienceId,
            email: contact.email,
            firstName: contact.firstName || null,
            lastName: contact.lastName || null,
            customFields: contact.customFields ? toPrismaJson(contact.customFields) : null,
            status: ContactStatus.SUBSCRIBED,
            subscribedAt: new Date(),
            createdAt: new Date(),
            updatedAt: new Date(),
          })),
        });

        // Update audience total contacts count
        await db.audience.update({
          where: { id: audienceId },
          data: {
            totalContacts: {
              increment: createdContacts.count,
            },
          },
        });

        // Log activity
        const bulkLogId = generateId('activity');
        await db.audienceActivityLog.create({
          data: {
            id: bulkLogId,
            userId,
            audienceId,
            action: "BULK_ADD_CONTACTS",
            description: `${createdContacts.count} contacts added to audience`,
            metadata: toPrismaJson({
              totalRequested: contacts.length,
              totalAdded: createdContacts.count,
              skipped: contacts.length - createdContacts.count,
              skippedEmails: existingEmails,
            }),
            createdAt: new Date(),
          },
        });

        return {
          added: createdContacts.count,
          skipped: contacts.length - createdContacts.count,
          skippedEmails: existingEmails,
        };
      } catch (error) {
        console.error("Error bulk adding contacts:", error);
        if (error instanceof TRPCError) throw error;
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to add contacts",
        });
      }
    }),

  /**
   * List contacts in audience
   */
  list: protectedProcedure
    .input(listContactsSchema)
    .query(async ({ input, ctx }) => {
      const { audienceId, status, limit, offset } = input;
      const userId = ctx.session?.user?.id;

      if (!userId) {
        throw new TRPCError({ code: "UNAUTHORIZED" });
      }

      try {
        // Check if audience exists and user has access
        const audience = await db.audience.findFirst({
          where: {
            id: audienceId,
            OR: [
              { userId },
              { team: { members: { some: { userId } } } },
            ],
          },
        });

        if (!audience) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Audience not found",
          });
        }

        const contacts = await db.audienceContact.findMany({
          where: {
            audienceId,
            ...(status ? { status } : {}),
          },
          orderBy: {
            createdAt: "desc",
          },
          take: limit,
          skip: offset,
        });

        const total = await db.audienceContact.count({
          where: {
            audienceId,
            ...(status ? { status } : {}),
          },
        });

        return {
          contacts,
          pagination: {
            total,
            limit,
            offset,
            hasMore: offset + limit < total,
          },
        };
      } catch (error) {
        console.error("Error listing contacts:", error);
        if (error instanceof TRPCError) throw error;
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to list contacts",
        });
      }
    }),

  /**
   * Get contact by ID
   */
  getById: protectedProcedure
    .input(getContactByIdSchema)
    .query(async ({ input, ctx }) => {
      const { id } = input;
      const userId = ctx.session?.user?.id;

      if (!userId) {
        throw new TRPCError({ code: "UNAUTHORIZED" });
      }

      try {
        const contact = await db.audienceContact.findFirst({
          where: {
            id,
            audience: {
              OR: [
                { userId },
                { team: { members: { some: { userId } } } },
              ],
            },
          },
          include: {
            audience: true,
          },
        });

        if (!contact) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Contact not found",
          });
        }

        return contact;
      } catch (error) {
        console.error("Error getting contact:", error);
        if (error instanceof TRPCError) throw error;
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to get contact",
        });
      }
    }),

  /**
   * Update contact
   */
  update: protectedProcedure
    .input(updateContactSchema)
    .mutation(async ({ input, ctx }) => {
      const { id, updates } = input;
      const userId = ctx.session?.user?.id;

      if (!userId) {
        throw new TRPCError({ code: "UNAUTHORIZED" });
      }

      try {
        const existingContact = await db.audienceContact.findFirst({
          where: {
            id,
            audience: {
              OR: [
                { userId },
                { team: { members: { some: { userId } } } },
              ],
            },
          },
        });

        if (!existingContact) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Contact not found",
          });
        }

        const updatedContact = await db.audienceContact.update({
          where: { id },
          data: {
            ...updates,
            customFields: updates.customFields ? toPrismaJson(updates.customFields) : undefined,
            updatedAt: new Date(),
          },
        });

        // Log activity
        const updateLogId = generateId('activity');
        await db.audienceActivityLog.create({
          data: {
            id: updateLogId,
            userId,
            audienceId: existingContact.audienceId,
            action: "UPDATE_CONTACT",
            description: `Contact ${existingContact.email} updated`,
            metadata: toPrismaJson({
              contactId: id,
              updates: updates as Record<string, unknown>,
            }),
            createdAt: new Date(),
          },
        });

        return updatedContact;
      } catch (error) {
        console.error("Error updating contact:", error);
        if (error instanceof TRPCError) throw error;
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to update contact",
        });
      }
    }),

  /**
   * Unsubscribe contact
   */
  unsubscribe: protectedProcedure
    .input(unsubscribeContactSchema)
    .mutation(async ({ input, ctx }) => {
      const { id } = input;
      const userId = ctx.session?.user?.id;

      if (!userId) {
        throw new TRPCError({ code: "UNAUTHORIZED" });
      }

      try {
        const existingContact = await db.audienceContact.findFirst({
          where: {
            id,
            audience: {
              OR: [
                { userId },
                { team: { members: { some: { userId } } } },
              ],
            },
          },
        });

        if (!existingContact) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Contact not found",
          });
        }

        const updatedContact = await db.audienceContact.update({
          where: { id },
          data: {
            status: ContactStatus.UNSUBSCRIBED,
            unsubscribedAt: new Date(),
            updatedAt: new Date(),
          },
        });

        // Log activity
        const unsubscribeLogId = generateId('activity');
        await db.audienceActivityLog.create({
          data: {
            id: unsubscribeLogId,
            userId,
            audienceId: existingContact.audienceId,
            action: "UNSUBSCRIBE_CONTACT",
            description: `Contact ${existingContact.email} unsubscribed`,
            metadata: toPrismaJson({
              contactId: id,
            }),
            createdAt: new Date(),
          },
        });

        return updatedContact;
      } catch (error) {
        console.error("Error unsubscribing contact:", error);
        if (error instanceof TRPCError) throw error;
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to unsubscribe contact",
        });
      }
    }),

  /**
   * Delete contact
   */
  delete: protectedProcedure
    .input(deleteContactSchema)
    .mutation(async ({ input, ctx }) => {
      const { id } = input;
      const userId = ctx.session?.user?.id;

      if (!userId) {
        throw new TRPCError({ code: "UNAUTHORIZED" });
      }

      try {
        const existingContact = await db.audienceContact.findFirst({
          where: {
            id,
            audience: {
              OR: [
                { userId },
                { team: { members: { some: { userId } } } },
              ],
            },
          },
        });

        if (!existingContact) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Contact not found",
          });
        }

        // Delete contact
        await db.audienceContact.delete({
          where: { id },
        });

        // Update audience total contacts count
        await db.audience.update({
          where: { id: existingContact.audienceId },
          data: {
            totalContacts: {
              decrement: 1,
            },
          },
        });

        // Log activity
        const deleteLogId = generateId('activity');
        await db.audienceActivityLog.create({
          data: {
            id: deleteLogId,
            userId,
            audienceId: existingContact.audienceId,
            action: "DELETE_CONTACT",
            description: `Contact ${existingContact.email} deleted`,
            metadata: toPrismaJson({
              contactId: id,
            }),
            createdAt: new Date(),
          },
        });

        return { success: true };
      } catch (error) {
        console.error("Error deleting contact:", error);
        if (error instanceof TRPCError) throw error;
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to delete contact",
        });
      }
    }),
});

export const contactsRouter: AnyRouter = _contactsRouter;
