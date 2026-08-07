import { TRPCError } from "@trpc/server";
import { and, eq, inArray, or } from "@npanel/db";
import { router, protectedProcedure } from "../../../trpc";
import { db } from "@npanel/db";
import { paymentTransaction, paymentTransactionActivityLog, } from "@npanel/db/schema/payment-transactions";
import { team, teamMember } from "@npanel/db/schema/teams";
import { createJengaClientFromEnv, formatJengaPhone, generateJengaOrderReference, JengaApiError, } from "./client";
import { getJengaUserFriendlyError } from "./error-codes";
import { parseJengaMetadata } from "./apply-payment-update";
import { getJengaPaymentStatusInputSchema, initiateCardPaymentInputSchema, } from "./types";
const isAgencyUserRole = (role) => role === "AGENCY_USER" || role === "AGENCY_ADMIN" || role === "AGENCY_SUPER_ADMIN";
/**
 * Jenga card payment gateway router (hosted redirect checkout).
 */
export const jengaRouter = router({
    /**
     * Initiate Jenga card payment. Returns checkoutUrl + paymentData for browser POST form.
     */
    initiateCardPayment: protectedProcedure
        .input(initiateCardPaymentInputSchema)
        .mutation(async ({ input, ctx }) => {
        if (!ctx.session?.user?.id) {
            throw new TRPCError({
                code: "UNAUTHORIZED",
                message: "Authentication required",
            });
        }
        const userId = ctx.session.user.id;
        const userRole = ctx.session.user.role;
        const now = new Date();
        if (input.teamId && !isAgencyUserRole(userRole)) {
            const [membership, ownedTeam] = await Promise.all([
                db.query.teamMember.findFirst({
                    where: and(eq(teamMember.teamId, input.teamId), eq(teamMember.userId, userId)),
                    columns: { id: true },
                }),
                db.query.team.findFirst({
                    where: and(eq(team.id, input.teamId), eq(team.createdById, userId)),
                    columns: { id: true },
                }),
            ]);
            if (!membership && !ownedTeam) {
                throw new TRPCError({
                    code: "FORBIDDEN",
                    message: "You do not have access to this team",
                });
            }
        }
        const orderReference = generateJengaOrderReference();
        const phone = formatJengaPhone(input.customerPhone);
        const paymentTimeLimit = input.paymentTimeLimit || process.env.JENGA_PAYMENT_TIME_LIMIT || "15mins";
        const metadata = {
            orderReference,
            source: input.orderIntent?.source ?? "buy_now",
            returnPath: input.orderIntent?.returnPath,
            returnOrigin: input.orderIntent?.returnOrigin,
            customer: {
                firstName: input.customerFirstName,
                lastName: input.customerLastName,
                email: input.customerEmail,
                phone,
                address: input.customerAddress,
                postalCode: input.customerPostalCodeZip,
                countryCode: input.countryCode,
            },
            items: input.orderIntent?.items,
            currency: input.orderIntent?.currency ?? input.currency,
            teamId: input.orderIntent?.teamId ?? input.teamId,
            billedForUserId: input.orderIntent?.billedForUserId,
            skipInvoice: input.orderIntent?.skipInvoice,
            cart: input.orderIntent?.cart,
            planId: input.orderIntent?.planId,
            productId: input.orderIntent?.productId,
            billingCycle: input.orderIntent?.billingCycle,
            primaryDomain: input.orderIntent?.primaryDomain,
        };
        const extraData = JSON.stringify({
            source: metadata.source,
            returnOrigin: metadata.returnOrigin,
            returnPath: metadata.returnPath,
            orderReference,
        });
        try {
            const jenga = createJengaClientFromEnv();
            const { checkoutUrl, paymentData } = await jenga.initiateCardPayment({
                orderAmount: input.amount,
                orderReference,
                currency: input.currency,
                productType: input.productType,
                productDescription: input.productDescription,
                paymentTimeLimit,
                customerFirstName: input.customerFirstName,
                customerLastName: input.customerLastName,
                customerEmail: input.customerEmail,
                customerPhone: phone,
                customerAddress: input.customerAddress,
                customerPostalCodeZip: input.customerPostalCodeZip,
                countryCode: input.countryCode,
                extraData,
            });
            const transactionId = crypto.randomUUID();
            await db.insert(paymentTransaction).values({
                id: transactionId,
                userId,
                teamId: input.teamId || input.orderIntent?.teamId || null,
                gateway: "JENGA",
                gatewayStatus: "INITIATED",
                gatewayMessage: "Redirect checkout initiated",
                checkoutRequestId: orderReference,
                amount: input.amount.toFixed(2),
                currency: input.currency,
                accountReference: orderReference,
                transactionDesc: input.productDescription.slice(0, 13),
                phoneNumber: phone,
                status: "PENDING",
                rawResponse: { checkoutUrl, orderReference },
                metadata: metadata,
                initiatedAt: now,
                createdAt: now,
                updatedAt: now,
            });
            await db.insert(paymentTransactionActivityLog).values({
                id: crypto.randomUUID(),
                transactionId,
                userId,
                action: "INITIATE",
                description: `Jenga card checkout initiated. Ref: ${orderReference}`,
                metadata: {
                    orderReference,
                    amount: input.amount,
                    currency: input.currency,
                    source: metadata.source,
                },
                ipAddress: null,
                userAgent: null,
                createdAt: now,
            });
            return {
                success: true,
                data: {
                    paymentTransactionId: transactionId,
                    orderReference,
                    checkoutUrl,
                    paymentData,
                },
            };
        }
        catch (error) {
            console.error("[Jenga] initiateCardPayment error:", error);
            if (error instanceof JengaApiError) {
                throw new TRPCError({
                    code: error.retryable ? "TIMEOUT" : "BAD_REQUEST",
                    message: error.errorInfo?.userMessage ||
                        getJengaUserFriendlyError(error.code) ||
                        error.description,
                });
            }
            if (error instanceof TRPCError)
                throw error;
            throw new TRPCError({
                code: "INTERNAL_SERVER_ERROR",
                message: "Failed to initiate card payment. Please try again.",
            });
        }
    }),
    /**
     * DB-only payment status by order reference (after callback/IPN).
     * Includes stored order intent so the return page can call createFromPayment.
     */
    getPaymentStatus: protectedProcedure
        .input(getJengaPaymentStatusInputSchema)
        .query(async ({ input, ctx }) => {
        if (!ctx.session?.user?.id) {
            throw new TRPCError({
                code: "UNAUTHORIZED",
                message: "Authentication required",
            });
        }
        const userId = ctx.session.user.id;
        const userRole = ctx.session.user.role;
        let accessCondition;
        if (isAgencyUserRole(userRole)) {
            accessCondition = and(eq(paymentTransaction.checkoutRequestId, input.orderReference), eq(paymentTransaction.gateway, "JENGA"));
        }
        else {
            const [membershipRows, ownedRows] = await Promise.all([
                db.query.teamMember.findMany({
                    where: eq(teamMember.userId, userId),
                    columns: { teamId: true },
                }),
                db.query.team.findMany({
                    where: eq(team.createdById, userId),
                    columns: { id: true },
                }),
            ]);
            const accessibleTeamIds = [
                ...new Set([
                    ...membershipRows.map((row) => row.teamId),
                    ...ownedRows.map((row) => row.id),
                ]),
            ];
            accessCondition = and(eq(paymentTransaction.checkoutRequestId, input.orderReference), eq(paymentTransaction.gateway, "JENGA"), accessibleTeamIds.length > 0
                ? or(eq(paymentTransaction.userId, userId), inArray(paymentTransaction.teamId, accessibleTeamIds))
                : eq(paymentTransaction.userId, userId));
        }
        const transaction = await db.query.paymentTransaction.findFirst({
            where: accessCondition,
        });
        if (!transaction) {
            throw new TRPCError({
                code: "NOT_FOUND",
                message: "Payment not found",
            });
        }
        const metadata = parseJengaMetadata(transaction.metadata);
        return {
            success: true,
            data: {
                paymentTransactionId: transaction.id,
                orderReference: input.orderReference,
                status: transaction.status,
                amount: transaction.amount,
                paidAmount: transaction.paidAmount,
                currency: transaction.currency,
                gatewayTransactionId: transaction.gatewayTransactionId,
                receiptNumber: transaction.receiptNumber,
                gatewayMessage: transaction.gatewayMessage,
                source: metadata?.source,
                orderIntent: metadata
                    ? {
                        items: metadata.items,
                        currency: metadata.currency,
                        teamId: metadata.teamId,
                        billedForUserId: metadata.billedForUserId,
                        skipInvoice: metadata.skipInvoice,
                        cart: metadata.cart,
                        planId: metadata.planId,
                        productId: metadata.productId,
                        billingCycle: metadata.billingCycle,
                        primaryDomain: metadata.primaryDomain,
                    }
                    : null,
            },
        };
    }),
});
