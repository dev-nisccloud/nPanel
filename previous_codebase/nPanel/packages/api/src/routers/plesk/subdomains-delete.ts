import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { router, publicProcedure } from "../../trpc";
import { sendPleskXmlRequest } from "../../lib/plesk/xml-client";

export const subdomainsDeleteRouter = router({
  delete: publicProcedure
    .input(z.object({
      id: z.number().optional(),
      name: z.string().optional(),
    }).refine(
      (data) => data.id !== undefined || data.name !== undefined,
      {
        message: "Either id or name must be provided",
      }
    ))
    .mutation(async ({ input }) => {
      try {
        if (!process.env.PLESK_XML_ENDPOINT) {
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "PLESK_XML_ENDPOINT not set",
          });
        }

        // Build the XML request for subdomain deletion
        let filterXml = "";
        
        if (input.id !== undefined) {
          filterXml = `<id>${input.id}</id>`;
        } else if (input.name !== undefined) {
          filterXml = `<name>${input.name}</name>`;
        }

        const xmlRequest = `
          <packet>
            <subdomain>
              <del>
                <filter>
                  ${filterXml}
                </filter>
              </del>
            </subdomain>
          </packet>
        `;

        // Make the API call to Plesk
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
        
        if (!xml || xml.trim() === "") {
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Empty response from Plesk server",
          });
        }

        // Parse the response
        const parser = new (await import("fast-xml-parser")).XMLParser({
          ignoreAttributes: false,
          attributeNamePrefix: "@_",
        });

        const parsedResponse = parser.parse(xml);

        // Check if the operation was successful
        const result = parsedResponse?.packet?.subdomain?.del?.result;
        
        if (!result) {
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Invalid response from Plesk API",
          });
        }

        if (result.status === "error") {
          const errorCode = result.errcode || "Unknown error";
          const errorMessage = result.errtext || "Failed to delete subdomain";
          
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: `Plesk API Error ${errorCode}: ${errorMessage}`,
          });
        }

        if (result.status !== "ok") {
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Unexpected response status from Plesk API",
          });
        }

        return {
          success: true,
          deletedId: result.id,
          filterId: result["filter-id"],
          message: "Subdomain deleted successfully",
        };

      } catch (error) {
        console.error("Error deleting subdomain:", error);

        if (error instanceof TRPCError) {
          throw error;
        }

        // Handle network or other errors
        if (error instanceof Error) {
          if (error.message.includes("ECONNREFUSED") || error.message.includes("ENOTFOUND")) {
            throw new TRPCError({
              code: "SERVICE_UNAVAILABLE",
              message: "Unable to connect to Plesk server. Please check your server configuration.",
            });
          }
        }

        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "An unexpected error occurred while deleting the subdomain",
        });
      }
    }),
});