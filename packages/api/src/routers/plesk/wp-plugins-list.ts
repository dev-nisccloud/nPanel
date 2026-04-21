import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { sendPleskRestRequest } from '../../lib/plesk/rest-client';
import { protectedProcedure, router } from '../../trpc';

/**
 * Get the list of plugins for a WordPress installation
 */
async function getWpPlugins(installationId: number) {
  const endpoint = `/v1/installations/${installationId}/plugins`;
  
  console.log(`Fetching WP Toolkit plugins for installation ID: ${endpoint}`);
  
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

/**
 * Get plugin catalog/search results for a WordPress installation
 */
async function getWpPluginCatalog(installationId: number, options: {
  page?: number;
  pageSize?: number;
  term?: string;
  compatible?: boolean;
  downloadCount?: number;
  rating?: number;
  lastUpdatedAt?: string;
} = {}) {
  const {
    page = 1,
    pageSize = 25,
    term = '',
    compatible = false,
    downloadCount = 0,
    rating = 0.0,
    lastUpdatedAt = 'all'
  } = options;

  // Build query parameters
  const queryParams = new URLSearchParams();
  queryParams.append('page', page.toString());
  queryParams.append('pageSize', pageSize.toString());
  queryParams.append('compatible', compatible.toString());
  queryParams.append('downloadCount', downloadCount.toString());
  queryParams.append('rating', rating.toString());
  queryParams.append('lastUpdatedAt', lastUpdatedAt);
  
  if (term) {
    queryParams.append('term', term);
  }

  const queryString = queryParams.toString();
  const endpoint = `/v1/installations/${installationId}/features/catalog/plugins?${queryString}`;
  
  console.log(`Fetching WP Toolkit plugin catalog for installation ID: ${endpoint}`);
  
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

export const wpPluginsListRouter = router({
  // Get plugins for a WordPress installation
  getByInstallationId: protectedProcedure
    .input(z.object({ installationId: z.number() }))
    .query(async ({ input }) => {
      try {
        // Check if required environment variables are set
        if (!process.env.PLESK_REST_ENDPOINT) {
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Server configuration error: PLESK_REST_ENDPOINT environment variable is not set",
          });
        }

        const plugins = await getWpPlugins(input.installationId);

        return {
          data: plugins,
          metadata: {
            endpoint: '/api/plesk-wp-plugins-list',
            timestamp: new Date().toISOString(),
            installationId: input.installationId,
            apiVersion: 'WP Toolkit 6.7.3-9437',
            note: `WordPress plugins retrieved for installation ID: ${input.installationId}`
          }
        };
      } catch (error) {
        console.error('Plesk WP Plugins List API Error:', error);
        if (error instanceof TRPCError) {
          throw error;
        }
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to fetch WordPress plugins",
          cause: error,
        });
      }
    }),

  // Get plugin catalog for a WordPress installation
  getCatalog: protectedProcedure
    .input(z.object({
      installationId: z.number(),
      page: z.number().optional(),
      pageSize: z.number().optional(),
      term: z.string().optional(),
      compatible: z.boolean().optional(),
      downloadCount: z.number().optional(),
      rating: z.number().optional(),
      lastUpdatedAt: z.string().optional(),
    }))
    .query(async ({ input }) => {
      try {
        // Check if required environment variables are set
        if (!process.env.PLESK_REST_ENDPOINT) {
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Server configuration error: PLESK_REST_ENDPOINT environment variable is not set",
          });
        }

        const { installationId, ...options } = input;
        const catalog = await getWpPluginCatalog(installationId, options);

        return {
          data: catalog,
          metadata: {
            endpoint: '/api/plesk-wp-plugins-list',
            timestamp: new Date().toISOString(),
            installationId,
            filters: options,
            apiVersion: 'WP Toolkit 6.7.3-9437',
            note: `WordPress plugin catalog retrieved for installation ID: ${installationId}`
          }
        };
      } catch (error) {
        console.error('Plesk WP Plugin Catalog API Error:', error);
        if (error instanceof TRPCError) {
          throw error;
        }
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to fetch WordPress plugin catalog",
          cause: error,
        });
      }
    }),
});