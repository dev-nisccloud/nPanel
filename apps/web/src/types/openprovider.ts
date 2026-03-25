// Openprovider API Types
// Based on the official Openprovider API documentation

export interface OpenproviderAuthRequest {
  username: string;
  password: string;
  ip?: string;
}

export interface OpenproviderAuthResponse {
  code: number;
  desc: string;
  data: {
    token: string;
    reseller_id: number;
  };
}

export interface OpenproviderTldRequest {
  limit?: number;
  offset?: number;
  extensions?: string[];
  status?: 'ACT' | 'INACT';
  with_price?: boolean;
  with_description?: boolean;
  with_restrictions?: boolean;
}

export interface OpenproviderTldResponse {
  code: number;
  desc: string;
  data: {
    results: OpenproviderTld[];
    total: number;
  };
}

export interface OpenproviderTld {
  name: string; // Extension (e.g., ".com")
  min_period: number;
  max_period: number;
  transfer_available: boolean;
  trade_available: boolean;
  renew_available: boolean;
  is_transfer_auth_code_required: boolean;
  is_trade_auth_code_required: boolean;
  is_auth_code_requested: boolean;
  is_auth_code_available: boolean;
  is_auth_code_changeable: boolean;
  is_private_whois_allowed: boolean;
  domicile_available: boolean;
  soft_quarantine_period: number;
  quarantine_period: number;
  dnssec_allowed: boolean;
  status: 'ACT' | 'INACT';
  billing_handle_enabled: boolean;
  reseller_handle_enabled: boolean;
  supported_idn_scripts: Array<{ value: string; description: string; }>;
  owner_handle_supported: boolean;
  admin_handle_supported: boolean;
  tech_handle_supported: boolean;
  billing_handle_supported: boolean;
  reseller_handle_supported: boolean;
  dnssec_keys_allowed: boolean;
  dnssec_digests_allowed: boolean;
  dnssec_max_records_amount: number;
  dnssec_algorithms: number[];
  prices: {
    min_period: number;
    max_period: number;
    setup_price: { product: { price: number; currency: string; }; reseller: { price: number; currency: string; }; };
    domicile_price: { product: { price: number; currency: string; }; reseller: { price: number; currency: string; }; };
    create_price: { product: { price: number; currency: string; }; reseller: { price: number; currency: string; }; };
    reseller_price: {
      product: { price: number; currency: string; };
      reseller: { price: number; currency: string; };
      promotion_details?: {
        start_date: string;
        end_date: string;
        non_promo_price: { product: { price: number; currency: string; }; reseller: { price: number; currency: string; }; };
      };
    };
    renew_price: { product: { price: number; currency: string; }; reseller: { price: number; currency: string; }; };
    transfer_price: { product: { price: number; currency: string; }; reseller: { price: number; currency: string; }; };
    restore_price: { product: { price: number; currency: string; }; reseller: { price: number; currency: string; }; };
    soft_restore_price: { product: { price: number; currency: string; }; reseller: { price: number; currency: string; }; };
    update_price: { product: { price: number; currency: string; }; reseller: { price: number; currency: string; }; };
  };
}

// Domain Check Types
export interface OpenproviderDomainCheckRequest {
  domains?: Array<{
    name: string;
    extension: string;
  }>;
  name?: string;
  extensions?: string[];
  page?: number;
  limit?: number;
  with_price?: boolean;
  with_whois?: boolean;
  additional_data?: {
    idn_script?: string;
  };
}

export interface OpenproviderDomainCheckResult {
  domain: string;
  status: 'free' | 'active' | 'reserved' | 'in use';
  reason?: string;
  price: {
    product: {
      price: number;
      currency: string;
    };
    reseller: {
      price: number;
      currency: string;
    };
  };
  is_premium?: boolean;
  premium?: {
    product: {
      price: number;
      currency: string;
    };
    reseller: {
      price: number;
      currency: string;
    };
  };
}

export interface OpenproviderDomainCheckResponse {
  code: number;
  desc: string;
  data: {
    results: OpenproviderDomainCheckResult[];
  };
}

export interface OpenproviderError {
  code: number;
  desc: string;
}

// API Configuration
export interface OpenproviderConfig {
  baseUrl: string;
  apiVersion: string;
  timeout: number;
}

// Default configuration
export const DEFAULT_OPENPROVIDER_CONFIG: OpenproviderConfig = {
  baseUrl: 'https://api.openprovider.eu',
  apiVersion: 'v1beta',
  timeout: 60000, // 60 seconds - increased for TLD requests
};
