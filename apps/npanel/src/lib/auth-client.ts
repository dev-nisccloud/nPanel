import { createAuthClient } from "better-auth/react";

export const authClient = createAuthClient({
  baseURL: process.env.BETTER_AUTH_URL,
  fetchOptions: {
    onError(e) {
      // Log errors but don't throw - let the calling code handle them
      console.error("Auth client error:", e);
    },
  },
});
