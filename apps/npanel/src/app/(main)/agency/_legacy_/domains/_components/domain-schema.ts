import { z } from "zod";

// Schema for domain table row validation
export const domainSchema = z.object({
  id: z.string(),
  extension: z.string(),
  displayName: z.string(),
  minPeriod: z.number(),
  maxPeriod: z.number(),
  canTransfer: z.boolean(),
  canRenew: z.boolean(),
  supportsIdn: z.boolean(),
  supportsDnssec: z.boolean(),
  requiresAuthCode: z.boolean(),
  isPremium: z.boolean(),
  pricing: z.object({
    product: z.object({
      currency: z.string(),
      price: z.number(),
      formatted: z.string(),
    }),
    reseller: z.object({
      currency: z.string(),
      price: z.number(),
      formatted: z.string(),
    }),
  }).nullable(),
  premiumPricing: z.object({
    currency: z.string(),
    price: z.number(),
    formatted: z.string(),
  }).nullable(),
  description: z.string().optional(),
  restrictions: z.array(z.string()),
  status: z.enum(['active', 'inactive', 'premium', 'restricted']),
  popularity: z.enum(['high', 'medium', 'low']),
  lastUpdated: z.string(),
});

// Schema for domain query parameters
export const domainQuerySchema = z.object({
  limit: z.number().min(1).max(1000).optional(),
  offset: z.number().min(0).optional(),
  extensions: z.array(z.string()).optional(),
  status: z.enum(['ACT', 'INACT']).optional(),
  with_price: z.boolean().optional(),
  with_description: z.boolean().optional(),
  with_restrictions: z.boolean().optional(),
  search: z.string().optional(),
  sortBy: z.enum(['name', 'price', 'premium', 'popularity']).optional(),
  sortDirection: z.enum(['asc', 'desc']).optional(),
});

// Schema for table state
export const domainTableStateSchema = z.object({
  pagination: z.object({
    pageIndex: z.number().min(0),
    pageSize: z.number().min(1).max(100),
  }),
  sorting: z.array(z.object({
    id: z.string(),
    desc: z.boolean(),
  })),
  columnFilters: z.array(z.object({
    id: z.string(),
    value: z.unknown(),
  })),
  globalFilter: z.string(),
});

// Type exports
export type DomainSchema = z.infer<typeof domainSchema>;
export type DomainQuerySchema = z.infer<typeof domainQuerySchema>;
export type DomainTableStateSchema = z.infer<typeof domainTableStateSchema>;
