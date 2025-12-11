import { MetaApiError } from './meta-client';

/**
 * Error types that can be returned by Meta API error handler
 */
export type MetaErrorType = 'refresh-token' | 'bad-body' | 'unknown';

/**
 * Structured error information from Meta API error handler
 */
export interface MetaErrorInfo {
	type: MetaErrorType;
	message: string;
	originalError?: MetaApiError;
}

/**
 * Comprehensive error handler for Meta/Facebook API errors
 * Based on common error codes and messages from Facebook Graph API
 * 
 * This handler categorizes errors into:
 * - refresh-token: Requires re-authentication (token expired, revoked, etc.)
 * - bad-body: Content/parameter validation errors
 * - unknown: Unhandled errors
 */
export class MetaErrorHandler {
	/**
	 * Handle Meta API error by checking error message and codes
	 * Returns structured error information for proper handling
	 */
	static handleError(error: MetaApiError | Error | string): MetaErrorInfo | undefined {
		// Convert error to string for pattern matching
		let errorBody = '';
		
		if (error instanceof MetaApiError) {
			errorBody = `${error.message} ${error.code} ${error.errorSubcode || ''} ${error.type || ''}`;
		} else if (error instanceof Error) {
			errorBody = error.message;
		} else {
			errorBody = String(error);
		}

		// Normalize for case-insensitive matching
		const normalizedBody = errorBody.toLowerCase();

		// ============================================================================
		// ACCESS TOKEN VALIDATION ERRORS - Require re-authentication
		// ============================================================================
		
		// Error 190: Invalid OAuth 2.0 Access Token
		if (
			error instanceof MetaApiError && error.code === 190 ||
			normalizedBody.indexOf('error validating access token') > -1 ||
			normalizedBody.indexOf('invalid access token') > -1 ||
			normalizedBody.indexOf('invalid oauth 2.0 access token') > -1
		) {
			return {
				type: 'refresh-token',
				message: 'Invalid OAuth 2.0 Access Token. Please re-authenticate your Facebook account',
				originalError: error instanceof MetaApiError ? error : undefined,
			};
		}

		// Error 102: Session key invalid or no longer valid
		if (
			error instanceof MetaApiError && error.code === 102 ||
			normalizedBody.indexOf('session key invalid') > -1 ||
			normalizedBody.indexOf('session key no longer valid') > -1
		) {
			return {
				type: 'refresh-token',
				message: 'Session key invalid or no longer valid. Please re-authenticate',
				originalError: error instanceof MetaApiError ? error : undefined,
			};
		}

		// Token expired (error code 490)
		if (normalizedBody.indexOf('490') > -1 || normalizedBody.indexOf('token expired') > -1) {
			return {
				type: 'refresh-token',
				message: 'Access token expired, please re-authenticate',
				originalError: error instanceof MetaApiError ? error : undefined,
			};
		}

		// Token revoked
		if (
			normalizedBody.indexOf('revoked_access_token') > -1 ||
			normalizedBody.indexOf('token revoked') > -1
		) {
			return {
				type: 'refresh-token',
				message: 'Access token has been revoked, please re-authenticate',
				originalError: error instanceof MetaApiError ? error : undefined,
			};
		}

		// Permission errors requiring re-authentication
		if (
			normalizedBody.indexOf('1404078') > -1 ||
			normalizedBody.indexOf('page publishing authorization required') > -1
		) {
			return {
				type: 'refresh-token',
				message: 'Page publishing authorization required, please re-authenticate',
				originalError: error instanceof MetaApiError ? error : undefined,
			};
		}

		// ============================================================================
		// PERMISSIONS ERRORS - Require re-authentication or permission grant
		// ============================================================================
		
		// Error 200: Permissions error
		if (
			error instanceof MetaApiError && error.code === 200 ||
			normalizedBody.indexOf('permissions error') > -1
		) {
			return {
				type: 'refresh-token',
				message: 'Permissions error. Please re-authenticate with required permissions',
				originalError: error instanceof MetaApiError ? error : undefined,
			};
		}

		// Error 283: That action requires the extended permission pages_read_engagement and/or pages_read_user_content and/or pages_manage_ads and/or pages_manage_metadata
		if (
			error instanceof MetaApiError && error.code === 283 ||
			normalizedBody.indexOf('pages_read_engagement') > -1 ||
			normalizedBody.indexOf('pages_read_user_content') > -1 ||
			normalizedBody.indexOf('pages_manage_ads') > -1 ||
			normalizedBody.indexOf('pages_manage_metadata') > -1
		) {
			return {
				type: 'refresh-token',
				message: 'This action requires extended permissions. Please re-authenticate with pages_read_engagement, pages_read_user_content, pages_manage_ads, or pages_manage_metadata permissions',
				originalError: error instanceof MetaApiError ? error : undefined,
			};
		}

		// Error 230: Permissions disallow message to user
		if (
			error instanceof MetaApiError && error.code === 230 ||
			normalizedBody.indexOf('permissions disallow message to user') > -1
		) {
			return {
				type: 'refresh-token',
				message: 'Permissions disallow message to user. Please check your app permissions',
				originalError: error instanceof MetaApiError ? error : undefined,
			};
		}

		// Error 210: User not visible
		if (
			error instanceof MetaApiError && error.code === 210 ||
			normalizedBody.indexOf('user not visible') > -1
		) {
			return {
				type: 'bad-body',
				message: 'User not visible. The requested user is not accessible',
				originalError: error instanceof MetaApiError ? error : undefined,
			};
		}

		// Error 415: Two factor authentication required
		if (
			error instanceof MetaApiError && error.code === 415 ||
			normalizedBody.indexOf('two factor authentication required') > -1 ||
			normalizedBody.indexOf('2fac') > -1
		) {
			return {
				type: 'refresh-token',
				message: 'Two factor authentication required. User must enter a code from SMS or TOTP code generator',
				originalError: error instanceof MetaApiError ? error : undefined,
			};
		}

		// Error 413: Invalid password
		if (
			error instanceof MetaApiError && error.code === 413 ||
			normalizedBody.indexOf('invalid password') > -1
		) {
			return {
				type: 'refresh-token',
				message: 'Invalid password. Please check your credentials',
				originalError: error instanceof MetaApiError ? error : undefined,
			};
		}

		// Error 3982: You do not have sufficient permissions to import this asset into the given Business Manager
		if (
			error instanceof MetaApiError && error.code === 3982 ||
			normalizedBody.indexOf('sufficient permissions to import') > -1
		) {
			return {
				type: 'refresh-token',
				message: 'You do not have sufficient permissions to import this asset into the given Business Manager',
				originalError: error instanceof MetaApiError ? error : undefined,
			};
		}

		// Error 3977: To claim a Page in Business Manager, you must already be an Admin of the Page
		if (
			error instanceof MetaApiError && error.code === 3977 ||
			normalizedBody.indexOf('must already be an admin of the page') > -1
		) {
			return {
				type: 'bad-body',
				message: 'To claim a Page in Business Manager, you must already be an Admin of the Page',
				originalError: error instanceof MetaApiError ? error : undefined,
			};
		}

		// Error 3944: Your Business Manager already has access to this object
		if (
			error instanceof MetaApiError && error.code === 3944 ||
			normalizedBody.indexOf('business manager already has access') > -1
		) {
			return {
				type: 'bad-body',
				message: 'Your Business Manager already has access to this object',
				originalError: error instanceof MetaApiError ? error : undefined,
			};
		}

		// Error 42001: This Page can't be removed because it's already linked to an Instagram business profile
		if (
			error instanceof MetaApiError && error.code === 42001 ||
			normalizedBody.indexOf('already linked to an instagram business profile') > -1
		) {
			return {
				type: 'bad-body',
				message: "This Page can't be removed because it's already linked to an Instagram business profile. To remove this Page from Business Manager, go to Instagram and convert to a personal account or change the Page linked to your business profile",
				originalError: error instanceof MetaApiError ? error : undefined,
			};
		}

		// Error 551: This person isn't available right now
		if (
			error instanceof MetaApiError && error.code === 551 ||
			normalizedBody.indexOf("isn't available right now") > -1
		) {
			return {
				type: 'bad-body',
				message: "This person isn't available right now",
				originalError: error instanceof MetaApiError ? error : undefined,
			};
		}

		// ============================================================================
		// CONTENT POLICY VIOLATIONS - Bad body/content errors
		// ============================================================================
		
		// Error 368: The action attempted has been deemed abusive or is otherwise disallowed
		if (
			error instanceof MetaApiError && error.code === 368 ||
			normalizedBody.indexOf('deemed abusive') > -1 ||
			normalizedBody.indexOf('otherwise disallowed') > -1
		) {
			return {
				type: 'bad-body',
				message: 'The action attempted has been deemed abusive or is otherwise disallowed',
				originalError: error instanceof MetaApiError ? error : undefined,
			};
		}

		// Photo size errors
		if (
			normalizedBody.indexOf('1366046') > -1 ||
			normalizedBody.indexOf('photo') > -1 && normalizedBody.indexOf('4 mb') > -1
		) {
			return {
				type: 'bad-body',
				message: 'Photos should be smaller than 4 MB and saved as JPG, PNG',
				originalError: error instanceof MetaApiError ? error : undefined,
			};
		}

		// Rate limiting - posting too fast
		if (
			normalizedBody.indexOf('1390008') > -1 ||
			normalizedBody.indexOf('posting too fast') > -1 ||
			normalizedBody.indexOf('rate limit') > -1
		) {
			return {
				type: 'bad-body',
				message: 'You are posting too fast, please slow down',
				originalError: error instanceof MetaApiError ? error : undefined,
			};
		}

		// Content flagged as abusive
		if (
			normalizedBody.indexOf('1346003') > -1 ||
			normalizedBody.indexOf('content flagged as abusive') > -1
		) {
			return {
				type: 'bad-body',
				message: 'Content flagged as abusive by Facebook',
				originalError: error instanceof MetaApiError ? error : undefined,
			};
		}

		// Security check required
		if (
			normalizedBody.indexOf('1404006') > -1 ||
			normalizedBody.indexOf('security check') > -1
		) {
			return {
				type: 'bad-body',
				message: "We couldn't post your content. A security check in Facebook is required to proceed.",
				originalError: error instanceof MetaApiError ? error : undefined,
			};
		}

		// Community standards violation
		if (
			normalizedBody.indexOf('1404102') > -1 ||
			normalizedBody.indexOf('community standards') > -1
		) {
			return {
				type: 'bad-body',
				message: 'Content violates Facebook Community Standards',
				originalError: error instanceof MetaApiError ? error : undefined,
			};
		}

		// Cannot post Facebook.com links
		if (
			normalizedBody.indexOf('1609008') > -1 ||
			normalizedBody.indexOf('cannot post facebook.com links') > -1
		) {
			return {
				type: 'bad-body',
				message: 'Cannot post Facebook.com links',
				originalError: error instanceof MetaApiError ? error : undefined,
			};
		}

		// ============================================================================
		// DEPRECATION ERRORS - Bad body/parameter errors
		// ============================================================================

		// Error 12: deprecate_post_aggregated_fields_for_attachement is deprecated for versions v3.3 and higher
		if (
			error instanceof MetaApiError && error.code === 12 ||
			normalizedBody.indexOf('deprecate_post_aggregated_fields_for_attachement') > -1 ||
			normalizedBody.indexOf('deprecated for versions v3.3 and higher') > -1
		) {
			return {
				type: 'bad-body',
				message: 'Some requested fields trigger deprecated attachment processing. Please use only documented safe fields for v24.0 (id, message, story, created_time, permalink_url)',
				originalError: error instanceof MetaApiError ? error : undefined,
			};
		}

		// Error 459: The session is invalid because the user has been checkpointed
		if (
			error instanceof MetaApiError && error.code === 459 ||
			normalizedBody.indexOf('session is invalid because the user has been checkpointed') > -1 ||
			normalizedBody.indexOf('user has been checkpointed') > -1
		) {
			return {
				type: 'refresh-token',
				message: 'The session is invalid because the user has been checkpointed. Please re-authenticate',
				originalError: error instanceof MetaApiError ? error : undefined,
			};
		}

		// Error 2500: Error parsing graph query
		if (
			error instanceof MetaApiError && error.code === 2500 ||
			normalizedBody.indexOf('error parsing graph query') > -1
		) {
			return {
				type: 'bad-body',
				message: 'Error parsing graph query. Please check your query syntax',
				originalError: error instanceof MetaApiError ? error : undefined,
			};
		}

		// Error 3001: Invalid query
		if (
			error instanceof MetaApiError && error.code === 3001 ||
			normalizedBody.indexOf('invalid query') > -1
		) {
			return {
				type: 'bad-body',
				message: 'Invalid query. Please check your query parameters',
				originalError: error instanceof MetaApiError ? error : undefined,
			};
		}

		// ============================================================================
		// PARAMETER VALIDATION ERRORS - Bad body/parameter errors
		// ============================================================================

		// Error 100: Invalid parameter
		if (
			error instanceof MetaApiError && error.code === 100 ||
			normalizedBody.indexOf('invalid parameter') > -1
		) {
			return {
				type: 'bad-body',
				message: 'Invalid parameter. Please check your request parameters',
				originalError: error instanceof MetaApiError ? error : undefined,
			};
		}

		// Error 194: Missing at least one required parameter
		if (
			error instanceof MetaApiError && error.code === 194 ||
			normalizedBody.indexOf('missing at least one required parameter') > -1
		) {
			return {
				type: 'bad-body',
				message: 'Missing at least one required parameter. Please check your request',
				originalError: error instanceof MetaApiError ? error : undefined,
			};
		}

		// Error 197: The post is empty. Please enter a message to share
		if (
			error instanceof MetaApiError && error.code === 197 ||
			normalizedBody.indexOf('post is empty') > -1 ||
			normalizedBody.indexOf('please enter a message to share') > -1
		) {
			return {
				type: 'bad-body',
				message: 'The post is empty. Please enter a message to share',
				originalError: error instanceof MetaApiError ? error : undefined,
			};
		}

		// Error 1500: The url you supplied is invalid
		if (
			error instanceof MetaApiError && error.code === 1500 ||
			normalizedBody.indexOf('url you supplied is invalid') > -1
		) {
			return {
				type: 'bad-body',
				message: 'The URL you supplied is invalid',
				originalError: error instanceof MetaApiError ? error : undefined,
			};
		}

		// Error 192: Invalid phone number
		if (
			error instanceof MetaApiError && error.code === 192 ||
			normalizedBody.indexOf('invalid phone number') > -1
		) {
			return {
				type: 'bad-body',
				message: 'Invalid phone number',
				originalError: error instanceof MetaApiError ? error : undefined,
			};
		}

		// Error 105: The number of parameters exceeded the maximum for this operation
		if (
			error instanceof MetaApiError && error.code === 105 ||
			normalizedBody.indexOf('number of parameters exceeded the maximum') > -1
		) {
			return {
				type: 'bad-body',
				message: 'The number of parameters exceeded the maximum for this operation',
				originalError: error instanceof MetaApiError ? error : undefined,
			};
		}

		// Error 104: Incorrect signature
		if (
			error instanceof MetaApiError && error.code === 104 ||
			normalizedBody.indexOf('incorrect signature') > -1
		) {
			return {
				type: 'bad-body',
				message: 'Incorrect signature. Please verify your request signature',
				originalError: error instanceof MetaApiError ? error : undefined,
			};
		}

		// Error 375: This Page doesn't have a location descriptor. Add one to continue
		if (
			error instanceof MetaApiError && error.code === 375 ||
			normalizedBody.indexOf("page doesn't have a location descriptor") > -1
		) {
			return {
				type: 'bad-body',
				message: "This Page doesn't have a location descriptor. Add one to continue",
				originalError: error instanceof MetaApiError ? error : undefined,
			};
		}

		// Error 320: Photo edit failure
		if (
			error instanceof MetaApiError && error.code === 320 ||
			normalizedBody.indexOf('photo edit failure') > -1
		) {
			return {
				type: 'bad-body',
				message: 'Photo edit failure. Please try again',
				originalError: error instanceof MetaApiError ? error : undefined,
			};
		}

		// Error 160: Invalid geolocation type
		if (
			error instanceof MetaApiError && error.code === 160 ||
			normalizedBody.indexOf('invalid geolocation type') > -1
		) {
			return {
				type: 'bad-body',
				message: 'Invalid geolocation type',
				originalError: error instanceof MetaApiError ? error : undefined,
			};
		}

		// Error 371: Invalid Page location update
		if (
			error instanceof MetaApiError && error.code === 371 ||
			normalizedBody.indexOf('invalid page location update') > -1
		) {
			return {
				type: 'bad-body',
				message: 'Invalid Page location update',
				originalError: error instanceof MetaApiError ? error : undefined,
			};
		}

		// Error 374: Invalid store location descriptor update since this Page is not a location Page
		if (
			error instanceof MetaApiError && error.code === 374 ||
			normalizedBody.indexOf('invalid store location descriptor') > -1
		) {
			return {
				type: 'bad-body',
				message: 'Invalid store location descriptor update since this Page is not a location Page',
				originalError: error instanceof MetaApiError ? error : undefined,
			};
		}

		// Invalid URL format
		if (
			normalizedBody.indexOf('2061006') > -1 ||
			normalizedBody.indexOf('invalid url format') > -1
		) {
			return {
				type: 'bad-body',
				message: 'Invalid URL format in post content',
				originalError: error instanceof MetaApiError ? error : undefined,
			};
		}

		// Invalid content format
		if (
			normalizedBody.indexOf('1349125') > -1 ||
			normalizedBody.indexOf('invalid content format') > -1
		) {
			return {
				type: 'bad-body',
				message: 'Invalid content format',
				originalError: error instanceof MetaApiError ? error : undefined,
			};
		}

		// Content too long
		if (
			normalizedBody.indexOf('name parameter too long') > -1 ||
			normalizedBody.indexOf('content too long') > -1 ||
			normalizedBody.indexOf('message too long') > -1
		) {
			return {
				type: 'bad-body',
				message: 'Post content is too long',
				originalError: error instanceof MetaApiError ? error : undefined,
			};
		}

		// ============================================================================
		// RATE LIMITING ERRORS - Bad body (temporary issues)
		// ============================================================================

		// Error 80001: There have been too many calls to this Page account
		if (
			error instanceof MetaApiError && error.code === 80001 ||
			normalizedBody.indexOf('too many calls to this page account') > -1
		) {
			return {
				type: 'bad-body',
				message: 'There have been too many calls to this Page account. Wait a bit and try again. For more info, please refer to https://developers.facebook.com/docs/graph-api/overview/rate-limiting',
				originalError: error instanceof MetaApiError ? error : undefined,
			};
		}

		// Error 80002: There have been too many calls to this Instagram account
		if (
			error instanceof MetaApiError && error.code === 80002 ||
			normalizedBody.indexOf('too many calls to this instagram account') > -1
		) {
			return {
				type: 'bad-body',
				message: 'There have been too many calls to this Instagram account. Wait a bit and try again. For more info, please refer to https://developers.facebook.com/docs/graph-api/overview/rate-limiting',
				originalError: error instanceof MetaApiError ? error : undefined,
			};
		}

		// Error 80005: There have been too many leadgen api calls to this Page account
		if (
			error instanceof MetaApiError && error.code === 80005 ||
			normalizedBody.indexOf('too many leadgen api calls') > -1
		) {
			return {
				type: 'bad-body',
				message: 'There have been too many leadgen api calls to this Page account. Wait a bit and try again. For more info, please refer to https://developers.facebook.com/docs/graph-api/overview/rate-limiting',
				originalError: error instanceof MetaApiError ? error : undefined,
			};
		}

		// Error 80006: There have been too many messenger api calls to this Page account
		if (
			error instanceof MetaApiError && error.code === 80006 ||
			normalizedBody.indexOf('too many messenger api calls') > -1
		) {
			return {
				type: 'bad-body',
				message: 'There have been too many messenger api calls to this Page account. Wait a bit and try again. For more info, please refer to https://developers.facebook.com/docs/graph-api/overview/rate-limiting',
				originalError: error instanceof MetaApiError ? error : undefined,
			};
		}

		// ============================================================================
		// SERVICE ERRORS - Bad body (temporary issues)
		// ============================================================================

		// Service temporarily unavailable
		if (
			normalizedBody.indexOf('1363047') > -1 ||
			normalizedBody.indexOf('1609010') > -1 ||
			normalizedBody.indexOf('service temporarily unavailable') > -1 ||
			normalizedBody.indexOf('service unavailable') > -1
		) {
			return {
				type: 'bad-body',
				message: 'Facebook service temporarily unavailable',
				originalError: error instanceof MetaApiError ? error : undefined,
			};
		}

		// ============================================================================
		// ADDITIONAL COMMON ERRORS
		// ============================================================================

		// OAuth errors
		if (
			normalizedBody.indexOf('invalid oauth') > -1 ||
			normalizedBody.indexOf('oauth error') > -1
		) {
			return {
				type: 'refresh-token',
				message: 'OAuth authentication error, please re-authenticate',
				originalError: error instanceof MetaApiError ? error : undefined,
			};
		}

		// Permission denied
		if (
			normalizedBody.indexOf('permission denied') > -1 ||
			normalizedBody.indexOf('insufficient permissions') > -1 ||
			normalizedBody.indexOf('200') > -1 && normalizedBody.indexOf('permissions') > -1
		) {
			return {
				type: 'refresh-token',
				message: 'Insufficient permissions. Please re-authenticate with required permissions.',
				originalError: error instanceof MetaApiError ? error : undefined,
			};
		}

		// Page not found or access denied
		if (
			normalizedBody.indexOf('page not found') > -1 ||
			normalizedBody.indexOf('cannot access page') > -1 ||
			normalizedBody.indexOf('100') > -1 && normalizedBody.indexOf('page') > -1
		) {
			return {
				type: 'bad-body',
				message: 'Page not found or access denied',
				originalError: error instanceof MetaApiError ? error : undefined,
			};
		}

		// Unknown error - return undefined to let default handling proceed
		return undefined;
	}

	/**
	 * Check if error requires token refresh
	 */
	static requiresTokenRefresh(error: MetaApiError | Error | string): boolean {
		const errorInfo = this.handleError(error);
		return errorInfo?.type === 'refresh-token';
	}

	/**
	 * Check if error is a content/body validation error
	 */
	static isBadBodyError(error: MetaApiError | Error | string): boolean {
		const errorInfo = this.handleError(error);
		return errorInfo?.type === 'bad-body';
	}

	/**
	 * Get user-friendly error message
	 */
	static getErrorMessage(error: MetaApiError | Error | string): string {
		const errorInfo = this.handleError(error);
		
		if (errorInfo) {
			return errorInfo.message;
		}

		// Fallback to original error message
		if (error instanceof MetaApiError) {
			return error.message;
		}
		
		if (error instanceof Error) {
			return error.message;
		}

		return 'An unknown error occurred with the Meta API';
	}
}

