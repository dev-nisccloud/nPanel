/**
 * Shared error handling utilities for OAuth system
 * Provides consistent error messages and proper error classification
 */

import { TRPCError } from "@trpc/server";
import type { Context } from "../context";

/**
 * Error severity levels
 */
export type ErrorSeverity = "low" | "medium" | "high" | "critical";

/**
 * OAuth error types
 */
export type OAuthErrorType =
  | "token_expired"
  | "token_revoked"
  | "invalid_scope"
  | "rate_limit"
  | "platform_error"
  | "network_error"
  | "validation_error"
  | "permission_denied"
  | "resource_not_found"
  | "unknown";

/**
 * OAuth error details for logging and debugging
 */
export interface OAuthErrorDetails {
  type: OAuthErrorType;
  severity: ErrorSeverity;
  platform?: string;
  platformErrorCode?: string | number;
  platformErrorMessage?: string;
  requiresReconnect?: boolean;
  retryable?: boolean;
  metadata?: Record<string, unknown>;
}

/**
 * Check if user is a super admin who can see detailed errors
 */
export function isSuperAdmin(ctx?: Context): boolean {
  const role = ctx?.session?.user?.role;
  return role === "AGENCY_SUPER_ADMIN" || role === "SUPER_ADMIN";
}

/**
 * Check if user is any admin role
 */
export function isAdmin(ctx?: Context): boolean {
  const role = ctx?.session?.user?.role;
  return (
    role === "AGENCY_SUPER_ADMIN" ||
    role === "SUPER_ADMIN" ||
    role === "AGENCY_ADMIN"
  );
}

/**
 * Get user-facing error message based on role
 * Super admins get detailed errors, regular users get generic messages
 */
export function getUserFacingMessage(
  details: OAuthErrorDetails,
  ctx?: Context
): string {
  // Super admins get the full technical details
  if (isSuperAdmin(ctx)) {
    const parts = [
      `[${details.type.toUpperCase()}]`,
      details.platformErrorMessage || "OAuth error occurred",
    ];

    if (details.platformErrorCode) {
      parts.push(`(Code: ${details.platformErrorCode})`);
    }

    if (details.platform) {
      parts.push(`[Platform: ${details.platform}]`);
    }

    return parts.join(" ");
  }

  // Regular users and admins get contextual but safe messages
  switch (details.type) {
    case "token_expired":
      return details.platform
        ? `Your ${details.platform} connection has expired. Please reconnect your account.`
        : "Your connection has expired. Please reconnect your account.";

    case "token_revoked":
      return details.platform
        ? `Your ${details.platform} access was revoked. Please reconnect your account.`
        : "Your access was revoked. Please reconnect your account.";

    case "invalid_scope":
      return "Insufficient permissions. Please reconnect and grant all required permissions.";

    case "rate_limit":
      return "Rate limit exceeded. Please try again in a few minutes.";

    case "platform_error":
      return details.platform
        ? `${details.platform} is experiencing issues. Please try again later.`
        : "The platform is experiencing issues. Please try again later.";

    case "network_error":
      return "Network connection issue. Please check your internet and try again.";

    case "validation_error":
      return "Invalid request. Please check your input and try again.";

    case "permission_denied":
      return "You don't have permission to access this resource.";

    case "resource_not_found":
      return "The requested resource was not found or has been deleted.";

    default:
      return "An error occurred. Please try again or contact support if the issue persists.";
  }
}

/**
 * Create a TRPC error with appropriate message for user's role
 */
export function createOAuthError(
  details: OAuthErrorDetails,
  ctx?: Context
): TRPCError {
  const userMessage = getUserFacingMessage(details, ctx);

  // Map OAuth error types to TRPC error codes
  const trpcCode = mapToTRPCCode(details.type);

  return new TRPCError({
    code: trpcCode,
    message: userMessage,
    cause: {
      oauthError: details,
      // Include full details only for super admins
      ...(isSuperAdmin(ctx) && {
        technicalDetails: {
          type: details.type,
          platformErrorCode: details.platformErrorCode,
          platformErrorMessage: details.platformErrorMessage,
          metadata: details.metadata,
        },
      }),
    },
  });
}

/**
 * Map OAuth error type to TRPC error code
 */
function mapToTRPCCode(errorType: OAuthErrorType): TRPCError["code"] {
  switch (errorType) {
    case "token_expired":
    case "token_revoked":
    case "invalid_scope":
      return "UNAUTHORIZED";

    case "permission_denied":
      return "FORBIDDEN";

    case "rate_limit":
      return "TOO_MANY_REQUESTS";

    case "validation_error":
      return "BAD_REQUEST";

    case "resource_not_found":
      return "NOT_FOUND";

    case "platform_error":
    case "network_error":
      return "INTERNAL_SERVER_ERROR";

    default:
      return "INTERNAL_SERVER_ERROR";
  }
}

/**
 * Classify Meta/Facebook Graph API errors
 */
export function classifyMetaError(error: {
  code?: number;
  error_subcode?: number;
  type?: string;
  message?: string;
  error_user_title?: string;
  error_user_msg?: string;
}): OAuthErrorDetails {
  const code = error.code;
  const subcode = error.error_subcode;
  const message = error.message || error.error_user_msg || "";

  // OAuth token errors (code 190)
  if (code === 190) {
    // Subcode 460 = session invalidated
    if (subcode === 460 || message.toLowerCase().includes("session has been invalidated")) {
      return {
        type: "token_revoked",
        severity: "high",
        platform: "Meta",
        platformErrorCode: `${code}:${subcode}`,
        platformErrorMessage: message,
        requiresReconnect: true,
        retryable: false,
      };
    }

    // Subcode 463 = token expired
    if (subcode === 463 || message.toLowerCase().includes("expired")) {
      return {
        type: "token_expired",
        severity: "high",
        platform: "Meta",
        platformErrorCode: `${code}:${subcode}`,
        platformErrorMessage: message,
        requiresReconnect: true,
        retryable: false,
      };
    }

    // Subcode 467 = invalid access token
    if (subcode === 467) {
      return {
        type: "token_revoked",
        severity: "high",
        platform: "Meta",
        platformErrorCode: `${code}:${subcode}`,
        platformErrorMessage: message,
        requiresReconnect: true,
        retryable: false,
      };
    }

    // Generic OAuth error
    return {
      type: "token_revoked",
      severity: "high",
      platform: "Meta",
      platformErrorCode: code,
      platformErrorMessage: message,
      requiresReconnect: true,
      retryable: false,
    };
  }

  // Permission errors (code 200)
  if (code === 200) {
    return {
      type: "permission_denied",
      severity: "medium",
      platform: "Meta",
      platformErrorCode: code,
      platformErrorMessage: message,
      requiresReconnect: false,
      retryable: false,
    };
  }

  // Permission errors (code 10)
  if (code === 10) {
    return {
      type: "permission_denied",
      severity: "medium",
      platform: "Meta",
      platformErrorCode: code,
      platformErrorMessage: message,
      requiresReconnect: false,
      retryable: false,
    };
  }

  // Rate limit (code 4, 17, 32, or 613)
  if ([4, 17, 32, 613].includes(code || 0)) {
    return {
      type: "rate_limit",
      severity: "low",
      platform: "Meta",
      platformErrorCode: code,
      platformErrorMessage: message,
      requiresReconnect: false,
      retryable: true,
    };
  }

  // Invalid parameters (code 100)
  if (code === 100) {
    return {
      type: "validation_error",
      severity: "low",
      platform: "Meta",
      platformErrorCode: code,
      platformErrorMessage: message,
      requiresReconnect: false,
      retryable: false,
    };
  }

  // Service/platform errors (code 1, 2, 368)
  if ([1, 2, 368].includes(code || 0)) {
    return {
      type: "platform_error",
      severity: "medium",
      platform: "Meta",
      platformErrorCode: code,
      platformErrorMessage: message,
      requiresReconnect: false,
      retryable: true,
    };
  }

  // Resource not found (code 803, 100 with specific message)
  if (code === 803 || message.toLowerCase().includes("does not exist")) {
    return {
      type: "resource_not_found",
      severity: "low",
      platform: "Meta",
      platformErrorCode: code,
      platformErrorMessage: message,
      requiresReconnect: false,
      retryable: false,
    };
  }

  // Default: unknown error
  return {
    type: "unknown",
    severity: "medium",
    platform: "Meta",
    platformErrorCode: code,
    platformErrorMessage: message,
    requiresReconnect: false,
    retryable: false,
  };
}

/**
 * Handle network/fetch errors
 */
export function classifyNetworkError(error: Error): OAuthErrorDetails {
  const message = error.message.toLowerCase();

  if (message.includes("timeout") || message.includes("timed out")) {
    return {
      type: "network_error",
      severity: "low",
      platformErrorMessage: "Request timed out",
      retryable: true,
    };
  }

  if (
    message.includes("enotfound") ||
    message.includes("econnrefused") ||
    message.includes("network")
  ) {
    return {
      type: "network_error",
      severity: "medium",
      platformErrorMessage: "Network connection failed",
      retryable: true,
    };
  }

  return {
    type: "unknown",
    severity: "medium",
    platformErrorMessage: error.message,
    retryable: false,
  };
}

/**
 * Log OAuth error for debugging (to be consumed by logging middleware)
 */
export function logOAuthError(
  details: OAuthErrorDetails,
  context: {
    userId?: string;
    connectionId?: string;
    assetId?: string;
    action?: string;
  }
): void {
  // In production, this would send to your logging service
  // For now, log to console with structured data
  console.error("[OAuth Error]", {
    ...details,
    ...context,
    timestamp: new Date().toISOString(),
  });
}

/**
 * Determine if error should trigger a reconnect requirement
 */
export function shouldRequireReconnect(details: OAuthErrorDetails): boolean {
  return details.requiresReconnect === true || 
    details.type === "token_expired" || 
    details.type === "token_revoked";
}

/**
 * Determine if operation should be retried
 */
export function shouldRetry(details: OAuthErrorDetails, retryCount: number): boolean {
  if (!details.retryable) {
    return false;
  }

  // Max 3 retries for retryable errors
  if (retryCount >= 3) {
    return false;
  }

  // Always retry rate limits and network errors
  return details.type === "rate_limit" || 
    details.type === "network_error" || 
    details.type === "platform_error";
}

/**
 * Calculate retry delay with exponential backoff
 */
export function getRetryDelay(retryCount: number, errorType: OAuthErrorType): number {
  // Rate limits: start with 60 seconds
  if (errorType === "rate_limit") {
    return Math.min(60000 * Math.pow(2, retryCount), 300000); // Max 5 minutes
  }

  // Platform/network errors: start with 5 seconds
  return Math.min(5000 * Math.pow(2, retryCount), 60000); // Max 1 minute
}
