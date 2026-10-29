import { GoogleAdsApi, Customer } from 'google-ads-api';
import { GoogleAdsErrorHandler } from './google-ads-error-handler';

export interface GoogleAdsClientConfig {
	developerToken: string;
	clientId: string;
	clientSecret: string;
	refreshToken: string;
	loginCustomerId?: string; // Optional: Manager account ID
}

export interface AccessibleCustomer {
	resourceName: string;
	customerId: string;
	descriptiveName?: string;
}

/**
 * Create Google Ads API client instance
 */
export function createGoogleAdsClient(config: GoogleAdsClientConfig): GoogleAdsApi {
	try {
		const client = new GoogleAdsApi({
			client_id: config.clientId,
			client_secret: config.clientSecret,
			developer_token: config.developerToken,
		});

		// Verify listAccessibleCustomers method exists
		if (typeof client.listAccessibleCustomers !== 'function') {
			throw new Error('listAccessibleCustomers method not found on GoogleAdsApi client. Please check the library version.');
		}

		return client;
	} catch (error) {
		const errorInfo = GoogleAdsErrorHandler.handleError(error);
		throw new Error(`Failed to create Google Ads client: ${errorInfo.message}`);
	}
}

/**
 * Get customer instance for making API calls
 */
export function getCustomerInstance(
	client: GoogleAdsApi,
	customerId: string,
	refreshToken: string,
	loginCustomerId?: string,
): Customer {
	try {
		const customer = client.Customer({
			customer_id: customerId.replace(/-/g, ""),
			refresh_token: refreshToken,
			...(loginCustomerId
				? { login_customer_id: loginCustomerId.replace(/-/g, "") }
				: {}),
		});

		return customer;
	} catch (error) {
		const errorInfo = GoogleAdsErrorHandler.handleError(error);
		throw new Error(`Failed to get customer instance: ${errorInfo.message}`);
	}
}

/**
 * List accessible Google Ads customers (accounts)
 * Uses the library's built-in listAccessibleCustomers method
 * This is equivalent to CustomerService.listAccessibleCustomers
 */
export async function getAccessibleCustomers(
	client: GoogleAdsApi,
	refreshToken: string
): Promise<AccessibleCustomer[]> {
	try {
		// Use the library's built-in method to list accessible customers
		// According to docs: "It returns the resource names of available customer accounts"
		// The method should return an array of resource names like ["customers/1234567890", ...]
		
		// Check if method exists
		if (typeof client.listAccessibleCustomers !== 'function') {
			throw new Error('listAccessibleCustomers method is not available on the Google Ads client. Please check the library version.');
		}

		const result = await client.listAccessibleCustomers(refreshToken);

		// Log for debugging
		console.log('[Google Ads] listAccessibleCustomers result:', {
			type: typeof result,
			isArray: Array.isArray(result),
			constructor: result?.constructor?.name,
			value: result,
		});

		// The library returns an object with resource_names property (snake_case)
		// Format: { resource_names: ["customers/1234567890", ...] }
		let resourceNames: string[] = [];
		
		if (Array.isArray(result)) {
			// Direct array (unlikely but handle it)
			resourceNames = result;
		} else if (result && typeof result === 'object') {
			// The library returns { resource_names: [...] } (snake_case)
			if ('resource_names' in result && Array.isArray(result.resource_names)) {
				resourceNames = result.resource_names;
			} else if ('resourceNames' in result && Array.isArray(result.resourceNames)) {
				// Handle camelCase variant if it exists
				resourceNames = result.resourceNames;
			} else {
				// Log full error details
				console.error('[Google Ads] Unexpected return format from listAccessibleCustomers:', {
					type: typeof result,
					isArray: Array.isArray(result),
					keys: result ? Object.keys(result) : null,
					constructor: result?.constructor?.name,
					result: result,
				});
				throw new Error(`Unexpected return format from listAccessibleCustomers. Expected array of resource names. Got: ${typeof result} with keys: ${result ? Object.keys(result).join(', ') : 'none'}`);
			}
		} else if (result === null || result === undefined) {
			// No customers accessible
			resourceNames = [];
		} else {
			throw new Error(`Unexpected return type from listAccessibleCustomers: ${typeof result}. Expected array of resource names.`);
		}

		// Convert resource names to AccessibleCustomer format
		const accessibleCustomers: AccessibleCustomer[] = resourceNames.map((resourceName: string) => {
			// Extract customer ID from resource name (format: "customers/1234567890")
			const customerIdMatch = resourceName.match(/customers\/(\d+)/);
			if (!customerIdMatch) {
				throw new Error(`Invalid resource name format: ${resourceName}`);
			}

			const customerId = customerIdMatch[1]!;
			// Format customer ID as XXX-XXX-XXXX (10 digits)
			const formattedCustomerId = customerId.length === 10
				? `${customerId.slice(0, 3)}-${customerId.slice(3, 6)}-${customerId.slice(6)}`
				: customerId;

			return {
				resourceName,
				customerId: formattedCustomerId,
				descriptiveName: undefined, // Will be fetched separately if needed
			};
		});

		return accessibleCustomers;
	} catch (error) {
		const errorInfo = GoogleAdsErrorHandler.handleError(error);
		
		// If it's a permission error, provide helpful message
		if (errorInfo.type === 'permission' || errorInfo.type === 'refresh-token') {
			throw new Error(`Failed to list accessible customers: ${errorInfo.message}`);
		}
		
		// Re-throw the error so it can be handled by the caller
		throw error;
	}
}

/**
 * Refresh access token using refresh token
 * Google OAuth 2.0 tokens can be refreshed using the refresh token
 */
export async function refreshAccessToken(
	refreshToken: string,
	clientId: string,
	clientSecret: string
): Promise<{
	access_token: string;
	expires_in: number;
	token_type: string;
}> {
	const { request } = await import('undici');

	const url = 'https://oauth2.googleapis.com/token';

	const body = new URLSearchParams();
	body.append('grant_type', 'refresh_token');
	body.append('refresh_token', refreshToken);
	body.append('client_id', clientId);
	body.append('client_secret', clientSecret);

	try {
		const response = await request(url, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/x-www-form-urlencoded',
			},
			body: body.toString(),
		});

		const data = (await response.body.json()) as unknown;

		if (typeof data === 'object' && data !== null && 'error' in data) {
			const error = data as { error?: string; error_description?: string };
			throw new Error(error.error_description || error.error || 'Failed to refresh token');
		}

		return data as {
			access_token: string;
			expires_in: number;
			token_type: string;
		};
	} catch (error) {
		const errorInfo = GoogleAdsErrorHandler.handleError(error);
		throw new Error(`Failed to refresh access token: ${errorInfo.message}`);
	}
}

