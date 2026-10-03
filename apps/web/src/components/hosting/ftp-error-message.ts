"use client";

import { useCallback } from "react";

import { authClient } from "@/lib/auth-client";

export const FTP_USER_ERROR_MESSAGE =
	"An error occurred. Please try again later or contact support.";

export function ftpErrorMessageForRole(error: unknown, role?: string | null): string {
	const isSuperAdmin = role?.trim().toUpperCase() === "AGENCY_SUPER_ADMIN";
	if (isSuperAdmin && error instanceof Error) {
		const message = error.message.trim();
		if (message) return message;
	}
	return FTP_USER_ERROR_MESSAGE;
}

export function useFtpErrorMessage() {
	const { data: session } = authClient.useSession();
	const role = (session?.user as { role?: string } | undefined)?.role;
	return useCallback((error: unknown) => ftpErrorMessageForRole(error, role), [role]);
}
