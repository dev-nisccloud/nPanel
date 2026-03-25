import { router } from '../../../trpc';
import { linkedinPagesListRouter } from './pages-list';
import { linkedinAuthRouter } from './auth';
import { linkedinContentCalendarRouter } from './content-calendar';
import { linkedinPageContentRouter } from './page-content';

export const linkedinRouter = router({
	/**
	 * Authentication and token management endpoints
	 */
	auth: linkedinAuthRouter,

	/**
	 * Organizations list management endpoints
	 */
	pages: linkedinPagesListRouter,

	/**
	 * Organization content and publishing endpoints
	 */
	content: linkedinPageContentRouter,

	/**
	 * Content calendar management endpoints (CRUD operations for scheduled posts)
	 */
	contentCalendar: linkedinContentCalendarRouter,
});

