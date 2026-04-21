import { z } from 'zod';
import { TRPCError } from '@trpc/server';
import { router, protectedProcedure } from '../../trpc';
import { createOpenProviderClient, OpenProviderApiError } from '../../lib/openprovider-client';
import type { OpenProviderAuthRequest } from '../../types/openprovider';

// Validation schemas
const LoginRequestSchema = z.object({
  username: z.string().min(1, 'Username is required').optional(),
  password: z.string().min(1, 'Password is required').optional(),
  ip: z.string().optional(),
  useEnvCredentials: z.boolean().optional().default(false),
});

const EnvCredentialsSchema = z.object({
  OPENPROVIDER_USERNAME: z.string().min(1, 'OPENPROVIDER_USERNAME is required'),
  OPENPROVIDER_PASSWORD: z.string().min(1, 'OPENPROVIDER_PASSWORD is required'),
  OPENPROVIDER_IP: z.string().optional(),
});

export const openProviderAuthRouter = router({
  /**
   * Authenticate with OpenProvider API
   */
  login: protectedProcedure
    .input(LoginRequestSchema)
    .mutation(async ({ input }: { input: z.infer<typeof LoginRequestSchema> }) => {
      try {
        let authRequest: OpenProviderAuthRequest;

        // Check if we should use environment variables for credentials
        if (input.useEnvCredentials) {
          // Validate environment variables
          const envCredentials = EnvCredentialsSchema.parse({
            OPENPROVIDER_USERNAME: process.env.OPENPROVIDER_USERNAME,
            OPENPROVIDER_PASSWORD: process.env.OPENPROVIDER_PASSWORD,
            OPENPROVIDER_IP: process.env.OPENPROVIDER_IP,
          });

          authRequest = {
            username: envCredentials.OPENPROVIDER_USERNAME,
            password: envCredentials.OPENPROVIDER_PASSWORD,
            ip: envCredentials.OPENPROVIDER_IP,
          };
        } else {
          // Use credentials from input
          if (!input.username || !input.password) {
            throw new TRPCError({
              code: 'BAD_REQUEST',
              message: 'Username and password are required when not using environment credentials',
            });
          }

          authRequest = {
            username: input.username,
            password: input.password,
            ip: input.ip,
          };
        }

        // Create OpenProvider client
        const client = createOpenProviderClient();

        // Authenticate with OpenProvider
        const authResponse = await client.authenticate(authRequest);

        // Check if authentication was successful
        if (authResponse.code !== 0) {
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: authResponse.desc,
          });
        }

        // Return successful authentication response
        return {
          success: true,
          data: {
            token: authResponse.data.token,
            reseller_id: authResponse.data.reseller_id,
          },
        };
      } catch (error) {
        console.error('OpenProvider authentication error:', error);

        // Handle validation errors
        if (error instanceof z.ZodError) {
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: 'Invalid request data',
            cause: error.issues.map(err => ({
              field: err.path.join('.'),
              message: err.message,
            })),
          });
        }

        // Handle OpenProvider API errors
        if (error instanceof OpenProviderApiError) {
          throw new TRPCError({
            code: error.code >= 400 && error.code < 500 ? 'BAD_REQUEST' : 'INTERNAL_SERVER_ERROR',
            message: error.description,
          });
        }

        // Handle tRPC errors
        if (error instanceof TRPCError) {
          throw error;
        }

        // Handle unexpected errors
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Internal server error',
        });
      }
    }),

  /**
   * Validate authentication token
   */
  validateToken: protectedProcedure
    .input(z.object({
      token: z.string().min(1, 'Token is required'),
    }))
    .mutation(async ({ input }: { input: { token: string } }) => {
      try {
        const client = createOpenProviderClient();
        client.setToken(input.token);

        // Try to make a simple API call to validate the token
        // We'll use a minimal TLD request to test the token
        const response = await client.getTlds({ limit: 1 });

        return {
          success: response.code === 0,
          valid: response.code === 0,
          message: response.code === 0 ? 'Token is valid' : response.desc,
        };
      } catch (error) {
        if (error instanceof OpenProviderApiError) {
          return {
            success: false,
            valid: false,
            message: error.description,
          };
        }

        return {
          success: false,
          valid: false,
          message: 'Token validation failed',
        };
      }
    }),

  /**
   * Get authentication status
   */
  getStatus: protectedProcedure
    .input(z.object({
      token: z.string().optional(),
    }))
    .query(async ({ input }: { input: { token?: string } }) => {
      try {
        if (!input.token) {
          return {
            authenticated: false,
            message: 'No token provided',
          };
        }

        const client = createOpenProviderClient();
        client.setToken(input.token);

        // Check if client is authenticated
        const isAuthenticated = client.isAuthenticated();

        return {
          authenticated: isAuthenticated,
          message: isAuthenticated ? 'Authenticated' : 'Not authenticated',
        };
      } catch (error) {
        return {
          authenticated: false,
          message: 'Authentication check failed',
        };
      }
    }),
});
