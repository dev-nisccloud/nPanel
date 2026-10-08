"use client";

import * as React from "react";
import { Link } from "react-router";
import {
    ClipboardList,
    ExternalLink,
    Package,
    FileText,
    Receipt,
    Upload,
    Timer,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

const STORAGE_KEY = "npanel:kra-etims-automated-test-checklist";

type StepId =
    | "portalStarted"
    | "reinitialized"
    | "itemCreated"
    | "invoiceGenerated"
    | "creditNoteIssued"
    | "artefactsUploaded";

type ChecklistState = Record<StepId, boolean>;

const DEFAULT_STATE: ChecklistState = {
    portalStarted: false,
    reinitialized: false,
    itemCreated: false,
    invoiceGenerated: false,
    creditNoteIssued: false,
    artefactsUploaded: false,
};

type Step = {
    id: StepId;
    title: string;
    detail: string;
    href?: string;
    hrefLabel?: string;
    endpoint?: string;
};

const STEPS: Step[] = [
    {
        id: "portalStarted",
        title: "Start Automated App Test on Developer Portal",
        detail: "Open the KRA Developer Platform, begin the automated test for this app, then run the steps below while that session is active.",
        href: "https://developer.go.ke",
        hrefLabel: "Open Developer Portal",
    },
    {
        id: "reinitialized",
        title: "Re-initialize device",
        detail: "Use Re-initialize Device on this page so KRA logs /initialize for the active test session.",
        endpoint: "/initialize",
    },
    {
        id: "itemCreated",
        title: "Create / register an item",
        detail: "Register an item on KRA eTIMS Products. Capture a screenshot showing item code, tax category, and price.",
        href: "/agency/kra-etims/products",
        hrefLabel: "Open Products",
        endpoint: "/saveItem",
    },
    {
        id: "invoiceGenerated",
        title: "Generate a signed invoice",
        detail: "Create and sync an invoice so KRA receives a sales transaction. Capture the generation screenshot and download the invoice copy.",
        href: "/agency/invoices/create",
        hrefLabel: "Create Invoice",
        endpoint: "/sendSalesTransaction",
    },
    {
        id: "creditNoteIssued",
        title: "Issue a credit note",
        detail: "Issue a credit note against the signed sale. Download the credit note copy for upload.",
        href: "/agency/kra-etims/sales",
        hrefLabel: "Open Sales",
        endpoint: "/sendSalesTransaction (R)",
    },
    {
        id: "artefactsUploaded",
        title: "Upload test artefacts",
        detail: "Upload Item Creation Screenshot, Invoice Generation Screenshot, Invoice Copy, and Credit Note Copy within one hour of completing the automated test.",
        href: "https://developer.go.ke",
        hrefLabel: "Upload on Portal",
    },
];

function loadState(): ChecklistState {
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (!raw) return { ...DEFAULT_STATE };
        return { ...DEFAULT_STATE, ...JSON.parse(raw) };
    } catch {
        return { ...DEFAULT_STATE };
    }
}

export function AutomatedTestChecklist({ enabled }: { enabled: boolean }) {
    const [state, setState] = React.useState<ChecklistState>(DEFAULT_STATE);

    React.useEffect(() => {
        setState(loadState());
    }, []);

    const persist = (next: ChecklistState) => {
        setState(next);
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
        } catch {
            // ignore quota / private mode
        }
    };

    const toggle = (id: StepId, checked: boolean) => {
        persist({ ...state, [id]: checked });
    };

    const reset = () => persist({ ...DEFAULT_STATE });

    const doneCount = STEPS.filter((s) => state[s.id]).length;

    if (!enabled) return null;

    return (
        <Card className="bg-card shadow-sm">
            <CardHeader className="pb-3">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div className="space-y-1">
                        <CardTitle className="flex items-center gap-2 text-base">
                            <ClipboardList className="h-5 w-5 text-primary" />
                            KRA Automated App Test
                        </CardTitle>
                        <CardDescription>
                            Run these steps in order during an active Developer Portal test session.
                            Progress is saved in this browser only.
                        </CardDescription>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                        <span className="text-xs text-muted-foreground">
                            {doneCount}/{STEPS.length} done
                        </span>
                        <Button type="button" variant="ghost" size="sm" onClick={reset}>
                            Reset
                        </Button>
                    </div>
                </div>
            </CardHeader>
            <CardContent className="space-y-4">
                <Alert className="bg-amber-50 border-amber-200 dark:bg-amber-900/10 dark:border-amber-900/50">
                    <Timer className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                    <AlertTitle className="text-amber-800 dark:text-amber-400 text-sm">
                        Portal first, then nPanel
                    </AlertTitle>
                    <AlertDescription className="text-amber-700 dark:text-amber-500 text-xs">
                        Calling endpoints outside an active automated test session will not update the KRA scoreboard.
                        Upload artefacts within 1 hour of a successful run.
                    </AlertDescription>
                </Alert>

                <ol className="space-y-3">
                    {STEPS.map((step, index) => {
                        const checked = state[step.id];
                        const isExternal = step.href?.startsWith("http");
                        return (
                            <li
                                key={step.id}
                                className="flex gap-3 rounded-lg border bg-muted/20 p-3"
                            >
                                <div className="pt-0.5">
                                    <Checkbox
                                        id={`etims-test-${step.id}`}
                                        checked={checked}
                                        onCheckedChange={(value) => toggle(step.id, value === true)}
                                    />
                                </div>
                                <div className="min-w-0 flex-1 space-y-2">
                                    <div className="flex flex-wrap items-center gap-2">
                                        <span className="text-xs font-medium text-muted-foreground">
                                            Step {index + 1}
                                        </span>
                                        {step.endpoint && (
                                            <code className="rounded bg-muted px-1.5 py-0.5 text-[10px]">
                                                {step.endpoint}
                                            </code>
                                        )}
                                    </div>
                                    <label
                                        htmlFor={`etims-test-${step.id}`}
                                        className={`block text-sm font-medium cursor-pointer ${checked ? "line-through text-muted-foreground" : ""}`}
                                    >
                                        {step.title}
                                    </label>
                                    <p className="text-xs text-muted-foreground">{step.detail}</p>
                                    {step.href && step.hrefLabel && (
                                        isExternal ? (
                                            <Button asChild variant="outline" size="sm" className="mt-1">
                                                <a href={step.href} target="_blank" rel="noreferrer">
                                                    <ExternalLink className="mr-1.5 h-3.5 w-3.5" />
                                                    {step.hrefLabel}
                                                </a>
                                            </Button>
                                        ) : (
                                            <Button asChild variant="outline" size="sm" className="mt-1">
                                                <Link to={step.href}>
                                                    {step.id === "itemCreated" && <Package className="mr-1.5 h-3.5 w-3.5" />}
                                                    {step.id === "invoiceGenerated" && <FileText className="mr-1.5 h-3.5 w-3.5" />}
                                                    {step.id === "creditNoteIssued" && <Receipt className="mr-1.5 h-3.5 w-3.5" />}
                                                    {step.id === "artefactsUploaded" && <Upload className="mr-1.5 h-3.5 w-3.5" />}
                                                    {step.hrefLabel}
                                                </Link>
                                            </Button>
                                        )
                                    )}
                                </div>
                            </li>
                        );
                    })}
                </ol>
            </CardContent>
        </Card>
    );
}
