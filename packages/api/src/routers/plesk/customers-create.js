import { XMLParser } from 'fast-xml-parser';
import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { sendPleskXmlRequest } from '../../lib/plesk/xml-client';
import { publicProcedure, router } from '../../trpc';
// Removed external type import - using Zod schema instead
// Define regex patterns at the top level for performance
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const LOGIN_REGEX = /^[a-zA-Z0-9._-]+$/;
// Zod schema for input validation
const createSchema = z.object({
    personName: z.string(),
    email: z.string().email(),
    login: z.string().optional(),
    password: z.string().optional(),
    phone: z.string().optional(),
    fax: z.string().optional(),
    company: z.string().optional(),
    address: z.string().optional(),
    city: z.string().optional(),
    state: z.string().optional(),
    postCode: z.string().optional(),
    country: z.string().optional(),
    locale: z.string().optional(),
    guid: z.string().optional(),
    ownerId: z.number().optional(),
    externalId: z.string().optional(),
    description: z.string().optional(),
});
/**
 * Validate required fields for customer creation (after auto-generation)
 */
function validateCreateData(data) {
    // Check core required fields
    if (!data.personName) {
        throw new Error('Customer name (personName) is required');
    }
    if (!data.email) {
        throw new Error('Customer email is required');
    }
    // Validate email format
    if (!EMAIL_REGEX.test(data.email)) {
        throw new Error('Invalid email format');
    }
    // Validate login format if provided (will be auto-generated if missing)
    if (data.login && !LOGIN_REGEX.test(data.login)) {
        throw new Error('Login must contain only alphanumeric characters, dots, underscores, or hyphens');
    }
    // Validate password strength if provided (will be auto-generated if missing)
    if (data.password && data.password.length < 8) {
        throw new Error('Password must be at least 8 characters long');
    }
}
/**
 * Build XML request for customer creation based on official Plesk XML-RPC API documentation
 */
function buildCustomerCreateXml(data) {
    // Escape XML special characters to prevent parsing errors
    const escapeXml = (str) => {
        return str
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&apos;');
    };
    // Auto-generate unique login if not provided
    const generateRandomLogin = () => {
        const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';
        let result = '';
        for (let i = 0; i < 6; i++) {
            result += letters.charAt(Math.floor(Math.random() * letters.length));
        }
        return result;
    };
    const login = data.login || generateRandomLogin();
    // Auto-generate password if not provided
    const password = data.password || Math.random().toString(36).slice(-12) + 'A1!';
    // Create XML structure with ONLY elements that Plesk accepts in gen_info
    // Based on Plesk error message analysis - removing unsupported elements
    return `<?xml version="1.0" encoding="UTF-8"?>
<packet>
  <customer>
    <add>
      <gen_info>
        <cname>${data.company ? escapeXml(String(data.company)) : ''}</cname>
        <pname>${escapeXml(data.personName)}</pname>
        <login>${escapeXml(login)}</login>
        <passwd>${escapeXml(password)}</passwd>
        <email>${escapeXml(data.email)}</email>
        <address>${data.address ? escapeXml(data.address) : ''}</address>
        <city>${data.city ? escapeXml(data.city) : ''}</city>
        <state>${data.state ? escapeXml(data.state) : ''}</state>
        <pcode>${data.postCode ? escapeXml(String(data.postCode)) : ''}</pcode>
        <country>${data.country ? escapeXml(data.country === 'Kenya' ? 'KE' : data.country) : ''}</country>
        <locale>${data.locale || 'en-US'}</locale>
        <owner-id>${data.ownerId || 1}</owner-id>
        <description>${data.description ? escapeXml(data.description) : ''}</description>
      </gen_info>
    </add>
  </customer>
</packet>`;
}
export const customersCreateRouter = router({
    // Create a new customer
    create: publicProcedure
        .input(createSchema)
        .mutation(async ({ input }) => {
        try {
            // Check if required environment variables are set
            if (!process.env.PLESK_XML_ENDPOINT) {
                throw new TRPCError({
                    code: "INTERNAL_SERVER_ERROR",
                    message: "Server configuration error: PLESK_XML_ENDPOINT environment variable is not set",
                });
            }
            // Validate input data
            validateCreateData(input);
            const xmlRequest = buildCustomerCreateXml(input);
            const { xml, isAuthError, isHostUnreachable } = await sendPleskXmlRequest(xmlRequest);
            if (isHostUnreachable) {
                throw new TRPCError({
                    code: "SERVICE_UNAVAILABLE",
                    message: "Plesk host is unreachable. Check network connectivity and server status.",
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
            let parsed;
            try {
                parsed = parser.parse(xml);
                // Check for Plesk error responses
                if (parsed.packet?.system?.status === 'error') {
                    const errorCode = parsed.packet.system.errcode;
                    const errorText = parsed.packet.system.errtext;
                    // Provide specific guidance based on common error codes
                    let errorGuidance = '';
                    switch (errorCode) {
                        case 1014:
                            errorGuidance = 'XML parsing error - check element order and required fields';
                            break;
                        case 1001:
                            errorGuidance = 'Authentication failed - check credentials';
                            break;
                        case 1002:
                            errorGuidance = 'Permission denied - check user permissions';
                            break;
                        case 1003:
                            errorGuidance = 'Invalid request - check XML structure';
                            break;
                        case 1004:
                            errorGuidance = 'Object not found - check if referenced objects exist';
                            break;
                        case 1005:
                            errorGuidance = 'Object already exists - duplicate entry';
                            break;
                        case 1006:
                            errorGuidance = 'Invalid parameter value';
                            break;
                        case 1007:
                            errorGuidance = 'Operation failed - check server logs';
                            break;
                        default:
                            errorGuidance = 'Unknown error - check Plesk documentation';
                    }
                    throw new TRPCError({
                        code: "BAD_REQUEST",
                        message: `Plesk API Error ${errorCode}: ${errorText}. ${errorGuidance}`,
                    });
                }
                // Check if customer was created successfully
                if (parsed.packet?.customer?.add?.result?.status === 'ok') {
                    // Customer created successfully
                }
                else if (parsed.packet?.customer?.add?.result?.status === 'error') {
                    // Handle customer-specific errors
                    const errorCode = parsed.packet.customer.add.result.errcode;
                    const errorText = parsed.packet.customer.add.result.errtext;
                    // Handle specific error cases
                    if (errorCode === 1007 && errorText.includes('already exists')) {
                        throw new TRPCError({
                            code: "CONFLICT",
                            message: `Customer already exists: ${errorText}`,
                        });
                    }
                    else {
                        throw new TRPCError({
                            code: "BAD_REQUEST",
                            message: `Customer creation failed: ${errorText}`,
                        });
                    }
                }
                else {
                    throw new TRPCError({
                        code: "INTERNAL_SERVER_ERROR",
                        message: "Customer creation failed - no success status in response",
                    });
                }
            }
            catch (parseError) {
                throw new TRPCError({
                    code: "INTERNAL_SERVER_ERROR",
                    message: "Failed to parse Plesk response",
                    cause: parseError,
                });
            }
            return {
                raw: xml,
                parsed,
            };
        }
        catch (error) {
            if (error instanceof TRPCError) {
                throw error;
            }
            throw new TRPCError({
                code: "INTERNAL_SERVER_ERROR",
                message: "Failed to create customer",
                cause: error,
            });
        }
    }),
});
