/**
 * Customer OAuth Main Router
 * Aggregates all OAuth-related routers
 */

import { router } from "../../trpc";
import { customerOAuthAssetsRouter } from "./assets";
import { customerOAuthAuthRouter } from "./auth";
import { customerOAuthCampaignsRouter } from "./campaigns";
import { customerOAuthConnectionsRouter } from "./connections";
import { customerOAuthFacebookPagesRouter } from "./facebook-pages";
import { customerOAuthGoogleRouter } from "./google";
import { customerOAuthLinkedInRouter } from "./linkedin";

export const customerOAuthRouter = router({
  auth: customerOAuthAuthRouter,
  connections: customerOAuthConnectionsRouter,
  assets: customerOAuthAssetsRouter,
  campaigns: customerOAuthCampaignsRouter,
  facebookPages: customerOAuthFacebookPagesRouter,
  linkedin: customerOAuthLinkedInRouter,
  google: customerOAuthGoogleRouter,
});
