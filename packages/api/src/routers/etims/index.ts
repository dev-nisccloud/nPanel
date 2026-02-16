import { router } from "../../trpc";
import { etimsAuthRouter } from "./auth";
import { etimsInitializationRouter } from "./initialization";
import { etimsDataRouter } from "./data";
import { etimsBranchRouter } from "./branch";
import { etimsItemsRouter } from "./items";
import { etimsImportsRouter } from "./imports";
import { etimsSalesRouter } from "./sales";
import { etimsPurchasesRouter } from "./purchases";
import { etimsStockRouter } from "./stock";

export const etimsRouter = router({
    auth: etimsAuthRouter,
    initialization: etimsInitializationRouter,
    data: etimsDataRouter,
    branch: etimsBranchRouter,
    items: etimsItemsRouter,
    imports: etimsImportsRouter,
    sales: etimsSalesRouter,
    purchases: etimsPurchasesRouter,
    stock: etimsStockRouter,
});
