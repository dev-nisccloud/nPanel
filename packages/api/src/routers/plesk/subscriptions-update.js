import { XMLParser } from 'fast-xml-parser';
import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { sendPleskXmlRequest } from '../../lib/plesk/xml-client';
import { protectedProcedure, router } from '../../trpc';
function buildUpdateGenSetupValues(data) {
    const elements = [];
    if (data.name)
        elements.push(`<name>${data.name}</name>`);
    if (data.status !== undefined)
        elements.push(`<status>${data.status}</status>`);
    if (data.ipAddress)
        elements.push(`<ip_address>${data.ipAddress}</ip_address>`);
    if (data.description)
        elements.push(`<description>${data.description}</description>`);
    if (data.adminDescription)
        elements.push(`<admin-description>${data.adminDescription}</admin-description>`);
    return elements.length > 0 ? `<gen_setup>${elements.join('')}</gen_setup>` : '';
}
function buildUpdateLimitsValues(data) {
    const limits = [];
    if (data.diskSpace !== undefined)
        limits.push(`<disk_space>${data.diskSpace}</disk_space>`);
    if (data.maxSubdomains !== undefined)
        limits.push(`<max_subdom>${data.maxSubdomains}</max_subdom>`);
    if (data.maxDomains !== undefined)
        limits.push(`<max_dom>${data.maxDomains}</max_dom>`);
    if (data.maxDatabases !== undefined)
        limits.push(`<max_db>${data.maxDatabases}</max_db>`);
    return limits.length > 0 ? `<limits>${limits.join('')}</limits>` : '';
}
function buildUpdatePrefsValues(data) {
    const prefs = [];
    if (data.www !== undefined)
        prefs.push(`<www>${data.www ? 'true' : 'false'}</www>`);
    return prefs.length > 0 ? `<prefs>${prefs.join('')}</prefs>` : '';
}
function buildSubscriptionUpdateXml(subscriptionId, data) {
    const genSetup = buildUpdateGenSetupValues(data);
    const limits = buildUpdateLimitsValues(data);
    const prefs = buildUpdatePrefsValues(data);
    const sections = [genSetup, limits, prefs].filter(Boolean).join('');
    if (!sections) {
        throw new TRPCError({ code: 'BAD_REQUEST', message: 'No update fields provided' });
    }
    return `<?xml version="1.0" encoding="UTF-8"?>
<packet>
  <webspace>
    <set>
      <filter><id>${subscriptionId}</id></filter>
      <values>
        ${sections}
      </values>
    </set>
  </webspace>
</packet>`;
}
export const subscriptionsUpdateRouter = router({
    update: protectedProcedure
        .input(z.object({
        id: z.number(),
        name: z.string().optional(),
        status: z.number().optional(),
        ipAddress: z.string().optional(),
        description: z.string().optional(),
        adminDescription: z.string().optional(),
        diskSpace: z.number().optional(),
        maxSubdomains: z.number().optional(),
        maxDomains: z.number().optional(),
        maxDatabases: z.number().optional(),
        www: z.boolean().optional(),
    }))
        .mutation(async ({ input }) => {
        try {
            if (!process.env.PLESK_XML_ENDPOINT)
                throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'PLESK_XML_ENDPOINT not set' });
            const { id, ...rest } = input;
            const xmlRequest = buildSubscriptionUpdateXml(id, rest);
            const { xml, isAuthError, isHostUnreachable } = await sendPleskXmlRequest(xmlRequest);
            if (isHostUnreachable)
                throw new TRPCError({ code: 'SERVICE_UNAVAILABLE', message: 'Plesk host is unreachable' });
            if (isAuthError)
                throw new TRPCError({ code: 'UNAUTHORIZED', message: 'Invalid Plesk credentials' });
            if (!xml || xml.trim() === '')
                throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Empty response from Plesk server' });
            const parser = new XMLParser({ ignoreAttributes: false });
            const parsed = parser.parse(xml);
            return { raw: xml, parsed };
        }
        catch (error) {
            if (error instanceof TRPCError)
                throw error;
            throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Failed to update subscription', cause: error });
        }
    }),
});
