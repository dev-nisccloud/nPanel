import { createAuthClient } from "better-auth/react";

// Use same-origin requests so auth cookies are included reliably in the browser
export const authClient = createAuthClient({
  fetchOptions: {
    onError(e) {
      console.error("Auth client error:", e);
    },
  },
});
