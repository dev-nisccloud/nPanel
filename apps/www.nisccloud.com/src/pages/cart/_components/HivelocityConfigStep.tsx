import * as React from "react";
import { Skeleton } from "@/components/ui/skeleton.tsx";
import { HivelocityHostnameField } from "./HivelocityHostnameField.tsx";
import { ServerNameplate } from "./ServerNameplate.tsx";
import { AppPicker, ConfigSection, OsPicker, PanelPicker, UpgradePicker } from "./server-pickers.tsx";
import {
  cleanOptionName,
  describeCompatibleOs,
  groupKind,
  groupOsFamilies,
  groupPanels,
  hasRealChoice,
  isNoneOption,
  osDisplayName,
  serverSpecs,
  type PanelProduct,
} from "./server-options.ts";
import {
  fetchExchangeRatesPublic,
  fetchFacilitiesPublic,
  fetchHivelocityOperatingSystems,
  fetchHivelocityProductOptions,
  fetchVpsPricingSettings,
  formatOptionPriceKes,
  type HivelocityAddonOption,
  type HivelocityOsOption,
  type PricingSettings,
} from "@/lib/vps-plans-api.ts";
import {
  generateDefaultHivelocityHostname,
  isValidHivelocityHostname,
  type HivelocityDefaultHostnameProductType,
} from "@/lib/hivelocity-default-hostname.ts";
import { filterStorefrontHivelocityAddonGroups } from "@/lib/hivelocity-addon-groups.ts";
import {
  collectHivelocityOptionTags,
  dedupeExclusiveGroupOptionIds,
  evaluateHivelocityCompatibilityExpression,
  getHivelocityAddonDisabledDetails,
  validateHivelocityOptionSelection,
} from "@/lib/hivelocity-option-compatibility.ts";

export interface HivelocityPricingContext {
  osList: HivelocityOsOption[];
  addonGroups: Record<string, HivelocityAddonOption[]>;
  pricing: PricingSettings | null;
  kesRate: number | null;
  loading: boolean;
  loadError: string | null;
  selectionValid: boolean;
}

export interface HivelocityCheckoutConfig {
  hostname: string;
  selectedOsId: string;
  selectedOsName: string;
  hivelocityOsOptionId: number | null;
  selectedOptionIds: number[];
  hivelocityPeriod: "monthly";
  locationName: string;
  hivelocityProductId: number;
  productType: HivelocityDefaultHostnameProductType;
}

export function createInitialHivelocityConfig(params: {
  productType: HivelocityDefaultHostnameProductType;
  hivelocityProductId: number;
  locationName: string;
}): HivelocityCheckoutConfig {
  return {
    hostname: generateDefaultHivelocityHostname(params.productType),
    selectedOsId: "",
    selectedOsName: "",
    hivelocityOsOptionId: null,
    selectedOptionIds: [],
    hivelocityPeriod: "monthly",
    locationName: params.locationName,
    hivelocityProductId: params.hivelocityProductId,
    productType: params.productType,
  };
}

export function isHivelocityConfigComplete(config: HivelocityCheckoutConfig): boolean {
  return Boolean(config.selectedOsId && isValidHivelocityHostname(config.hostname));
}

const PRODUCT_LABELS: Record<HivelocityDefaultHostnameProductType, string> = {
  VPS: "VPS",
  VDS: "VDS",
  DEDICATED_SERVERS: "Dedicated server",
};

interface HivelocityConfigStepProps {
  config: HivelocityCheckoutConfig;
  onChange: (next: HivelocityCheckoutConfig) => void;
  onPricingContext?: (ctx: HivelocityPricingContext) => void;
  planName?: string;
}

export function HivelocityConfigStep({ config, onChange, onPricingContext, planName }: HivelocityConfigStepProps) {
  const [osList, setOsList] = React.useState<HivelocityOsOption[]>([]);
  const [addonGroups, setAddonGroups] = React.useState<Record<string, HivelocityAddonOption[]>>({});
  const [pricing, setPricing] = React.useState<PricingSettings | null>(null);
  const [kesRate, setKesRate] = React.useState<number | null>(null);
  const [locationTitle, setLocationTitle] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [loadError, setLoadError] = React.useState<string | null>(null);

  /** Groups the buyer can choose from. Location is set on the plan card, so it is not offered again here. */
  const selectableGroups = React.useMemo(() => {
    const visible = filterStorefrontHivelocityAddonGroups(addonGroups, config.productType);
    return Object.fromEntries(
      Object.entries(visible).filter(([group, options]) => {
        const kind = groupKind(group);
        return kind !== "location" && kind !== "os" && hasRealChoice(options);
      }),
    ) as Record<string, HivelocityAddonOption[]>;
  }, [addonGroups, config.productType]);

  const selectedOs = React.useMemo(
    () => osList.find((os) => String(os.id) === config.selectedOsId) ?? null,
    [osList, config.selectedOsId],
  );
  const selectedOsFeatures = React.useMemo(() => selectedOs?.operatingSystemFeatures ?? {}, [selectedOs]);
  const allProductOptions = React.useMemo(() => Object.values(addonGroups).flat(), [addonGroups]);
  const selectedOptions = React.useMemo(
    () => allProductOptions.filter((opt) => config.selectedOptionIds.includes(opt.id)),
    [allProductOptions, config.selectedOptionIds],
  );
  const selectedOptionIdStrings = React.useMemo(() => config.selectedOptionIds.map(String), [config.selectedOptionIds]);

  const selectionValidation = React.useMemo(
    () =>
      validateHivelocityOptionSelection({
        os: selectedOs,
        allOptions: allProductOptions,
        selectedOptionIds: selectedOptionIdStrings,
        groupedOptions: selectableGroups,
        osFeatures: selectedOsFeatures,
      }),
    [selectedOs, allProductOptions, selectedOptionIdStrings, selectableGroups, selectedOsFeatures],
  );

  const getAddonDisabledDetails = React.useCallback(
    (addon: HivelocityAddonOption, groupName?: string, includeInTagSet = false) => {
      const otherSelected = includeInTagSet ? selectedOptions : selectedOptions.filter((o) => o.id !== addon.id);
      return getHivelocityAddonDisabledDetails({
        addon,
        groupName,
        os: selectedOs,
        osFeatures: selectedOsFeatures,
        selectedTags: collectHivelocityOptionTags(selectedOs, otherSelected),
      });
    },
    [selectedOptions, selectedOs, selectedOsFeatures],
  );

  React.useEffect(() => {
    onPricingContext?.({
      osList,
      addonGroups: selectableGroups,
      pricing,
      kesRate,
      loading,
      loadError,
      selectionValid: selectionValidation.ok,
    });
  }, [osList, selectableGroups, pricing, kesRate, loading, loadError, selectionValidation.ok, onPricingContext]);

  React.useEffect(() => {
    let active = true;
    setLoading(true);
    setLoadError(null);

    Promise.all([
      fetchHivelocityOperatingSystems(config.hivelocityProductId),
      fetchHivelocityProductOptions(config.hivelocityProductId),
      fetchVpsPricingSettings(config.productType),
      fetchExchangeRatesPublic(),
    ])
      .then(([os, addons, settings, rate]) => {
        if (!active) return;
        setOsList(os);
        setAddonGroups(addons);
        setPricing(settings);
        setKesRate(rate);
      })
      .catch((err) => {
        if (!active) return;
        setLoadError(err instanceof Error ? err.message : "Server options could not be loaded.");
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [config.hivelocityProductId, config.productType]);

  React.useEffect(() => {
    let active = true;
    fetchFacilitiesPublic()
      .then((facilities) => {
        if (active) setLocationTitle(facilities.find((f) => f.code === config.locationName)?.title ?? null);
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, [config.locationName]);

  /** Drop selections from groups that are not offered. */
  React.useEffect(() => {
    if (loading) return;
    const visibleIds = new Set(Object.values(selectableGroups).flat().map((o) => o.id));
    const pruned = config.selectedOptionIds.filter((id) => visibleIds.has(id));
    if (pruned.length !== config.selectedOptionIds.length) {
      onChange({ ...config, selectedOptionIds: pruned });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectableGroups, loading]);

  /** One option per exclusive category. */
  React.useEffect(() => {
    if (!config.selectedOptionIds.length || !Object.keys(addonGroups).length) return;
    const deduped = dedupeExclusiveGroupOptionIds(addonGroups, selectedOptionIdStrings).map(Number);
    if (deduped.length !== config.selectedOptionIds.length || deduped.some((id, i) => id !== config.selectedOptionIds[i])) {
      onChange({ ...config, selectedOptionIds: deduped });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [addonGroups, config.selectedOptionIds.length]);

  /** Remove add-ons that became incompatible after an OS or add-on change. */
  React.useEffect(() => {
    if (!selectedOs || !config.selectedOptionIds.length) return;
    const incompatible = new Set<number>();
    for (const [group, options] of Object.entries(selectableGroups)) {
      for (const opt of options) {
        if (!config.selectedOptionIds.includes(opt.id)) continue;
        if (getAddonDisabledDetails(opt, group, true)) incompatible.add(opt.id);
      }
    }
    if (!incompatible.size) return;
    onChange({ ...config, selectedOptionIds: config.selectedOptionIds.filter((id) => !incompatible.has(id)) });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedOs, selectedOsFeatures, config.selectedOptionIds.join(","), selectableGroups]);

  const osPrice = React.useCallback((usd: number) => formatOptionPriceKes(usd, pricing?.os ?? null, kesRate), [pricing, kesRate]);
  const addonPrice = React.useCallback((usd: number) => formatOptionPriceKes(usd, pricing?.addons ?? null, kesRate), [pricing, kesRate]);

  const osPatch = (os: HivelocityOsOption) => ({
    selectedOsId: String(os.id),
    selectedOsName: os.name,
    hivelocityOsOptionId: os.id,
  });

  const selectInGroup = (group: string, optionId: number | null) => {
    const groupIds = new Set((selectableGroups[group] ?? []).map((o) => o.id));
    const rest = config.selectedOptionIds.filter((id) => !groupIds.has(id));
    onChange({ ...config, selectedOptionIds: optionId === null ? rest : [...rest, optionId] });
  };

  const families = React.useMemo(() => groupOsFamilies(osList), [osList]);

  /** Start from the newest free system, as most buyers keep it; the choice stays visible and changeable. */
  React.useEffect(() => {
    if (loading || config.selectedOsId || !families.length) return;
    const first = families.flatMap((f) => f.versions).find((v) => v.os.monthlyPriceUsd <= 0);
    if (first) onChange({ ...config, ...osPatch(first.os) });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading, families, config.selectedOsId]);
  const groupsOf = (kind: ReturnType<typeof groupKind>) => Object.entries(selectableGroups).filter(([group]) => groupKind(group) === kind);
  const panelGroups = groupsOf("panel");
  const appGroups = groupsOf("apps");
  const upgradeGroups = groupsOf("upgrade");

  const panelProducts = React.useMemo(
    () => panelGroups.flatMap(([group, options]) => groupPanels(options).map((product) => ({ group, product }))),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [selectableGroups],
  );

  const switchTarget = (product: PanelProduct, tierIndex: number) => {
    const fits = (os: HivelocityOsOption, option: HivelocityAddonOption) =>
      (option.expressions ?? []).every((e) => evaluateHivelocityCompatibilityExpression(e, os.tags ?? []));
    const tier = product.tiers[tierIndex] ?? product.tiers[0];
    for (const family of families) {
      for (const { os } of family.versions) {
        const option = tier.options.find((o) => fits(os, o));
        if (option) return { os, optionId: option.id, label: osDisplayName(os) };
      }
    }
    return null;
  };

  const specs = React.useMemo(() => serverSpecs(addonGroups, config.selectedOptionIds), [addonGroups, config.selectedOptionIds]);
  const extras = selectedOptions
    .filter((o) => {
      const group = Object.entries(selectableGroups).find(([, options]) => options.some((x) => x.id === o.id))?.[0];
      return group && (groupKind(group) === "panel" || groupKind(group) === "apps") && !isNoneOption(o);
    })
    .map((o) => {
      const group = Object.entries(selectableGroups).find(([, options]) => options.some((x) => x.id === o.id))?.[0] ?? "";
      return groupKind(group) === "panel" ? (panelProducts.find((p) => p.product.tiers.some((t) => t.options.some((x) => x.id === o.id)))?.product.name ?? cleanOptionName(o.name)) : cleanOptionName(o.name);
    });

  const hostnameValid = isValidHivelocityHostname(config.hostname);
  const ready = Boolean(selectedOs) && hostnameValid && selectionValidation.ok;
  const status = !selectedOs ? "Choose an operating system" : !hostnameValid ? "Add a hostname" : !selectionValidation.ok ? "Check your add-ons" : "Ready to deploy";

  const nameplate = (
    <ServerNameplate
      productLabel={PRODUCT_LABELS[config.productType]}
      planName={planName ?? PRODUCT_LABELS[config.productType]}
      hostname={config.hostname.trim()}
      location={locationTitle ?? config.locationName}
      osName={selectedOs ? osDisplayName(selectedOs) : null}
      extras={extras}
      specs={specs}
      status={loading ? "Loading server options" : status}
      ready={!loading && ready}
    />
  );

  if (loading) {
    return (
      <div className="space-y-4">
        {nameplate}
        <div className="rounded-3xl border border-border bg-card p-6">
          <Skeleton className="h-7 w-48" />
          <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-28 rounded-2xl" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="space-y-4">
        {nameplate}
        <div className="rounded-3xl border border-destructive/30 bg-card p-6 text-base text-destructive" role="alert">
          {loadError} Refresh the page to try again.
        </div>
      </div>
    );
  }

  let step = 0;
  const appGroup = appGroups[0];
  const selectedApp = appGroup ? (appGroup[1].find((o) => config.selectedOptionIds.includes(o.id) && !isNoneOption(o))?.id ?? null) : null;

  return (
    <div className="space-y-4">
      {nameplate}

      <ConfigSection
        id="config-os"
        step={++step}
        done={Boolean(selectedOs)}
        title="Choose an operating system"
        description="Pick a system and version. Apps and control panels below depend on it."
      >
        <OsPicker
          families={families}
          selectedOsId={config.selectedOsId}
          onSelect={(os) => onChange({ ...config, ...osPatch(os) })}
          priceLabel={osPrice}
        />
        {selectedOs?.operatingSystemFeatures?.sshKey || selectedOs?.operatingSystemFeatures?.cloudInit ? (
          <p className="mt-4 text-sm text-muted-foreground">
            {osDisplayName(selectedOs)} supports{" "}
            {[selectedOs.operatingSystemFeatures?.sshKey && "SSH key login", selectedOs.operatingSystemFeatures?.cloudInit && "cloud-init"]
              .filter(Boolean)
              .join(" and ")}
            .
          </p>
        ) : null}
      </ConfigSection>

      {panelProducts.length ? (
        <ConfigSection
          id="config-panel"
          step={++step}
          title="Add a control panel"
          description="Optional. A panel lets you manage websites and email in a browser instead of over SSH."
        >
          <PanelPicker
            products={panelProducts.map((p) => p.product)}
            selectedIds={config.selectedOptionIds}
            onSelect={(optionId) => {
              const entry = panelProducts.find((p) => p.product.tiers.some((t) => t.options.some((o) => o.id === optionId)));
              if (entry) selectInGroup(entry.group, optionId);
            }}
            onClear={() => panelGroups.forEach(([group]) => selectInGroup(group, null))}
            disabledFor={(option) => {
              const group = panelProducts.find((p) => p.product.tiers.some((t) => t.options.includes(option)))?.group;
              return getAddonDisabledDetails(option, group);
            }}
            compatibleOsText={(product) => describeCompatibleOs(product.expressions, osList)}
            switchTarget={switchTarget}
            onSwitchOs={(os, optionId) => {
              const entry = panelProducts.find((p) => p.product.tiers.some((t) => t.options.some((o) => o.id === optionId)));
              const groupIds = new Set((entry ? selectableGroups[entry.group] : []).map((o) => o.id));
              onChange({
                ...config,
                ...osPatch(os),
                selectedOptionIds: [...config.selectedOptionIds.filter((id) => !groupIds.has(id)), optionId],
              });
            }}
            priceLabel={addonPrice}
          />
        </ConfigSection>
      ) : null}

      {appGroup ? (
        <ConfigSection
          id="config-apps"
          step={++step}
          title="Install an app"
          description="Optional. The app is installed while your server is set up."
        >
          <AppPicker
            options={appGroup[1]}
            selectedId={selectedApp}
            onSelect={(optionId) => selectInGroup(appGroup[0], optionId)}
            disabledFor={(option) => getAddonDisabledDetails(option, appGroup[0])}
            priceLabel={addonPrice}
          />
        </ConfigSection>
      ) : null}

      {upgradeGroups.length ? (
        <ConfigSection
          id="config-upgrades"
          step={++step}
          title="Hardware and services"
          description="Optional upgrades for this machine. Anything you leave as it is stays as listed."
        >
          <div className="space-y-4">
            {upgradeGroups.map(([group, options]) => (
              <UpgradePicker
                key={group}
                group={group}
                options={options}
                selectedIds={config.selectedOptionIds}
                onSelect={selectInGroup}
                disabledFor={(option) => getAddonDisabledDetails(option, group)}
                priceLabel={addonPrice}
              />
            ))}
          </div>
        </ConfigSection>
      ) : null}

      <ConfigSection id="config-hostname" step={++step} done={hostnameValid} title="Name your server">
        <HivelocityHostnameField
          productType={config.productType}
          hostname={config.hostname}
          onHostnameChange={(hostname) => onChange({ ...config, hostname })}
        />
      </ConfigSection>

      {!selectionValidation.ok && selectedOs ? (
        <div className="rounded-2xl border border-amber-500/30 bg-amber-500/10 p-4 text-sm text-foreground" role="status">
          {selectionValidation.reasons[0]}
        </div>
      ) : null}
    </div>
  );
}
