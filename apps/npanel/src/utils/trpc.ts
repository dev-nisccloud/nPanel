import { QueryCache, QueryClient } from "@tanstack/react-query";
import { createTRPCReact } from "@trpc/react-query";
import type { AppRouter } from "@nPanel/api";
import { toast } from "sonner";

export const queryClient = new QueryClient({
	queryCache: new QueryCache({
		onError: (error) => {
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
