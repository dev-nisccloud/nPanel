import { auth } from "@nPanel/auth";
import { toNextJsHandler } from "better-auth/next-js";

// Force Node.js runtime for Better Auth
export const runtime = 'nodejs';

export const { GET, POST } = toNextJsHandler(auth.handler);
