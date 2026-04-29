import { XMLParser } from 'fast-xml-parser';
import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { sendPleskXmlRequest } from '../../lib/plesk/xml-client';
import { protectedProcedure, router } from '../../trpc';
function buildGenSetupSection(data) {
    const elements = [`<name>${data.name}</name>`];
    elements.push(`<owner-id>${data.ownerId}</owner-id>`);
    if (data.ipAddress)
        elements.push(`<ip_address>${data.ipAddress}</ip_address>`);
    if (data.status !== undefined)
        elements.push(`<status>${data.status}</status>`);
    if (data.hostingType)
        elements.push(`<htype>${data.hostingType}</htype>`);
    if (data.description)
        elements.push(`<description>${data.description}</description>`);
    if (data.adminDescription)
        elements.push(`<admin-description>${data.adminDescription}</admin-description>`);
    return `<gen_setup>${elements.join('')}</gen_setup>`;
}
function buildHostingSection(data) {
    if (data.hostingType !== 'vrt_hst')
        return '';
    // Auto-generate FTP login and password
    const generateRandomLogin = () => {
        const letters = 'abcdefghijklmnopqrstuvwxyz0123456789';
        let result = 'ftp';
        for (let i = 0; i < 6; i++) {
            result += letters.charAt(Math.floor(Math.random() * letters.length));
        }
        return result;
    };
    const generateRandomPassword = () => {
        return Math.random().toString(36).slice(-12) + 'A1!';
    };
    const ftpLogin = generateRandomLogin();
    const ftpPassword = generateRandomPassword();
    const props = [];
    props.push(`<property><name>ftp_login</name><value>${ftpLogin}</value></property>`);
    props.push(`<property><name>ftp_password</name><value>${ftpPassword}</value></property>`);
    return `<hosting><vrt_hst>${props.join('')}</vrt_hst></hosting>`;
}
function buildPlanSection(data) {
    if (!data.planName && !data.planGuid && !data.planExternalId)
        return '';
    const fields = [];
    if (data.planName)
        fields.push(`<plan-name>${data.planName}</plan-name>`);
    if (data.planGuid)
        fields.push(`<plan-guid>${data.planGuid}</plan-guid>`);
    if (data.planExternalId)
        fields.push(`<plan-external-id>${data.planExternalId}</plan-external-id>`);
    return fields.join('');
}
function buildAdditionalSections(data) {
    const sections = [];
    if (data.limitsXml)
        sections.push(`<limits>${data.limitsXml}</limits>`);
    if (data.permsXml)
        sections.push(`<permissions>${data.permsXml}</permissions>`);
    if (data.prefsXml)
        sections.push(`<prefs>${data.prefsXml}</prefs>`);
    if (data.ipPoolXml)
        sections.push(`<ip_pool>${data.ipPoolXml}</ip_pool>`);
    return sections.join('');
}
function buildSubscriptionCreateXml(data) {
    const genSetup = buildGenSetupSection(data);
    const hosting = buildHostingSection(data);
    const plan = buildPlanSection(data);
    const additional = buildAdditionalSections(data);
    return `<?xml version="1.0" encoding="UTF-8"?>
<packet>
  <webspace>
    <add>
      ${genSetup}
      ${hosting}
      ${plan}
      ${additional}
    </add>
  </webspace>
</packet>`;
}
export const subscriptionsCreateRouter = router({
    create: protectedProcedure
        .input(z.object({
        name: z.string(),
        ownerId: z.number(),
        hostingType: z.enum(['vrt_hst', 'standard', 'none']).optional(),
        ipAddress: z.string().optional(),
        status: z.number().optional(),
        description: z.string().optional(),
        adminDescription: z.string().optional(),
        planName: z.string().optional(),
        planGuid: z.string().optional(),
        planExternalId: z.string().optional(),
        limitsXml: z.string().optional(),
        permsXml: z.string().optional(),
        prefsXml: z.string().optional(),
        ipPoolXml: z.string().optional(),
        // login and password are auto-generated
    }))
        .mutation(async ({ input }) => {
        try {
            if (!process.env.PLESK_XML_ENDPOINT)
                throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'PLESK_XML_ENDPOINT not set' });
            const xmlRequest = buildSubscriptionCreateXml(input);
            const { xml, isAuthError, isHostUnreachable } = await sendPleskXmlRequest(xmlRequest);
            if (isHostUnreachable)
                throw new TRPCError({ code: 'SERVICE_UNAVAILABLE', message: 'Plesk host is unreachable' });
            if (isAuthError)
                throw new TRPCError({ code: 'UNAUTHORIZED', message: 'Invalid Plesk credentials' });
            if (!xml || xml.trim() === '') {
                throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Empty response from Plesk server' });
            }
            // Parse XML to check for errors
            const parser = new XMLParser({ ignoreAttributes: false });
            let parsed;
            try {
                parsed = parser.parse(xml);
            }
            catch (parseError) {
                throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Failed to parse Plesk response', cause: parseError });
            }
            return { raw: xml, parsed };
        }
        catch (error) {
            if (error instanceof TRPCError)
                throw error;
            throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Failed to create subscription', cause: error });
        }
    }),
});
