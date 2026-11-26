"use client";

import { authClient } from "@/lib/auth-client";
import { usePreferencesStore } from "@/stores/preferences/preferences-provider";
import { toast } from "@/components/ui/sonner";
import { trpc } from "@/utils/trpc";

export function DisplayCurrencyPreference() {
  const { data: session } = authClient.useSession();
  const currency = usePreferencesStore((state) => state.displayCurrency);
  const setCurrency = usePreferencesStore((state) => state.setDisplayCurrency);
  const utils = trpc.useUtils();
  const impersonatedBy = (
    session?.session as { impersonatedBy?: string | null } | undefined
  )?.impersonatedBy;
  const updatePreference = trpc.user.updateDisplayCurrencyPreference.useMutation({
    onSuccess: async () => {
      await utils.user.getDisplayCurrencyPreference.invalidate();
      toast.success("Display currency updated");
    },
    onError: async (error) => {
      await utils.user.getDisplayCurrencyPreference.invalidate();
      toast.error("Could not update display currency", {
        description: error.message,
      });
    },
  });

  return (
    <section className="rounded-xl border border-border bg-card p-5">
      <div className="max-w-2xl">
        <h2 className="text-base font-semibold text-foreground">Display currency</h2>
        <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
          Choose how new catalogue prices are displayed across nPanel and the Nisc Cloud website.
          Existing quotes, orders, payments and invoices keep their original currency.
        </p>
      </div>
      <label className="mt-4 flex max-w-md flex-col gap-2 text-sm font-medium text-foreground">
        Preferred display currency
        <select
          value={currency}
          disabled={updatePreference.isPending || Boolean(impersonatedBy)}
          onChange={(event) => {
            const next = event.target.value as "KES" | "USD";
            setCurrency(next);
            updatePreference.mutate({ currency: next });
          }}
          className="h-10 rounded-lg border border-input bg-background px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-60"
        >
          <option value="KES">KES — Kenyan shilling</option>
          <option value="USD">USD — US dollar</option>
        </select>
      </label>
      {impersonatedBy ? (
        <p className="mt-3 text-xs text-muted-foreground">
          Currency preferences cannot be changed while viewing an impersonated account.
        </p>
      ) : null}
    </section>
  );
}
