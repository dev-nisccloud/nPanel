import { XMLParser } from 'fast-xml-parser';
import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { and, eq } from "@npanel/db";

import { db } from "@npanel/db";
import { hostingSubscription, niscServicePlan } from "@npanel/db/schema/hosting";
import { serviceSubscription } from "@npanel/db/schema/service-subscriptions";
import { sendPleskXmlRequest } from '../../lib/plesk/xml-client';
import { publicProcedure, protectedProcedure, router } from '../../trpc';

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
  getAll: publicProcedure
    .input(z.object({}).optional().default({}))
    .query(async () => {
      
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
  getById: publicProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ input }) => {
      const { id } = input;
      
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