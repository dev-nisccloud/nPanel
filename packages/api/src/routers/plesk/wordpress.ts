import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { sendPleskRestRequest } from '../../lib/plesk/rest-client';
import { protectedProcedure, router } from '../../trpc'; 

/**
 * Get WordPress installations using WP Toolkit REST API with advanced filtering
 */
async function getWpInstallations(options: {
  domain?: string;
  installationIds?: number[];
  sortBy?: 'title' | 'displayTitle' | 'ownerName' | 'version';
  sortOrder?: 'asc' | 'desc';
} = {}) {
  const { domain, installationIds, sortBy = 'title', sortOrder = 'asc' } = options;
  
  // Build query parameters
  const queryParams = new URLSearchParams();
  
  if (installationIds && installationIds.length > 0) {
    installationIds.forEach(id => queryParams.append('installationsIds[]', id.toString()));
  }
  
  if (sortBy) {
    queryParams.append('sortBy', sortBy);
  }
  
  if (sortOrder) {
    queryParams.append('sortOrder', sortOrder);
  }
  
  const queryString = queryParams.toString();
  const endpoint = `/v1/installations${queryString ? `?${queryString}` : ''}`;
  
  console.log(`Fetching WP Toolkit installations from: ${endpoint}`);
  
  const { data, isAuthError, isHostUnreachable, statusCode } =
    await sendPleskRestRequest(endpoint, 'GET');
  
  if (isHostUnreachable) {
    throw new Error('Plesk host is unreachable');
  }

  if (isAuthError) {
    throw new Error('Invalid Plesk credentials');
  }

  if (statusCode < 200 || statusCode >= 300 || !data) {
    throw new Error(`WP Toolkit API returned status ${statusCode}: ${JSON.stringify(data)}`);
  }

  // Filter by domain if specified
  if (domain && Array.isArray(data)) {
    return data.filter((installation: any) => {
      const installationDomain = installation.domain?.name || installation.url;
      if (typeof installationDomain !== 'string') {
        return false;
      }
      return installationDomain === domain || 
             installationDomain.includes(domain) ||
             installationDomain.includes(`.${domain}`);
    });
  }

  return data;
}

/**
 * Get a specific WordPress installation by ID
 */
async function getWpInstallationById(installationId: number) {
  const endpoint = `/v1/installations/${installationId}`;
  
  console.log(`Fetching WP Toolkit installation by ID: ${endpoint}`);
  
  const { data, isAuthError, isHostUnreachable, statusCode } =
    await sendPleskRestRequest(endpoint, 'GET');
  
  if (isHostUnreachable) {
    throw new Error('Plesk host is unreachable');
  }

  if (isAuthError) {
    throw new Error('Invalid Plesk credentials');
  }

  if (statusCode === 404) {
    throw new Error(`WordPress installation with ID ${installationId} not found`);
  }

  if (statusCode < 200 || statusCode >= 300 || !data) {
    throw new Error(`WP Toolkit API returned status ${statusCode}: ${JSON.stringify(data)}`);
  }

  return data;
}

export const wordpressRouter = router({
  // Get all WordPress installations with filtering
  getAll: protectedProcedure
    .input(z.object({
      domain: z.string().optional(),
      installationIds: z.array(z.number()).optional(),
      sortBy: z.enum(['title', 'displayTitle', 'ownerName', 'version']).optional(),
      sortOrder: z.enum(['asc', 'desc']).optional(),
    }).optional().default({}))
    .query(async ({ input = {} }) => {
      const { domain, installationIds, sortBy = 'title', sortOrder = 'asc' } = input;
      
      try {
        // Check if required environment variables are set
        if (!process.env.PLESK_REST_ENDPOINT) {
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Server configuration error: PLESK_REST_ENDPOINT environment variable is not set",
          });
        }

        // Validate domain parameter if provided
        if (domain) {
          const domainRegex = /^[a-zA-Z0-9][a-zA-Z0-9-]{0,61}[a-zA-Z0-9]?(\.[a-zA-Z0-9][a-zA-Z0-9-]{0,61}[a-zA-Z0-9]?)*$/;
          if (!domainRegex.test(domain)) {
            throw new TRPCError({
              code: "BAD_REQUEST",
              message: "Invalid 'domain' parameter. Must be a valid domain name.",
            });
          }
        }

        const installations = await getWpInstallations({
          domain,
          installationIds,
          sortBy,
          sortOrder
        });

        const responseData = Array.isArray(installations) ? installations : [installations];

        return {
          data: responseData,
          metadata: {
            endpoint: '/api/plesk-wp-instances',
            timestamp: new Date().toISOString(),
            totalInstallations: Array.isArray(responseData) ? responseData.length : 1,
            apiVersion: 'WP Toolkit 6.7.3-9437',
            filters: {
              domain: domain || null,
              installationIds: installationIds || null,
              sortBy: sortBy || 'title',
              sortOrder: sortOrder || 'asc'
            },
            note: domain 
              ? `WordPress installations filtered by domain: ${domain}` 
              : "All WordPress installations retrieved from WP Toolkit REST API"
          }
        };
      } catch (error) {
        console.error('Plesk WP Instances API Error:', error);
        if (error instanceof TRPCError) {
          throw error;
        }
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to fetch WordPress instances",
          cause: error,
        });
      }
    }),

  // Get WordPress installation by ID (REQUIRED INPUT - BUSINESS CRITICAL)
  getById: protectedProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ input }) => {
      const { id: installationId } = input;
      
      try {
        // Check if required environment variables are set
        if (!process.env.PLESK_REST_ENDPOINT) {
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Server configuration error: PLESK_REST_ENDPOINT environment variable is not set",
          });
        }

        const installation = await getWpInstallationById(installationId);

        return {
          data: installation,
          metadata: {
            endpoint: '/api/plesk-wp-instances',
            timestamp: new Date().toISOString(),
            totalInstallations: 1,
            apiVersion: 'WP Toolkit 6.7.3-9437',
            note: `Single WordPress installation retrieved by ID: ${installationId}`
          }
        };
      } catch (error) {
        console.error('Plesk WP Installation API Error:', error);
        if (error instanceof TRPCError) {
          throw error;
        }
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to fetch WordPress installation",
          cause: error,
        });
      }
    }),
});

