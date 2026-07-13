import { QueryCache, QueryClient } from "@tanstack/react-query";
import { createTRPCReact } from "@trpc/react-query";
import type { AppRouter } from "@npanel/api";
import type { inferRouterInputs, inferRouterOutputs } from "@trpc/server";

import { toast } from "@/components/ui/sonner";
import { redirectToMfa, redirectToReauth } from "@/lib/auth-redirect";

function handleAuthStepUpError(error: { message?: string }): boolean {
	const message = error.message ?? "";
	if (message === "REAUTH_REQUIRED") {
		redirectToReauth();
		return true;
	}
	if (message === "MFA_REQUIRED" || message === "MFA_SETUP_REQUIRED") {
		redirectToMfa();
		return true;
	}
	return false;
}

export const queryClient = new QueryClient({
	queryCache: new QueryCache({
		onError: (error) => {
			if (handleAuthStepUpError(error)) return;
			toast.error(error.message, {
				action: {
					label: "retry",
					onClick: () => {
						queryClient.invalidateQueries();
					},
				},
			});
		},
	}),
});

export const trpc = createTRPCReact<AppRouter>();

export type RouterInputs = inferRouterInputs<AppRouter>;
export type RouterOutputs = inferRouterOutputs<AppRouter>;
