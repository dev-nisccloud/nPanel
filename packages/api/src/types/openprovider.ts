// OpenProvider API Types
// Comprehensive types based on the official OpenProvider API documentation

export interface OpenProviderConfig {
  baseUrl: string;
  apiVersion: string;
  timeout: number;
}

export const DEFAULT_OPENPROVIDER_CONFIG: OpenProviderConfig = {
  baseUrl: 'https://api.openprovider.eu',
  apiVersion: 'v1beta',
  timeout: 60000, // 60 seconds
};

// Authentication Types
export interface OpenProviderAuthRequest {
  username: string;
  password: string;
  ip?: string;
}

export interface OpenProviderAuthResponse {
  code: number;
  desc: string;
  data: {
    token: string;
    reseller_id: number;
  };
}

// TLD Types
export interface OpenProviderTldRequest {
  limit?: number;
  offset?: number;
  extensions?: string[];
  status?: 'ACT' | 'INACT';
  with_price?: boolean;
  with_description?: boolean;
  with_restrictions?: boolean;
}

export interface OpenProviderTldResponse {
  code: number;
  desc: string;
  data: {
    results: OpenProviderTld[];
    total: number;
  };
}

export interface OpenProviderTld {
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
  modify_owner_allowed?: boolean;
  trade_allowed?: boolean;
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
export interface OpenProviderDomainCheckRequest {
  domains?: Array<{
    name: string;
    extension: string;
  }>;
  name?: string;
  extensions?: string[];
  with_price?: boolean;
  with_whois?: boolean;
  additional_data?: {
    idn_script?: string;
  };
}

export interface OpenProviderDomainCheckResult {
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

export interface OpenProviderDomainCheckResponse {
  code: number;
  desc: string;
  data: {
    results: OpenProviderDomainCheckResult[];
  };
}

// Customer/Handle Types
export interface OpenProviderCustomerRequest {
  name: {
    first_name: string;
    last_name: string;
  };
  address: {
    street: string;
    number: string;
    zipcode: string;
    city: string;
    country: string;
    state?: string;
  };
  phone: {
    country_code: string;
    area_code: string;
    subscriber_number: string;
  };
  email: string;
  company_name?: string;
  tags?: string[];
  additional_data?: Record<string, any>;
  fax?: {
    country_code: string;
    area_code: string;
    subscriber_number: string;
  };
}

export interface OpenProviderCustomerResponse {
  code: number;
  desc: string;
  data: {
    handle: string;
  };
}

export interface OpenProviderCustomerSearchRequest {
  handle_pattern?: string;
  email_pattern?: string;
  first_name_pattern?: string;
  last_name_pattern?: string;
  company_name_pattern?: string;
  comment_pattern?: string;
  with_additional_data?: boolean;
  limit?: number;
  offset?: number;
}

export interface OpenProviderCustomerSearchResponse {
  code: number;
  desc: string;
  data: {
    results: Array<{
      handle: string;
      company_name?: string;
      email: string;
      additional_data?: Record<string, any>;
    }>;
    total: number;
  };
}

// Domain Registration Types
export interface OpenProviderDomainRegistrationRequest {
  /** Domain name and extension - nested per OpenProvider REST API spec */
  domain: {
    name: string;
    extension: string;
  };
  period?: number;
  owner_handle: string;
  admin_handle?: string;
  tech_handle?: string;
  billing_handle?: string;
  reseller_handle?: string;
  name_servers?: Array<{
    name: string;
    ip?: string;
  }>;
  ns_group?: string;
  autorenew?: 'on' | 'off' | 'default';
  is_private_whois_enabled?: boolean;
  promo_code?: string;
  dnssec_keys?: Array<{
    flags: number;
    protocol: number;
    algorithm: number;
    public_key: string;
  }>;
  additional_data?: Record<string, any>;
}

export interface OpenProviderDomainRegistrationResponse {
  code: number;
  desc: string;
  data: {
    id: number;
    domain: string;
    status: 'ACT' | 'REQ';
    activation_date?: string;
    expiration_date: string;
    renewal_date: string;
    auth_code?: string;
  };
}

// Domain Transfer Types
export interface OpenProviderDomainTransferRequest {
  domain: {
    name: string;
    extension: string;
  };
  auth_code: string;
  owner_handle: string;
  admin_handle: string;
  tech_handle: string;
  billing_handle?: string;
  autorenew?: 'on' | 'off' | 'default';
  /** Period in years to add on transfer (optional). */
  period?: number;
  name_servers?: Array<{
    name: string;
    ip?: string;
  }>;
  ns_group?: string;
}

export interface OpenProviderDomainTransferResponse {
  code: number;
  desc: string;
  data: {
    id: number;
    domain: string;
    status: 'REQ' | 'ACT';
    auth_code: string;
    expiration_date: string;
    renewal_date: string;
  };
}

// Domain Management Types
export interface OpenProviderDomainSearchRequest {
  domain_name_pattern?: string;
  limit?: number;
  offset?: number;
  status?: 'ACT' | 'REQ' | 'DEL' | 'FAIL';
  with_registry_statuses?: boolean;
}

export interface OpenProviderDomainSearchResponse {
  code: number;
  desc: string;
  data: {
    results: Array<{
      id: number;
      domain: string;
      owner_handle: string;
      admin_handle: string;
      tech_handle: string;
      billing_handle?: string;
      name_servers: Array<{
        name: string;
        ip?: string;
      }>;
      status: 'ACT' | 'REQ' | 'DEL' | 'FAIL';
      auth_code?: string;
      autorenew: 'on' | 'off' | 'default';
      creation_date: string;
      expiration_date: string;
      renewal_date: string;
      is_locked: boolean;
      is_private_whois_enabled: boolean;
      is_dnssec_enabled: boolean;
      dnssec_keys?: Array<{
        flags: number;
        protocol: number;
        algorithm: number;
        public_key: string;
      }>;
    }>;
    total: number;
  };
}

export interface OpenProviderDomainTradeRequest {
  domain: {
    name: string;
    extension: string;
  };
  owner_handle: string;
  admin_handle?: string;
  tech_handle?: string;
  billing_handle?: string;
  auth_code?: string;
  period?: number;
}

export interface OpenProviderDomainTradeResponse {
  code: number;
  desc: string;
  data?: {
    id?: number;
    status?: string;
  };
}

export interface OpenProviderDomainUpdateRequest {
  owner_handle?: string;
  admin_handle?: string;
  tech_handle?: string;
  billing_handle?: string;
  ns_group?: string;
  name_servers?: Array<{
    name: string;
    ip?: string;
  }>;
  autorenew?: 'on' | 'off' | 'default';
  is_locked?: boolean;
  is_private_whois_enabled?: boolean;
  is_dnssec_enabled?: boolean;
  dnssec_keys?: Array<{
    flags: number;
    protocol: number;
    algorithm: number;
    public_key: string;
  }>;
}

export interface OpenProviderDomainUpdateResponse {
  code: number;
  desc: string;
  data: {
    id: number;
    status: 'ACT' | 'REQ';
  };
}

// Domain Renewal Types
export interface OpenProviderDomainRenewalRequest {
  period?: number;
}

export interface OpenProviderDomainRenewalResponse {
  code: number;
  desc: string;
  data: {
    id: number;
    status: 'ACT' | 'REQ';
    expiration_date: string;
    renewal_date: string;
  };
}

// Auth Code Types
export interface OpenProviderAuthCodeResponse {
  code: number;
  desc: string;
  data: {
    auth_code: string;
  };
}

export interface OpenProviderAuthCodeResetRequest {
  auth_code_type?: 'external' | 'internal';
}

export interface OpenProviderAuthCodeResetResponse {
  code: number;
  desc: string;
  data: {
    auth_code: string;
  };
}

// DNS Zone Types
export interface OpenProviderDnsZoneRequest {
  domain: {
    name: string;
    extension: string;
  };
  type: 'master' | 'slave';
  records?: Array<{
    name: string;
    type: 'A' | 'AAAA' | 'CNAME' | 'MX' | 'SRV' | 'TXT' | 'NS' | 'TLSA' | 'SSHFP' | 'CAA';
    value: string;
    prio?: number;
    ttl?: number;
  }>;
  template_name?: string;
  provider?: 'sectigo';
  secured?: boolean;
  master_ip?: string;
}

export interface OpenProviderDnsZoneResponse {
  code: number;
  desc: string;
  data: {
    success: boolean;
  };
}

export interface OpenProviderDnsZoneSearchRequest {
  limit?: number;
  offset?: number;
  name_pattern?: string;
  type?: 'master' | 'slave';
  with_records?: boolean;
  with_history?: boolean;
}

export interface OpenProviderDnsZoneSearchResponse {
  code: number;
  desc: string;
  data: {
    results: Array<{
      name: string;
      type: 'master' | 'slave';
      active: boolean;
      creation_date: string;
      records?: Array<{
        name: string;
        type: string;
        value: string;
        prio?: number;
        ttl: number;
      }>;
      history?: Array<{
        date: string;
        action: string;
        details: string;
      }>;
    }>;
    total: number;
  };
}

export interface OpenProviderDnsZoneUpdateRequest {
  records?: {
    add?: Array<{
      name: string;
      type: string;
      value: string;
      prio?: number;
      ttl?: number;
    }>;
    update?: Array<{
      name: string;
      type: string;
      value: string;
      prio?: number;
      ttl?: number;
    }>;
    remove?: Array<{
      name: string;
      type: string;
      value: string;
      prio?: number;
      ttl?: number;
    }>;
  };
  is_spamexperts_enabled?: boolean;
}

export interface OpenProviderDnsZoneUpdateResponse {
  code: number;
  desc: string;
  data: {
    success: boolean;
  };
}

// Domain Pricing Types
export interface OpenProviderDomainPricingRequest {
  domain: {
    name: string;
    extension: string;
  };
  operation: 'create' | 'transfer' | 'renew' | 'restore';
  period?: number;
  additional_data?: {
    idn_script?: string;
  };
}

export interface OpenProviderDomainPricingResponse {
  code: number;
  desc: string;
  data: {
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
    is_premium: boolean;
    promotion_details?: {
      start_date: string;
      end_date: string;
      non_promo_price: {
        product: {
          price: number;
          currency: string;
        };
        reseller: {
          price: number;
          currency: string;
        };
      };
    };
  };
}

// Additional Data Types
export interface OpenProviderAdditionalDataRequest {
  domain: {
    extension: string;
  };
}

export interface OpenProviderAdditionalDataResponse {
  code: number;
  desc: string;
  data: {
    fields: Array<{
      name: string;
      description: string;
      required: boolean;
      type: string;
    }>;
  };
}

export interface OpenProviderCustomerAdditionalDataRequest {
  domain: {
    extension: string;
    name?: string;
  };
}

export interface OpenProviderCustomerAdditionalDataResponse {
  code: number;
  desc: string;
  data: {
    fields: Array<{
      name: string;
      description: string;
      required: boolean;
      type: string;
    }>;
  };
}

// Email Verification Types
export interface OpenProviderEmailVerificationStartRequest {
  email: string;
  handle: string;
  language?: string;
}

export interface OpenProviderEmailVerificationStartResponse {
  code: number;
  desc: string;
  data: {
    id: string;
    email_sent: boolean;
  };
}

export interface OpenProviderEmailVerificationStatusRequest {
  domain?: string;
  handle?: string;
  email?: string;
  status?: 'pending' | 'verified' | 'failed';
  is_suspended?: boolean;
  limit?: number;
  offset?: number;
}

export interface OpenProviderEmailVerificationStatusResponse {
  code: number;
  desc: string;
  data: {
    results: Array<{
      domain: string;
      handle: string;
      email: string;
      status: 'pending' | 'verified' | 'failed';
      expiration_date?: string;
    }>;
    total: number;
  };
}

// SSL Certificate Types
export interface OpenProviderSslProduct {
  id: number;
  name: string;
  description: string;
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
  supported_software: string[];
  validation_method: string;
  warranty: number;
}

export interface OpenProviderSslProductsResponse {
  code: number;
  desc: string;
  data: {
    results: OpenProviderSslProduct[];
    total: number;
  };
}

export interface OpenProviderSslOrderRequest {
  product_id: number;
  domain: string;
  validation_method: 'email' | 'dns' | 'file';
  validation_email?: string;
  csr?: string;
  additional_domains?: string[];
}

export interface OpenProviderSslOrderResponse {
  code: number;
  desc: string;
  data: {
    order_id: number;
    status: 'pending' | 'processing' | 'completed' | 'failed';
  };
}

// Error Types
export interface OpenProviderError {
  code: number;
  desc: string;
}

// Cache Types
export interface CacheEntry<T> {
  data: T;
  timestamp: number;
  expiresAt: number;
}

// Response Wrapper Types
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    code: number;
    message: string;
    details?: any;
  };
  meta?: {
    cached?: boolean;
    cached_at?: string;
    fetched_at?: string;
    total?: number;
    limit?: number;
    offset?: number;
  };
}
