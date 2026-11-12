"use client";

import { createContext, useContext, useEffect, useRef } from "react";

import { useStore, type StoreApi } from "zustand";

import { createPreferencesStore } from "./preferences-store";
import type { PreferencesState } from "./preferences-store";
import { authClient } from "@/lib/auth-client";
import { trpc } from "@/utils/trpc";

const PreferencesStoreContext = createContext<StoreApi<PreferencesState> | null>(null);

function DisplayCurrencyPreferenceSync() {
  const { data: session, isPending } = authClient.useSession();
  const setDisplayCurrency = usePreferencesStore((state) => state.setDisplayCurrency);
  const impersonatedBy = (
    session?.session as { impersonatedBy?: string | null } | undefined
  )?.impersonatedBy;
  const canSync = !isPending && Boolean(session?.user?.id) && !impersonatedBy;
  const preference = trpc.user.getDisplayCurrencyPreference.useQuery(undefined, {
    enabled: canSync,
    staleTime: 5 * 60 * 1_000,
  });

  useEffect(() => {
    const currency = preference.data?.currency;
    if (currency === "KES" || currency === "USD") {
      setDisplayCurrency(currency);
    }
  }, [preference.data?.currency, setDisplayCurrency]);

  return null;
}

export const PreferencesStoreProvider = ({
  children,
  themeMode,
  themePreset,
}: {
  children: React.ReactNode;
  themeMode: PreferencesState["themeMode"];
  themePreset: PreferencesState["themePreset"];
}) => {
  const storeRef = useRef<StoreApi<PreferencesState> | null>(null);

  storeRef.current ??= createPreferencesStore({ themeMode, themePreset });

  return (
    <PreferencesStoreContext.Provider value={storeRef.current}>
      <DisplayCurrencyPreferenceSync />
      {children}
    </PreferencesStoreContext.Provider>
  );
};

export const usePreferencesStore = <T,>(selector: (state: PreferencesState) => T): T => {
  const store = useContext(PreferencesStoreContext);
  if (!store) throw new Error("Missing PreferencesStoreProvider");
  return useStore(store, selector);
};
