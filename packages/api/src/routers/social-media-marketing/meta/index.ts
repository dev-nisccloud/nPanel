import { router } from '../../../trpc';
import { metaPagesListRouter } from './pages-list';
import { metaPageContentRouter } from './page-content';
import { metaAuthRouter } from './auth';

export const metaRouter = router({
	/**
	 * Authentication and token management endpoints
	 */
	auth: metaAuthRouter,

	/**
	 * Pages list management endpoints
	 */
	pages: metaPagesListRouter,

	/**
	 * Page content management endpoints (posts, photos, videos, events)
	 */
	content: metaPageContentRouter,
});

