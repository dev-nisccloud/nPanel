import { AccountOverview } from "./agency.finance/_components/account-overview";
import { CurrencyExchange } from "./agency.finance/_components/currency-exchange";
import { ExpenseSummary } from "./agency.finance/_components/expense-summary";
import { FinancialOverview } from "./agency.finance/_components/financial-overview";

export default function Page() {
  return (
    <div className="@container/main flex flex-col gap-4 md:gap-6 px-4 md:px-6 lg:px-8 py-4 md:py-6">
      <div className="w-full max-w-7xl mx-auto">
        <div className="flex flex-col gap-2 mb-6">
          <h1 className="text-base font-semibold tracking-tight">Financial Overview</h1>
          <p className="text-xs text-muted-foreground">
            Monitor your agency's financial health, track expenses, and manage currency exchange.
          </p>
        </div>
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          <div className="flex flex-col gap-4 lg:col-span-1">
            <AccountOverview />
          </div>

          <div className="flex flex-col gap-4 lg:col-span-2">
            <div className="flex-1">
              <FinancialOverview />
            </div>
            <div className="grid flex-1 grid-cols-1 gap-4 *:data-[slot=card]:shadow-xs md:grid-cols-2">
              <ExpenseSummary />
              <CurrencyExchange />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
