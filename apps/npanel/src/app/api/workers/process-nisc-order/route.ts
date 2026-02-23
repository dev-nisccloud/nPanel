import { NextRequest, NextResponse } from "next/server";
import { verifySignatureAppRouter } from "@upstash/qstash/nextjs";
import prisma from "@nPanel/db";
import { getQStashSigningKeys } from "@nPanel/api/lib/qstash/client";
import { processNiscOrder } from "@nPanel/api/lib/nisc-order-processor";
import { niscLog } from "@nPanel/api/lib/nisc-order-logger";
import {
	renderNiscOrderConfirmationEmail,
	renderNiscOrderFailedEmail,
} from "@nPanel/api/lib/email-templates";
import { sendEmail, sendEmailBatch } from "@nPanel/api/lib/email";

export const runtime = "nodejs";
export const maxDuration = 300;

interface NiscOrderPayload {
	niscOrderId: string;
}

/**
 * QStash worker: process a NISC order (provision items, create subscriptions, send emails).
 */
export async function POST(request: NextRequest) {
	await niscLog("worker_request_received", { step: "start" });

	try {
		const signingKeys = getQStashSigningKeys();
		await verifySignatureAppRouter(request as any, {
			currentSigningKey: signingKeys.current ?? undefined,
			nextSigningKey: signingKeys.next ?? undefined,
		});
		await niscLog("worker_signature_verified", { step: "signature_ok" });
	} catch {
		await niscLog("worker_signature_failed", { step: "signature_invalid" });
		return NextResponse.json(
			{ error: "Invalid QStash signature" },
			{ status: 401 },
		);
	}

	let body: unknown;
	try {
		body = await request.json();
	} catch {
		await niscLog("worker_invalid_body", { step: "json_parse_failed" });
		return NextResponse.json(
			{ error: "Invalid JSON body" },
			{ status: 400 },
		);
	}

	const { niscOrderId } = body as NiscOrderPayload;
	if (!niscOrderId) {
		await niscLog("worker_missing_payload", { step: "missing_niscOrderId" });
		return NextResponse.json(
			{ error: "Missing niscOrderId" },
			{ status: 400 },
		);
	}
	await niscLog("worker_payload_parsed", { niscOrderId, step: "payload_ok" });

	const order = await prisma.niscOrder.findUnique({
		where: { id: niscOrderId },
		include: {
			user: { select: { email: true, name: true } },
			team: { select: { createdById: true } },
			orderItems: {
				include: {
					product: { select: { name: true } },
					productPlan: { select: { name: true } },
				},
			},
		},
	});

	if (!order) {
		await niscLog("worker_order_not_found", { niscOrderId });
		return NextResponse.json(
			{ error: "Order not found" },
			{ status: 404 },
		);
	}
	await niscLog("worker_order_loaded", {
		niscOrderId,
		orderNumber: order.orderNumber,
		status: order.status,
		itemCount: order.orderItems.length,
	});

	if (order.status !== "PENDING") {
		await niscLog("worker_order_skip_not_pending", { niscOrderId, status: order.status });
		return NextResponse.json(
			{ message: "Order already processed", status: order.status },
			{ status: 200 },
		);
	}

	try {
		await niscLog("worker_processor_start", { niscOrderId });
		const result = await processNiscOrder(niscOrderId);
		await niscLog("worker_processor_done", {
			niscOrderId,
			ok: result.ok,
			status: result.status,
			failureReason: result.failureReason ?? null,
		});

		const orderAfter = await prisma.niscOrder.findUnique({
			where: { id: niscOrderId },
			include: {
				orderItems: {
					include: {
						product: { select: { name: true } },
						productPlan: { select: { name: true } },
					},
				},
			},
		});

		const baseUrl = (process.env.NEXT_PUBLIC_APP_URL ?? "").replace(/\/$/, "");
		const orderLink = `${baseUrl}/agency/nisc-service-orders?order=${niscOrderId}`;
		const retryLink = `${baseUrl}/agency/nisc-service-orders`;

		// Customer name for email body (order placed by); only the "order received" email goes to customer (sent at creation).
		const customerName =
			order.user?.name ??
			(order.team?.createdById
				? (
						await prisma.user.findUnique({
							where: { id: order.team.createdById },
							select: { name: true },
						})
					)?.name ?? null
				: null) ??
			"Customer";

		// Status emails (confirmation / failed / partial) go to super admins only, not to the customer.
		const superAdmins = await prisma.user.findMany({
			where: { role: "AGENCY_SUPER_ADMIN", status: "ACTIVE" },
			select: { email: true },
		});
		const superAdminEmails = superAdmins
			.map((u) => u.email)
			.filter((e): e is string => typeof e === "string" && e.trim().length > 0);

		if (superAdminEmails.length > 0 && orderAfter) {
			try {
				if (result.ok && result.status === "COMPLETED") {
					await niscLog("worker_email_sending", {
						niscOrderId,
						emailType: "confirmation",
						recipients: "super_admins",
						count: superAdminEmails.length,
					});
					const html = await renderNiscOrderConfirmationEmail({
						customerName: customerName ?? undefined,
						orderNumber: orderAfter.orderNumber,
						orderDate: orderAfter.createdAt.toISOString().slice(0, 10),
						totalAmount: orderAfter.total,
						currency: orderAfter.currency,
						orderItems: orderAfter.orderItems.map((i) => ({
							name: [i.product?.name, i.productPlan?.name].filter(Boolean).join(" - ") || i.primaryDomain || "Order item",
							price: i.itemSubtotal,
						})),
						orderLink,
					});
					await sendEmailBatch(
						superAdminEmails.map((to) => ({
							to,
							subject: `[NISC Admin] Order confirmed: ${orderAfter!.orderNumber}`,
							html,
						})),
					);
					await niscLog("worker_email_sent", {
						niscOrderId,
						emailType: "confirmation",
						recipients: "super_admins",
						count: superAdminEmails.length,
					});
				} else if (!result.ok || result.status === "PARTIAL") {
					await niscLog("worker_email_sending", {
						niscOrderId,
						emailType: "failed_partial",
						recipients: "super_admins",
						count: superAdminEmails.length,
						failureReason: result.failureReason ?? null,
					});
					const failedItems = orderAfter.orderItems
						.filter((i) => i.status === "FAILED")
						.map((i) => ({
							name: [i.product?.name, i.productPlan?.name].filter(Boolean).join(" - ") || i.primaryDomain || "Order item",
							error: i.provisioningError ?? undefined,
						}));
					const html = await renderNiscOrderFailedEmail({
						customerName: customerName ?? undefined,
						orderNumber: orderAfter.orderNumber,
						failedItems: failedItems.length > 0 ? failedItems : undefined,
						failureReason: result.failureReason,
						retryLink,
					});
					await sendEmailBatch(
						superAdminEmails.map((to) => ({
							to,
							subject: `[NISC Admin] Order could not be completed: ${orderAfter!.orderNumber}`,
							html,
						})),
					);
					await niscLog("worker_email_sent", {
						niscOrderId,
						emailType: "failed_partial",
						recipients: "super_admins",
						count: superAdminEmails.length,
					});
				}
			} catch (emailErr) {
				const emailErrMsg = emailErr instanceof Error ? emailErr.message : String(emailErr);
				await niscLog("worker_email_failed", {
					niscOrderId,
					recipients: "super_admins",
					error: emailErrMsg,
				});
			}
		} else if (superAdminEmails.length === 0) {
			await niscLog("worker_email_skipped_no_super_admins", { niscOrderId });
		}

		await niscLog("worker_response_success", {
			niscOrderId,
			status: result.status,
			failureReason: result.failureReason ?? null,
		});
		return NextResponse.json({
			success: true,
			niscOrderId,
			status: result.status,
			failureReason: result.failureReason ?? undefined,
		});
	} catch (error) {
		const errorMessage = error instanceof Error ? error.message : String(error);
		const stack = error instanceof Error ? error.stack : undefined;
		await niscLog("worker_processor_exception", {
			niscOrderId,
			error: errorMessage,
			stack: stack ?? undefined,
		});

		const isRetryable =
			errorMessage.includes("timeout") ||
			errorMessage.includes("network") ||
			errorMessage.includes("ECONNREFUSED");

		return NextResponse.json(
			{ error: errorMessage, niscOrderId, retryable: isRetryable },
			{ status: isRetryable ? 500 : 200 },
		);
	}
}
