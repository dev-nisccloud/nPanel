export function getCategoryDisplayName(category: string): string {
    const map: Record<string, string> = {
        CLOUD: "Cloud",
        MARKETING: "Marketing",
        CONSULTING: "Consulting",
        CUSTOM: "Custom",
        AI: "AI",
    };
    return map[category] ?? category;
}

export function getCategoryBadgeClass(category: string): string {
    const map: Record<string, string> = {
        CLOUD:
            "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 border-blue-200 dark:border-blue-800",
        MARKETING:
            "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200 border-purple-200 dark:border-purple-800",
        CONSULTING:
            "bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200 border-amber-200 dark:border-amber-800",
        CUSTOM:
            "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200 border-gray-200 dark:border-gray-700",
        AI: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200 border-emerald-200 dark:border-emerald-800",
    };
    return map[category] ?? "";
}

export function getPricingModelDisplayName(model: string): string {
    const map: Record<string, string> = {
        FIXED: "Fixed Price",
        COMMISSION: "Commission %",
    };
    return map[model] ?? model;
}

export function getBillingCycleDisplayName(cycle: string | null | undefined): string {
    if (!cycle) return " ";
    const map: Record<string, string> = {
        MONTHLY: "Monthly",
        YEARLY: "Yearly",
        BIENNIALLY: "Biennial",
        CUSTOM: "Custom",
    };
    return map[cycle] ?? cycle;
}

export function getCommissionEntryStatusClass(status: string): string {
    const map: Record<string, string> = {
        DRAFT: "bg-muted text-muted-foreground",
        INVOICED:
            "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 border-blue-200 dark:border-blue-800",
        PAID: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 border-green-200 dark:border-green-800",
        WAIVED:
            "bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200 border-amber-200 dark:border-amber-800",
    };
    return map[status] ?? "";
}
