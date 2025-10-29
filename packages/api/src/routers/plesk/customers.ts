import { XMLParser } from 'fast-xml-parser';
import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { sendPleskXmlRequest } from '../../lib/plesk/xml-client';
import { publicProcedure, router } from '../../trpc';

/**
 * Build XML request to fetch all customers
 */
function buildCustomersGetXml(): string {
  return `<?xml version="1.0" encoding="UTF-8"?>
<packet>
  <customer>
    <get>
      <filter/>
      <dataset>
        <gen_info/>
        <stat/>
      </dataset>
    </get>
  </customer>
</packet>`;
}

/**
 * Build XML request to fetch a specific customer by ID
 */
function buildCustomerGetByIdXml(customerId: number): string {
  return `<?xml version="1.0" encoding="UTF-8"?>
<packet>
  <customer>
    <get>
      <filter>
        <id>${customerId}</id>
      </filter>
      <dataset>
        <gen_info/>
        <stat/>
      </dataset>
    </get>
  </customer>
</packet>`;
}

export const customersRouter = router({
  // Get all customers
  getAll: publicProcedure
    .input(z.object({}).optional().default({}))
    .query(async ({ input = {} }) => {

  try {
    // Check if required environment variables are set
    if (!process.env.PLESK_XML_ENDPOINT) {
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Server configuration error: PLESK_XML_ENDPOINT environment variable is not set",
          });
        }

        const xmlRequest = buildCustomersGetXml();
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
    let parsed: unknown;

    try {
      parsed = parser.parse(xml);
    } catch (parseError) {
          console.error('Failed to parse XML response:', parseError);
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
      } catch (error) {
        console.error('Plesk Customers API Error:', error);
        if (error instanceof TRPCError) {
          throw error;
        }
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to fetch customers",
          cause: error,
        });
      }
    }),

  // Get customer by ID
  getById: publicProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ input }: { input: { id: number } }) => {
      const { id: customerId } = input;
      
      try {
        // Check if required environment variables are set
        if (!process.env.PLESK_XML_ENDPOINT) {
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Server configuration error: PLESK_XML_ENDPOINT environment variable is not set",
          });
        }

        const xmlRequest = buildCustomerGetByIdXml(customerId);
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
        let parsed: unknown;

        try {
          parsed = parser.parse(xml);
        } catch (parseError) {
          console.error('Failed to parse XML response:', parseError);
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
      } catch (error) {
        console.error('Plesk Customer API Error:', error);
        if (error instanceof TRPCError) {
          throw error;
        }
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to fetch customer",
          cause: error,
        });
      }
    }),
});

