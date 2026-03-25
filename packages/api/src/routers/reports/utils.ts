import { and, eq } from "drizzle-orm";
import { db } from "@npanel/db";
import {
    creativeProductionSnapshot,
    revenueByServiceSnapshot,
    revenueByTeamSnapshot,
    salesReportSnapshot,
} from "@npanel/db/schema/reporting";
import { startOfDay, startOfMonth } from "date-fns";
import { randomUUID } from "node:crypto";

export async function aggregateSales(period: "DAILY" | "MONTHLY" = "DAILY") {
    // We aggregate all invoices to ensure the snapshot table is fully populated
    // In a production environment with millions of rows, we would only aggregate the last few days
    const invoices = await db.query.invoice.findMany({
        with: {
            lineItems: true,
            team: true,
        },
    });

    const salesGroups: Record<string, any> = {};
    const serviceGroups: Record<string, any> = {};
    const teamGroups: Record<string, { date: Date; period: string; teamId: string; teamName: string; currency: string; amount: number }> = {};

    invoices.forEach((inv) => {
        const invDate = period === "DAILY" ? startOfDay(inv.createdAt) : startOfMonth(inv.createdAt);
        const sKey = `${invDate.toISOString()}-${inv.currency}`;

        if (!salesGroups[sKey]) {
            salesGroups[sKey] = {
                date: invDate,
                currency: inv.currency,
                totalRevenue: 0,
                totalInvoiced: 0,
                totalPaid: 0,
                taxableAmount: 0,
                taxAmount: 0,
                pendingAmount: 0,
                invoiceCount: 0,
                paidInvoiceCount: 0,
            };
        }

        const amount = parseFloat(inv.amount || "0");
        const subtotal = parseFloat(inv.subtotal || inv.amount || "0");
        const tax = parseFloat(inv.tax || "0");

        salesGroups[sKey].totalInvoiced += amount;
        salesGroups[sKey].taxableAmount += subtotal;
        salesGroups[sKey].taxAmount += tax;
        salesGroups[sKey].invoiceCount += 1;

        if (inv.status === "PAID") {
            salesGroups[sKey].totalRevenue += amount;
            salesGroups[sKey].totalPaid += amount;
            salesGroups[sKey].paidInvoiceCount += 1;
        } else {
            const paidEffectively = inv.status === "PARTIALLY_PAID" ? (amount * 0.5) : 0;
            salesGroups[sKey].totalPaid += paidEffectively;
            salesGroups[sKey].pendingAmount += (amount - paidEffectively);
        }

        // Aggregate by team (company)
        const teamId = inv.teamId ?? "__NO_TEAM__";
        const teamName = inv.team?.name ?? "No company";
        const tKey = `${invDate.toISOString()}-${teamId}-${inv.currency}`;
        if (!teamGroups[tKey]) {
            teamGroups[tKey] = {
                date: invDate,
                period,
                teamId,
                teamName,
                currency: inv.currency,
                amount: 0,
            };
        }
        teamGroups[tKey].amount += parseFloat(inv.amount || "0");

        // Aggregate by service from line items
        inv.lineItems.forEach((item) => {
            const itemName = (item.name || "").toUpperCase();
            let serviceType = "OTHER";

            if (itemName.includes("HOSTING") || itemName.includes("SERVER") || itemName.includes("DOMAIN")) {
                serviceType = "HOSTING";
            } else if (itemName.includes("SEO") || itemName.includes("MARKETING") || itemName.includes("ADS")) {
                serviceType = "SEO";
            } else if (itemName.includes("CREATIVE") || itemName.includes("DESIGN") || itemName.includes("LOGO")) {
                serviceType = "CREATIVE";
            }

            const svKey = `${invDate.toISOString()}-${serviceType}-${inv.currency}`;
            if (!serviceGroups[svKey]) {
                serviceGroups[svKey] = {
                    date: invDate,
                    period,
                    serviceType,
                    currency: inv.currency,
                    amount: 0,
                };
            }
            serviceGroups[svKey].amount += parseFloat(item.total || "0");
        });
    });

    // Upsert Sales Snapshots
    for (const key in salesGroups) {
        const data = salesGroups[key];
        if (data == null) continue;
        const existing = await db.query.salesReportSnapshot.findFirst({
            where: and(
                eq(salesReportSnapshot.date, data.date),
                eq(salesReportSnapshot.period, period),
                eq(salesReportSnapshot.currency, data.currency),
            ),
            columns: { id: true },
        });
        if (existing) {
            await db
                .update(salesReportSnapshot)
                .set({
                    totalRevenue: String(data.totalRevenue),
                    totalInvoiced: String(data.totalInvoiced),
                    totalPaid: String(data.totalPaid),
                    taxableAmount: String(data.taxableAmount),
                    taxAmount: String(data.taxAmount),
                    pendingAmount: String(data.pendingAmount),
                    invoiceCount: data.invoiceCount,
                    paidInvoiceCount: data.paidInvoiceCount,
                })
                .where(eq(salesReportSnapshot.id, existing.id));
        } else {
            await db.insert(salesReportSnapshot).values({
                id: randomUUID(),
                date: data.date,
                period,
                currency: data.currency,
                totalRevenue: String(data.totalRevenue),
                totalInvoiced: String(data.totalInvoiced),
                totalPaid: String(data.totalPaid),
                taxableAmount: String(data.taxableAmount),
                taxAmount: String(data.taxAmount),
                pendingAmount: String(data.pendingAmount),
                invoiceCount: data.invoiceCount,
                paidInvoiceCount: data.paidInvoiceCount,
            });
        }
    }

    // Upsert Service Snapshots
    for (const key in serviceGroups) {
        const data = serviceGroups[key];
        if (data == null) continue;
        const existing = await db.query.revenueByServiceSnapshot.findFirst({
            where: and(
                eq(revenueByServiceSnapshot.date, data.date),
                eq(revenueByServiceSnapshot.period, data.period),
                eq(revenueByServiceSnapshot.serviceType, data.serviceType),
                eq(revenueByServiceSnapshot.currency, data.currency),
            ),
            columns: { id: true },
        });
        if (existing) {
            await db
                .update(revenueByServiceSnapshot)
                .set({ amount: String(data.amount) })
                .where(eq(revenueByServiceSnapshot.id, existing.id));
        } else {
            await db.insert(revenueByServiceSnapshot).values({
                id: randomUUID(),
                date: data.date,
                period: data.period,
                serviceType: data.serviceType,
                currency: data.currency,
                amount: String(data.amount),
            });
        }
    }

    // Upsert Revenue by Team (Company) Snapshots
    for (const key in teamGroups) {
        const data = teamGroups[key];
        if (data == null) continue;
        const existing = await db.query.revenueByTeamSnapshot.findFirst({
            where: and(
                eq(revenueByTeamSnapshot.date, data.date),
                eq(revenueByTeamSnapshot.period, data.period),
                eq(revenueByTeamSnapshot.teamId, data.teamId),
                eq(revenueByTeamSnapshot.currency, data.currency),
            ),
            columns: { id: true },
        });
        if (existing) {
            await db
                .update(revenueByTeamSnapshot)
                .set({ amount: String(data.amount), teamName: data.teamName })
                .where(eq(revenueByTeamSnapshot.id, existing.id));
        } else {
            await db.insert(revenueByTeamSnapshot).values({
                id: randomUUID(),
                date: data.date,
                period: data.period,
                teamId: data.teamId,
                teamName: data.teamName,
                currency: data.currency,
                amount: String(data.amount),
            });
        }
    }
}

export async function aggregateCreative(period: "DAILY" | "MONTHLY" = "DAILY") {
    const assets = await db.query.creativeAsset.findMany({
        with: {
            versions: true,
        },
    });

    const groups: Record<string, any> = {};

    assets.forEach((asset) => {
        const assetDate = period === "DAILY" ? startOfDay(asset.createdAt) : startOfMonth(asset.createdAt);
        const key = assetDate.toISOString();

        if (!groups[key]) {
            groups[key] = {
                date: assetDate,
                assetsCreated: 0,
                assetsApproved: 0,
                versionsCreated: 0,
            };
        }

        groups[key].assetsCreated += 1;
        groups[key].versionsCreated += asset.versions.length;

        if (asset.status === "APPROVED") {
            groups[key].assetsApproved += 1;
        }
    });

    for (const key in groups) {
        const data = groups[key];
        if (data == null) continue;
        const existing = await db.query.creativeProductionSnapshot.findFirst({
            where: and(
                eq(creativeProductionSnapshot.date, data.date),
                eq(creativeProductionSnapshot.period, period),
            ),
            columns: { id: true },
        });
        if (existing) {
            await db
                .update(creativeProductionSnapshot)
                .set({
                    assetsCreated: data.assetsCreated,
                    assetsApproved: data.assetsApproved,
                    versionsCreated: data.versionsCreated,
                })
                .where(eq(creativeProductionSnapshot.id, existing.id));
        } else {
            await db.insert(creativeProductionSnapshot).values({
                id: randomUUID(),
                date: data.date,
                period,
                assetsCreated: data.assetsCreated,
                assetsApproved: data.assetsApproved,
                versionsCreated: data.versionsCreated,
            });
        }
    }
}
