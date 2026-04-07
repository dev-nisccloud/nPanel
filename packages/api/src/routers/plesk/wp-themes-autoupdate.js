import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { sendPleskRestRequest } from '../../lib/plesk/rest-client';
import { publicProcedure, router } from '../../trpc';
async function updateWpThemeAutoUpdates(installationId, themes) {
    const endpoint = `/v1/installations/${installationId}/themes`;
    // Use PATCH method for updating settings in bulk, consistent with plugins endpoint
    const { data, isAuthError, isHostUnreachable, statusCode } = await sendPleskRestRequest(endpoint, 'PATCH', themes);
    if (isHostUnreachable)
        throw new TRPCError({ code: 'SERVICE_UNAVAILABLE', message: 'Plesk host is unreachable' });
    if (isAuthError)
        throw new TRPCError({ code: 'UNAUTHORIZED', message: 'Invalid Plesk credentials' });
    if (statusCode === 404)
        throw new TRPCError({ code: 'NOT_FOUND', message: `WordPress installation ${installationId} not found` });
    if (statusCode < 200 || statusCode >= 300 || !data) {
        const errorDetail = data ? JSON.stringify(data) : 'No data returned';
        throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: `WP Toolkit returned ${statusCode}: ${errorDetail}` });
    }
    return data;
}
export const wpThemesAutoupdateRouter = router({
    update: publicProcedure
        .input(z.object({
        installationId: z.number(),
        themes: z.array(z.object({ slug: z.string(), autoUpdates: z.boolean().optional(), status: z.boolean().optional() })).min(1),
    }))
        .mutation(async ({ input }) => {
        const data = await updateWpThemeAutoUpdates(input.installationId, input.themes);
        return { data };
    }),
});
