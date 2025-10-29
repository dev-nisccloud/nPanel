import { z } from "zod";
import { TRPCError, type AnyRouter } from "@trpc/server";
import { protectedProcedure, router } from "../../trpc";
import db from "@nPanel/db";
import { verifyDomain, checkVerificationStatus, deleteDomain } from "../../lib/aws-ses/domain-verification";
import { queueDomainVerification } from "../../lib/queue/email-queue";

// Dedicated Zod schemas for domain management
const createDomainSchema = z.object({
  domainName: z.string().regex(/^[a-z0-9]+([\-\.]{1}[a-z0-9]+)*\.[a-z]{2,}$/, "Invalid domain format"),
  teamId: z.string().optional(),
});

const getDomainByIdSchema = z.object({
  id: z.string(),
});

const checkVerificationSchema = z.object({
  id: z.string(),
});

const deleteDomainSchema = z.object({
  id: z.string(),
});

const listDomainsSchema = z.object({
  teamId: z.string().optional(),
  limit: z.number().min(1).max(100).default(20),
  offset: z.number().min(0).default(0),
});

export const domainsRouter: AnyRouter = router({
  /**
   * Create a new email domain
   */
  create: protectedProcedure
    .input(createDomainSchema)
    .mutation(async ({ input, ctx }) => {
      const { domainName, teamId } = input;
      const userId = ctx.session?.user?.id;

      if (!userId) {
        throw new TRPCError({ code: "UNAUTHORIZED" });
      }

      try {
        // Check if domain already exists
        const existingDomain = await db.emailDomain.findUnique({
          where: { domainName },
        });

        if (existingDomain) {
          throw new TRPCError({
            code: "CONFLICT",
            message: "Domain already exists",
          });
        }

        // Verify domain with SES
        const verificationResult = await verifyDomain(domainName);

        // Create domain in database
        const domain = await db.emailDomain.create({
          data: {
            id: crypto.randomUUID(),
            domainName,
            teamId: teamId || null,
            userId,
            verificationStatus: "PENDING",
            dkimTokens: verificationResult.dkimTokens,
            spfRecord: verificationResult.spfRecord,
            dmarcRecord: verificationResult.dmarcRecord,
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        });

        // Log activity
        await db.emailDomainActivityLog.create({
          data: {
            id: crypto.randomUUID(),
            userId,
            emailDomainId: domain.id,
            action: "CREATE",
            description: `Domain ${domainName} created and verification initiated`,
            metadata: {
              domainName,
              teamId,
            },
            createdAt: new Date(),
          },
        });

        // Queue verification check
        await queueDomainVerification(domain.id);

        return {
          domain,
          dnsRecords: {
            spfRecord: verificationResult.spfRecord,
            dmarcRecord: verificationResult.dmarcRecord,
            dkimRecords: verificationResult.dkimTokens.map(token => 
              `${token}._domainkey.${domainName} CNAME ${token}.dkim.amazonses.com`
            ),
          },
        };
      } catch (error) {
        console.error("Error creating domain:", error);
        if (error instanceof TRPCError) throw error;
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to create domain",
        });
      }
    }),

  /**
   * List domains for user/team
   */
  list: protectedProcedure
    .input(listDomainsSchema)
    .query(async ({ input, ctx }) => {
      const { teamId, limit, offset } = input;
      const userId = ctx.session?.user?.id;

      if (!userId) {
        throw new TRPCError({ code: "UNAUTHORIZED" });
      }

      try {
        const domains = await db.emailDomain.findMany({
          where: {
            OR: [
              { userId },
              ...(teamId ? [{ teamId }] : []),
            ],
          },
          include: {
            team: true,
            _count: {
              select: {
                campaigns: true,
              },
            },
          },
          orderBy: {
            createdAt: "desc",
          },
          take: limit,
          skip: offset,
        });

        const total = await db.emailDomain.count({
          where: {
            OR: [
              { userId },
              ...(teamId ? [{ teamId }] : []),
            ],
          },
        });

        return {
          domains,
          pagination: {
            total,
            limit,
            offset,
            hasMore: offset + limit < total,
          },
        };
      } catch (error) {
        console.error("Error listing domains:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to list domains",
        });
      }
    }),

  /**
   * Get domain by ID
   */
  getById: protectedProcedure
    .input(getDomainByIdSchema)
    .query(async ({ input, ctx }) => {
      const { id } = input;
      const userId = ctx.session?.user?.id;

      if (!userId) {
        throw new TRPCError({ code: "UNAUTHORIZED" });
      }

      try {
        const domain = await db.emailDomain.findFirst({
          where: {
            id,
            OR: [
              { userId },
              { team: { members: { some: { userId } } } },
            ],
          },
          include: {
            team: true,
            campaigns: {
              select: {
                id: true,
                name: true,
                status: true,
                createdAt: true,
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

        // Generate DNS records
        const dnsRecords = {
          spfRecord: domain.spfRecord,
          dmarcRecord: domain.dmarcRecord,
          dkimRecords: (domain.dkimTokens as string[])?.map(token => 
            `${token}._domainkey.${domain.domainName} CNAME ${token}.dkim.amazonses.com`
          ) || [],
        };

        return {
          domain,
          dnsRecords,
        };
      } catch (error) {
        console.error("Error getting domain:", error);
        if (error instanceof TRPCError) throw error;
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to get domain",
        });
      }
    }),

  /**
   * Check domain verification status
   */
  checkVerification: protectedProcedure
    .input(checkVerificationSchema)
    .mutation(async ({ input, ctx }) => {
      const { id } = input;
      const userId = ctx.session?.user?.id;

      if (!userId) {
        throw new TRPCError({ code: "UNAUTHORIZED" });
      }

      try {
        const domain = await db.emailDomain.findFirst({
          where: {
            id,
            OR: [
              { userId },
              { team: { members: { some: { userId } } } },
            ],
          },
        });

        if (!domain) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Domain not found",
          });
        }

        // Check verification status with SES
        const verificationStatus = await checkVerificationStatus(domain.domainName);

        // Update domain in database
        const updatedDomain = await db.emailDomain.update({
          where: { id },
          data: {
            verificationStatus: verificationStatus.verificationStatus === "Success" ? "VERIFIED" : "PENDING",
            isVerified: verificationStatus.isVerified,
            verificationAttempts: {
              increment: 1,
            },
            lastVerificationAt: new Date(),
            updatedAt: new Date(),
          },
        });

        // Log activity
        await db.emailDomainActivityLog.create({
          data: {
            id: crypto.randomUUID(),
            userId,
            emailDomainId: id,
            action: "VERIFICATION_CHECK",
            description: `Manual verification check: ${verificationStatus.verificationStatus}`,
            metadata: {
              sesStatus: verificationStatus.verificationStatus,
              dkimStatus: verificationStatus.dkimVerificationStatus,
            },
            createdAt: new Date(),
          },
        });

        return {
          domain: updatedDomain,
          verificationStatus,
        };
      } catch (error) {
        console.error("Error checking verification:", error);
        if (error instanceof TRPCError) throw error;
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to check verification status",
        });
      }
    }),

  /**
   * Delete domain
   */
  delete: protectedProcedure
    .input(deleteDomainSchema)
    .mutation(async ({ input, ctx }) => {
      const { id } = input;
      const userId = ctx.session?.user?.id;

      if (!userId) {
        throw new TRPCError({ code: "UNAUTHORIZED" });
      }

      try {
        const domain = await db.emailDomain.findFirst({
          where: {
            id,
            OR: [
              { userId },
              { team: { members: { some: { userId } } } },
            ],
          },
          include: {
            campaigns: true,
          },
        });

        if (!domain) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Domain not found",
          });
        }

        // Check if domain is used in campaigns
        if (domain.campaigns.length > 0) {
          throw new TRPCError({
            code: "CONFLICT",
            message: "Cannot delete domain that is used in campaigns",
          });
        }

        // Delete from SES
        await deleteDomain(domain.domainName);

        // Delete from database
        await db.emailDomain.delete({
          where: { id },
        });

        // Log activity
        await db.emailDomainActivityLog.create({
          data: {
            id: crypto.randomUUID(),
            userId,
            emailDomainId: id,
            action: "DELETE",
            description: `Domain ${domain.domainName} deleted`,
            metadata: {
              domainName: domain.domainName,
            },
            createdAt: new Date(),
          },
        });

        return { success: true };
      } catch (error) {
        console.error("Error deleting domain:", error);
        if (error instanceof TRPCError) throw error;
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to delete domain",
        });
      }
    }),
});
