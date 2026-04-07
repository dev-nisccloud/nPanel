import { router } from '../../../trpc';
import { metaPagesListRouter } from './pages-list';
import { metaPageContentRouter } from './page-content';
import { metaAuthRouter } from './auth';
import { metaContentCalendarRouter } from './content-calendar';
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
    /**
     * Content calendar management endpoints (CRUD operations for scheduled posts)
     */
    contentCalendar: metaContentCalendarRouter,
});
