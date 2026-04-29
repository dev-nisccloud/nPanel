import { router } from "../../trpc";
import { digitaxBranchesRouter } from "./branches";
import { digitaxItemsRouter } from "./items";
import { digitaxCustomersRouter } from "./customers";
import { digitaxPurchasesRouter } from "./purchases";
import { digitaxSalesRouter } from "./sales";
import { digitaxNoticesRouter } from "./notices";
import { digitaxVerificationsRouter } from "./verifications";
export const digitaxRouter = router({
    branches: digitaxBranchesRouter,
    items: digitaxItemsRouter,
    customers: digitaxCustomersRouter,
    purchases: digitaxPurchasesRouter,
    sales: digitaxSalesRouter,
    notices: digitaxNoticesRouter,
    verifications: digitaxVerificationsRouter,
});
