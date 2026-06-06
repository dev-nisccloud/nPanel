import { protectedProcedure } from "../../trpc";
import { hivelocityErrorMiddleware } from "../../lib/hivelocity-errors";
export const hivelocityProcedure = protectedProcedure.use(hivelocityErrorMiddleware);
