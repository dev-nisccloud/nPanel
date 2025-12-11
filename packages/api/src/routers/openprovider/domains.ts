import { z } from 'zod';
import { TRPCError } from '@trpc/server';
import { router, publicProcedure } from '../../trpc';
import { createOpenProviderClient, OpenProviderApiError } from '../../lib/openprovider-client';
import { Redis } from "@upstash/redis";
import type { 
  OpenProviderDomainCheckRequest,
  OpenProviderDomainRegistrationRequest,
  OpenProviderDomainTransferRequest,
  OpenProviderDomainSearchRequest,
  OpenProviderDomainUpdateRequest,
  OpenProviderDomainRenewalRequest,
  OpenProviderDomainPricingRequest,
  OpenProviderAdditionalDataRequest,
  OpenProviderCustomerAdditionalDataRequest,
} from '../../types/openprovider';

// P1-6: Redis client for backend response caching
let redisInstance: Redis | null = null;

function getRedisClient(): Redis | null {
  try {
    if (!redisInstance) {
      const url = process.env.UPSTASH_REDIS_REST_URL;
      const token = process.env.UPSTASH_REDIS_REST_TOKEN;

      if (!url || !token) {
        // Redis not configured - caching disabled
        return null;
      }

      redisInstance = new Redis({ url, token });
    }
    return redisInstance;
  } catch (error) {
    console.error('Failed to initialize Redis client:', error);
    return null;
  }
}

// Validation schemas
const DomainCheckRequestSchema = z.object({
  domains: z.array(z.object({
    name: z.string().min(1, 'Domain name is required'),
    extension: z.string().min(1, 'Domain extension is required'),
  })).optional(),
  name: z.string().min(1, 'Domain name is required').optional(),
  extensions: z.array(z.string().min(1, 'Extension cannot be empty')).optional(),
  with_price: z.boolean().optional().default(true),
  with_whois: z.boolean().optional().default(true),
  additional_data: z.object({
    idn_script: z.string().optional(),
  }).optional(),
}).refine((data) => data.domains || data.name, {
  message: "Either 'domains' array or 'name' must be provided"
});

const DomainRegistrationRequestSchema = z.object({
  name: z.string().min(1, 'Domain name is required'),
  extension: z.string().min(1, 'Domain extension is required'),
  period: z.number().min(1).max(10).optional().default(1),
  owner_handle: z.string().min(1, 'Owner handle is required'),
  admin_handle: z.string().min(1, 'Admin handle is required'),
  tech_handle: z.string().min(1, 'Tech handle is required'),
  billing_handle: z.string().optional(),
  reseller_handle: z.string().optional(),
  name_servers: z.array(z.object({
    name: z.string().min(1, 'Nameserver name is required'),
    ip: z.string().optional(),
  })).optional(),
  ns_group: z.string().optional(),
  autorenew: z.enum(['on', 'off', 'default']).optional().default('default'),
  is_private_whois_enabled: z.boolean().optional().default(false),
  promo_code: z.string().optional(),
  dnssec_keys: z.array(z.object({
    flags: z.number(),
    protocol: z.number(),
    algorithm: z.number(),
    public_key: z.string(),
  })).optional(),
  additional_data: z.record(z.string(), z.any()).optional(),
});

const DomainTransferRequestSchema = z.object({
  domain: z.object({
    name: z.string().min(1, 'Domain name is required'),
    extension: z.string().min(1, 'Domain extension is required'),
  }),
  auth_code: z.string().min(1, 'Auth code is required'),
  owner_handle: z.string().min(1, 'Owner handle is required'),
  admin_handle: z.string().min(1, 'Admin handle is required'),
  tech_handle: z.string().min(1, 'Tech handle is required'),
  billing_handle: z.string().optional(),
  autorenew: z.enum(['on', 'off', 'default']).optional().default('default'),
  name_servers: z.array(z.object({
    name: z.string().min(1, 'Nameserver name is required'),
    ip: z.string().optional(),
  })).optional(),
  ns_group: z.string().optional(),
});

const DomainSearchRequestSchema = z.object({
  domain_name_pattern: z.string().optional(),
  limit: z.number().min(1).max(1000).optional().default(100),
  offset: z.number().min(0).optional().default(0),
  status: z.enum(['ACT', 'REQ', 'DEL', 'FAIL']).optional(),
});

const DomainUpdateRequestSchema = z.object({
  domainId: z.number().min(1, 'Domain ID is required'),
  owner_handle: z.string().optional(),
  admin_handle: z.string().optional(),
  tech_handle: z.string().optional(),
  billing_handle: z.string().optional(),
  ns_group: z.string().optional(),
  name_servers: z.array(z.object({
    name: z.string().min(1, 'Nameserver name is required'),
    ip: z.string().optional(),
  })).optional(),
  autorenew: z.enum(['on', 'off', 'default']).optional(),
  is_locked: z.boolean().optional(),
  is_private_whois_enabled: z.boolean().optional(),
  is_dnssec_enabled: z.boolean().optional(),
  dnssec_keys: z.array(z.object({
    flags: z.number(),
    protocol: z.number(),
    algorithm: z.number(),
    public_key: z.string(),
  })).optional(),
});

const DomainRenewalRequestSchema = z.object({
  domainId: z.number().min(1, 'Domain ID is required'),
  period: z.number().min(1).max(10).optional().default(1),
});

const DomainPricingRequestSchema = z.object({
  domain: z.object({
    name: z.string().min(1, 'Domain name is required'),
    extension: z.string().min(1, 'Domain extension is required'),
  }),
  operation: z.enum(['create', 'transfer', 'renew', 'restore']),
  period: z.number().min(1).max(10).optional().default(1),
  additional_data: z.object({
    idn_script: z.string().optional(),
  }).optional(),
});

const AdditionalDataRequestSchema = z.object({
  extension: z.string().min(1, 'Extension is required'),
});

const CustomerAdditionalDataRequestSchema = z.object({
  extension: z.string().min(1, 'Extension is required'),
  name: z.string().optional(),
});

export const openProviderDomainsRouter = router({
  /**
   * Check domain availability and pricing
   */
  checkAvailability: publicProcedure
    .input(DomainCheckRequestSchema)
    .query(async ({ input }) => {
      try {
        // P1-6: Check Redis cache before making API call
        const redis = getRedisClient();
        let cacheKey: string | null = null;
        
        if (redis && input.name) {
          // Create cache key from input parameters
          const extensionsKey = input.extensions?.sort().join(',') || 'all';
          cacheKey = `domain-check:${input.name}:${extensionsKey}:${input.with_price}:${input.with_whois}`;
          
          try {
            const cached = await redis.get(cacheKey);
            if (cached) {
              // Return cached response
              const cachedResponse = typeof cached === 'string' ? JSON.parse(cached) : cached;
              return {
                ...cachedResponse,
                meta: {
                  ...cachedResponse.meta,
                  cached: true,
                },
              };
            }
          } catch (cacheError) {
            console.error('Failed to read from cache:', cacheError);
            // Continue with API call if cache read fails
          }
        }

        const client = createOpenProviderClient();
        
        // Try to authenticate with environment credentials
        try {
          await client.authenticate({
            username: process.env.OPENPROVIDER_USERNAME!,
            password: process.env.OPENPROVIDER_PASSWORD!,
            ip: process.env.OPENPROVIDER_IP,
          });
        } catch (authError) {
          throw new TRPCError({
            code: 'UNAUTHORIZED',
            message: 'OpenProvider authentication failed. Please check your environment credentials.',
          });
        }

        let checkRequest: OpenProviderDomainCheckRequest;

        // If only name is provided, use specific extensions or all available TLDs
        if (input.name && !input.domains) {
          let extensionsToUse: string[] = [];
          
          if (input.extensions && input.extensions.length > 0) {
            // Use provided extensions - ensure they start with dot
            extensionsToUse = input.extensions.map(ext => ext.startsWith('.') ? ext : `.${ext}`);
          } else {
            // Fetch all available TLDs from OpenProvider
            try {
              const tldResponse = await client.getTlds({
                status: 'ACT',
                with_price: true,
                limit: 1000, // Get a large number of TLDs
              });
              
              if (tldResponse.code === 0 && tldResponse.data.results) {
                extensionsToUse = tldResponse.data.results.map((tld: any) => tld.name);
              } else {
                // Fallback to popular extensions if TLD fetch fails
                extensionsToUse = ['.com', '.net', '.org', '.info', '.biz', '.co', '.io', '.me', '.tv', '.cc', '.xyz', '.online', '.site', '.store', '.tech'];
              }
            } catch (tldError) {
              // Fallback to popular extensions if TLD fetch fails
              extensionsToUse = ['.com', '.net', '.org', '.info', '.biz', '.co', '.io', '.me', '.tv', '.cc', '.xyz', '.online', '.site', '.store', '.tech'];
            }
          }

            checkRequest = {
              domains: extensionsToUse.map(extension => ({
                name: input.name!,
                extension: extension.startsWith('.') ? extension.substring(1) : extension, // Remove dot if present
              })),
              with_price: input.with_price,
              with_whois: input.with_whois,
              additional_data: input.additional_data,
            };
        } else {
          // Use provided domains array - ensure extensions don't have dots
          checkRequest = {
            domains: input.domains!.map(domain => ({
              name: domain.name,
              extension: domain.extension.startsWith('.') ? domain.extension.substring(1) : domain.extension, // Remove dot if present
            })),
            with_price: input.with_price,
            with_whois: input.with_whois,
            additional_data: input.additional_data,
          };
        }

        // Call OpenProvider domain check API
        let checkResponse;
        
        // If we have many domains, batch them into smaller requests
        // FIX: Process batches sequentially with delays to avoid overwhelming API and prevent 504 timeouts
        if (checkRequest.domains && checkRequest.domains.length > 10) {
          const batchSize = 10;
          const batches: OpenProviderDomainCheckRequest[] = [];
          
          for (let i = 0; i < checkRequest.domains.length; i += batchSize) {
            const batch = checkRequest.domains.slice(i, i + batchSize);
            batches.push({
              domains: batch,
              with_price: checkRequest.with_price,
              with_whois: checkRequest.with_whois,
              additional_data: checkRequest.additional_data,
            });
          }
          
          // Process batches with controlled concurrency (2-3 at a time) to balance speed and API limits
          const batchResults: any[] = [];
          const CONCURRENCY_LIMIT = 2; // Process 2 batches at a time
          
          for (let i = 0; i < batches.length; i += CONCURRENCY_LIMIT) {
            const batchGroup = batches.slice(i, i + CONCURRENCY_LIMIT);
            
            // Process this group of batches in parallel
            const groupPromises = batchGroup.map(async (batch, groupIndex) => {
              try {
                const batchResponse = await client.checkDomains(batch);
                
                if (batchResponse.code !== 0) {
                  throw new TRPCError({
                    code: 'BAD_REQUEST',
                    message: batchResponse.desc,
                  });
                }
                
                return batchResponse.data.results || [];
              } catch (error) {
                // If a batch fails, log it but return empty array
                console.error(`Batch ${i + groupIndex + 1} failed:`, error);
                return [];
              }
            });
            
            // Wait for this group to complete
            const groupResults = await Promise.all(groupPromises);
            batchResults.push(...groupResults.flat());
            
            // Add small delay between groups (except for the last group) to avoid overwhelming API
            if (i + CONCURRENCY_LIMIT < batches.length) {
              await new Promise(resolve => setTimeout(resolve, 150)); // 150ms delay between groups
            }
          }
          
          // Combine all batch results
          checkResponse = {
            code: 0,
            desc: "OK",
            data: {
              results: batchResults
            }
          };
        } else {
          // Single request for small batches
          checkResponse = await client.checkDomains(checkRequest);
          
          if (checkResponse.code !== 0) {
            throw new TRPCError({
              code: 'BAD_REQUEST',
              message: checkResponse.desc,
            });
          }
        }

        const response = {
          success: true,
          data: checkResponse.data,
          meta: {
            checked_at: new Date().toISOString(),
            total_domains_checked: checkRequest.domains?.length || 0,
            request_type: input.name 
              ? (input.extensions && input.extensions.length > 0 
                  ? 'name_with_specific_extensions' 
                  : 'name_with_custom_extensions')
              : 'specific_domains',
            cached: false,
          },
        };

        // P1-6: Cache the response for 5 minutes (300 seconds)
        if (redis && cacheKey) {
          try {
            await redis.setex(cacheKey, 300, JSON.stringify(response));
          } catch (cacheError) {
            console.error('Failed to cache response:', cacheError);
            // Don't throw error - caching failure shouldn't break the API
          }
        }

        return response;
      } catch (error) {
        console.error('OpenProvider domain check error:', error);

        if (error instanceof z.ZodError) {
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: 'Invalid request data',
            cause: error.issues.map((err: any) => ({
              field: err.path.join('.'),
              message: err.message,
            })),
          });
        }

        if (error instanceof OpenProviderApiError) {
          throw new TRPCError({
            code: error.code >= 400 && error.code < 500 ? 'BAD_REQUEST' : 'INTERNAL_SERVER_ERROR',
            message: error.description,
          });
        }

        if (error instanceof TRPCError) {
          throw error;
        }

        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Internal server error',
        });
      }
    }),

  /**
   * Register a new domain
   */
  register: publicProcedure
    .input(DomainRegistrationRequestSchema)
    .mutation(async ({ input }) => {
      try {
        const client = createOpenProviderClient();
        
        // Try to authenticate with environment credentials
        try {
          await client.authenticate({
            username: process.env.OPENPROVIDER_USERNAME!,
            password: process.env.OPENPROVIDER_PASSWORD!,
            ip: process.env.OPENPROVIDER_IP,
          });
        } catch (authError) {
          throw new TRPCError({
            code: 'UNAUTHORIZED',
            message: 'OpenProvider authentication failed. Please check your environment credentials.',
          });
        }

        const registrationRequest: OpenProviderDomainRegistrationRequest = {
          name: input.name,
          extension: input.extension,
          period: input.period,
          owner_handle: input.owner_handle,
          admin_handle: input.admin_handle,
          tech_handle: input.tech_handle,
          billing_handle: input.billing_handle,
          reseller_handle: input.reseller_handle,
          name_servers: input.name_servers,
          ns_group: input.ns_group,
          autorenew: input.autorenew,
          is_private_whois_enabled: input.is_private_whois_enabled,
          promo_code: input.promo_code,
          dnssec_keys: input.dnssec_keys,
          additional_data: input.additional_data,
        };

        const response = await client.registerDomain(registrationRequest);

        if (response.code !== 0) {
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: response.desc,
          });
        }

        return {
          success: true,
          data: response.data,
          meta: {
            registered_at: new Date().toISOString(),
            domain: `${input.name}${input.extension}`,
          },
        };
      } catch (error) {
        console.error('OpenProvider domain registration error:', error);

        if (error instanceof z.ZodError) {
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: 'Invalid request data',
            cause: error.issues.map((err: any) => ({
              field: err.path.join('.'),
              message: err.message,
            })),
          });
        }

        if (error instanceof OpenProviderApiError) {
          throw new TRPCError({
            code: error.code >= 400 && error.code < 500 ? 'BAD_REQUEST' : 'INTERNAL_SERVER_ERROR',
            message: error.description,
          });
        }

        if (error instanceof TRPCError) {
          throw error;
        }

        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Internal server error',
        });
      }
    }),

  /**
   * Transfer a domain from another registrar
   */
  transfer: publicProcedure
    .input(DomainTransferRequestSchema)
    .mutation(async ({ input }) => {
      try {
        const client = createOpenProviderClient();
        
        // Try to authenticate with environment credentials
        try {
          await client.authenticate({
            username: process.env.OPENPROVIDER_USERNAME!,
            password: process.env.OPENPROVIDER_PASSWORD!,
            ip: process.env.OPENPROVIDER_IP,
          });
        } catch (authError) {
          throw new TRPCError({
            code: 'UNAUTHORIZED',
            message: 'OpenProvider authentication failed. Please check your environment credentials.',
          });
        }

        const transferRequest: OpenProviderDomainTransferRequest = {
          domain: input.domain,
          auth_code: input.auth_code,
          owner_handle: input.owner_handle,
          admin_handle: input.admin_handle,
          tech_handle: input.tech_handle,
          billing_handle: input.billing_handle,
          autorenew: input.autorenew,
          name_servers: input.name_servers,
          ns_group: input.ns_group,
        };

        const response = await client.transferDomain(transferRequest);

        if (response.code !== 0) {
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: response.desc,
          });
        }

        return {
          success: true,
          data: response.data,
          meta: {
            transfer_initiated_at: new Date().toISOString(),
            domain: `${input.domain.name}${input.domain.extension}`,
          },
        };
      } catch (error) {
        console.error('OpenProvider domain transfer error:', error);

        if (error instanceof z.ZodError) {
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: 'Invalid request data',
            cause: error.issues.map((err: any) => ({
              field: err.path.join('.'),
              message: err.message,
            })),
          });
        }

        if (error instanceof OpenProviderApiError) {
          throw new TRPCError({
            code: error.code >= 400 && error.code < 500 ? 'BAD_REQUEST' : 'INTERNAL_SERVER_ERROR',
            message: error.description,
          });
        }

        if (error instanceof TRPCError) {
          throw error;
        }

        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Internal server error',
        });
      }
    }),

  /**
   * Search domains in your account
   */
  search: publicProcedure
    .input(DomainSearchRequestSchema)
    .query(async ({ input }) => {
      try {
        const client = createOpenProviderClient();
        
        // Try to authenticate with environment credentials
        try {
          await client.authenticate({
            username: process.env.OPENPROVIDER_USERNAME!,
            password: process.env.OPENPROVIDER_PASSWORD!,
            ip: process.env.OPENPROVIDER_IP,
          });
        } catch (authError) {
          throw new TRPCError({
            code: 'UNAUTHORIZED',
            message: 'OpenProvider authentication failed. Please check your environment credentials.',
          });
        }

        const searchRequest: OpenProviderDomainSearchRequest = {
          domain_name_pattern: input.domain_name_pattern,
          limit: input.limit,
          offset: input.offset,
          status: input.status,
        };

        const response = await client.searchDomains(searchRequest);

        if (response.code !== 0) {
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: response.desc,
          });
        }

        return {
          success: true,
          data: response.data,
          meta: {
            searched_at: new Date().toISOString(),
            total: response.data.total,
            limit: input.limit,
            offset: input.offset,
          },
        };
      } catch (error) {
        console.error('OpenProvider domain search error:', error);

        if (error instanceof z.ZodError) {
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: 'Invalid request data',
            cause: error.issues.map((err: any) => ({
              field: err.path.join('.'),
              message: err.message,
            })),
          });
        }

        if (error instanceof OpenProviderApiError) {
          throw new TRPCError({
            code: error.code >= 400 && error.code < 500 ? 'BAD_REQUEST' : 'INTERNAL_SERVER_ERROR',
            message: error.description,
          });
        }

        if (error instanceof TRPCError) {
          throw error;
        }

        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Internal server error',
        });
      }
    }),

  /**
   * Update domain attributes
   */
  update: publicProcedure
    .input(DomainUpdateRequestSchema)
    .mutation(async ({ input }) => {
      try {
        const client = createOpenProviderClient();
        
        // Try to authenticate with environment credentials
        try {
          await client.authenticate({
            username: process.env.OPENPROVIDER_USERNAME!,
            password: process.env.OPENPROVIDER_PASSWORD!,
            ip: process.env.OPENPROVIDER_IP,
          });
        } catch (authError) {
          throw new TRPCError({
            code: 'UNAUTHORIZED',
            message: 'OpenProvider authentication failed. Please check your environment credentials.',
          });
        }

        const updateRequest: OpenProviderDomainUpdateRequest = {
          owner_handle: input.owner_handle,
          admin_handle: input.admin_handle,
          tech_handle: input.tech_handle,
          billing_handle: input.billing_handle,
          ns_group: input.ns_group,
          name_servers: input.name_servers,
          autorenew: input.autorenew,
          is_locked: input.is_locked,
          is_private_whois_enabled: input.is_private_whois_enabled,
          is_dnssec_enabled: input.is_dnssec_enabled,
          dnssec_keys: input.dnssec_keys,
        };

        const response = await client.updateDomain(input.domainId, updateRequest);

        if (response.code !== 0) {
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: response.desc,
          });
        }

        return {
          success: true,
          data: response.data,
          meta: {
            updated_at: new Date().toISOString(),
            domain_id: input.domainId,
          },
        };
      } catch (error) {
        console.error('OpenProvider domain update error:', error);

        if (error instanceof z.ZodError) {
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: 'Invalid request data',
            cause: error.issues.map((err: any) => ({
              field: err.path.join('.'),
              message: err.message,
            })),
          });
        }

        if (error instanceof OpenProviderApiError) {
          throw new TRPCError({
            code: error.code >= 400 && error.code < 500 ? 'BAD_REQUEST' : 'INTERNAL_SERVER_ERROR',
            message: error.description,
          });
        }

        if (error instanceof TRPCError) {
          throw error;
        }

        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Internal server error',
        });
      }
    }),

  /**
   * Renew a domain
   */
  renew: publicProcedure
    .input(DomainRenewalRequestSchema)
    .mutation(async ({ input }) => {
      try {
        const client = createOpenProviderClient();
        
        // Try to authenticate with environment credentials
        try {
          await client.authenticate({
            username: process.env.OPENPROVIDER_USERNAME!,
            password: process.env.OPENPROVIDER_PASSWORD!,
            ip: process.env.OPENPROVIDER_IP,
          });
        } catch (authError) {
          throw new TRPCError({
            code: 'UNAUTHORIZED',
            message: 'OpenProvider authentication failed. Please check your environment credentials.',
          });
        }

        const renewalRequest: OpenProviderDomainRenewalRequest = {
          period: input.period,
        };

        const response = await client.renewDomain(input.domainId, renewalRequest);

        if (response.code !== 0) {
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: response.desc,
          });
        }

        return {
          success: true,
          data: response.data,
          meta: {
            renewed_at: new Date().toISOString(),
            domain_id: input.domainId,
            renewal_period: input.period,
          },
        };
      } catch (error) {
        console.error('OpenProvider domain renewal error:', error);

        if (error instanceof z.ZodError) {
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: 'Invalid request data',
            cause: error.issues.map((err: any) => ({
              field: err.path.join('.'),
              message: err.message,
            })),
          });
        }

        if (error instanceof OpenProviderApiError) {
          throw new TRPCError({
            code: error.code >= 400 && error.code < 500 ? 'BAD_REQUEST' : 'INTERNAL_SERVER_ERROR',
            message: error.description,
          });
        }

        if (error instanceof TRPCError) {
          throw error;
        }

        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Internal server error',
        });
      }
    }),

  /**
   * Get domain auth code
   */
  getAuthCode: publicProcedure
    .input(z.object({
      domainId: z.number().min(1, 'Domain ID is required'),
    }))
    .query(async ({ input }) => {
      try {
        const client = createOpenProviderClient();
        
        // Try to authenticate with environment credentials
        try {
          await client.authenticate({
            username: process.env.OPENPROVIDER_USERNAME!,
            password: process.env.OPENPROVIDER_PASSWORD!,
            ip: process.env.OPENPROVIDER_IP,
          });
        } catch (authError) {
          throw new TRPCError({
            code: 'UNAUTHORIZED',
            message: 'OpenProvider authentication failed. Please check your environment credentials.',
          });
        }

        const response = await client.getDomainAuthCode(input.domainId);

        if (response.code !== 0) {
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: response.desc,
          });
        }

        return {
          success: true,
          data: response.data,
          meta: {
            retrieved_at: new Date().toISOString(),
            domain_id: input.domainId,
          },
        };
      } catch (error) {
        console.error('OpenProvider domain auth code retrieval error:', error);

        if (error instanceof OpenProviderApiError) {
          throw new TRPCError({
            code: error.code >= 400 && error.code < 500 ? 'BAD_REQUEST' : 'INTERNAL_SERVER_ERROR',
            message: error.description,
          });
        }

        if (error instanceof TRPCError) {
          throw error;
        }

        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Internal server error',
        });
      }
    }),

  /**
   * Reset domain auth code
   */
  resetAuthCode: publicProcedure
    .input(z.object({
      domainId: z.number().min(1, 'Domain ID is required'),
      auth_code_type: z.enum(['external', 'internal']).optional(),
    }))
    .mutation(async ({ input }) => {
      try {
        const client = createOpenProviderClient();
        
        // Try to authenticate with environment credentials
        try {
          await client.authenticate({
            username: process.env.OPENPROVIDER_USERNAME!,
            password: process.env.OPENPROVIDER_PASSWORD!,
            ip: process.env.OPENPROVIDER_IP,
          });
        } catch (authError) {
          throw new TRPCError({
            code: 'UNAUTHORIZED',
            message: 'OpenProvider authentication failed. Please check your environment credentials.',
          });
        }

        const response = await client.resetDomainAuthCode(input.domainId, {
          auth_code_type: input.auth_code_type,
        });

        if (response.code !== 0) {
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: response.desc,
          });
        }

        return {
          success: true,
          data: response.data,
          meta: {
            reset_at: new Date().toISOString(),
            domain_id: input.domainId,
          },
        };
      } catch (error) {
        console.error('OpenProvider domain auth code reset error:', error);

        if (error instanceof OpenProviderApiError) {
          throw new TRPCError({
            code: error.code >= 400 && error.code < 500 ? 'BAD_REQUEST' : 'INTERNAL_SERVER_ERROR',
            message: error.description,
          });
        }

        if (error instanceof TRPCError) {
          throw error;
        }

        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Internal server error',
        });
      }
    }),

  /**
   * Delete a domain
   */
  delete: publicProcedure
    .input(z.object({
      domainId: z.number().min(1, 'Domain ID is required'),
      domainName: z.string().min(1, 'Domain name is required'),
      domainExtension: z.string().min(1, 'Domain extension is required'),
    }))
    .mutation(async ({ input }) => {
      try {
        const client = createOpenProviderClient();
        
        // Try to authenticate with environment credentials
        try {
          await client.authenticate({
            username: process.env.OPENPROVIDER_USERNAME!,
            password: process.env.OPENPROVIDER_PASSWORD!,
            ip: process.env.OPENPROVIDER_IP,
          });
        } catch (authError) {
          throw new TRPCError({
            code: 'UNAUTHORIZED',
            message: 'OpenProvider authentication failed. Please check your environment credentials.',
          });
        }

        const response = await client.deleteDomain(input.domainId, {
          domain: {
            name: input.domainName,
            extension: input.domainExtension,
          },
        });

        if (response.code !== 0) {
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: response.desc,
          });
        }

        return {
          success: true,
          data: response,
          meta: {
            deleted_at: new Date().toISOString(),
            domain_id: input.domainId,
            domain: `${input.domainName}${input.domainExtension}`,
          },
        };
      } catch (error) {
        console.error('OpenProvider domain deletion error:', error);

        if (error instanceof OpenProviderApiError) {
          throw new TRPCError({
            code: error.code >= 400 && error.code < 500 ? 'BAD_REQUEST' : 'INTERNAL_SERVER_ERROR',
            message: error.description,
          });
        }

        if (error instanceof TRPCError) {
          throw error;
        }

        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Internal server error',
        });
      }
    }),

  /**
   * Restore a domain
   */
  restore: publicProcedure
    .input(z.object({
      domainId: z.number().min(1, 'Domain ID is required'),
    }))
    .mutation(async ({ input }) => {
      try {
        const client = createOpenProviderClient();
        
        // Try to authenticate with environment credentials
        try {
          await client.authenticate({
            username: process.env.OPENPROVIDER_USERNAME!,
            password: process.env.OPENPROVIDER_PASSWORD!,
            ip: process.env.OPENPROVIDER_IP,
          });
        } catch (authError) {
          throw new TRPCError({
            code: 'UNAUTHORIZED',
            message: 'OpenProvider authentication failed. Please check your environment credentials.',
          });
        }

        const response = await client.restoreDomain(input.domainId);

        if (response.code !== 0) {
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: response.desc,
          });
        }

        return {
          success: true,
          data: response,
          meta: {
            restored_at: new Date().toISOString(),
            domain_id: input.domainId,
          },
        };
      } catch (error) {
        console.error('OpenProvider domain restoration error:', error);

        if (error instanceof OpenProviderApiError) {
          throw new TRPCError({
            code: error.code >= 400 && error.code < 500 ? 'BAD_REQUEST' : 'INTERNAL_SERVER_ERROR',
            message: error.description,
          });
        }

        if (error instanceof TRPCError) {
          throw error;
        }

        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Internal server error',
        });
      }
    }),

  /**
   * Get domain pricing
   */
  getPricing: publicProcedure
    .input(DomainPricingRequestSchema)
    .query(async ({ input }) => {
      try {
        const client = createOpenProviderClient();
        
        // Try to authenticate with environment credentials
        try {
          await client.authenticate({
            username: process.env.OPENPROVIDER_USERNAME!,
            password: process.env.OPENPROVIDER_PASSWORD!,
            ip: process.env.OPENPROVIDER_IP,
          });
        } catch (authError) {
          throw new TRPCError({
            code: 'UNAUTHORIZED',
            message: 'OpenProvider authentication failed. Please check your environment credentials.',
          });
        }

        const pricingRequest: OpenProviderDomainPricingRequest = {
          domain: input.domain,
          operation: input.operation,
          period: input.period,
          additional_data: input.additional_data,
        };

        const response = await client.getDomainPricing(pricingRequest);

        if (response.code !== 0) {
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: response.desc,
          });
        }

        return {
          success: true,
          data: response.data,
          meta: {
            priced_at: new Date().toISOString(),
            domain: `${input.domain.name}${input.domain.extension}`,
            operation: input.operation,
            period: input.period,
          },
        };
      } catch (error) {
        console.error('OpenProvider domain pricing error:', error);

        if (error instanceof z.ZodError) {
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: 'Invalid request data',
            cause: error.issues.map((err: any) => ({
              field: err.path.join('.'),
              message: err.message,
            })),
          });
        }

        if (error instanceof OpenProviderApiError) {
          throw new TRPCError({
            code: error.code >= 400 && error.code < 500 ? 'BAD_REQUEST' : 'INTERNAL_SERVER_ERROR',
            message: error.description,
          });
        }

        if (error instanceof TRPCError) {
          throw error;
        }

        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Internal server error',
        });
      }
    }),

  /**
   * Get additional data requirements for a TLD
   */
  getAdditionalData: publicProcedure
    .input(AdditionalDataRequestSchema)
    .query(async ({ input }) => {
      try {
        const client = createOpenProviderClient();
        
        // Try to authenticate with environment credentials
        try {
          await client.authenticate({
            username: process.env.OPENPROVIDER_USERNAME!,
            password: process.env.OPENPROVIDER_PASSWORD!,
            ip: process.env.OPENPROVIDER_IP,
          });
        } catch (authError) {
          throw new TRPCError({
            code: 'UNAUTHORIZED',
            message: 'OpenProvider authentication failed. Please check your environment credentials.',
          });
        }

        const request: OpenProviderAdditionalDataRequest = {
          domain: {
            extension: input.extension,
          },
        };

        const response = await client.getAdditionalData(request);

        if (response.code !== 0) {
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: response.desc,
          });
        }

        return {
          success: true,
          data: response.data,
          meta: {
            retrieved_at: new Date().toISOString(),
            extension: input.extension,
          },
        };
      } catch (error) {
        console.error('OpenProvider additional data retrieval error:', error);

        if (error instanceof z.ZodError) {
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: 'Invalid request data',
            cause: error.issues.map((err: any) => ({
              field: err.path.join('.'),
              message: err.message,
            })),
          });
        }

        if (error instanceof OpenProviderApiError) {
          throw new TRPCError({
            code: error.code >= 400 && error.code < 500 ? 'BAD_REQUEST' : 'INTERNAL_SERVER_ERROR',
            message: error.description,
          });
        }

        if (error instanceof TRPCError) {
          throw error;
        }

        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Internal server error',
        });
      }
    }),

  /**
   * Get additional customer data requirements for a TLD
   */
  getCustomerAdditionalData: publicProcedure
    .input(CustomerAdditionalDataRequestSchema)
    .query(async ({ input }) => {
      try {
        const client = createOpenProviderClient();
        
        // Try to authenticate with environment credentials
        try {
          await client.authenticate({
            username: process.env.OPENPROVIDER_USERNAME!,
            password: process.env.OPENPROVIDER_PASSWORD!,
            ip: process.env.OPENPROVIDER_IP,
          });
        } catch (authError) {
          throw new TRPCError({
            code: 'UNAUTHORIZED',
            message: 'OpenProvider authentication failed. Please check your environment credentials.',
          });
        }

        const request: OpenProviderCustomerAdditionalDataRequest = {
          domain: {
            extension: input.extension,
            name: input.name,
          },
        };

        const response = await client.getCustomerAdditionalData(request);

        if (response.code !== 0) {
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: response.desc,
          });
        }

        return {
          success: true,
          data: response.data,
          meta: {
            retrieved_at: new Date().toISOString(),
            extension: input.extension,
            domain_name: input.name,
          },
        };
      } catch (error) {
        console.error('OpenProvider customer additional data retrieval error:', error);

        if (error instanceof z.ZodError) {
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: 'Invalid request data',
            cause: error.issues.map((err: any) => ({
              field: err.path.join('.'),
              message: err.message,
            })),
          });
        }

        if (error instanceof OpenProviderApiError) {
          throw new TRPCError({
            code: error.code >= 400 && error.code < 500 ? 'BAD_REQUEST' : 'INTERNAL_SERVER_ERROR',
            message: error.description,
          });
        }

        if (error instanceof TRPCError) {
          throw error;
        }

        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Internal server error',
        });
      }
    }),
});
