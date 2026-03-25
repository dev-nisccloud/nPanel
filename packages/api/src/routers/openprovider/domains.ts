import { z } from 'zod';
import { TRPCError } from '@trpc/server';
import { router, publicProcedure } from '../../trpc';
import { createOpenProviderClient, OpenProviderApiError } from '../../lib/openprovider-client';
import { getRedisClient } from '../../lib/redis';
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

/** Whether an OpenProvider error indicates expired/invalid auth (retry with re-auth). */
function isOpenProviderAuthError(error: unknown): error is OpenProviderApiError {
  return error instanceof OpenProviderApiError && (error.code === 401 || error.code === 403);
}

/** Whether an OpenProvider error is transient (timeout or server error); can retry once. */
function isOpenProviderTransientError(error: unknown): error is OpenProviderApiError {
  if (!(error instanceof OpenProviderApiError)) return false;
  return error.code === 504 || (error.code >= 500 && error.code < 600);
}

/** Redis key and TTL for OpenProvider auth token (long-lived, like exchange rates). Token lasts 48h; we store 47h. */
const OPENPROVIDER_TOKEN_KEY = 'openprovider:auth-token';
const OPENPROVIDER_TOKEN_TTL_SEC = 47 * 60 * 60; // 47 hours
const OPENPROVIDER_TRANSIENT_RETRY_DELAY_MS = 400;
const DOMAIN_CHECK_CACHE_TTL_SEC = 600; // 10 min for domain availability

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
}).refine((data) => {
  // When checking by name (no domains array), extensions are required (UI always passes them).
  if (data.name && !data.domains) return (data.extensions?.length ?? 0) > 0;
  return true;
}, {
  message: "extensions are required when checking by name (e.g. ['.com', '.net']). Pass the TLDs to check.",
  path: ['extensions'],
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

const DomainListRequestSchema = z.object({
  domain_name_pattern: z.string().optional(),
  limit: z.number().min(1).max(1000).optional().default(100),
  offset: z.number().min(0).optional().default(0),
  status: z.enum(['ACT', 'REQ', 'DEL', 'FAIL']).optional(),
  with_customer_info: z.boolean().optional().default(false),
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

        // Use token from Redis when available to skip auth round-trip (resilient + performant across cold starts)
        if (!client.isAuthenticated()) {
          let hasToken = false;
          if (redis) {
            try {
              const cachedToken = await redis.get(OPENPROVIDER_TOKEN_KEY);
              if (cachedToken) {
                const parsed = typeof cachedToken === 'string' ? JSON.parse(cachedToken) as { token?: string; expiresAt?: number } : cachedToken as { token?: string; expiresAt?: number };
                if (parsed?.token && typeof parsed.expiresAt === 'number' && parsed.expiresAt > Date.now()) {
                  client.setToken(parsed.token);
                  hasToken = true;
                }
              }
            } catch {
              // Ignore Redis parse/read errors; fall back to auth
            }
          }
          if (!hasToken) {
            try {
              const authResponse = await client.authenticate({
                username: process.env.OPENPROVIDER_USERNAME!,
                password: process.env.OPENPROVIDER_PASSWORD!,
                ip: process.env.OPENPROVIDER_IP,
              });
              if (redis && authResponse?.data?.token) {
                const expiresAt = Date.now() + OPENPROVIDER_TOKEN_TTL_SEC * 1000;
                await redis.setex(OPENPROVIDER_TOKEN_KEY, OPENPROVIDER_TOKEN_TTL_SEC, JSON.stringify({ token: authResponse.data.token, expiresAt })).catch(() => {});
              }
            } catch (authError) {
              throw new TRPCError({
                code: 'INTERNAL_SERVER_ERROR',
                message: 'OpenProvider service unavailable. Please check your environment credentials.',
              });
            }
          }
        }

        let checkRequest: OpenProviderDomainCheckRequest;

        if (input.name && !input.domains) {
          // Extensions are required when checking by name (validated by schema)
          const extensionsToUse = (input.extensions ?? []).map(ext => ext.startsWith('.') ? ext : `.${ext}`);
          checkRequest = {
            domains: extensionsToUse.map(extension => ({
              name: input.name!,
              extension: extension.startsWith('.') ? extension.substring(1) : extension,
            })),
            with_price: input.with_price,
            with_whois: input.with_whois,
            additional_data: input.additional_data,
          };
        } else {
          checkRequest = {
            domains: input.domains!.map(domain => ({
              name: domain.name,
              extension: domain.extension.startsWith('.') ? domain.extension.substring(1) : domain.extension,
            })),
            with_price: input.with_price,
            with_whois: input.with_whois,
            additional_data: input.additional_data,
          };
        }

        const doCheck = async (): Promise<{ code: number; desc: string; data: { results: any[] } }> => {
          if (checkRequest.domains && checkRequest.domains.length > 15) {
            const batchSize = 15;
            const batches: OpenProviderDomainCheckRequest[] = [];
            
            for (let i = 0; i < checkRequest.domains.length; i += batchSize) {
              batches.push({
                domains: checkRequest.domains.slice(i, i + batchSize),
                with_price: checkRequest.with_price,
                with_whois: checkRequest.with_whois,
                additional_data: checkRequest.additional_data,
              });
            }

            const batchResults: any[] = [];
            const CONCURRENCY_LIMIT = 5;
            let currentBatchIndex = 0;

            // Worker function to process batches from the queue
            const worker = async () => {
              while (currentBatchIndex < batches.length) {
                const batchIndex = currentBatchIndex++;
                const batch = batches[batchIndex];
                if (!batch) continue;
                try {
                  const batchResponse = await client.checkDomains(batch);
                  if (batchResponse.code !== 0) {
                    throw new TRPCError({ code: 'BAD_REQUEST', message: batchResponse.desc });
                  }
                  batchResults.push(...(batchResponse.data.results || []));
                } catch (error) {
                  console.error(`Batch ${batchIndex + 1} failed:`, error);
                  // We continue processing even if one batch fails, to return partial results
                }
              }
            };

            // Start up to CONCURRENCY_LIMIT workers
            const workers = Array.from(
              { length: Math.min(CONCURRENCY_LIMIT, batches.length) },
              () => worker()
            );

            await Promise.all(workers);
            return { code: 0, desc: "OK", data: { results: batchResults } };
          }
          const checkResponse = await client.checkDomains(checkRequest);
          if (checkResponse.code !== 0) {
            throw new TRPCError({ code: 'BAD_REQUEST', message: checkResponse.desc });
          }
          return checkResponse;
        };

        let checkResponse: { code: number; desc: string; data: { results: any[] } };
        try {
          checkResponse = await doCheck();
        } catch (firstError) {
          if (isOpenProviderAuthError(firstError)) {
            if (redis) await redis.del(OPENPROVIDER_TOKEN_KEY).catch(() => {});
            const authResponse = await client.authenticate({
              username: process.env.OPENPROVIDER_USERNAME!,
              password: process.env.OPENPROVIDER_PASSWORD!,
              ip: process.env.OPENPROVIDER_IP,
            });
            if (redis && authResponse?.data?.token) {
              const expiresAt = Date.now() + OPENPROVIDER_TOKEN_TTL_SEC * 1000;
              await redis.setex(OPENPROVIDER_TOKEN_KEY, OPENPROVIDER_TOKEN_TTL_SEC, JSON.stringify({ token: authResponse.data.token, expiresAt })).catch(() => {});
            }
            checkResponse = await doCheck();
          } else if (isOpenProviderTransientError(firstError)) {
            await new Promise(resolve => setTimeout(resolve, OPENPROVIDER_TRANSIENT_RETRY_DELAY_MS));
            checkResponse = await doCheck();
          } else {
            throw firstError;
          }
        }

        const response = {
          success: true,
          data: checkResponse.data,
          meta: {
            checked_at: new Date().toISOString(),
            total_domains_checked: checkRequest.domains?.length || 0,
            request_type: input.name ? 'name_with_specific_extensions' : 'specific_domains',
            cached: false,
          },
        };

        // Cache the response (10 min) to reduce OpenProvider load and improve repeat-search latency
        if (redis && cacheKey) {
          try {
            await redis.setex(cacheKey, DOMAIN_CHECK_CACHE_TTL_SEC, JSON.stringify(response));
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
          const errMsg = authError instanceof Error ? authError.message : String(authError);
          console.error('[OpenProvider] Authentication failed:', errMsg, authError);
          throw new TRPCError({
            code: 'INTERNAL_SERVER_ERROR',
            message: `OpenProvider authentication failed: ${errMsg}`,
            cause: authError,
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
          const errMsg = authError instanceof Error ? authError.message : String(authError);
          console.error('[OpenProvider] Authentication failed:', errMsg, authError);
          throw new TRPCError({
            code: 'INTERNAL_SERVER_ERROR',
            message: `OpenProvider authentication failed: ${errMsg}`,
            cause: authError,
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
          const errMsg = authError instanceof Error ? authError.message : String(authError);
          console.error('[OpenProvider] Authentication failed:', errMsg, authError);
          throw new TRPCError({
            code: 'INTERNAL_SERVER_ERROR',
            message: `OpenProvider authentication failed: ${errMsg}`,
            cause: authError,
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
   * List all domains (Domains Portfolio)
   * This is a user-friendly endpoint for the domains portfolio page
   */
  list: publicProcedure
    .input(DomainListRequestSchema)
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
          const errMsg = authError instanceof Error ? authError.message : String(authError);
          console.error('[OpenProvider] Authentication failed:', errMsg, authError);
          throw new TRPCError({
            code: 'INTERNAL_SERVER_ERROR',
            message: `OpenProvider authentication failed: ${errMsg}`,
            cause: authError,
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

        // Map OpenProvider response to our domain portfolio format
        const mappedDomains = response.data.results.map((domain) => {
          // Handle domain field - it might be a string or an object
          let domainString: string;
          let extension: string;

          if (typeof domain.domain === 'string') {
            // Domain is a string like "example.com"
            domainString = domain.domain;
            const domainParts = domain.domain.split('.');
            extension = `.${domainParts.slice(1).join('.')}`;
          } else if (domain.domain && typeof domain.domain === 'object') {
            // Domain is an object with name and extension properties
            const domainObj = domain.domain as { name?: string; extension?: string };
            const domainName = domainObj.name || '';
            const ext = domainObj.extension || '';
            extension = ext.startsWith('.') ? ext : `.${ext}`;
            domainString = `${domainName}${extension}`;
          } else {
            // Fallback - log error and skip this domain
            console.error('Invalid domain format:', domain.domain);
            throw new TRPCError({
              code: 'INTERNAL_SERVER_ERROR',
              message: `Invalid domain format received from OpenProvider: ${JSON.stringify(domain.domain)}`,
            });
          }

          // Map status from OpenProvider to our format
          const statusMap: Record<string, 'ACTIVE' | 'EXPIRED' | 'PENDING' | 'SUSPENDED' | 'TRANSFERRING'> = {
            'ACT': 'ACTIVE',
            'REQ': 'PENDING',
            'DEL': 'EXPIRED',
            'FAIL': 'SUSPENDED',
          };

          // Check if domain is expired
          const expiryDate = new Date(domain.expiration_date);
          const isExpired = expiryDate < new Date();
          const mappedStatus = isExpired ? 'EXPIRED' : (statusMap[domain.status] || 'PENDING');

          // Extract owner information if available
          const owner = (domain as any).owner;
          const ownerName = owner?.full_name || owner?.company_name || domain.owner_handle || '';
          const ownerCompany = owner?.company_name || '';

          return {
            id: domain.id.toString(),
            domain: domainString,
            status: mappedStatus,
            registrationDate: domain.creation_date,
            expiryDate: domain.expiration_date,
            clientName: ownerName,
            clientEmail: '', // Will be populated if with_customer_info is true
            tld: extension,
            autoRenewal: domain.autorenew === 'on',
            nameservers: domain.name_servers.map((ns) => ns.name),
            // Additional OpenProvider fields
            ownerHandle: domain.owner_handle,
            adminHandle: domain.admin_handle,
            techHandle: domain.tech_handle,
            billingHandle: domain.billing_handle,
            isLocked: domain.is_locked,
            isPrivateWhois: domain.is_private_whois_enabled,
            isDnssecEnabled: domain.is_dnssec_enabled,
            authCode: domain.auth_code,
            renewalDate: domain.renewal_date,
            // Extended fields from OpenProvider
            resellerId: (domain as any).reseller_id,
            nsgroupId: (domain as any).nsgroup_id,
            nsGroup: (domain as any).ns_group,
            type: (domain as any).type,
            canRenew: (domain as any).can_renew,
            isLockable: (domain as any).is_lockable,
            isDeleted: (domain as any).is_deleted,
            isPremium: (domain as any).is_premium,
            isAbusive: (domain as any).is_abusive,
            isParked: (domain as any).is_parked,
            orderDate: (domain as any).order_date,
            activeDate: (domain as any).active_date,
            registryExpirationDate: (domain as any).registry_expiration_date,
            lastChanged: (domain as any).last_changed,
            ownerCompanyName: ownerCompany,
            ownerFullName: owner?.full_name || '',
            comments: (domain as any).comments || '',
            unit: (domain as any).unit,
            dnssec: (domain as any).dnssec,
            nameServersFull: domain.name_servers.map((ns) => ({
              name: ns.name,
              ip: ns.ip,
              ip6: (ns as any).ip6,
              seqNr: (ns as any).seq_nr,
            })),
          };
        });

        // If with_customer_info is true, fetch customer details for each unique handle
        if (input.with_customer_info) {
          // TODO: Implement customer info fetching
          // For now, we'll use the handle as the client name
          // This would require calling the customer search endpoint for each unique handle
        }

        return {
          success: true,
          data: mappedDomains,
          meta: {
            total: response.data.total,
            limit: input.limit,
            offset: input.offset,
            retrieved_at: new Date().toISOString(),
          },
        };
      } catch (error) {
        console.error('OpenProvider domain list error:', error);

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
          const errMsg = authError instanceof Error ? authError.message : String(authError);
          console.error('[OpenProvider] Authentication failed:', errMsg, authError);
          throw new TRPCError({
            code: 'INTERNAL_SERVER_ERROR',
            message: `OpenProvider authentication failed: ${errMsg}`,
            cause: authError,
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
          const supportUrl = 'https://support.openprovider.eu/hc/en-us/articles/7265441900946';
          const alreadyHasSupportLink =
            error.code === 399 &&
            (error.description.includes('support.openprovider.eu') ||
              error.description.includes('7265441900946'));
          const hint399 =
            error.code === 399
              ? alreadyHasSupportLink
                ? ' Nameserver/registry updates can fail due to propagation, format, or TLD restrictions.'
                : ` Nameserver/registry updates can fail due to propagation, format, or TLD restrictions. For more details see: ${supportUrl}`
              : '';
          throw new TRPCError({
            code: error.code >= 400 && error.code < 500 ? 'BAD_REQUEST' : 'INTERNAL_SERVER_ERROR',
            message: error.description + hint399,
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
          const errMsg = authError instanceof Error ? authError.message : String(authError);
          console.error('[OpenProvider] Authentication failed:', errMsg, authError);
          throw new TRPCError({
            code: 'INTERNAL_SERVER_ERROR',
            message: `OpenProvider authentication failed: ${errMsg}`,
            cause: authError,
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
          const errMsg = authError instanceof Error ? authError.message : String(authError);
          console.error('[OpenProvider] Authentication failed:', errMsg, authError);
          throw new TRPCError({
            code: 'INTERNAL_SERVER_ERROR',
            message: `OpenProvider authentication failed: ${errMsg}`,
            cause: authError,
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
          const errMsg = authError instanceof Error ? authError.message : String(authError);
          console.error('[OpenProvider] Authentication failed:', errMsg, authError);
          throw new TRPCError({
            code: 'INTERNAL_SERVER_ERROR',
            message: `OpenProvider authentication failed: ${errMsg}`,
            cause: authError,
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
          const errMsg = authError instanceof Error ? authError.message : String(authError);
          console.error('[OpenProvider] Authentication failed:', errMsg, authError);
          throw new TRPCError({
            code: 'INTERNAL_SERVER_ERROR',
            message: `OpenProvider authentication failed: ${errMsg}`,
            cause: authError,
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
          const errMsg = authError instanceof Error ? authError.message : String(authError);
          console.error('[OpenProvider] Authentication failed:', errMsg, authError);
          throw new TRPCError({
            code: 'INTERNAL_SERVER_ERROR',
            message: `OpenProvider authentication failed: ${errMsg}`,
            cause: authError,
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
          const errMsg = authError instanceof Error ? authError.message : String(authError);
          console.error('[OpenProvider] Authentication failed:', errMsg, authError);
          throw new TRPCError({
            code: 'INTERNAL_SERVER_ERROR',
            message: `OpenProvider authentication failed: ${errMsg}`,
            cause: authError,
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
          const errMsg = authError instanceof Error ? authError.message : String(authError);
          console.error('[OpenProvider] Authentication failed:', errMsg, authError);
          throw new TRPCError({
            code: 'INTERNAL_SERVER_ERROR',
            message: `OpenProvider authentication failed: ${errMsg}`,
            cause: authError,
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
          const errMsg = authError instanceof Error ? authError.message : String(authError);
          console.error('[OpenProvider] Authentication failed:', errMsg, authError);
          throw new TRPCError({
            code: 'INTERNAL_SERVER_ERROR',
            message: `OpenProvider authentication failed: ${errMsg}`,
            cause: authError,
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
