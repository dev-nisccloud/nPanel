import { router } from '../../../trpc';
import { instagramAuthRouter } from './auth';
export const instagramRouter = router({
    /**
     * Authentication and token management endpoints for the standalone
     * Instagram API with Instagram Login flow (instagram.com / api.instagram.com
     * / graph.instagram.com).
     */
    auth: instagramAuthRouter,
});
