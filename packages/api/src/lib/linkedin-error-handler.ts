import { LinkedInApiError } from './linkedin-client';

/**
 * Error types that can be returned by LinkedIn API error handler
 */
export type LinkedInErrorType = 'refresh-token' | 'bad-body' | 'unknown';

/**
 * Structured error information from LinkedIn API error handler
 */
export interface LinkedInErrorInfo {
	type: LinkedInErrorType;
	message: string;
	originalError?: LinkedInApiError;
}

/**
 * Comprehensive error handler for LinkedIn API errors
 * Based on common error codes and messages from LinkedIn API
 * 
 * This handler categorizes errors into:
 * - refresh-token: Requires re-authentication (token expired, revoked, etc.)
 * - bad-body: Content/parameter validation errors
 * - unknown: Unhandled errors
 */
export class LinkedInErrorHandler {
	/**
	 * Handle LinkedIn API error by checking error message and codes
	 * Returns structured error information for proper handling
	 */
	static handleError(error: LinkedInApiError | Error | string): LinkedInErrorInfo | undefined {
		// Convert error to string for pattern matching
		let errorBody = '';
		
		if (error instanceof LinkedInApiError) {
			errorBody = `${error.message} ${error.status} ${error.serviceErrorCode || ''}`;
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
		
		// 401: Unauthorized - Invalid or expired token
		if (
			error instanceof LinkedInApiError && error.status === 401 ||
			normalizedBody.indexOf('unauthorized') > -1 ||
			normalizedBody.indexOf('invalid token') > -1 ||
			normalizedBody.indexOf('expired token') > -1 ||
			normalizedBody.indexOf('invalid access token') > -1
		) {
			return {
				type: 'refresh-token',
				message: 'Invalid or expired access token. Please re-authenticate your LinkedIn account',
				originalError: error instanceof LinkedInApiError ? error : undefined,
			};
		}

		// 403: Forbidden - Insufficient permissions
		if (
			error instanceof LinkedInApiError && error.status === 403 ||
			normalizedBody.indexOf('forbidden') > -1 ||
			normalizedBody.indexOf('insufficient permissions') > -1 ||
			normalizedBody.indexOf('permission denied') > -1
		) {
			return {
				type: 'refresh-token',
				message: 'Insufficient permissions. Please re-authenticate with required permissions (w_organization_social, rw_organization_admin)',
				originalError: error instanceof LinkedInApiError ? error : undefined,
			};
		}

		// Token revoked
		if (
			normalizedBody.indexOf('revoked') > -1 ||
			normalizedBody.indexOf('token revoked') > -1
		) {
			return {
				type: 'refresh-token',
				message: 'Access token has been revoked, please re-authenticate',
				originalError: error instanceof LinkedInApiError ? error : undefined,
			};
		}

		// ============================================================================
		// CONTENT POLICY VIOLATIONS - Bad body/content errors
		// ============================================================================
		
		// 400: Bad Request - Content validation errors
		if (
			error instanceof LinkedInApiError && error.status === 400 ||
			normalizedBody.indexOf('bad request') > -1 ||
			normalizedBody.indexOf('invalid parameter') > -1 ||
			normalizedBody.indexOf('validation error') > -1
		) {
			// Check for duplicate content specifically
			if (
				normalizedBody.indexOf('duplicate') > -1 ||
				normalizedBody.indexOf('content is a duplicate') > -1 ||
				normalizedBody.indexOf('badrequestresponseexception') > -1
			) {
				return {
					type: 'bad-body',
					message: 'This content has already been posted. LinkedIn does not allow duplicate posts.',
					originalError: error instanceof LinkedInApiError ? error : undefined,
				};
			}
			
			// Check for specific content errors
			if (
				normalizedBody.indexOf('content policy') > -1 ||
				normalizedBody.indexOf('community guidelines') > -1 ||
				normalizedBody.indexOf('prohibited content') > -1
			) {
				return {
					type: 'bad-body',
					message: 'Content violates LinkedIn Community Guidelines',
					originalError: error instanceof LinkedInApiError ? error : undefined,
				};
			}

			return {
				type: 'bad-body',
				message: 'Invalid request. Please check your post content and parameters',
				originalError: error instanceof LinkedInApiError ? error : undefined,
			};
		}

		// Media errors
		if (
			normalizedBody.indexOf('media') > -1 && (
				normalizedBody.indexOf('invalid') > -1 ||
				normalizedBody.indexOf('unsupported') > -1 ||
				normalizedBody.indexOf('too large') > -1
			)
		) {
			return {
				type: 'bad-body',
				message: 'Invalid media file. Please check file format and size (max 200MB for videos, 10MB for images)',
				originalError: error instanceof LinkedInApiError ? error : undefined,
			};
		}

		// Post constraints
		if (
			normalizedBody.indexOf('carousel') > -1 && normalizedBody.indexOf('minimum') > -1 ||
			normalizedBody.indexOf('at least 2') > -1 && normalizedBody.indexOf('photo') > -1
		) {
			return {
				type: 'bad-body',
				message: 'Carousel posts require at least 2 photos',
				originalError: error instanceof LinkedInApiError ? error : undefined,
			};
		}

		if (
			normalizedBody.indexOf('video') > -1 && normalizedBody.indexOf('multiple') > -1 ||
			normalizedBody.indexOf('only one video') > -1
		) {
			return {
				type: 'bad-body',
				message: 'Only one video is allowed per post',
				originalError: error instanceof LinkedInApiError ? error : undefined,
			};
		}

		// ============================================================================
		// RATE LIMITING ERRORS - Bad body (temporary issues)
		// ============================================================================

		// 429: Too Many Requests
		if (
			error instanceof LinkedInApiError && error.status === 429 ||
			normalizedBody.indexOf('too many requests') > -1 ||
			normalizedBody.indexOf('rate limit') > -1 ||
			normalizedBody.indexOf('throttle') > -1
		) {
			return {
				type: 'bad-body',
				message: 'Rate limit exceeded. Please wait a moment and try again',
				originalError: error instanceof LinkedInApiError ? error : undefined,
			};
		}

		// ============================================================================
		// SERVICE ERRORS - Bad body (temporary issues)
		// ============================================================================

		// 500: Internal Server Error
		if (
			error instanceof LinkedInApiError && error.status === 500 ||
			normalizedBody.indexOf('internal server error') > -1 ||
			normalizedBody.indexOf('service error') > -1
		) {
			return {
				type: 'bad-body',
				message: 'LinkedIn service temporarily unavailable. Please try again later',
				originalError: error instanceof LinkedInApiError ? error : undefined,
			};
		}

		// 503: Service Unavailable
		if (
			error instanceof LinkedInApiError && error.status === 503 ||
			normalizedBody.indexOf('service unavailable') > -1 ||
			normalizedBody.indexOf('temporarily unavailable') > -1
		) {
			return {
				type: 'bad-body',
				message: 'LinkedIn service temporarily unavailable. Please try again later',
				originalError: error instanceof LinkedInApiError ? error : undefined,
			};
		}

		// ============================================================================
		// NOT FOUND ERRORS - Bad body
		// ============================================================================

		// 404: Not Found
		if (
			error instanceof LinkedInApiError && error.status === 404 ||
			normalizedBody.indexOf('not found') > -1 ||
			normalizedBody.indexOf('organization not found') > -1
		) {
			return {
				type: 'bad-body',
				message: 'Organization not found or access denied',
				originalError: error instanceof LinkedInApiError ? error : undefined,
			};
		}

		// Unknown error - return undefined to let default handling proceed
		return undefined;
	}

	/**
	 * Check if error requires token refresh
	 */
	static requiresTokenRefresh(error: LinkedInApiError | Error | string): boolean {
		const errorInfo = this.handleError(error);
		return errorInfo?.type === 'refresh-token';
	}

	/**
	 * Check if error is a content/body validation error
	 */
	static isBadBodyError(error: LinkedInApiError | Error | string): boolean {
		const errorInfo = this.handleError(error);
		return errorInfo?.type === 'bad-body';
	}

	/**
	 * Get user-friendly error message
	 */
	static getErrorMessage(error: LinkedInApiError | Error | string): string {
		const errorInfo = this.handleError(error);
		
		if (errorInfo) {
			return errorInfo.message;
		}

		// Fallback to original error message
		if (error instanceof LinkedInApiError) {
			return error.message;
		}
		
		if (error instanceof Error) {
			return error.message;
		}

		return 'An unknown error occurred with the LinkedIn API';
	}
}



