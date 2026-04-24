import { XMLParser } from 'fast-xml-parser';
import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { and, eq } from "@npanel/db";

import { db } from "@npanel/db";
import { hostingSubscription, niscServicePlan } from "@npanel/db/schema/hosting";
import { niscClientSubscription } from "@npanel/db/schema/products";
import { serviceSubscription } from "@npanel/db/schema/service-subscriptions";
import { team, teamMember } from "@npanel/db/schema/teams";
import { sendPleskXmlRequest } from '../../lib/plesk/xml-client';
import { protectedProcedure, router } from '../../trpc';

const isAgencyUserRole = (role: string | null | undefined) =>
  role === "AGENCY_USER" || role === "AGENCY_ADMIN" || role === "AGENCY_SUPER_ADMIN";

async function ensureTeamReadAccess(params: {
  teamId: string;
  userId: string;
  role: string | null | undefined;
}) {
  const { teamId, userId, role } = params;
  if (isAgencyUserRole(role)) return;

  const [membership, ownerTeam] = await Promise.all([
    db.query.teamMember.findFirst({
      where: and(eq(teamMember.teamId, teamId), eq(teamMember.userId, userId)),
      columns: { id: true },
    }),
    db.query.team.findFirst({
      where: and(eq(team.id, teamId), eq(team.createdById, userId)),
      columns: { id: true },
    }),
  ]);

  if (!membership && !ownerTeam) {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "You do not have access to this team",
    });
  }
}

/**
 * Build XML request to fetch all subscriptions
 */
function buildSubscriptionsGetXml(): string {
  return `<?xml version="1.0" encoding="UTF-8"?>
<packet>
  <webspace>
    <get>
      <filter/>
      <dataset>
        <gen_info/>
        <hosting/>
        <limits/>
        <prefs/>
        <stat/>
        <permissions/>
      </dataset>
    </get>
  </webspace>
</packet>`;
}

/**
 * Build XML request to fetch a specific subscription by ID
 */
function buildSubscriptionGetByIdXml(subscriptionId: number): string {
  return `<?xml version="1.0" encoding="UTF-8"?>
<packet>
  <webspace>
    <get>
      <filter>
        <id>${subscriptionId}</id>
      </filter>
      <dataset>
        <gen_info/>
        <hosting/>
        <limits/>
        <prefs/>
        <stat/>
        <permissions/>
      </dataset>
    </get>
  </webspace>
</packet>`;
}

export const subscriptionsRouter = router({
  // Get all subscriptions
  getAll: protectedProcedure
    .input(z.object({}).optional().default({}))
    .query(async ({ ctx }) => {
      if (!isAgencyUserRole(ctx.session.user.role)) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Only agency users can access all Plesk subscriptions",
        });
      }
      
      try {
        // Check if required environment variables are set
        if (!process.env.PLESK_XML_ENDPOINT) {
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Server configuration error: PLESK_XML_ENDPOINT environment variable is not set",
          });
        }

        const xmlRequest = buildSubscriptionsGetXml();
        const { xml, isAuthError, isHostUnreachable } = await sendPleskXmlRequest(xmlRequest);

        if (isHostUnreachable) {
          throw new TRPCError({
            code: "SERVICE_UNAVAILABLE",
            message: "Plesk host is unreachable",
          });
        }

        if (isAuthError) {
          throw new TRPCError({
            code: "UNAUTHORIZED",
            message: "Invalid Plesk credentials",
          });
        }

        // Check if we have valid XML response
        if (!xml || xml.trim() === '') {
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Empty response from Plesk server",
          });
        }

        const parser = new XMLParser({ ignoreAttributes: false });
        let parsed: any;

        try {
          parsed = parser.parse(xml);
        } catch (parseError) {
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Failed to parse Plesk response",
            cause: parseError,
          });
        }

        // Check for Plesk system errors (rate limiting, permissions, etc.)
        if (parsed?.packet?.system?.status === 'error') {
          const errorCode = parsed.packet.system.errcode;
          const errorText = parsed.packet.system.errtext || 'Unknown error';
          
          // Handle rate limiting (error code 1010)
          if (errorCode === 1010) {
            throw new TRPCError({
              code: "TOO_MANY_REQUESTS",
              message: `Rate limit exceeded: ${errorText}. Please wait before making another request.`,
            });
          }
          
          // Handle other system errors
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: `Plesk API Error ${errorCode}: ${errorText}`,
          });
        }

        return {
          raw: xml,
          parsed,
        };
      } catch (error) {
        if (error instanceof TRPCError) {
          throw error;
        }
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to fetch subscriptions",
          cause: error,
        });
      }
    }),

  // Get subscription by ID
  getById: protectedProcedure
    .input(z.object({
      id: z.number(),
      teamId: z.string().optional(),
    }))
    .query(async ({ input, ctx }) => {
      const { id, teamId } = input;
      const sessionUser = ctx.session.user;
      const isAgencyUser = isAgencyUserRole(sessionUser.role);

      if (!isAgencyUser) {
        if (!teamId) {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "teamId is required for non-agency users",
          });
        }

        await ensureTeamReadAccess({
          teamId,
          userId: sessionUser.id,
          role: sessionUser.role,
        });

        // Latest subscriptions model guard:
        // non-agency users can only fetch a Plesk subscription ID that is linked
        // to the provided team via nisc_client_subscription.pleskFilterId.
        const linkedSubscription = await db.query.niscClientSubscription.findFirst({
          where: and(
            eq(niscClientSubscription.teamId, teamId),
            eq(niscClientSubscription.pleskFilterId, String(id)),
          ),
          columns: { id: true },
        });

        if (!linkedSubscription) {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "You do not have access to this subscription",
          });
        }
      }
      
      try {
        // Check if required environment variables are set
        if (!process.env.PLESK_XML_ENDPOINT) {
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Server configuration error: PLESK_XML_ENDPOINT environment variable is not set",
          });
        }

        const xmlRequest = buildSubscriptionGetByIdXml(id);
        const { xml, isAuthError, isHostUnreachable } = await sendPleskXmlRequest(xmlRequest);

        if (isHostUnreachable) {
          throw new TRPCError({
            code: "SERVICE_UNAVAILABLE",
            message: "Plesk host is unreachable",
          });
        }

        if (isAuthError) {
          throw new TRPCError({
            code: "UNAUTHORIZED",
            message: "Invalid Plesk credentials",
          });
        }

        // Check if we have valid XML response
        if (!xml || xml.trim() === '') {
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Empty response from Plesk server",
          });
        }

        const parser = new XMLParser({ ignoreAttributes: false });
        let parsed: any;

        try {
          parsed = parser.parse(xml);
        } catch (parseError) {
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Failed to parse Plesk response",
            cause: parseError,
          });
        }

        // Check for Plesk system errors (rate limiting, permissions, etc.)
        if (parsed?.packet?.system?.status === 'error') {
          const errorCode = parsed.packet.system.errcode;
          const errorText = parsed.packet.system.errtext || 'Unknown error';
          
          // Handle rate limiting (error code 1010)
          if (errorCode === 1010) {
            throw new TRPCError({
              code: "TOO_MANY_REQUESTS",
              message: `Rate limit exceeded: ${errorText}. Please wait before making another request.`,
            });
          }
          
          // Handle other system errors
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: `Plesk API Error ${errorCode}: ${errorText}`,
          });
        }

        return {
          raw: xml,
          parsed,
        };
      } catch (error) {
        if (error instanceof TRPCError) {
          throw error;
        }
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to fetch subscription",
          cause: error,
        });
      }
    }),

  // Get subscriptions filtered by team's service subscriptions
  getByTeamFilterIds: protectedProcedure
    .input(z.object({ 
      teamId: z.string(),
      hostingSubType: z.enum(["WEB_HOSTING", "EMAIL_HOSTING", "RESELLER_HOSTING", "VPS_HOSTING", "DEDICATED_HOSTING"]).optional(),
    }))
    .output(z.object({
      hasServiceSubscriptions: z.boolean(),
      raw: z.string(),
      parsed: z.any(),
    }))
    .query(async ({ ctx, input }) => {
      const session = ctx.session;
      if (!session?.user?.id) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "You must be logged in",
        });
      }
      await ensureTeamReadAccess({
        teamId: input.teamId,
        userId: session.user.id,
        role: session.user.role,
      });

      try {
        // Optimized: Query with filters at database level to reduce data transfer
        // Filter by hostingSubType if provided, otherwise show all hosting types
        const conditions = [
          eq(serviceSubscription.teamId, input.teamId),
          eq(niscServicePlan.planType, "HOSTING"),
        ];
        if (input.hostingSubType) {
          conditions.push(eq(niscServicePlan.hostingSubType, input.hostingSubType));
        }

        const serviceSubscriptions = await db
          .select({
            id: serviceSubscription.id,
            hostingSubscriptionId: serviceSubscription.hostingSubscriptionId,
            pleskFilterId: hostingSubscription.pleskFilterId,
          })
          .from(serviceSubscription)
          .innerJoin(
            niscServicePlan,
            eq(serviceSubscription.niscServicePlanId, niscServicePlan.id),
          )
          .leftJoin(
            hostingSubscription,
            eq(serviceSubscription.hostingSubscriptionId, hostingSubscription.id),
          )
          .where(and(...conditions));

        // Check if team has any hosting subscriptions
        const hasServiceSubscriptions = serviceSubscriptions.length > 0;

        // If no service subscriptions at all, return early with flag
        if (!hasServiceSubscriptions) {
          return {
            hasServiceSubscriptions: false,
            raw: "",
            parsed: {
              packet: {
                webspace: {
                  get: {
                    result: [],
                  },
                },
              },
            },
          };
        }

        // Extract pleskFilterId values from HostingSubscription and convert to numbers for efficient matching
        // Pre-build Sets for O(1) lookup performance during filtering
        const pleskFilterIdSet = new Set<number>();
        const pleskFilterIdStringSet = new Set<string>();
        
        for (const sub of serviceSubscriptions) {
          const filterId = sub.pleskFilterId;
          if (filterId) {
            const numId = Number(filterId);
            if (!isNaN(numId)) {
              pleskFilterIdSet.add(numId);
            } else {
              pleskFilterIdStringSet.add(String(filterId));
            }
          }
        }
        
        // Early return if no filter IDs (has subscriptions but no HostingSubscription linked)
        if (pleskFilterIdSet.size === 0 && pleskFilterIdStringSet.size === 0) {
          return {
            hasServiceSubscriptions: true,
            raw: "",
            parsed: {
              packet: {
                webspace: {
                  get: {
                    result: [],
                  },
                },
              },
            },
          };
        }


        // Check if required environment variables are set
        if (!process.env.PLESK_XML_ENDPOINT) {
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Server configuration error: PLESK_XML_ENDPOINT environment variable is not set",
          });
        }

        // Fetch all subscriptions from Plesk
        const xmlRequest = buildSubscriptionsGetXml();
        const { xml, isAuthError, isHostUnreachable } = await sendPleskXmlRequest(xmlRequest);

        if (isHostUnreachable) {
          throw new TRPCError({
            code: "SERVICE_UNAVAILABLE",
            message: "Plesk host is unreachable",
          });
        }

        if (isAuthError) {
          throw new TRPCError({
            code: "UNAUTHORIZED",
            message: "Invalid Plesk credentials",
          });
        }

        // Check if we have valid XML response
        if (!xml || xml.trim() === '') {
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Empty response from Plesk server",
          });
        }

        const parser = new XMLParser({ ignoreAttributes: false });
        let parsed: any;

        try {
          parsed = parser.parse(xml);
        } catch (parseError) {
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Failed to parse Plesk response",
            cause: parseError,
          });
        }

        // Check for Plesk system errors
        if (parsed?.packet?.system?.status === 'error') {
          const errorCode = parsed.packet.system.errcode;
          const errorText = parsed.packet.system.errtext || 'Unknown error';
          
          if (errorCode === 1010) {
            throw new TRPCError({
              code: "TOO_MANY_REQUESTS",
              message: `Rate limit exceeded: ${errorText}. Please wait before making another request.`,
            });
          }
          
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: `Plesk API Error ${errorCode}: ${errorText}`,
          });
        }

        // Filter subscriptions by matching filter-id with our pleskFilterIds
        // Use pre-built Sets for O(1) lookup performance
        const allResults = parsed?.packet?.webspace?.get?.result || [];
        
        // Optimized filtering: single pass with Set lookup (O(1) instead of O(n))
        const filteredResults = allResults.filter((subscription: any) => {
          const filterId = subscription["filter-id"];
          if (filterId === undefined || filterId === null) {
            return false;
          }
          
          // Try number lookup first (most common case, fastest)
          const filterIdNum = typeof filterId === "number" ? filterId : Number(filterId);
          if (!isNaN(filterIdNum) && pleskFilterIdSet.has(filterIdNum)) {
            return true;
          }
          
          // Fallback: string comparison for edge cases
          return pleskFilterIdStringSet.has(String(filterId));
        });

        // Return filtered results with flag
        return {
          hasServiceSubscriptions: true,
          raw: xml,
          parsed: {
            ...parsed,
            packet: {
              ...parsed.packet,
              webspace: {
                ...parsed.packet.webspace,
                get: {
                  ...parsed.packet.webspace.get,
                  result: filteredResults,
                },
              },
            },
          },
        };
      } catch (error) {
        if (error instanceof TRPCError) {
          throw error;
        }
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to fetch filtered subscriptions",
          cause: error,
        });
      }
    }),
});