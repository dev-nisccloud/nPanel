import { randomUUID } from "node:crypto";
import { and, eq } from "@npanel/db";
import { db } from "@npanel/db";
import { paymentTransaction, paymentTransactionActivityLog, } from "@npanel/db/schema/payment-transactions";
/**
 * Apply browser callback (GET redirect) to payment_transaction.
 * Success when status === "paid" (per Jenga docs).
 */
export async function applyJengaCallbackUpdate(query) {
    const orderReference = query.orderReference?.trim();
    if (!orderReference) {
        return { ok: false, reason: "Missing orderReference" };
    }
    const transaction = await db.query.paymentTransaction.findFirst({
        where: and(eq(paymentTransaction.checkoutRequestId, orderReference), eq(paymentTransaction.gateway, "JENGA")),
    });
    if (!transaction) {
        return { ok: false, reason: "Transaction not found" };
    }
    if (transaction.status === "SUCCESS" || transaction.status === "FAILED") {
        return {
            ok: true,
            alreadyTerminal: true,
            transactionId: transaction.id,
            status: transaction.status,
        };
    }
    const now = new Date();
    const isPaid = query.status === "paid";
    const nextStatus = isPaid ? "SUCCESS" : "FAILED";
    await db
        .update(paymentTransaction)
        .set({
        status: nextStatus,
        gatewayStatus: query.status ?? null,
        gatewayMessage: query.desc ?? null,
        gatewayTransactionId: query.transactionId ?? null,
        receiptNumber: query.transactionId ?? null,
        paidAmount: isPaid && query.amount ? query.amount : transaction.paidAmount,
        rawResponse: query,
        processedAt: isPaid ? now : transaction.processedAt,
        failedAt: isPaid ? transaction.failedAt : now,
        updatedAt: now,
    })
        .where(eq(paymentTransaction.id, transaction.id));
    await db.insert(paymentTransactionActivityLog).values({
        id: randomUUID(),
        transactionId: transaction.id,
        userId: transaction.userId,
        action: isPaid ? "CALLBACK_SUCCESS" : "CALLBACK_FAILED",
        description: isPaid
            ? `Jenga callback: paid. TransactionId: ${query.transactionId ?? "n/a"}`
            : `Jenga callback: not paid (status=${query.status ?? "unknown"})`,
        metadata: {
            orderReference,
            transactionId: query.transactionId,
            status: query.status,
            amount: query.amount,
            desc: query.desc,
        },
        ipAddress: null,
        userAgent: null,
        createdAt: now,
    });
    return {
        ok: true,
        alreadyTerminal: false,
        transactionId: transaction.id,
        status: nextStatus,
    };
}
/**
 * Apply IPN webhook to payment_transaction (durable source of truth).
 * Matches by billNumber (order reference) or customer.reference when present.
 */
export async function applyJengaIpnUpdate(payload) {
    const orderReference = payload.transaction.billNumber?.trim() ||
        payload.customer.reference?.trim();
    if (!orderReference) {
        return { ok: false, reason: "Missing billNumber/order reference in IPN" };
    }
    const transaction = await db.query.paymentTransaction.findFirst({
        where: and(eq(paymentTransaction.checkoutRequestId, orderReference), eq(paymentTransaction.gateway, "JENGA")),
    });
    if (!transaction) {
        return { ok: false, reason: "Transaction not found" };
    }
    if (transaction.status === "SUCCESS" || transaction.status === "FAILED") {
        // Allow IPN to upgrade FAILED→SUCCESS if callback raced incorrectly
        if (transaction.status === "FAILED" &&
            payload.transaction.status === "SUCCESS") {
            // fall through
        }
        else {
            return {
                ok: true,
                alreadyTerminal: true,
                transactionId: transaction.id,
                status: transaction.status,
            };
        }
    }
    const now = new Date();
    const isSuccess = payload.transaction.status === "SUCCESS";
    const nextStatus = isSuccess ? "SUCCESS" : "FAILED";
    await db
        .update(paymentTransaction)
        .set({
        status: nextStatus,
        gatewayStatus: payload.transaction.status,
        gatewayMessage: payload.transaction.remarks ?? payload.transaction.paymentMode,
        gatewayTransactionId: payload.transaction.reference,
        receiptNumber: payload.bank.reference || payload.transaction.reference,
        paidAmount: isSuccess
            ? String(payload.transaction.amount)
            : transaction.paidAmount,
        rawResponse: payload,
        processedAt: isSuccess ? now : transaction.processedAt,
        failedAt: isSuccess ? null : now,
        updatedAt: now,
    })
        .where(eq(paymentTransaction.id, transaction.id));
    await db.insert(paymentTransactionActivityLog).values({
        id: randomUUID(),
        transactionId: transaction.id,
        userId: transaction.userId,
        action: isSuccess ? "IPN_SUCCESS" : "IPN_FAILED",
        description: isSuccess
            ? `Jenga IPN SUCCESS. Ref: ${payload.transaction.reference}`
            : `Jenga IPN FAILED. ${payload.transaction.remarks ?? ""}`,
        metadata: {
            orderReference,
            transactionReference: payload.transaction.reference,
            bankReference: payload.bank.reference,
            amount: payload.transaction.amount,
            paymentMode: payload.transaction.paymentMode,
            status: payload.transaction.status,
        },
        ipAddress: null,
        userAgent: null,
        createdAt: now,
    });
    return {
        ok: true,
        alreadyTerminal: false,
        transactionId: transaction.id,
        status: nextStatus,
    };
}
export function parseJengaMetadata(raw) {
    if (!raw || typeof raw !== "object")
        return null;
    const meta = raw;
    if (!meta.orderReference)
        return null;
    return meta;
}
export function getJengaReturnRedirect(params) {
    const webOrigin = process.env.WEB_APP_URL ||
        process.env.NEXT_PUBLIC_APP_URL ||
        "http://localhost:3000";
    const wwwOrigin = process.env.STOREFRONT_APP_URL ||
        process.env.WWW_APP_URL ||
        process.env.LANDING_APP_URL ||
        "http://localhost:3001";
    const source = params.metadata?.source;
    const returnOrigin = params.metadata?.returnOrigin;
    const returnPath = params.metadata?.returnPath;
    if (source === "storefront") {
        const origin = returnOrigin || wwwOrigin;
        const path = returnPath || "/cart";
        const url = new URL(path, origin);
        url.searchParams.set("jengaRef", params.orderReference);
        url.searchParams.set("jengaStatus", params.status);
        return url.toString();
    }
    const origin = returnOrigin || webOrigin;
    const path = returnPath || "/payment/jenga/return";
    const url = new URL(path, origin);
    url.searchParams.set("orderReference", params.orderReference);
    url.searchParams.set("status", params.status);
    return url.toString();
}
