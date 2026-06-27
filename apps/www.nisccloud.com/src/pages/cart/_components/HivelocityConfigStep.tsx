import * as React from "react";
import { Loader2, Search } from "lucide-react";
import { Input } from "@/components/ui/input.tsx";
import { Badge } from "@/components/ui/badge.tsx";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion.tsx";
import { HivelocityHostnameField } from "./HivelocityHostnameField.tsx";
import {
  HivelocityAddonNoSelectionRow,
  HivelocityAddonOptionRow,
} from "./HivelocityAddonOptionRow.tsx";
import {
  fetchExchangeRatesPublic,
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
  getHivelocityAddonDisabledDetails,
  groupHasOptOutOption,
  isHivelocityOptionalSingleSelectGroup,
  isHivelocityOptionGroupMultiSelect,
  validateHivelocityOptionSelection,
} from "@/lib/hivelocity-option-compatibility.ts";
import { cn } from "@/lib/utils.ts";

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

interface HivelocityConfigStepProps {
  config: HivelocityCheckoutConfig;
  onChange: (next: HivelocityCheckoutConfig) => void;
  onPricingContext?: (ctx: HivelocityPricingContext) => void;
}

export function HivelocityConfigStep({ config, onChange, onPricingContext }: HivelocityConfigStepProps) {
  const [osList, setOsList] = React.useState<HivelocityOsOption[]>([]);
  const [addonGroups, setAddonGroups] = React.useState<Record<string, HivelocityAddonOption[]>>({});
  const [pricing, setPricing] = React.useState<PricingSettings | null>(null);
  const [kesRate, setKesRate] = React.useState<number | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [loadError, setLoadError] = React.useState<string | null>(null);
  const [osSearch, setOsSearch] = React.useState("");

  const displayAddonGroups = React.useMemo(
    () => filterStorefrontHivelocityAddonGroups(addonGroups, config.productType),
    [addonGroups, config.productType],
  );

  const selectedOs = React.useMemo(
    () => osList.find((os) => String(os.id) === config.selectedOsId) ?? null,
    [osList, config.selectedOsId],
  );

  const selectedOsFeatures = React.useMemo(
    () => selectedOs?.operatingSystemFeatures ?? {},
    [selectedOs],
  );

  const allProductOptions = React.useMemo(
    () => Object.values(addonGroups).flat(),
    [addonGroups],
  );

  const selectedOptions = React.useMemo(
    () => allProductOptions.filter((opt) => config.selectedOptionIds.includes(opt.id)),
    [allProductOptions, config.selectedOptionIds],
  );

  const selectedOptionIdStrings = React.useMemo(
    () => config.selectedOptionIds.map(String),
    [config.selectedOptionIds],
  );

  const selectionValidation = React.useMemo(
    () =>
      validateHivelocityOptionSelection({
        os: selectedOs,
        allOptions: allProductOptions,
        selectedOptionIds: selectedOptionIdStrings,
        groupedOptions: displayAddonGroups,
        osFeatures: selectedOsFeatures,
      }),
    [selectedOs, allProductOptions, selectedOptionIdStrings, displayAddonGroups, selectedOsFeatures],
  );

  const getAddonDisabledDetails = React.useCallback(
    (addon: HivelocityAddonOption, groupName?: string, includeInTagSet = false) => {
      const otherSelected = includeInTagSet
        ? selectedOptions
        : selectedOptions.filter((o) => o.id !== addon.id);
      const tagsForCheck = collectHivelocityOptionTags(selectedOs, otherSelected);
      return getHivelocityAddonDisabledDetails({
        addon,
        groupName,
        os: selectedOs,
        osFeatures: selectedOsFeatures,
        selectedTags: tagsForCheck,
      });
    },
    [selectedOptions, selectedOs, selectedOsFeatures],
  );

  const filteredOs = React.useMemo(() => {
    const q = osSearch.trim().toLowerCase();
    if (!q) return osList;
    return osList.filter((os) => os.name.toLowerCase().includes(q));
  }, [osList, osSearch]);

  React.useEffect(() => {
    onPricingContext?.({
      osList,
      addonGroups: displayAddonGroups,
      pricing,
      kesRate,
      loading,
      loadError,
      selectionValid: selectionValidation.ok,
    });
  }, [
    osList,
    displayAddonGroups,
    pricing,
    kesRate,
    loading,
    loadError,
    selectionValidation.ok,
    onPricingContext,
  ]);

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
        setLoadError(err instanceof Error ? err.message : "Failed to load server options.");
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [config.hivelocityProductId, config.productType]);

  /** Drop selections from hidden add-on groups. */
  React.useEffect(() => {
    const visibleIds = new Set(Object.values(displayAddonGroups).flat().map((o) => o.id));
    const pruned = config.selectedOptionIds.filter((id) => visibleIds.has(id));
    if (pruned.length !== config.selectedOptionIds.length) {
      onChange({ ...config, selectedOptionIds: pruned });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [displayAddonGroups]);

  /** One option per exclusive category. */
  React.useEffect(() => {
    if (!config.selectedOptionIds.length || !Object.keys(addonGroups).length) return;
    const deduped = dedupeExclusiveGroupOptionIds(addonGroups, selectedOptionIdStrings).map(Number);
    if (
      deduped.length !== config.selectedOptionIds.length ||
      deduped.some((id, i) => id !== config.selectedOptionIds[i])
    ) {
      onChange({ ...config, selectedOptionIds: deduped });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [addonGroups, config.selectedOptionIds.length]);

  /** Remove add-ons that became incompatible after OS / selection changes. */
  React.useEffect(() => {
    if (!selectedOs || !config.selectedOptionIds.length) return;

    const incompatible = new Set<number>();
    for (const opt of allProductOptions) {
      const groupName = Object.entries(displayAddonGroups).find(([, rows]) =>
        rows.some((row) => row.id === opt.id),
      )?.[0];
      if (!groupName) continue;
      if (!config.selectedOptionIds.includes(opt.id)) continue;
      const details = getAddonDisabledDetails(opt, groupName, true);
      if (details) incompatible.add(opt.id);
    }

    if (!incompatible.size) return;
    onChange({
      ...config,
      selectedOptionIds: config.selectedOptionIds.filter((id) => !incompatible.has(id)),
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedOs, selectedOsFeatures, config.selectedOptionIds.join(","), displayAddonGroups]);

  const selectOs = (os: HivelocityOsOption) => {
    onChange({
      ...config,
      selectedOsId: String(os.id),
      selectedOsName: os.name,
      hivelocityOsOptionId: os.id,
    });
  };

  const setSelectedOptionIds = (next: number[]) => {
    onChange({ ...config, selectedOptionIds: next });
  };

  const getGroupSelectionMode = (groupName: string) =>
    isHivelocityOptionGroupMultiSelect(groupName) ? ("multi" as const) : ("single" as const);

  if (loading) {
    return (
      <div className="bg-white border border-border rounded-2xl p-8 flex flex-col items-center justify-center text-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary mb-3" />
        <p className="text-sm text-muted-foreground">Loading server configuration…</p>
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="bg-white border border-destructive/30 rounded-2xl p-6 text-sm text-destructive">
        {loadError}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="bg-white border border-border rounded-2xl p-5 shadow-sm space-y-4">
        <div>
          <h2 className="text-base font-bold text-foreground">Operating system</h2>
          <p className="text-sm text-muted-foreground mt-0.5">
            Choose one OS for your server. Your choice determines which apps and control panels are
            available below.
          </p>
        </div>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            value={osSearch}
            onChange={(e) => setOsSearch(e.target.value)}
            placeholder="Search operating systems…"
            className="pl-9 h-10 rounded-xl"
          />
        </div>

        <div className="max-h-64 overflow-y-auto rounded-xl border border-border divide-y divide-border">
          {filteredOs.length === 0 ? (
            <p className="p-4 text-sm text-muted-foreground text-center">No operating systems found.</p>
          ) : (
            filteredOs.map((os) => {
              const selected = config.selectedOsId === String(os.id);
              return (
                <button
                  key={`os-${os.id}`}
                  type="button"
                  onClick={() => selectOs(os)}
                  className={cn(
                    "w-full flex items-center justify-between gap-3 px-4 py-3 text-left transition-colors",
                    selected ? "bg-primary/5 border-l-2 border-l-primary" : "hover:bg-muted/40",
                  )}
                >
                  <span className="text-sm font-medium text-foreground">{os.name}</span>
                  <span className="text-xs font-semibold text-muted-foreground whitespace-nowrap">
                    {formatOptionPriceKes(os.monthlyPriceUsd, pricing?.os ?? null, kesRate)}
                  </span>
                </button>
              );
            })
          )}
        </div>
      </div>

      <HivelocityHostnameField
        productType={config.productType}
        hostname={config.hostname}
        onHostnameChange={(hostname) => onChange({ ...config, hostname })}
      />

      {Object.keys(displayAddonGroups).length > 0 && (
        <div className="bg-white border border-border rounded-2xl p-5 shadow-sm space-y-3">
          <div>
            <h2 className="text-base font-bold text-foreground">Add-ons</h2>
            <p className="text-sm text-muted-foreground mt-0.5">
              Optional extras  availability depends on your selected operating system.
            </p>
          </div>

          {!config.selectedOsId ? (
            <p className="text-sm text-muted-foreground rounded-lg border border-dashed p-4 text-center">
              Select an operating system above to see compatible add-ons.
            </p>
          ) : (
            <Accordion type="multiple" className="w-full">
              {Object.entries(displayAddonGroups).map(([group, options]) => {
                const selectionMode = getGroupSelectionMode(group);
                const groupOptionIds = new Set(options.map((o) => o.id));
                const selectedInGroupCount = options.filter((o) =>
                  config.selectedOptionIds.includes(o.id),
                ).length;

                return (
                  <AccordionItem key={group} value={group} className="border rounded-xl px-3 mb-2">
                    <AccordionTrigger className="py-3 hover:no-underline">
                      <div className="flex items-center justify-between w-full gap-2 pr-2">
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="text-sm font-medium truncate">{group}</span>
                          {selectionMode === "single" ? (
                            <Badge variant="secondary" className="rounded-full shrink-0">
                              Choose one
                            </Badge>
                          ) : null}
                        </div>
                        <span className="text-xs text-muted-foreground shrink-0">
                          {selectionMode === "single"
                            ? `${selectedInGroupCount}/1`
                            : `${selectedInGroupCount} selected`}
                        </span>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent className="pb-3 space-y-2">
                      {selectionMode === "single" &&
                      isHivelocityOptionalSingleSelectGroup(group) &&
                      !groupHasOptOutOption(options) ? (
                        <HivelocityAddonNoSelectionRow
                          checked={selectedInGroupCount === 0}
                          onSelect={() =>
                            setSelectedOptionIds(
                              config.selectedOptionIds.filter((id) => !groupOptionIds.has(id)),
                            )
                          }
                          description={`Skip ${group}  nothing from this category will be added.`}
                        />
                      ) : null}

                      {options.map((opt) => {
                        const checked = config.selectedOptionIds.includes(opt.id);
                        const disabledDetails = checked ? null : getAddonDisabledDetails(opt, group);
                        const disabled = Boolean(disabledDetails);

                        const handleSelect = () => {
                          if (disabled) return;
                          if (selectionMode === "single") {
                            const withoutGroup = config.selectedOptionIds.filter(
                              (id) => !groupOptionIds.has(id),
                            );
                            setSelectedOptionIds(
                              checked ? withoutGroup : [...withoutGroup, opt.id],
                            );
                            return;
                          }
                          setSelectedOptionIds(
                            checked
                              ? config.selectedOptionIds.filter((id) => id !== opt.id)
                              : [...config.selectedOptionIds, opt.id],
                          );
                        };

                        return (
                          <HivelocityAddonOptionRow
                            key={`${group}-${opt.id}`}
                            name={opt.name}
                            checked={checked}
                            disabled={disabled}
                            disabledDetails={disabledDetails}
                            displayPriceLabel={formatOptionPriceKes(
                              opt.monthlyPriceUsd,
                              pricing?.addons ?? null,
                              kesRate,
                            )}
                            onSelect={handleSelect}
                          />
                        );
                      })}
                    </AccordionContent>
                  </AccordionItem>
                );
              })}
            </Accordion>
          )}
        </div>
      )}
    </div>
  );
}
