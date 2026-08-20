"use client";

import * as React from "react";
import { EllipsisVertical } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

export type CleanListColumnHideBelow =
  | "@md"
  | "@lg"
  | "@xl"
  | "@2xl"
  | "@3xl"
  | "@5xl";

export type CleanListColumn = {
  key: string;
  label: React.ReactNode;
  /** Width classes for this column, e.g. `w-64` → max 16rem, can shrink. */
  className?: string;
  /** Hide this column below a container-query breakpoint. Primary and actions stay visible. */
  hideBelow?: CleanListColumnHideBelow;
  align?: "start" | "end";
};

const DEFAULT_COLUMNS: CleanListColumn[] = [
  { key: "primary", label: "Name" },
  { key: "actions", label: "Actions", align: "end" },
];

type CleanListLayout = {
  columns: CleanListColumn[];
  gridClass: string;
};

const CleanListLayoutContext = React.createContext<CleanListLayout>({
  columns: DEFAULT_COLUMNS,
  gridClass: "",
});

const BP_ORDER: CleanListColumnHideBelow[] = [
  "@md",
  "@lg",
  "@xl",
  "@2xl",
  "@3xl",
  "@5xl",
];

const BP_MIN: Record<CleanListColumnHideBelow, string> = {
  "@md": "28rem",
  "@lg": "32rem",
  "@xl": "36rem",
  "@2xl": "42rem",
  "@3xl": "48rem",
  "@5xl": "64rem",
};

const WIDTH_TRACK: Record<string, string> = {
  "w-16": "minmax(0,4rem)",
  "w-20": "minmax(0,5rem)",
  "w-24": "minmax(0,6rem)",
  "w-28": "minmax(0,7rem)",
  "w-32": "minmax(0,8rem)",
  "w-36": "minmax(0,9rem)",
  "w-40": "minmax(0,10rem)",
  "w-44": "minmax(0,11rem)",
  "w-48": "minmax(0,12rem)",
  "w-52": "minmax(0,13rem)",
  "w-56": "minmax(0,14rem)",
  "w-60": "minmax(0,15rem)",
  "w-64": "minmax(0,16rem)",
  "w-72": "minmax(0,18rem)",
  "w-80": "minmax(0,20rem)",
};

function splitColumns(columns: CleanListColumn[]) {
  const primary = columns.find((column) => column.key !== "actions") ?? columns[0];
  const extras = columns.filter((column) => column.key !== "actions" && column !== primary);
  const actions = columns.find((column) => column.key === "actions");
  return { primary, extras, actions };
}

function extraTrack(column: CleanListColumn) {
  const tokens = column.className?.split(/\s+/) ?? [];
  for (const token of tokens) {
    if (WIDTH_TRACK[token]) return WIDTH_TRACK[token];
  }
  return "minmax(0,1fr)";
}

function extrasVisibleAt(
  extras: CleanListColumn[],
  at: CleanListColumnHideBelow | null,
) {
  return extras.filter((column) => {
    if (!column.hideBelow) return true;
    if (at == null) return false;
    return BP_ORDER.indexOf(at) >= BP_ORDER.indexOf(column.hideBelow);
  });
}

function trackList(columns: CleanListColumn[], at: CleanListColumnHideBelow | null) {
  const { extras, actions } = splitColumns(columns);
  const parts = [
    "minmax(0,1fr)",
    ...extrasVisibleAt(extras, at).map(extraTrack),
    actions ? "max-content" : null,
  ].filter(Boolean);
  return parts.join(" ");
}

function cssKey(key: string) {
  return key.replace(/[^a-zA-Z0-9_-]/g, "");
}

function extraAlign(column: CleanListColumn) {
  return column.align === "end" ? "justify-content:flex-end;text-align:right;" : "";
}

function buildGridCss(gridClass: string, columns: CleanListColumn[]) {
  const { extras, actions } = splitColumns(columns);
  const board = `.${gridClass}`;
  const line = `.${gridClass} > .cl-line`;
  const actionsAlign =
    actions?.align === "end" ? `${board} .cl-actions{justify-self:end;}` : "";

  const rules: string[] = [
    // One shared grid for header + every row so tracks (especially Actions) stay aligned.
    `${board}{display:grid;width:100%;min-width:0;max-width:100%;column-gap:0.75rem;padding-left:1rem;padding-right:1rem;grid-template-columns:${trackList(columns, null)};}`,
    `${line}{display:grid;grid-template-columns:subgrid;grid-column:1/-1;min-width:0;width:100%;}`,
    `${board} .cl-primary,${board} .cl-extra,${board} .cl-actions{min-width:0;}`,
    `${board} .cl-primary,${board} .cl-extra{overflow:hidden;}`,
    `${board} .cl-extra{display:none;}`,
    `${board} .cl-actions-full{display:none;align-items:center;gap:0.375rem;}`,
    `${board} .cl-actions-menu{display:block;}`,
    actionsAlign,
  ].filter(Boolean);

  for (const column of extras) {
    const key = cssKey(column.key);
    const align = extraAlign(column);
    if (!column.hideBelow) {
      rules.push(`${board} .cl-extra-${key}{display:flex;align-items:flex-start;${align}}`);
      rules.push(`${board} .cl-stack-${key}{display:none;}`);
      continue;
    }
    const min = BP_MIN[column.hideBelow];
    rules.push(`${board} .cl-stack-${key}{display:flex;align-items:flex-start;gap:0.5rem;}`);
    rules.push(
      `@container (min-width:${min}){${board}{grid-template-columns:${trackList(columns, column.hideBelow)};}${board} .cl-extra-${key}{display:flex;align-items:flex-start;${align}}${board} .cl-stack-${key}{display:none;}}`,
    );
  }

  rules.push(
    `@container (min-width:${BP_MIN["@5xl"]}){${board} .cl-actions-full{display:flex;}${board} .cl-actions-menu{display:none;}}`,
  );

  return rules.join("");
}

/**
 * Compact cell text matching hosting-subscription meta (`text-xs text-muted-foreground`).
 */
export function CleanListCell({
  children,
  className,
  title,
  mono,
  wrap,
}: {
  children?: React.ReactNode;
  className?: string;
  title?: string;
  mono?: boolean;
  /** Wrap onto extra lines instead of truncating, so the full value stays visible. */
  wrap?: boolean;
}) {
  const content = children == null || children === "" ? "—" : children;

  return (
    <span
      title={wrap ? undefined : title ?? (typeof content === "string" ? content : undefined)}
      className={cn(
        "block min-w-0 text-xs text-muted-foreground",
        wrap ? "whitespace-pre-wrap break-all" : "truncate",
        mono && "font-mono",
        className,
      )}
    >
      {content}
    </span>
  );
}

const HEADER_LABEL =
  "text-[11px] font-medium uppercase tracking-wider text-muted-foreground";

function CleanListHeader() {
  const { columns } = React.useContext(CleanListLayoutContext);
  const { primary, extras, actions } = splitColumns(columns);

  return (
    <div className="cl-line items-center bg-muted/40 py-2">
      <div className="cl-primary">
        <span className={HEADER_LABEL}>{primary?.label ?? "Name"}</span>
      </div>
      {extras.map((column) => (
        <div key={column.key} className={cn("cl-extra", `cl-extra-${cssKey(column.key)}`)}>
          <span className={HEADER_LABEL}>{column.label}</span>
        </div>
      ))}
      {actions ? (
        <div className="cl-actions">
          <span className={HEADER_LABEL}>{actions.label}</span>
        </div>
      ) : null}
    </div>
  );
}

/**
 * Hostinger-style clean list: one bordered card, divider rows,
 * optional column headers, extra columns that collapse under the title on small screens,
 * compact actions on the right (more menu below ~lg of the list container).
 */
export function CleanList({
  children,
  className,
  emptyMessage = "Nothing to show.",
  columns = DEFAULT_COLUMNS,
}: {
  children?: React.ReactNode;
  className?: string;
  emptyMessage?: string;
  columns?: CleanListColumn[];
}) {
  const items = React.Children.toArray(children).filter(Boolean);
  const resolvedColumns = columns.length > 0 ? columns : DEFAULT_COLUMNS;
  const rawId = React.useId();
  const gridClass = `clg${rawId.replace(/[^a-zA-Z0-9]/g, "")}`;
  const css = buildGridCss(gridClass, resolvedColumns);

  if (items.length === 0) {
    return (
      <div
        className={cn(
          "rounded-xl border border-dashed bg-card px-4 py-10 text-center text-sm text-muted-foreground",
          className,
        )}
      >
        {emptyMessage}
      </div>
    );
  }

  return (
    <CleanListLayoutContext.Provider value={{ columns: resolvedColumns, gridClass }}>
      <div
        className={cn(
          "@container w-full min-w-0 max-w-full overflow-hidden rounded-xl border bg-card",
          className,
        )}
      >
        <style>{css}</style>
        <div className={cn(gridClass, "divide-y divide-border")}>
          <CleanListHeader />
          {items}
        </div>
      </div>
    </CleanListLayoutContext.Provider>
  );
}

function CleanListRowActionsMenu({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = React.useState(false);

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="size-8 text-muted-foreground data-[state=open]:bg-muted"
          aria-label="Open actions"
        >
          <EllipsisVertical className="size-4" />
          <span className="sr-only">Open actions</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        className="min-w-48 p-1"
        onClick={() => setOpen(false)}
      >
        <div
          className={cn(
            "flex flex-col gap-0.5",
            "[&_button]:h-auto [&_button]:min-h-8 [&_button]:w-full [&_button]:justify-start [&_button]:rounded-sm [&_button]:border-0 [&_button]:bg-transparent [&_button]:px-2 [&_button]:py-1.5 [&_button]:text-sm [&_button]:shadow-none [&_button]:hover:bg-accent [&_button]:hover:text-accent-foreground",
            "[&_a]:h-auto [&_a]:min-h-8 [&_a]:w-full [&_a]:justify-start [&_a]:rounded-sm [&_a]:border-0 [&_a]:bg-transparent [&_a]:px-2 [&_a]:py-1.5 [&_a]:text-sm [&_a]:shadow-none [&_a]:hover:bg-accent [&_a]:hover:text-accent-foreground",
          )}
        >
          {children}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export function CleanListRow({
  title,
  description,
  leading,
  trailing,
  actions,
  cells,
  onClick,
  className,
}: {
  title: React.ReactNode;
  description?: React.ReactNode;
  /** Optional icon / badge on the far left */
  leading?: React.ReactNode;
  /** Optional meta next to the title (e.g. external link icon) */
  trailing?: React.ReactNode;
  /** Compact action buttons / menus aligned right */
  actions?: React.ReactNode;
  /** Extra column values keyed to `CleanList` column defs (not `primary` / `actions`). */
  cells?: Record<string, React.ReactNode>;
  onClick?: () => void;
  className?: string;
}) {
  const { columns } = React.useContext(CleanListLayoutContext);
  const { extras, actions: actionsCol } = splitColumns(columns);
  const interactive = typeof onClick === "function";
  const stackedExtras = extras.filter((column) => cells?.[column.key] != null);

  return (
    <div
      className={cn(
        "cl-line items-start py-3.5",
        interactive && "cursor-pointer transition-colors hover:bg-muted/30",
        className,
      )}
      onClick={onClick}
      onKeyDown={
        interactive
          ? (e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                onClick?.();
              }
            }
          : undefined
      }
      role={interactive ? "button" : undefined}
      tabIndex={interactive ? 0 : undefined}
    >
      <div className="cl-primary">
        <div className="flex min-w-0 items-start gap-3">
          {leading ? <div className="mt-0.5 shrink-0">{leading}</div> : null}
          <div className="min-w-0 flex-1 space-y-0.5">
            <div className="flex min-w-0 items-center gap-1.5">
              <p className="min-w-0 flex-1 truncate text-sm font-semibold text-foreground">
                {title}
              </p>
              {trailing ? <div className="max-w-full shrink-0">{trailing}</div> : null}
            </div>
            {description ? (
              <div className="min-w-0 space-y-1 text-xs text-muted-foreground">
                {description}
              </div>
            ) : null}
            {stackedExtras.length > 0 ? (
              <div className="min-w-0 space-y-1 pt-0.5">
                {stackedExtras.map((column) => (
                  <div
                    key={column.key}
                    className={cn("cl-stack", `cl-stack-${cssKey(column.key)}`, "min-w-0")}
                  >
                    <span className="shrink-0 text-[10px] font-medium uppercase tracking-wider text-muted-foreground/80">
                      {column.label}
                    </span>
                    <div className="min-w-0 flex-1 overflow-hidden">{cells?.[column.key]}</div>
                  </div>
                ))}
              </div>
            ) : null}
          </div>
        </div>
      </div>

      {extras.map((column) => (
        <div
          key={column.key}
          className={cn("cl-extra", `cl-extra-${cssKey(column.key)}`)}
        >
          {cells?.[column.key] ?? <CleanListCell>—</CleanListCell>}
        </div>
      ))}

      {actions ? (
        <div
          className="cl-actions"
          onClick={(e) => e.stopPropagation()}
          onKeyDown={(e) => e.stopPropagation()}
        >
          <div className="cl-actions-full">{actions}</div>
          <div className="cl-actions-menu">
            <CleanListRowActionsMenu>{actions}</CleanListRowActionsMenu>
          </div>
        </div>
      ) : actionsCol ? (
        <div className="cl-actions" />
      ) : null}
    </div>
  );
}
