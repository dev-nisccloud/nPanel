import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { sendPleskRestRequest } from '../../lib/plesk/rest-client';
import { protectedProcedure, router } from '../../trpc';

async function getInstalledThemes(installationId: number) {
  const endpoint = `/v1/installations/${installationId}/themes`;
  const { data, isAuthError, isHostUnreachable, statusCode } = await sendPleskRestRequest(endpoint, 'GET');
  if (isHostUnreachable) throw new TRPCError({ code: 'SERVICE_UNAVAILABLE', message: 'Plesk host is unreachable' });
  if (isAuthError) throw new TRPCError({ code: 'UNAUTHORIZED', message: 'Invalid Plesk credentials' });
  if (statusCode === 404) throw new TRPCError({ code: 'NOT_FOUND', message: `WordPress installation ${installationId} not found` });
  if (statusCode < 200 || statusCode >= 300 || !data) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: `WP Toolkit returned ${statusCode}` });
  return data;
}

async function getThemeCatalog(installationId: number, options: {
  compatible?: boolean;
  downloadCount?: number;
  lastUpdatedAt?: 'all' | '3M' | '6M' | '1y' | '2y';
  page?: number;
  pageSize?: number;
  rating?: number;
  term?: string;
}) {
  const queryParams = new URLSearchParams();
  if (options.compatible !== undefined) queryParams.append('compatible', options.compatible.toString());
  if (options.downloadCount !== undefined) queryParams.append('downloadCount', options.downloadCount.toString());
  if (options.lastUpdatedAt !== undefined) queryParams.append('lastUpdatedAt', options.lastUpdatedAt);
  if (options.page !== undefined) queryParams.append('page', options.page.toString());
  if (options.pageSize !== undefined) queryParams.append('pageSize', options.pageSize.toString());
  if (options.rating !== undefined) queryParams.append('rating', options.rating.toString());
  if (options.term !== undefined) queryParams.append('term', options.term);
  const queryString = queryParams.toString();
  const endpoint = `/v1/installations/${installationId}/features/catalog/themes${queryString ? `?${queryString}` : ''}`;
  const { data, isAuthError, isHostUnreachable, statusCode } = await sendPleskRestRequest(endpoint, 'GET');
  if (isHostUnreachable) throw new TRPCError({ code: 'SERVICE_UNAVAILABLE', message: 'Plesk host is unreachable' });
  if (isAuthError) throw new TRPCError({ code: 'UNAUTHORIZED', message: 'Invalid Plesk credentials' });
  if (statusCode === 404) throw new TRPCError({ code: 'NOT_FOUND', message: `WordPress installation ${installationId} not found` });
  if (statusCode < 200 || statusCode >= 300 || !data) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: `WP Toolkit returned ${statusCode}` });
  return data;
}

export const wpThemesListRouter = router({
  installed: protectedProcedure
    .input(z.object({ installationId: z.number() }))
    .query(async ({ input }) => {
      const data = await getInstalledThemes(input.installationId);
      return { data };
    }),
  catalog: protectedProcedure
    .input(z.object({
      installationId: z.number(),
      compatible: z.boolean().optional(),
      downloadCount: z.number().optional(),
      lastUpdatedAt: z.enum(['all', '3M', '6M', '1y', '2y']).optional(),
      page: z.number().optional(),
      pageSize: z.number().optional(),
      rating: z.number().optional(),
      term: z.string().optional(),
    }))
    .query(async ({ input }) => {
      const { installationId, ...options } = input;
      const data = await getThemeCatalog(installationId, options);
      return { data };
    }),
});
