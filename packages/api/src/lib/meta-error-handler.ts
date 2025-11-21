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
		
		// Token validation errors
		if (
			normalizedBody.indexOf('error validating access token') > -1 ||
			normalizedBody.indexOf('invalid access token') > -1
		) {
			return {
				type: 'refresh-token',
				message: 'Please re-authenticate your Facebook account',
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
		// CONTENT POLICY VIOLATIONS - Bad body/content errors
		// ============================================================================

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
		// PARAMETER VALIDATION ERRORS - Bad body/parameter errors
		// ============================================================================

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

