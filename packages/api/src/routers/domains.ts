import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { protectedProcedure, router } from "../trpc";
import prisma from "@nPanel/db";
import { randomUUID } from "node:crypto";

// ============================================================================
// ZOD SCHEMAS - Independent from database schema
// ============================================================================

// Domain output schema
const domainOutputSchema = z.object({
  id: z.string(),
  domainName: z.string(),
  userId: z.string(),
  teamId: z.string().nullable(),
  openProviderId: z.number(),
  activationDate: z.date().nullable(),
  expirationDate: z.date().nullable(),
  renewalDate: z.date().nullable(),
  registrationDate: z.date(),
  openProviderPrice: z.string().nullable(),
  niscPrice: z.string().nullable(),
  notes: z.string().nullable(),
  createdAt: z.date(),
  updatedAt: z.date(),
  user: z.object({
    id: z.string(),
    name: z.string(),
    email: z.string(),
  }).optional(),
  team: z.object({
    id: z.string(),
    name: z.string(),
    slug: z.string(),
  }).nullable().optional(),
});

// Accept date or ISO string (tRPC sends dates as strings over the wire)
const dateInput = z.union([z.date(), z.string()]).transform((v) => (typeof v === "string" ? new Date(v) : v));
const optionalDateInput = z
  .union([z.date(), z.string(), z.null(), z.undefined()])
  .optional()
  .transform((v) => (v == null ? null : typeof v === "string" ? new Date(v) : v));

// Link domain to team input schema
const linkDomainToTeamInputSchema = z.object({
  domainName: z.string().min(1, "Domain name is required"),
  openProviderId: z.number().min(1, "OpenProvider ID is required"),
  teamId: z.string().min(1, "Team ID is required"),
  openProviderPrice: z.string().optional(),
  niscPrice: z.string().optional(),
  activationDate: optionalDateInput,
  expirationDate: optionalDateInput,
  renewalDate: optionalDateInput,
  registrationDate: dateInput,
  notes: z.string().optional(),
});

// Link domain to team output schema
const linkDomainToTeamOutputSchema = z.object({
  success: z.boolean(),
  message: z.string(),
  data: domainOutputSchema,
});

// Get domain by ID input schema
const getDomainByIdInputSchema = z.object({
  id: z.string().min(1, "Domain ID is required"),
});

// Get domain by ID output schema
const getDomainByIdOutputSchema = domainOutputSchema;

// Get domains by team input schema
const getDomainsByTeamInputSchema = z.object({
  teamId: z.string().min(1, "Team ID is required"),
});

// Get domains by team output schema
const getDomainsByTeamOutputSchema = z.array(domainOutputSchema);

// Get domains by user input schema
const getDomainsByUserInputSchema = z.object({}).optional().default({});

// Get domains by user output schema
const getDomainsByUserOutputSchema = z.array(domainOutputSchema);

// Update domain notes input schema
const updateDomainNotesInputSchema = z.object({
  id: z.string().min(1, "Domain ID is required"),
  notes: z.string().optional().nullable(),
});

// Update domain notes output schema
const updateDomainNotesOutputSchema = domainOutputSchema;

// Unlink domain from team input schema
const unlinkDomainFromTeamInputSchema = z.object({
  id: z.string().min(1, "Domain ID is required"),
});

// Unlink domain from team output schema
const unlinkDomainFromTeamOutputSchema = domainOutputSchema;

// Get domain by domain name input schema
const getByDomainNameInputSchema = z.object({
  domainName: z.string().min(1, "Domain name is required"),
});

// Get domain by domain name output schema (nullable)
const getByDomainNameOutputSchema = domainOutputSchema.nullable();

// Update domain team link input schema (our Domain.id + teamId + optional prices/notes)
const updateTeamInputSchema = z.object({
  id: z.string().min(1, "Domain ID is required"),
  teamId: z.string().min(1, "Team ID is required"),
  openProviderPrice: z.string().optional(),
  niscPrice: z.string().optional(),
  notes: z.string().optional().nullable(),
});

// Update domain team link output schema
const updateTeamOutputSchema = domainOutputSchema;

// ============================================================================
// ROUTER
// ============================================================================

export const domainsRouter = router({
  /**
   * Link a domain to a team
   * Creates a domain record in the database and links it to a team
   */
  linkToTeam: protectedProcedure
    .input(linkDomainToTeamInputSchema)
    .output(linkDomainToTeamOutputSchema)
    .mutation(async ({ input, ctx }) => {
      const userId = ctx.session?.user?.id;
      if (!userId) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "You must be logged in to link a domain",
        });
      }

      try {
        // Check if domain already exists
        const existingDomain = await prisma.domain.findUnique({
          where: { domainName: input.domainName },
        });

        if (existingDomain) {
          throw new TRPCError({
            code: "CONFLICT",
            message: "Domain already exists in the system",
          });
        }

        // Verify team exists and get team owner
        const team = await prisma.team.findUnique({
          where: { id: input.teamId },
          include: {
            members: {
              where: { role: "OWNER" },
              include: { user: true },
            },
          },
        });

        if (!team) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Team not found",
          });
        }

        const teamOwner = team.members[0]?.user;
        if (!teamOwner) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Team owner not found",
          });
        }

        // Use transaction for atomicity
        const result = await prisma.$transaction(async (tx) => {
          // Create domain record
          const now = new Date();
          const domain = await tx.domain.create({
            data: {
              id: randomUUID(),
              domainName: input.domainName,
              userId,
              teamId: input.teamId,
              openProviderId: input.openProviderId,
              activationDate: input.activationDate ?? null,
              expirationDate: input.expirationDate ?? null,
              renewalDate: input.renewalDate ?? null,
              registrationDate: input.registrationDate,
              openProviderPrice: input.openProviderPrice ?? null,
              niscPrice: input.niscPrice ?? null,
              notes: input.notes ?? null,
              createdAt: now,
              updatedAt: now,
            },
            include: {
              user: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                },
              },
              team: {
                select: {
                  id: true,
                  name: true,
                  slug: true,
                },
              },
            },
          });

          // Create activity log for linking operation
          await tx.domainActivityLog.create({
            data: {
              id: randomUUID(),
              userId,
              domainId: domain.id,
              action: "LINK_TEAM",
              description: `Domain linked to team: ${team.name}`,
              metadata: {
                teamId: input.teamId,
                teamName: team.name,
                linkedBy: userId,
              },
              ipAddress: null, // Headers not available in tRPC context
              userAgent: null, // Headers not available in tRPC context
              createdAt: new Date(),
            },
          });

          // Create notification for team owner
          const notification = await tx.notification.create({
            data: {
              id: randomUUID(),
              userId: teamOwner.id,
              teamId: input.teamId,
              type: "DOMAIN",
              priority: "NORMAL",
              title: "Domain Added to Team",
              message: `Domain ${input.domainName} has been added to your team "${team.name}" successfully. You can now manage it and perform other operations.`,
              link: `/agency/domains-portfolio`,
              metadata: {
                domainId: domain.id,
                domainName: input.domainName,
                linkedBy: userId,
              },
              seen: false,
              createdAt: new Date(),
              updatedAt: new Date(),
            },
          });

          // Create notification activity log
          await tx.notificationActivityLog.create({
            data: {
              id: randomUUID(),
              userId: teamOwner.id,
              notificationId: notification.id,
              action: "CREATE",
              description: `Notification created for domain link: ${input.domainName}`,
              metadata: {
                domainId: domain.id,
                domainName: input.domainName,
                teamId: input.teamId,
              },
              ipAddress: null, // Headers not available in tRPC context
              userAgent: null, // Headers not available in tRPC context
              createdAt: new Date(),
            },
          });

          return domain;
        });

        return {
          success: true,
          message: "Domain linked to team successfully",
          data: result,
        };
      } catch (error) {
        console.error("Domain link to team error:", error);

        if (error instanceof TRPCError) {
          throw error;
        }

        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to link domain to team",
        });
      }
    }),

  /**
   * Get domain by ID
   */
  getById: protectedProcedure
    .input(getDomainByIdInputSchema)
    .output(getDomainByIdOutputSchema)
    .query(async ({ input, ctx }) => {
      const userId = ctx.session?.user?.id;
      if (!userId) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "You must be logged in to view domains",
        });
      }

      try {
        const domain = await prisma.domain.findUnique({
          where: { id: input.id },
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
            team: {
              select: {
                id: true,
                name: true,
                slug: true,
              },
            },
          },
        });

        if (!domain) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Domain not found",
          });
        }

        return domain;
      } catch (error) {
        console.error("Get domain by ID error:", error);

        if (error instanceof TRPCError) {
          throw error;
        }

        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to get domain",
        });
      }
    }),

  /**
   * Get domain by domain name (our DB Domain, if any)
   * Returns null if no Domain record exists for that name
   */
  getByDomainName: protectedProcedure
    .input(getByDomainNameInputSchema)
    .output(getByDomainNameOutputSchema)
    .query(async ({ input, ctx }) => {
      const userId = ctx.session?.user?.id;
      if (!userId) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "You must be logged in to view domains",
        });
      }

      try {
        const domain = await prisma.domain.findUnique({
          where: { domainName: input.domainName },
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
            team: {
              select: {
                id: true,
                name: true,
                slug: true,
              },
            },
          },
        });

        return domain;
      } catch (error) {
        console.error("Get domain by domain name error:", error);

        if (error instanceof TRPCError) {
          throw error;
        }

        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to get domain",
        });
      }
    }),

  /**
   * Get domains by team
   */
  getByTeam: protectedProcedure
    .input(getDomainsByTeamInputSchema)
    .output(getDomainsByTeamOutputSchema)
    .query(async ({ input, ctx }) => {
      const userId = ctx.session?.user?.id;
      if (!userId) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "You must be logged in to view domains",
        });
      }

      try {
        const domains = await prisma.domain.findMany({
          where: { teamId: input.teamId },
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
            team: {
              select: {
                id: true,
                name: true,
                slug: true,
              },
            },
          },
          orderBy: { createdAt: "desc" },
        });

        return domains;
      } catch (error) {
        console.error("Get domains by team error:", error);

        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to get domains",
        });
      }
    }),

  /**
   * Get domains by user
   */
  getByUser: protectedProcedure
    .input(getDomainsByUserInputSchema)
    .output(getDomainsByUserOutputSchema)
    .query(async ({ ctx }) => {
      const userId = ctx.session?.user?.id;
      if (!userId) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "You must be logged in to view domains",
        });
      }

      try {
        const domains = await prisma.domain.findMany({
          where: { userId },
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
            team: {
              select: {
                id: true,
                name: true,
                slug: true,
              },
            },
          },
          orderBy: { createdAt: "desc" },
        });

        return domains;
      } catch (error) {
        console.error("Get domains by user error:", error);

        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to get domains",
        });
      }
    }),

  /**
   * Update domain notes
   */
  updateNotes: protectedProcedure
    .input(updateDomainNotesInputSchema)
    .output(updateDomainNotesOutputSchema)
    .mutation(async ({ input, ctx }) => {
      const userId = ctx.session?.user?.id;
      if (!userId) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "You must be logged in to update domain notes",
        });
      }

      try {
        const domain = await prisma.$transaction(async (tx) => {
          const updatedDomain = await tx.domain.update({
            where: { id: input.id },
            data: {
              notes: input.notes ?? null,
              updatedAt: new Date(),
            },
            include: {
              user: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                },
              },
              team: {
                select: {
                  id: true,
                  name: true,
                  slug: true,
                },
              },
            },
          });

          // Create activity log
          await tx.domainActivityLog.create({
            data: {
              id: randomUUID(),
              userId,
              domainId: input.id,
              action: "UPDATE_NOTES",
              description: "Domain notes updated",
              metadata: {
                notes: input.notes,
              },
              ipAddress: null, // Headers not available in tRPC context
              userAgent: null, // Headers not available in tRPC context
              createdAt: new Date(),
            },
          });

          return updatedDomain;
        });

        return domain;
      } catch (error) {
        console.error("Update domain notes error:", error);

        if (error instanceof TRPCError) {
          throw error;
        }

        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to update domain notes",
        });
      }
    }),

  /**
   * Unlink domain from team
   */
  unlinkFromTeam: protectedProcedure
    .input(unlinkDomainFromTeamInputSchema)
    .output(unlinkDomainFromTeamOutputSchema)
    .mutation(async ({ input, ctx }) => {
      const userId = ctx.session?.user?.id;
      if (!userId) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "You must be logged in to unlink a domain",
        });
      }

      try {
        const domain = await prisma.$transaction(async (tx) => {
          // Get domain with team info
          const existingDomain = await tx.domain.findUnique({
            where: { id: input.id },
            include: {
              team: true,
            },
          });

          if (!existingDomain) {
            throw new TRPCError({
              code: "NOT_FOUND",
              message: "Domain not found",
            });
          }

          const teamId = existingDomain.teamId;
          const teamName = existingDomain.team?.name;

          // Update domain to remove team link
          const updatedDomain = await tx.domain.update({
            where: { id: input.id },
            data: {
              teamId: null,
              updatedAt: new Date(),
            },
            include: {
              user: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                },
              },
              team: {
                select: {
                  id: true,
                  name: true,
                  slug: true,
                },
              },
            },
          });

          // Create activity log
          await tx.domainActivityLog.create({
            data: {
              id: randomUUID(),
              userId,
              domainId: input.id,
              action: "UNLINK_TEAM",
              description: teamId ? `Domain unlinked from team: ${teamName}` : "Domain unlinked from team",
              metadata: {
                previousTeamId: teamId,
                previousTeamName: teamName,
                unlinkedBy: userId,
              },
              ipAddress: null, // Headers not available in tRPC context
              userAgent: null, // Headers not available in tRPC context
              createdAt: new Date(),
            },
          });

          return updatedDomain;
        });

        return domain;
      } catch (error) {
        console.error("Unlink domain from team error:", error);

        if (error instanceof TRPCError) {
          throw error;
        }

        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to unlink domain from team",
        });
      }
    }),

  /**
   * Update domain team link (link existing Domain to a team)
   * Use when the domain already exists in our DB.
   */
  updateTeam: protectedProcedure
    .input(updateTeamInputSchema)
    .output(updateTeamOutputSchema)
    .mutation(async ({ input, ctx }) => {
      const userId = ctx.session?.user?.id;
      if (!userId) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "You must be logged in to link a domain",
        });
      }

      try {
        const team = await prisma.team.findUnique({
          where: { id: input.teamId },
          include: {
            members: {
              where: { role: "OWNER" },
              include: { user: true },
            },
          },
        });

        if (!team) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Team not found",
          });
        }

        const domain = await prisma.$transaction(async (tx) => {
          const existingDomain = await tx.domain.findUnique({
            where: { id: input.id },
            include: { team: true },
          });

          if (!existingDomain) {
            throw new TRPCError({
              code: "NOT_FOUND",
              message: "Domain not found",
            });
          }

          const updatedDomain = await tx.domain.update({
            where: { id: input.id },
            data: {
              teamId: input.teamId,
              ...(input.openProviderPrice !== undefined && { openProviderPrice: input.openProviderPrice ?? null }),
              ...(input.niscPrice !== undefined && { niscPrice: input.niscPrice ?? null }),
              ...(input.notes !== undefined && { notes: input.notes ?? null }),
              updatedAt: new Date(),
            },
            include: {
              user: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                },
              },
              team: {
                select: {
                  id: true,
                  name: true,
                  slug: true,
                },
              },
            },
          });

          await tx.domainActivityLog.create({
            data: {
              id: randomUUID(),
              userId,
              domainId: input.id,
              action: "LINK_TEAM",
              description: `Domain linked to team: ${team.name}`,
              metadata: {
                teamId: input.teamId,
                teamName: team.name,
                linkedBy: userId,
              },
              ipAddress: null,
              userAgent: null,
              createdAt: new Date(),
            },
          });

          const teamOwner = team.members[0]?.user;
          if (teamOwner) {
            await tx.notification.create({
              data: {
                id: randomUUID(),
                userId: teamOwner.id,
                teamId: input.teamId,
                type: "DOMAIN",
                priority: "NORMAL",
                title: "Domain Linked to Team",
                message: `Domain ${existingDomain.domainName} has been linked to your team "${team.name}".`,
                link: "/agency/domains-portfolio",
                metadata: {
                  domainId: input.id,
                  domainName: existingDomain.domainName,
                  linkedBy: userId,
                },
                seen: false,
                createdAt: new Date(),
                updatedAt: new Date(),
              },
            });
          }

          return updatedDomain;
        });

        return domain;
      } catch (error) {
        console.error("Update domain team error:", error);

        if (error instanceof TRPCError) {
          throw error;
        }

        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to link domain to team",
        });
      }
    }),
});
