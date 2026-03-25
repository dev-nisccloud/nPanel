import { TRPCError } from "@trpc/server";
import { and, desc, eq } from "@npanel/db";
import { db } from "@npanel/db";
import { user as userTable } from "@npanel/db/schema/auth";
import { team, teamMember } from "@npanel/db/schema/teams";
import { domain, domainActivityLog } from "@npanel/db/schema/domains";
import {
  notification,
  notificationActivityLog,
} from "@npanel/db/schema/notifications";
import { protectedProcedure, router } from "../trpc";
import { randomUUID } from "node:crypto";
import { z } from "zod";

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
// HELPERS - Team access for customer-scoped domain listing
// ============================================================================

function isAgencyUser(role: string) {
  return ["AGENCY_USER", "AGENCY_ADMIN", "AGENCY_SUPER_ADMIN"].includes(role);
}

async function getAuthenticatedUser(ctx: { session: { user?: { id: string } } | null }) {
  const uid = ctx.session?.user?.id;
  if (!uid) {
    throw new TRPCError({ code: "UNAUTHORIZED", message: "You must be logged in to view domains" });
  }
  const [u] = await db
    .select({ id: userTable.id, role: userTable.role })
    .from(userTable)
    .where(eq(userTable.id, uid))
    .limit(1);
  if (!u) {
    throw new TRPCError({ code: "UNAUTHORIZED", message: "User not found" });
  }
  return u as { id: string; role: string };
}

async function ensureTeamAccess(teamId: string, userId: string, role: string) {
  if (isAgencyUser(role)) return;
  const [m] = await db
    .select({ id: teamMember.id })
    .from(teamMember)
    .where(and(eq(teamMember.teamId, teamId), eq(teamMember.userId, userId)))
    .limit(1);
  if (!m) {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "You do not have access to this team.",
    });
  }
}

type DomainWithRelations = z.infer<typeof domainOutputSchema>;

async function fetchDomainById(id: string): Promise<DomainWithRelations | null> {
  const [row] = await db
    .select({
      id: domain.id,
      domainName: domain.domainName,
      userId: domain.userId,
      teamId: domain.teamId,
      openProviderId: domain.openProviderId,
      activationDate: domain.activationDate,
      expirationDate: domain.expirationDate,
      renewalDate: domain.renewalDate,
      registrationDate: domain.registrationDate,
      openProviderPrice: domain.openProviderPrice,
      niscPrice: domain.niscPrice,
      notes: domain.notes,
      createdAt: domain.createdAt,
      updatedAt: domain.updatedAt,
      user: {
        id: userTable.id,
        name: userTable.name,
        email: userTable.email,
      },
      team: {
        id: team.id,
        name: team.name,
        slug: team.slug,
      },
    })
    .from(domain)
    .leftJoin(userTable, eq(domain.userId, userTable.id))
    .leftJoin(team, eq(domain.teamId, team.id))
    .where(eq(domain.id, id))
    .limit(1);

  if (!row) return null;

  return {
    ...row,
    user: row.user?.id ? row.user : undefined,
    team: row.team?.id ? row.team : null,
  } as DomainWithRelations;
}

async function fetchDomainByDomainName(
  domainName: string,
): Promise<DomainWithRelations | null> {
  const [row] = await db
    .select({
      id: domain.id,
      domainName: domain.domainName,
      userId: domain.userId,
      teamId: domain.teamId,
      openProviderId: domain.openProviderId,
      activationDate: domain.activationDate,
      expirationDate: domain.expirationDate,
      renewalDate: domain.renewalDate,
      registrationDate: domain.registrationDate,
      openProviderPrice: domain.openProviderPrice,
      niscPrice: domain.niscPrice,
      notes: domain.notes,
      createdAt: domain.createdAt,
      updatedAt: domain.updatedAt,
      user: {
        id: userTable.id,
        name: userTable.name,
        email: userTable.email,
      },
      team: {
        id: team.id,
        name: team.name,
        slug: team.slug,
      },
    })
    .from(domain)
    .leftJoin(userTable, eq(domain.userId, userTable.id))
    .leftJoin(team, eq(domain.teamId, team.id))
    .where(eq(domain.domainName, domainName))
    .limit(1);

  if (!row) return null;

  return {
    ...row,
    user: row.user?.id ? row.user : undefined,
    team: row.team?.id ? row.team : null,
  } as DomainWithRelations;
}

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
        const existingDomain = await fetchDomainByDomainName(input.domainName);

        if (existingDomain) {
          throw new TRPCError({
            code: "CONFLICT",
            message: "Domain already exists in the system",
          });
        }

        // Verify team exists and get team owner
        const [teamRow] = await db
          .select({ id: team.id, name: team.name, slug: team.slug })
          .from(team)
          .where(eq(team.id, input.teamId))
          .limit(1);

        if (!teamRow) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Team not found",
          });
        }

        const [teamOwner] = await db
          .select({
            id: userTable.id,
            name: userTable.name,
            email: userTable.email,
          })
          .from(teamMember)
          .innerJoin(team, eq(teamMember.teamId, team.id))
          .innerJoin(userTable, eq(teamMember.userId, userTable.id))
          .where(and(eq(teamMember.teamId, input.teamId), eq(teamMember.role, "OWNER")))
          .limit(1);

        if (!teamOwner) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Team owner not found",
          });
        }

        // Use transaction for atomicity
        const createdDomainId = await db.transaction(async (tx: any) => {
          const now = new Date();
          const domainId = randomUUID();

          await tx.insert(domain).values({
            id: domainId,
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
          });

          await tx.insert(domainActivityLog).values({
            id: randomUUID(),
            userId,
            domainId,
            teamId: input.teamId,
            action: "LINK_TEAM",
            description: `Domain linked to team: ${teamRow.name}`,
            metadata: {
              teamId: input.teamId,
              teamName: teamRow.name,
              linkedBy: userId,
            },
            ipAddress: null,
            userAgent: null,
            createdAt: now,
          });

          const notificationId = randomUUID();
          await tx.insert(notification).values({
            id: notificationId,
            userId: teamOwner.id,
            teamId: input.teamId,
            type: "DOMAIN",
            priority: "NORMAL",
            title: "Domain Added to Team",
            message: `Domain ${input.domainName} has been added to your team "${teamRow.name}" successfully. You can now manage it and perform other operations.`,
            link: `/agency/domains-portfolio`,
            metadata: {
              domainId,
              domainName: input.domainName,
              linkedBy: userId,
            },
            seen: false,
            readAt: null,
            createdAt: now,
            updatedAt: now,
          });

          await tx.insert(notificationActivityLog).values({
            id: randomUUID(),
            userId: teamOwner.id,
            notificationId,
            action: "CREATE",
            description: `Notification created for domain link: ${input.domainName}`,
            metadata: {
              domainId,
              domainName: input.domainName,
              teamId: input.teamId,
            },
            ipAddress: null,
            userAgent: null,
            createdAt: now,
          });

          return domainId;
        });

        const result = await fetchDomainById(createdDomainId);

        if (!result) {
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Created domain could not be fetched",
          });
        }

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
   * Get domain by ID.
   * For customers (non-agency), enforces that the domain is linked to a team
   * the user belongs to.
   */
  getById: protectedProcedure
    .input(getDomainByIdInputSchema)
    .output(getDomainByIdOutputSchema)
    .query(async ({ input, ctx }) => {
        const authenticatedUser = await getAuthenticatedUser(ctx);

      try {
        const domainRow = await fetchDomainById(input.id);

        if (!domainRow) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Domain not found",
          });
        }

        if (!isAgencyUser(authenticatedUser.role)) {
          if (!domainRow.teamId) {
            throw new TRPCError({
              code: "FORBIDDEN",
              message: "You do not have access to this domain.",
            });
          }
          await ensureTeamAccess(domainRow.teamId, authenticatedUser.id, authenticatedUser.role);
        }

        return domainRow;
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
        return await fetchDomainByDomainName(input.domainName);
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
   * Get domains by team.
   * Verifies the caller has access to the team (member or agency) before returning domains.
   */
  getByTeam: protectedProcedure
    .input(getDomainsByTeamInputSchema)
    .output(getDomainsByTeamOutputSchema)
    .query(async ({ input, ctx }) => {
        const authenticatedUser = await getAuthenticatedUser(ctx);
        await ensureTeamAccess(input.teamId, authenticatedUser.id, authenticatedUser.role);

      try {
        const rows = await db
          .select({
            id: domain.id,
            domainName: domain.domainName,
            userId: domain.userId,
            teamId: domain.teamId,
            openProviderId: domain.openProviderId,
            activationDate: domain.activationDate,
            expirationDate: domain.expirationDate,
            renewalDate: domain.renewalDate,
            registrationDate: domain.registrationDate,
            openProviderPrice: domain.openProviderPrice,
            niscPrice: domain.niscPrice,
            notes: domain.notes,
            createdAt: domain.createdAt,
            updatedAt: domain.updatedAt,
            user: {
              id: userTable.id,
              name: userTable.name,
              email: userTable.email,
            },
            team: {
              id: team.id,
              name: team.name,
              slug: team.slug,
            },
          })
          .from(domain)
          .leftJoin(userTable, eq(domain.userId, userTable.id))
          .leftJoin(team, eq(domain.teamId, team.id))
          .where(eq(domain.teamId, input.teamId))
          .orderBy(desc(domain.createdAt));

        return rows.map((r) => ({
          ...r,
          user: r.user?.id ? r.user : undefined,
          team: r.team?.id ? r.team : null,
        })) as DomainWithRelations[];
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
        const rows = await db
          .select({
            id: domain.id,
            domainName: domain.domainName,
            userId: domain.userId,
            teamId: domain.teamId,
            openProviderId: domain.openProviderId,
            activationDate: domain.activationDate,
            expirationDate: domain.expirationDate,
            renewalDate: domain.renewalDate,
            registrationDate: domain.registrationDate,
            openProviderPrice: domain.openProviderPrice,
            niscPrice: domain.niscPrice,
            notes: domain.notes,
            createdAt: domain.createdAt,
            updatedAt: domain.updatedAt,
            user: {
              id: userTable.id,
              name: userTable.name,
              email: userTable.email,
            },
            team: {
              id: team.id,
              name: team.name,
              slug: team.slug,
            },
          })
          .from(domain)
          .leftJoin(userTable, eq(domain.userId, userTable.id))
          .leftJoin(team, eq(domain.teamId, team.id))
          .where(eq(domain.userId, userId))
          .orderBy(desc(domain.createdAt));

        return rows.map((r) => ({
          ...r,
          user: r.user?.id ? r.user : undefined,
          team: r.team?.id ? r.team : null,
        })) as DomainWithRelations[];
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
        await db.transaction(async (tx: any) => {
          await tx
            .update(domain)
            .set({ notes: input.notes ?? null, updatedAt: new Date() })
            .where(eq(domain.id, input.id));

          await tx.insert(domainActivityLog).values({
            id: randomUUID(),
            userId,
            domainId: input.id,
            teamId: null,
            action: "UPDATE_NOTES",
            description: "Domain notes updated",
            metadata: { notes: input.notes },
            ipAddress: null,
            userAgent: null,
            createdAt: new Date(),
          });
        });

        const updated = await fetchDomainById(input.id);
        if (!updated) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Domain not found" });
        }
        return updated;
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
        const existing = await fetchDomainById(input.id);
        if (!existing) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Domain not found" });
        }

        await db.transaction(async (tx: any) => {
          await tx
            .update(domain)
            .set({ teamId: null, updatedAt: new Date() })
            .where(eq(domain.id, input.id));

          await tx.insert(domainActivityLog).values({
            id: randomUUID(),
            userId,
            domainId: input.id,
            teamId: existing.teamId,
            action: "UNLINK_TEAM",
            description: existing.teamId
              ? `Domain unlinked from team: ${existing.team?.name ?? ""}`.trim()
              : "Domain unlinked from team",
            metadata: {
              previousTeamId: existing.teamId,
              previousTeamName: existing.team?.name ?? null,
              unlinkedBy: userId,
            },
            ipAddress: null,
            userAgent: null,
            createdAt: new Date(),
          });
        });

        const updated = await fetchDomainById(input.id);
        if (!updated) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Domain not found" });
        }
        return updated;
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
        const [teamRow] = await db
          .select({ id: team.id, name: team.name, slug: team.slug })
          .from(team)
          .where(eq(team.id, input.teamId))
          .limit(1);

        if (!teamRow) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Team not found",
          });
        }

        const existingDomain = await fetchDomainById(input.id);
        if (!existingDomain) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Domain not found" });
        }

        const [teamOwner] = await db
          .select({ id: userTable.id })
          .from(teamMember)
          .innerJoin(userTable, eq(teamMember.userId, userTable.id))
          .where(and(eq(teamMember.teamId, input.teamId), eq(teamMember.role, "OWNER")))
          .limit(1);

        const now = new Date();

        await db.transaction(async (tx: any) => {
          await tx
            .update(domain)
            .set({
              teamId: input.teamId,
              ...(input.openProviderPrice !== undefined && {
                openProviderPrice: input.openProviderPrice ?? null,
              }),
              ...(input.niscPrice !== undefined && { niscPrice: input.niscPrice ?? null }),
              ...(input.notes !== undefined && { notes: input.notes ?? null }),
              updatedAt: now,
            })
            .where(eq(domain.id, input.id));

          await tx.insert(domainActivityLog).values({
            id: randomUUID(),
            userId,
            domainId: input.id,
            teamId: input.teamId,
            action: "LINK_TEAM",
            description: `Domain linked to team: ${teamRow.name}`,
            metadata: {
              teamId: input.teamId,
              teamName: teamRow.name,
              linkedBy: userId,
            },
            ipAddress: null,
            userAgent: null,
            createdAt: now,
          });

          if (teamOwner) {
            await tx.insert(notification).values({
              id: randomUUID(),
              userId: teamOwner.id,
              teamId: input.teamId,
              type: "DOMAIN",
              priority: "NORMAL",
              title: "Domain Linked to Team",
              message: `Domain ${existingDomain.domainName} has been linked to your team "${teamRow.name}".`,
              link: "/agency/domains-portfolio",
              metadata: {
                domainId: input.id,
                domainName: existingDomain.domainName,
                linkedBy: userId,
              },
              seen: false,
              readAt: null,
              createdAt: now,
              updatedAt: now,
            });
          }
        });

        const updated = await fetchDomainById(input.id);
        if (!updated) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Domain not found" });
        }
        return updated;
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
