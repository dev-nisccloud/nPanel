import { z } from "zod";

export const tldSchema = z.object({
  name: z.string(),
  min_period: z.number(),
  max_period: z.number(),
  transfer_available: z.boolean(),
  trade_available: z.boolean(),
  renew_available: z.boolean(),
  is_transfer_auth_code_required: z.boolean(),
  is_trade_auth_code_required: z.boolean(),
  is_auth_code_requested: z.boolean(),
  is_auth_code_available: z.boolean(),
  is_auth_code_changeable: z.boolean(),
  is_private_whois_allowed: z.boolean(),
  domicile_available: z.boolean(),
  soft_quarantine_period: z.number(),
  quarantine_period: z.number(),
  dnssec_allowed: z.boolean(),
  status: z.enum(['ACT', 'INACT']),
  billing_handle_enabled: z.boolean(),
  reseller_handle_enabled: z.boolean(),
  supported_idn_scripts: z.array(z.object({
    value: z.string(),
    description: z.string(),
  })).optional(),
  owner_handle_supported: z.boolean(),
  admin_handle_supported: z.boolean(),
  tech_handle_supported: z.boolean(),
  billing_handle_supported: z.boolean(),
  reseller_handle_supported: z.boolean(),
  dnssec_keys_allowed: z.boolean(),
  dnssec_digests_allowed: z.boolean(),
  dnssec_max_records_amount: z.number(),
  dnssec_algorithms: z.array(z.number()),
  prices: z.object({
    min_period: z.number(),
    max_period: z.number(),
    setup_price: z.object({
      product: z.object({ price: z.number(), currency: z.string() }),
      reseller: z.object({ price: z.number(), currency: z.string() }),
    }),
    domicile_price: z.object({
      product: z.object({ price: z.number(), currency: z.string() }),
      reseller: z.object({ price: z.number(), currency: z.string() }),
    }),
    create_price: z.object({
      product: z.object({ price: z.number(), currency: z.string() }),
      reseller: z.object({ price: z.number(), currency: z.string() }),
    }),
    reseller_price: z.object({
      product: z.object({ price: z.number(), currency: z.string() }),
      reseller: z.object({ price: z.number(), currency: z.string() }),
      promotion_details: z.object({
        start_date: z.string(),
        end_date: z.string(),
        non_promo_price: z.object({
          product: z.object({ price: z.number(), currency: z.string() }),
          reseller: z.object({ price: z.number(), currency: z.string() }),
        }),
      }).optional(),
    }),
    renew_price: z.object({
      product: z.object({ price: z.number(), currency: z.string() }),
      reseller: z.object({ price: z.number(), currency: z.string() }),
    }),
    transfer_price: z.object({
      product: z.object({ price: z.number(), currency: z.string() }),
      reseller: z.object({ price: z.number(), currency: z.string() }),
    }),
    restore_price: z.object({
      product: z.object({ price: z.number(), currency: z.string() }),
      reseller: z.object({ price: z.number(), currency: z.string() }),
    }),
    soft_restore_price: z.object({
      product: z.object({ price: z.number(), currency: z.string() }),
      reseller: z.object({ price: z.number(), currency: z.string() }),
    }),
    update_price: z.object({
      product: z.object({ price: z.number(), currency: z.string() }),
      reseller: z.object({ price: z.number(), currency: z.string() }),
    }),
  }).optional(),
});

export type TldData = z.infer<typeof tldSchema>;
