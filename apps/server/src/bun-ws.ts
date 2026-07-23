import { createBunWebSocket } from "hono/bun";

/** Shared Bun websocket bridge — kept separate so the HTTP server can bind before the full app graph loads. */
export const { upgradeWebSocket, websocket } = createBunWebSocket();
