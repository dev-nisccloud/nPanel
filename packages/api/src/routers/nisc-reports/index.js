import { router } from "../../trpc";
import { niscRevenueRouter } from "./revenue";
import { niscInvoicesRouter } from "./invoices";
import { niscQuotationsRouter } from "./quotations";
import { niscSubscriptionsRouter } from "./subscriptions";
import { niscClientsRouter } from "./clients";
import { niscProfitabilityRouter } from "./profitability";
import { niscPaymentsRouter } from "./payments";
import { niscTaxRouter } from "./tax";
export const niscReportsRouter = router({
    revenue: niscRevenueRouter,
    invoices: niscInvoicesRouter,
    quotations: niscQuotationsRouter,
    subscriptions: niscSubscriptionsRouter,
    clients: niscClientsRouter,
    profitability: niscProfitabilityRouter,
    payments: niscPaymentsRouter,
    tax: niscTaxRouter,
});
