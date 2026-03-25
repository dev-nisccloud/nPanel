/**
 * Google Ads API Error Handler
 * Handles errors from Google Ads API and converts them to user-friendly messages
 */

export interface GoogleAdsErrorInfo {
	type: 'refresh-token' | 'bad-body' | 'permission' | 'rate-limit' | 'unknown';
	message: string;
	originalError?: Error | unknown;
}

export class GoogleAdsErrorHandler {
	/**
	 * Handle Google Ads API error by checking error message and codes
	 * Returns structured error information for proper handling
	 */
	static handleError(error: Error | unknown): GoogleAdsErrorInfo {
		// Convert error to string for pattern matching
		let errorBody = '';
		let errorCode: number | undefined;

		if (error instanceof Error) {
			errorBody = error.message;
			// Try to extract error code from message if present
			const codeMatch = error.message.match(/\[(\d+)\]/);
			if (codeMatch?.[1] != null) {
				errorCode = parseInt(codeMatch[1], 10);
			}
		} else if (typeof error === 'object' && error !== null) {
			errorBody = JSON.stringify(error);
			if ('code' in error && typeof error.code === 'number') {
				errorCode = error.code;
			}
		} else {
			errorBody = String(error);
		}

		// Normalize for case-insensitive matching
		const normalizedBody = errorBody.toLowerCase();

		// ============================================================================
		// AUTHENTICATION ERRORS - Require re-authentication
		// ============================================================================

		// Invalid credentials
		if (
			normalizedBody.includes('invalid_grant') ||
			normalizedBody.includes('invalid_credentials') ||
			normalizedBody.includes('authentication failed')
		) {
			return {
				type: 'refresh-token',
				message: 'Invalid credentials. Please re-authenticate your Google Ads account',
				originalError: error,
			};
		}

		// Token expired
		if (
			normalizedBody.includes('token_expired') ||
			normalizedBody.includes('expired_token') ||
			normalizedBody.includes('access token expired')
		) {
			return {
				type: 'refresh-token',
				message: 'Access token expired. Please re-authenticate',
				originalError: error,
			};
		}

		// Token revoked
		if (
			normalizedBody.includes('token_revoked') ||
			normalizedBody.includes('revoked_token') ||
			normalizedBody.includes('token has been revoked')
		) {
			return {
				type: 'refresh-token',
				message: 'Access token has been revoked. Please re-authenticate',
				originalError: error,
			};
		}

		// Unauthorized (401)
		if (errorCode === 401 || normalizedBody.includes('unauthorized')) {
			return {
				type: 'refresh-token',
				message: 'Unauthorized access. Please re-authenticate your Google Ads account',
				originalError: error,
			};
		}

		// ============================================================================
		// PERMISSION ERRORS
		// ============================================================================

		// Forbidden (403)
		if (errorCode === 403 || normalizedBody.includes('forbidden')) {
			return {
				type: 'permission',
				message: 'Permission denied. Please check your Google Ads account permissions',
				originalError: error,
			};
		}

		// Insufficient permissions
		if (
			normalizedBody.includes('insufficient_permissions') ||
			normalizedBody.includes('permission denied') ||
			normalizedBody.includes('access denied')
		) {
			return {
				type: 'permission',
				message: 'Insufficient permissions. Please grant required permissions to your Google Ads account',
				originalError: error,
			};
		}

		// ============================================================================
		// RATE LIMIT ERRORS
		// ============================================================================

		// Rate limit exceeded
		if (
			errorCode === 429 ||
			normalizedBody.includes('rate_limit') ||
			normalizedBody.includes('too many requests') ||
			normalizedBody.includes('quota exceeded')
		) {
			return {
				type: 'rate-limit',
				message: 'Rate limit exceeded. Please try again later',
				originalError: error,
			};
		}

		// ============================================================================
		// VALIDATION ERRORS
		// ============================================================================

		// Bad request (400)
		if (errorCode === 400 || normalizedBody.includes('bad_request')) {
			return {
				type: 'bad-body',
				message: 'Invalid request. Please check your input parameters',
				originalError: error,
			};
		}

		// Validation errors
		if (
			normalizedBody.includes('validation') ||
			normalizedBody.includes('invalid') ||
			normalizedBody.includes('malformed')
		) {
			return {
				type: 'bad-body',
				message: 'Validation error. Please check your request data',
				originalError: error,
			};
		}

		// ============================================================================
		// UNKNOWN ERRORS
		// ============================================================================

		return {
			type: 'unknown',
			message: error instanceof Error ? error.message : 'An unexpected error occurred with Google Ads API',
			originalError: error,
		};
	}
}

