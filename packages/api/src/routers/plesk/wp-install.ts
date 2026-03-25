import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { request, Agent } from 'undici';
import { publicProcedure, router } from '../../trpc';

const PLESK_REST_ENDPOINT_V2 =
  process.env.PLESK_REST_ENDPOINT_V2 ??
  (process.env.PLESK_REST_ENDPOINT
    ? process.env.PLESK_REST_ENDPOINT.replace('/api/modules/wp-toolkit', '') + '/api/v2'
    : undefined) ??
  'https://your-plesk-host:8443/api/v2';
const PLESK_SECRET_KEY = process.env.PLESK_SECRET_KEY;

// Connection pool for v2 API
const pleskV2Agent = new Agent({
  connections: 5,
  pipelining: 1,
  keepAliveTimeout: 60000,
  keepAliveMaxTimeout: 60000,
});

/**
 * Send request to Plesk REST API v2 (for CLI extension calls)
 */
async function sendPleskV2Request(
  endpoint: string,
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' = 'GET',
  body?: any
): Promise<{ data: any | null; isAuthError: boolean; isHostUnreachable: boolean; statusCode: number }> {
  if (!PLESK_REST_ENDPOINT_V2) {
    throw new Error('PLESK_REST_ENDPOINT_V2 or PLESK_REST_ENDPOINT environment variable is required');
  }

  if (!PLESK_SECRET_KEY) {
    throw new Error('PLESK_SECRET_KEY environment variable is required');
  }

  const fullUrl = `${PLESK_REST_ENDPOINT_V2}${endpoint}`;

  try {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'User-Agent': 'npanel-Server/1.0',
      'X-API-Key': PLESK_SECRET_KEY,
    };

    const requestOptions: any = {
      method,
      headers,
      dispatcher: pleskV2Agent,
      signal: AbortSignal.timeout(120_000), // 2 minutes timeout for installation
    };

    if (body && (method === 'POST' || method === 'PUT' || method === 'DELETE')) {
      requestOptions.body = JSON.stringify(body);
    }

    const response = await request(fullUrl, requestOptions);
    const responseText = await response.body.text();
    let responseData = null;

    if (responseText.trim() !== '') {
      try {
        responseData = JSON.parse(responseText);
      } catch {
        responseData = responseText;
      }
    }

    return {
      data: responseData,
      isAuthError: response.statusCode === 401 || response.statusCode === 403,
      isHostUnreachable: false,
      statusCode: response.statusCode,
    };
  } catch (error) {
    const err = error as Error;
    const isHostUnreachable =
      err.message.toLowerCase().includes('econnrefused') ||
      err.message.toLowerCase().includes('econnaborted') ||
      err.message.toLowerCase().includes('enotfound') ||
      err.message.toLowerCase().includes('enetunreach') ||
      err.message.toLowerCase().includes('timeout') ||
      err.name.toLowerCase() === 'timeouterror';

    return {
      data: null,
      isAuthError: false,
      isHostUnreachable,
      statusCode: 0,
    };
  }
}

export const wpInstallRouter = router({
  // Install WordPress via CLI endpoint
  install: publicProcedure
    .input(z.object({
      domainName: z.string().min(1, "Domain name is required"),
      username: z.string().min(1, "Username is required"),
      adminEmail: z.string().email("Valid email is required"),
      adminPassword: z.string().min(12, "Password must be at least 12 characters"),
      wpVersion: z.string().optional().default("latest"),
      siteTitle: z.string().optional(),
      language: z.string().optional().default("en_US"),
      protocol: z.enum(["http", "https"]).optional().default("https"),
      databaseName: z.string().optional(), // Optional: if provided, use existing database
      dbUser: z.string().optional(), // Optional: if provided, use existing database user
    }))
    .mutation(async ({ input }) => {
      try {
        // Check if required environment variables are set
        if (!PLESK_REST_ENDPOINT_V2 && !process.env.PLESK_REST_ENDPOINT) {
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Server configuration error: PLESK_REST_ENDPOINT environment variable is not set",
          });
        }

        if (!PLESK_SECRET_KEY) {
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Server configuration error: PLESK_SECRET_KEY environment variable is not set",
          });
        }

        // Build params array for wp-toolkit --install command
        const params: string[] = [
          "--call",
          "wp-toolkit",
          "--install",
          "-domain-name",
          input.domainName,
        ];

        // Add optional parameters
        if (input.username) {
          params.push("-username", input.username);
        }

        if (input.adminEmail) {
          params.push("-admin-email", input.adminEmail);
        }

        if (input.wpVersion && input.wpVersion !== "latest") {
          params.push("-version", input.wpVersion);
        }

        if (input.siteTitle) {
          params.push("-site-title", input.siteTitle);
        }

        if (input.language) {
          params.push("-language", input.language);
        }

        if (input.protocol) {
          params.push("-protocol", input.protocol);
        }

        // Database options (only if provided)
        if (input.databaseName) {
          params.push("-db-name", input.databaseName);
        }

        if (input.dbUser) {
          params.push("-db-user", input.dbUser);
        }

        // Prepare request body
        const requestBody: {
          params: string[];
          env?: Record<string, string>;
        } = {
          params,
        };

        // Add password via env for security
        requestBody.env = {
          ADMIN_PASSWORD: input.adminPassword,
        };

        // If database is specified, we might need DB password (but WP Toolkit usually handles this)
        // For now, we'll let WP Toolkit handle database credentials if using existing DB

        console.log(`Installing WordPress on ${input.domainName} via CLI endpoint`);
        console.log(`Params:`, params);

        // Call the CLI extension endpoint
        const { data, isAuthError, isHostUnreachable, statusCode } = await sendPleskV2Request(
          '/cli/extension/call',
          'POST',
          requestBody
        );

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

        if (statusCode < 200 || statusCode >= 300) {
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: `WordPress installation failed: ${statusCode}. ${data ? JSON.stringify(data) : 'Unknown error'}`,
          });
        }

        // The response might contain installation details
        // We may need to poll /v1/installations to get the installation ID
        return {
          success: true,
          data,
          message: "WordPress installation started successfully",
        };
      } catch (error) {
        console.error('WordPress Installation API Error:', error);
        if (error instanceof TRPCError) {
          throw error;
        }
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: `Failed to install WordPress: ${error instanceof Error ? error.message : "Unknown error"}`,
          cause: error,
        });
      }
    }),
});
