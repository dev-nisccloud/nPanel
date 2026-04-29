import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { sendPleskRestRequest } from '../../lib/plesk/rest-client';
import { protectedProcedure, router } from '../../trpc';
async function getWpCredentials(installationId) {
    const endpoint = `/v1/installations/${installationId}/credentials`;
    const { data, isAuthError, isHostUnreachable, statusCode } = await sendPleskRestRequest(endpoint, 'GET');
    if (isHostUnreachable)
        throw new TRPCError({ code: 'SERVICE_UNAVAILABLE', message: 'Plesk host is unreachable' });
    if (isAuthError)
        throw new TRPCError({ code: 'UNAUTHORIZED', message: 'Invalid Plesk credentials' });
    if (statusCode === 404)
        throw new TRPCError({ code: 'NOT_FOUND', message: `WordPress installation ${installationId} not found` });
    if (statusCode < 200 || statusCode >= 300 || !data)
        throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: `WP Toolkit returned ${statusCode}` });
    return data;
}
async function getWpAccountSettings(installationId) {
    const endpoint = `/v1/installations/${installationId}/account`;
    const { data, isAuthError, isHostUnreachable, statusCode } = await sendPleskRestRequest(endpoint, 'GET');
    if (isHostUnreachable)
        throw new TRPCError({ code: 'SERVICE_UNAVAILABLE', message: 'Plesk host is unreachable' });
    if (isAuthError)
        throw new TRPCError({ code: 'UNAUTHORIZED', message: 'Invalid Plesk credentials' });
    if (statusCode === 404)
        throw new TRPCError({ code: 'NOT_FOUND', message: `WordPress installation ${installationId} not found` });
    if (statusCode < 200 || statusCode >= 300 || !data)
        throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: `WP Toolkit returned ${statusCode}` });
    return data;
}
export const wpCredentialsRouter = router({
    get: protectedProcedure
        .input(z.object({ installationId: z.number() }))
        .query(async ({ input }) => {
        const data = await getWpCredentials(input.installationId);
        return { data };
    }),
    getAccount: protectedProcedure
        .input(z.object({ installationId: z.number() }))
        .query(async ({ input }) => {
        const data = await getWpAccountSettings(input.installationId);
        return { data };
    }),
});
