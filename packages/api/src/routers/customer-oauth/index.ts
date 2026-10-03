/**
 * Customer OAuth Main Router
 * Aggregates all OAuth-related routers
 */

import { router } from "../../trpc";
import { customerOAuthAuthRouter } from "./auth";
import { customerOAuthConnectionsRouter } from "./connections";
import { customerOAuthAssetsRouter } from "./assets";

export const customerOAuthRouter = router({
  auth: customerOAuthAuthRouter,
  connections: customerOAuthConnectionsRouter,
  assets: customerOAuthAssetsRouter,
});
