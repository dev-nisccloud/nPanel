import prisma from "@nPanel/db";
import { startOfDay, startOfMonth, subDays, subMonths } from "date-fns";

export async function aggregateSales(period: "DAILY" | "MONTHLY" = "DAILY") {
    // We aggregate all invoices to ensure the snapshot table is fully populated
    // In a production environment with millions of rows, we would only aggregate the last few days
    const invoices = await prisma.invoice.findMany({
        include: {
            lineItems: true,
        },
    });

    const salesGroups: Record<string, any> = {};
    const serviceGroups: Record<string, any> = {};

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
        await prisma.salesReportSnapshot.upsert({
            where: {
                date_period_currency: {
                    date: data.date,
                    period: period,
                    currency: data.currency,
                },
            },
            update: {
                totalRevenue: data.totalRevenue,
                totalInvoiced: data.totalInvoiced,
                totalPaid: data.totalPaid,
                taxableAmount: data.taxableAmount,
                taxAmount: data.taxAmount,
                pendingAmount: data.pendingAmount,
                invoiceCount: data.invoiceCount,
                paidInvoiceCount: data.paidInvoiceCount,
            },
            create: {
                date: data.date,
                period: period,
                currency: data.currency,
                totalRevenue: data.totalRevenue,
                totalInvoiced: data.totalInvoiced,
                totalPaid: data.totalPaid,
                taxableAmount: data.taxableAmount,
                taxAmount: data.taxAmount,
                pendingAmount: data.pendingAmount,
                invoiceCount: data.invoiceCount,
                paidInvoiceCount: data.paidInvoiceCount,
            },
        });
    }

    // Upsert Service Snapshots
    for (const key in serviceGroups) {
        const data = serviceGroups[key];
        await prisma.revenueByServiceSnapshot.upsert({
            where: {
                date_period_serviceType_currency: {
                    date: data.date,
                    period: data.period,
                    serviceType: data.serviceType,
                    currency: data.currency,
                },
            },
            update: { amount: data.amount },
            create: {
                date: data.date,
                period: data.period,
                serviceType: data.serviceType,
                currency: data.currency,
                amount: data.amount,
            },
        });
    }
}

export async function aggregateCreative(period: "DAILY" | "MONTHLY" = "DAILY") {
    const assets = await prisma.creativeAsset.findMany({
        include: {
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
        await prisma.creativeProductionSnapshot.upsert({
            where: {
                date_period: {
                    date: data.date,
                    period: period,
                },
            },
            update: {
                assetsCreated: data.assetsCreated,
                assetsApproved: data.assetsApproved,
                versionsCreated: data.versionsCreated,
            },
            create: {
                date: data.date,
                period: period,
                assetsCreated: data.assetsCreated,
                assetsApproved: data.assetsApproved,
                versionsCreated: data.versionsCreated,
            },
        });
    }
}
