import { XMLParser } from 'fast-xml-parser';
import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { sendPleskXmlRequest } from '../../lib/plesk/xml-client';
import { publicProcedure, router } from '../../trpc';
function validateCreateData(data) {
    if (!data.parent) {
        throw new TRPCError({ code: 'BAD_REQUEST', message: 'Parent domain is required' });
    }
    if (!data.name || data.name.trim() === '') {
        throw new TRPCError({ code: 'BAD_REQUEST', message: 'Subdomain name is required' });
    }
    if (!data.parent.includes('.')) {
        throw new TRPCError({ code: 'BAD_REQUEST', message: 'Parent domain must be a valid domain name' });
    }
    // Subdomain name validation: alphanumeric and hyphens, must start and end with alphanumeric
    // Allow single character subdomains
    const subdomainName = data.name.trim();
    if (subdomainName.length === 0) {
        throw new TRPCError({ code: 'BAD_REQUEST', message: 'Subdomain name cannot be empty' });
    }
    if (subdomainName.length > 63) {
        throw new TRPCError({ code: 'BAD_REQUEST', message: 'Subdomain name cannot exceed 63 characters' });
    }
    // More permissive regex: allows single char, but if longer, must start/end with alphanumeric
    if (!/^[a-zA-Z0-9]([a-zA-Z0-9-]*[a-zA-Z0-9])?$/.test(subdomainName)) {
        throw new TRPCError({ code: 'BAD_REQUEST', message: 'Invalid subdomain name format. Use only letters, numbers, and hyphens. Cannot start or end with a hyphen.' });
    }
    if (data.webstat && !['none', 'awstats', 'webalizer', 'analog', 'custom'].includes(data.webstat)) {
        throw new TRPCError({ code: 'BAD_REQUEST', message: 'Invalid webstat type' });
    }
}
function buildSubdomainCreateXml(data) {
    const escapeXml = (str) => str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#x27;');
    // Build properties array - properties are direct children of <add>
    const properties = [];
    if (data.wwwRoot)
        properties.push(`      <property><name>www_root</name><value>${escapeXml(data.wwwRoot)}</value></property>`);
    if (data.ssh !== undefined)
        properties.push(`      <property><name>ssh</name><value>${data.ssh ? 'true' : 'false'}</value></property>`);
    if (data.safeMode !== undefined)
        properties.push(`      <property><name>safe_mode</name><value>${data.safeMode ? 'true' : 'false'}</value></property>`);
    // PHP handler property name is php_handler_id, not php
    if (data.php)
        properties.push(`      <property><name>php_handler_id</name><value>${escapeXml(data.php)}</value></property>`);
    if (data.cgi !== undefined)
        properties.push(`      <property><name>cgi</name><value>${data.cgi ? 'true' : 'false'}</value></property>`);
    if (data.perl !== undefined)
        properties.push(`      <property><name>perl</name><value>${data.perl ? 'true' : 'false'}</value></property>`);
    if (data.python !== undefined)
        properties.push(`      <property><name>python</name><value>${data.python ? 'true' : 'false'}</value></property>`);
    if (data.ruby !== undefined)
        properties.push(`      <property><name>ruby</name><value>${data.ruby ? 'true' : 'false'}</value></property>`);
    if (data.nodejs !== undefined)
        properties.push(`      <property><name>nodejs</name><value>${data.nodejs ? 'true' : 'false'}</value></property>`);
    if (data.webstat && data.webstat !== 'none')
        properties.push(`      <property><name>webstat</name><value>${escapeXml(data.webstat)}</value></property>`);
    // Properties should be direct children of <add>, not wrapped in <properties>
    const propertiesXml = properties.length > 0
        ? properties.join('\n')
        : '';
    const hostingXml = data.hosting
        ? `      <hosting>
        <vrt_hst>
          <property><name>ip_address</name><value>${escapeXml(data.hosting.ipAddress ?? '')}</value></property>
          <property><name>ftp_login</name><value>${escapeXml(data.hosting.ftpLogin ?? '')}</value></property>
          <property><name>ftp_password</name><value>${escapeXml(data.hosting.ftpPassword ?? '')}</value></property>
        </vrt_hst>
      </hosting>`
        : '';
    // Correct XML structure: <parent> and <name> are direct children of <add>
    return `<?xml version="1.0" encoding="UTF-8"?>
<packet>
  <subdomain>
    <add>
      <parent>${escapeXml(data.parent)}</parent>
      <name>${escapeXml(data.name)}</name>
${propertiesXml}
${hostingXml}
    </add>
  </subdomain>
</packet>`;
}
export const subdomainsCreateRouter = router({
    create: publicProcedure
        .input(z.object({
        parent: z.string(),
        name: z.string(),
        wwwRoot: z.string().optional(),
        ssh: z.boolean().optional(),
        safeMode: z.boolean().optional(),
        php: z.string().optional(),
        cgi: z.boolean().optional(),
        perl: z.boolean().optional(),
        python: z.boolean().optional(),
        ruby: z.boolean().optional(),
        nodejs: z.boolean().optional(),
        webstat: z.enum(['none', 'awstats', 'webalizer', 'analog', 'custom']).optional(),
        hosting: z.object({
            ipAddress: z.string().optional(),
            ftpLogin: z.string().optional(),
            ftpPassword: z.string().optional(),
        }).optional(),
    }))
        .mutation(async ({ input }) => {
        try {
            if (!process.env.PLESK_XML_ENDPOINT) {
                throw new TRPCError({
                    code: 'INTERNAL_SERVER_ERROR',
                    message: 'PLESK_XML_ENDPOINT not set'
                });
            }
            validateCreateData(input);
            const xmlRequest = buildSubdomainCreateXml(input);
            const { xml, isAuthError, isHostUnreachable } = await sendPleskXmlRequest(xmlRequest);
            if (isHostUnreachable) {
                throw new TRPCError({
                    code: 'SERVICE_UNAVAILABLE',
                    message: 'Plesk host is unreachable'
                });
            }
            if (isAuthError) {
                throw new TRPCError({
                    code: 'UNAUTHORIZED',
                    message: 'Invalid Plesk credentials'
                });
            }
            if (!xml || xml.trim() === '') {
                throw new TRPCError({
                    code: 'INTERNAL_SERVER_ERROR',
                    message: 'Empty response from Plesk server'
                });
            }
            // Parse XML response to check for errors
            const parser = new XMLParser({ ignoreAttributes: false });
            let parsed;
            try {
                parsed = parser.parse(xml);
            }
            catch (parseError) {
                console.error('Failed to parse XML response:', parseError);
                throw new TRPCError({
                    code: 'INTERNAL_SERVER_ERROR',
                    message: 'Failed to parse Plesk response',
                    cause: parseError,
                });
            }
            // Check for error in response
            const result = parsed?.packet?.subdomain?.add?.result;
            if (!result) {
                throw new TRPCError({
                    code: 'INTERNAL_SERVER_ERROR',
                    message: 'Invalid response from Plesk API: No result found',
                });
            }
            // Check status - must be explicitly "ok"
            if (result.status === 'error' || result.status === 'fault') {
                const errorCode = result.errcode || result['@_code'] || 'UNKNOWN';
                const errorText = result.errtext || result.message || result['@_message'] || 'Unknown error occurred';
                // Map common Plesk error codes to user-friendly messages
                let errorMessage = errorText;
                if (errorCode === '1007') {
                    errorMessage = 'A subdomain with this name already exists';
                }
                else if (errorCode === '1015') {
                    errorMessage = 'Parent domain not found';
                }
                else if (errorCode === '1006') {
                    errorMessage = 'Permission denied';
                }
                else if (errorCode === '1019') {
                    errorMessage = 'Invalid property name or value';
                }
                else if (errorCode === '1023') {
                    errorMessage = 'General operation failed';
                }
                else if (errorCode === '1034') {
                    errorMessage = 'Subdomains are not supported on sites without physical hosting';
                }
                throw new TRPCError({
                    code: 'BAD_REQUEST',
                    message: errorMessage,
                });
            }
            // Explicitly check for "ok" status
            if (result.status !== 'ok') {
                throw new TRPCError({
                    code: 'INTERNAL_SERVER_ERROR',
                    message: `Unexpected response status from Plesk API: ${result.status}`,
                });
            }
            // Success - return the result
            return {
                raw: xml,
                parsed,
                success: true,
                subdomainId: result.id,
            };
        }
        catch (error) {
            console.error('Subdomain creation error:', error);
            if (error instanceof TRPCError) {
                throw error;
            }
            throw new TRPCError({
                code: 'INTERNAL_SERVER_ERROR',
                message: `Failed to create subdomain: ${error instanceof Error ? error.message : 'Unknown error'}`,
                cause: error
            });
        }
    }),
});
