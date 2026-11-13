import * as React from "react";
import {
  Archive,
  ArrowRightLeft,
  Check,
  Cloud,
  HardDrive,
  LifeBuoy,
  MemoryStick,
  Network,
  Puzzle,
  ShieldCheck,
  Zap,
  type LucideIcon,
} from "lucide-react";
import { BrandLogo } from "@/components/server-logos.tsx";
import type { HivelocityAddonDisabledDetails } from "@/lib/hivelocity-option-compatibility.ts";
import type { HivelocityAddonOption, HivelocityOsOption } from "@/lib/vps-plans-api.ts";
import { cn } from "@/lib/utils.ts";
import {
  cleanOptionName,
  defaultChoice,
  groupLabel,
  isNoneOption,
  type OsFamily,
  type PanelProduct,
} from "./server-options.ts";

type PriceLabel = (monthlyUsd: number) => string;

function extraPrice(label: string) {
  return label === "Included" ? "Included" : `+${label}`;
}

const tileBase =
  "relative rounded-2xl border bg-background text-left transition focus-within:ring-2 focus-within:ring-primary/40";
const tileActive = "border-primary ring-2 ring-primary/25";
const tileIdle = "border-border hover:border-primary/50";

export function ConfigSection({
  id,
  step,
  done = false,
  title,
  description,
  children,
}: {
  id: string;
  step: number;
  done?: boolean;
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <section aria-labelledby={id} className="rounded-3xl border border-border bg-card p-5 shadow-sm sm:p-6">
      <div className="flex items-start gap-3">
        <span
          className={cn(
            "flex size-8 shrink-0 items-center justify-center rounded-full text-sm font-bold transition-colors",
            done ? "bg-primary text-[#02070a]" : "border border-border bg-background text-foreground",
          )}
          aria-hidden
        >
          {done ? <Check className="size-4" /> : step}
        </span>
        <div className="min-w-0">
          <h2 id={id} className="type-h3 text-foreground">
            {title}
          </h2>
          {description ? <p className="mt-1 text-[15px] leading-relaxed text-muted-foreground">{description}</p> : null}
        </div>
      </div>
      <div className="mt-5">{children}</div>
    </section>
  );
}

// ─── Operating system ─────────────────────────────────────────────────────────

export function OsPicker({
  families,
  selectedOsId,
  onSelect,
  priceLabel,
}: {
  families: OsFamily[];
  selectedOsId: string;
  onSelect: (os: HivelocityOsOption) => void;
  priceLabel: PriceLabel;
}) {
  const [shown, setShown] = React.useState<Record<string, number>>({});

  return (
    <div role="radiogroup" aria-label="Operating system" className="grid grid-cols-1 gap-3 min-[420px]:grid-cols-2 sm:grid-cols-3">
      {families.map((family) => {
        const selected = family.versions.find((v) => String(v.os.id) === selectedOsId);
        const shownId = selected?.os.id ?? shown[family.key] ?? family.versions[0].os.id;
        const version = family.versions.find((v) => v.os.id === shownId) ?? family.versions[0];
        const price = extraPrice(priceLabel(version.os.monthlyPriceUsd));
        return (
          <div
            key={family.key}
            className={cn(
              tileBase,
              "flex items-center gap-3 p-3 min-[420px]:flex-col min-[420px]:items-stretch min-[420px]:gap-0",
              selected ? tileActive : tileIdle,
            )}
          >
            <button
              type="button"
              role="radio"
              aria-checked={Boolean(selected)}
              onClick={() => onSelect(version.os)}
              className="flex min-w-0 flex-1 cursor-pointer items-center gap-3 rounded-xl text-left focus-visible:outline-none min-[420px]:pr-6"
            >
              <BrandLogo name={family.name} />
              <span className="min-w-0">
                <span className="block text-base font-medium leading-snug text-foreground">{family.name}</span>
                <span className={cn("block text-sm", price === "Included" ? "text-muted-foreground" : "text-primary dark:text-primary")}>
                  {price}
                </span>
              </span>
            </button>
            {selected ? (
              <Check className="absolute right-3 top-3 hidden size-4 text-primary min-[420px]:block dark:text-primary" aria-hidden />
            ) : null}
            {family.versions.length > 1 ? (
              <select
                aria-label={`${family.name} version`}
                value={shownId}
                onChange={(e) => {
                  const id = Number(e.target.value);
                  setShown((s) => ({ ...s, [family.key]: id }));
                  const next = family.versions.find((v) => v.os.id === id);
                  if (next) onSelect(next.os);
                }}
                className="h-9 w-28 shrink-0 cursor-pointer rounded-lg border border-border bg-card px-2 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary min-[420px]:mt-3 min-[420px]:w-full"
              >
                {family.versions.map((v) => (
                  <option key={v.os.id} value={v.os.id}>
                    {v.label}
                  </option>
                ))}
              </select>
            ) : (
              <p className="flex h-9 w-28 shrink-0 items-center rounded-lg bg-muted/40 px-2 text-sm text-muted-foreground min-[420px]:mt-3 min-[420px]:w-full">
                {version.label}
              </p>
            )}
          </div>
        );
      })}
    </div>
  );
}

// ─── Control panel ────────────────────────────────────────────────────────────

export function PanelPicker({
  products,
  selectedIds,
  onSelect,
  onClear,
  disabledFor,
  compatibleOsText,
  switchTarget,
  onSwitchOs,
  priceLabel,
}: {
  products: PanelProduct[];
  selectedIds: number[];
  onSelect: (optionId: number) => void;
  onClear: () => void;
  disabledFor: (option: HivelocityAddonOption) => HivelocityAddonDisabledDetails | null;
  compatibleOsText: (product: PanelProduct) => string | null;
  switchTarget: (product: PanelProduct, tierIndex: number) => { os: HivelocityOsOption; optionId: number; label: string } | null;
  onSwitchOs: (os: HivelocityOsOption, optionId: number) => void;
  priceLabel: PriceLabel;
}) {
  const [shownTier, setShownTier] = React.useState<Record<string, number>>({});
  const anySelected = products.some((p) => p.tiers.some((t) => t.options.some((o) => selectedIds.includes(o.id))));

  return (
    <div role="radiogroup" aria-label="Control panel" className="grid grid-cols-1 gap-3 sm:grid-cols-2">
      <button
        type="button"
        role="radio"
        aria-checked={!anySelected}
        onClick={onClear}
        className={cn(tileBase, "flex cursor-pointer items-center gap-3 p-4 focus-visible:outline-none", !anySelected ? tileActive : tileIdle)}
      >
        <span className="flex size-10 shrink-0 items-center justify-center rounded-xl border border-dashed border-border text-sm text-muted-foreground" aria-hidden>
          —
        </span>
        <span>
          <span className="block text-base font-medium text-foreground">No control panel</span>
          <span className="block text-sm text-muted-foreground">Manage the server over SSH</span>
        </span>
        {!anySelected ? <Check className="absolute right-3 top-3 size-4 text-primary dark:text-primary" aria-hidden /> : null}
      </button>

      {products.map((product) => {
        const selectedTierIndex = product.tiers.findIndex((t) => t.options.some((o) => selectedIds.includes(o.id)));
        const active = selectedTierIndex !== -1;
        const compatibleTiers = product.tiers.map((t) => t.options.find((o) => !disabledFor(o)) ?? null);
        const firstCompatible = compatibleTiers.findIndex(Boolean);
        const tierIndex = active ? selectedTierIndex : (shownTier[product.name] ?? (firstCompatible === -1 ? 0 : firstCompatible));
        const tier = product.tiers[tierIndex] ?? product.tiers[0];
        const option = compatibleTiers[tierIndex];
        const available = firstCompatible !== -1;
        const price = extraPrice(priceLabel((option ?? tier.options[0]).monthlyPriceUsd));
        const target = available ? null : switchTarget(product, tierIndex);
        const needs = available ? null : compatibleOsText(product);

        return (
          <div key={product.name} className={cn(tileBase, "flex flex-col p-4", active ? tileActive : tileIdle, !available && "bg-muted/30")}>
            <button
              type="button"
              role="radio"
              aria-checked={active}
              aria-disabled={!option}
              onClick={() => option && onSelect(option.id)}
              className={cn("flex items-center gap-3 rounded-xl pr-6 text-left focus-visible:outline-none", option ? "cursor-pointer" : "cursor-not-allowed")}
            >
              <BrandLogo name={product.name} />
              <span className="min-w-0">
                <span className="block text-base font-medium text-foreground">{product.name}</span>
                <span className="block text-sm text-primary dark:text-primary">{price}</span>
              </span>
            </button>
            {active ? <Check className="absolute right-3 top-3 size-4 text-primary dark:text-primary" aria-hidden /> : null}
            {product.tiers.length > 1 ? (
              <select
                aria-label={`${product.name} accounts`}
                value={tierIndex}
                onChange={(e) => {
                  const next = Number(e.target.value);
                  setShownTier((s) => ({ ...s, [product.name]: next }));
                  const nextOption = compatibleTiers[next];
                  if (active && nextOption) onSelect(nextOption.id);
                }}
                className="mt-3 h-9 w-full cursor-pointer rounded-lg border border-border bg-card px-2 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
              >
                {product.tiers.map((t, i) => (
                  <option key={t.label} value={i} disabled={available && !compatibleTiers[i]}>
                    {t.label}
                  </option>
                ))}
              </select>
            ) : (
              <p className="mt-3 text-sm text-muted-foreground">{tier.label}</p>
            )}
            {!available ? (
              <div className="mt-3 text-sm text-muted-foreground">
                {needs ? <p>Works with {needs}.</p> : <p>Not available with this operating system.</p>}
                {target ? (
                  <button
                    type="button"
                    onClick={() => onSwitchOs(target.os, target.optionId)}
                    className="mt-2 inline-flex cursor-pointer items-center gap-1.5 rounded-lg font-semibold text-primary underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary dark:text-primary"
                  >
                    Use {target.label} with {product.name}
                  </button>
                ) : null}
              </div>
            ) : null}
          </div>
        );
      })}
    </div>
  );
}

// ─── One-click apps ───────────────────────────────────────────────────────────

export function AppPicker({
  options,
  selectedId,
  onSelect,
  disabledFor,
  priceLabel,
}: {
  options: HivelocityAddonOption[];
  selectedId: number | null;
  onSelect: (optionId: number | null) => void;
  disabledFor: (option: HivelocityAddonOption) => HivelocityAddonDisabledDetails | null;
  priceLabel: PriceLabel;
}) {
  const apps = options.filter((o) => !isNoneOption(o));
  return (
    <div role="radiogroup" aria-label="One-click app" className="grid grid-cols-1 gap-2.5 min-[420px]:grid-cols-2 sm:grid-cols-3">
      <button
        type="button"
        role="radio"
        aria-checked={selectedId === null}
        onClick={() => onSelect(null)}
        className={cn(tileBase, "flex cursor-pointer items-center gap-3 p-3 focus-visible:outline-none", selectedId === null ? tileActive : tileIdle)}
      >
        <span className="flex size-8 shrink-0 items-center justify-center rounded-lg border border-dashed border-border text-sm text-muted-foreground" aria-hidden>
          —
        </span>
        <span className="text-base font-medium text-foreground">No app</span>
      </button>
      {apps.map((app) => {
        const disabled = selectedId !== app.id ? disabledFor(app) : null;
        const active = selectedId === app.id;
        const name = cleanOptionName(app.name);
        const price = priceLabel(app.monthlyPriceUsd);
        return (
          <button
            key={app.id}
            type="button"
            role="radio"
            aria-checked={active}
            aria-disabled={Boolean(disabled)}
            title={disabled?.reason}
            onClick={() => !disabled && onSelect(app.id)}
            className={cn(
              tileBase,
              "flex items-center gap-3 p-3 focus-visible:outline-none",
              active ? tileActive : tileIdle,
              disabled ? "cursor-not-allowed opacity-50" : "cursor-pointer",
            )}
          >
            <BrandLogo name={name} size="sm" />
            <span className="min-w-0">
              <span className="block text-base font-medium leading-snug text-foreground">{name}</span>
              {disabled ? (
                <span className="block text-sm text-muted-foreground">Not with this OS</span>
              ) : price !== "Included" ? (
                <span className="block text-sm text-primary dark:text-primary">+{price}</span>
              ) : null}
            </span>
          </button>
        );
      })}
    </div>
  );
}

// ─── Hardware and services (dedicated servers) ────────────────────────────────

const GROUP_ICONS: [RegExp, LucideIcon][] = [
  [/memory|ram/i, MemoryStick],
  [/drive|disk|storage|raid/i, HardDrive],
  [/backup/i, Archive],
  [/ddos|firewall|defen[cs]e|security/i, ShieldCheck],
  [/bandwidth|network|port|\bip\b/i, Network],
  [/managed/i, LifeBuoy],
  [/migration/i, ArrowRightLeft],
  [/litespeed/i, Zap],
  [/object storage|wasabi/i, Cloud],
];

function groupIcon(name: string): LucideIcon {
  return GROUP_ICONS.find(([pattern]) => pattern.test(name))?.[1] ?? Puzzle;
}

export function UpgradePicker({
  group,
  options,
  selectedIds,
  onSelect,
  disabledFor,
  priceLabel,
}: {
  group: string;
  options: HivelocityAddonOption[];
  selectedIds: number[];
  onSelect: (group: string, optionId: number | null) => void;
  disabledFor: (option: HivelocityAddonOption) => HivelocityAddonDisabledDetails | null;
  priceLabel: PriceLabel;
}) {
  const Icon = groupIcon(group);
  const label = groupLabel(group);
  const base = defaultChoice(options);
  const choices = options.filter((o) => !isNoneOption(o) && o.id !== base?.optionId);
  const selected = options.find((o) => selectedIds.includes(o.id) && o.id !== base?.optionId) ?? null;
  const selectId = `upgrade-${group.replace(/[^a-z0-9]+/gi, "-").toLowerCase()}`;

  return (
    <div className="flex flex-col gap-3 border-t border-border pt-4 first:border-t-0 first:pt-0 sm:flex-row sm:items-start sm:gap-4">
      <div className="flex min-w-0 items-center gap-3 sm:w-48 sm:shrink-0 sm:pt-1.5">
        <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary dark:text-primary" aria-hidden>
          <Icon className="size-5" />
        </span>
        <span className="text-base font-medium text-foreground">{label}</span>
      </div>

      {choices.length + (base ? 1 : 0) <= 4 ? (
        <div role="radiogroup" aria-label={label} className="flex min-w-0 flex-1 flex-wrap gap-2">
          {base ? (
            <button
              type="button"
              role="radio"
              aria-checked={!selected}
              onClick={() => onSelect(group, null)}
              className={cn(
                "cursor-pointer rounded-xl border px-3 py-2 text-left text-sm transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary",
                !selected ? "border-primary bg-primary/10 text-foreground" : "border-border bg-background text-foreground hover:border-primary/50",
              )}
            >
              <span className="block font-medium">{base.label}</span>
              <span className="block text-muted-foreground">Included</span>
            </button>
          ) : null}
          {choices.map((option) => {
            const disabled = selected?.id !== option.id ? disabledFor(option) : null;
            const active = selected?.id === option.id;
            return (
              <button
                key={option.id}
                type="button"
                role="radio"
                aria-checked={active}
                aria-disabled={Boolean(disabled)}
                title={disabled?.reason}
                onClick={() => !disabled && onSelect(group, option.id)}
                className={cn(
                  "rounded-xl border px-3 py-2 text-left text-sm transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary",
                  active ? "border-primary bg-primary/10 text-foreground" : "border-border bg-background text-foreground hover:border-primary/50",
                  disabled ? "cursor-not-allowed opacity-50" : "cursor-pointer",
                )}
              >
                <span className="block font-medium">{cleanOptionName(option.name)}</span>
                <span className="block text-primary dark:text-primary">{extraPrice(priceLabel(option.monthlyPriceUsd))}</span>
              </button>
            );
          })}
        </div>
      ) : (
        <div className="min-w-0 flex-1">
          <label htmlFor={selectId} className="sr-only">
            {label}
          </label>
          <select
            id={selectId}
            value={selected?.id ?? ""}
            onChange={(e) => onSelect(group, e.target.value ? Number(e.target.value) : null)}
            className="h-11 w-full cursor-pointer rounded-xl border border-border bg-background px-3 text-base text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
          >
            <option value="">{base ? `${base.label} (included)` : "None"}</option>
            {choices.map((option) => (
              <option key={option.id} value={option.id} disabled={Boolean(disabledFor(option)) && selected?.id !== option.id}>
                {cleanOptionName(option.name)} · {extraPrice(priceLabel(option.monthlyPriceUsd))}
              </option>
            ))}
          </select>
        </div>
      )}
    </div>
  );
}
