import { router } from "../../trpc";
import { salesReportsRouter } from "./sales";
import { creativeReportsRouter } from "./creative";

export const reportsRouter = router({
    sales: salesReportsRouter,
    creative: creativeReportsRouter,
});
