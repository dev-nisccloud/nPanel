import { GoogleAdsApi, Customer } from 'google-ads-api';
export interface GoogleAdsClientConfig {
    developerToken: string;
    clientId: string;
    clientSecret: string;
    refreshToken: string;
    loginCustomerId?: string;
}
export interface AccessibleCustomer {
    resourceName: string;
    customerId: string;
    descriptiveName?: string;
}
/**
 * Create Google Ads API client instance
 */
export declare function createGoogleAdsClient(config: GoogleAdsClientConfig): GoogleAdsApi;
/**
 * Get customer instance for making API calls
 */
export declare function getCustomerInstance(client: GoogleAdsApi, customerId: string, refreshToken: string, loginCustomerId?: string): Customer;
/**
 * List accessible Google Ads customers (accounts)
 * Uses the library's built-in listAccessibleCustomers method
 * This is equivalent to CustomerService.listAccessibleCustomers
 */
export declare function getAccessibleCustomers(client: GoogleAdsApi, refreshToken: string): Promise<AccessibleCustomer[]>;
/**
 * Refresh access token using refresh token
 * Google OAuth 2.0 tokens can be refreshed using the refresh token
 */
export declare function refreshAccessToken(refreshToken: string, clientId: string, clientSecret: string): Promise<{
    access_token: string;
    expires_in: number;
    token_type: string;
}>;
