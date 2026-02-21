import { NextRequest, NextResponse } from "next/server";
import { verifySignatureAppRouter } from "@upstash/qstash/nextjs";
import prisma from "@nPanel/db";
import { getQStashSigningKeys } from "@nPanel/api/lib/qstash/client";
import { processNiscOrder } from "@nPanel/api/lib/nisc-order-processor";
import {
	renderNiscOrderConfirmationEmail,
	renderNiscOrderFailedEmail,
} from "@nPanel/api/lib/email-templates";
import { sendEmail } from "@nPanel/api/lib/email";

export const runtime = "nodejs";
export const maxDuration = 300;

interface NiscOrderPayload {
	niscOrderId: string;
}

/**
 * QStash worker: process a NISC order (provision items, create subscriptions, send emails).
 */
export async function POST(request: NextRequest) {
	try {
		const signingKeys = getQStashSigningKeys();
		await verifySignatureAppRouter(request as any, {
			currentSigningKey: signingKeys.current ?? undefined,
			nextSigningKey: signingKeys.next ?? undefined,
		});
	} catch {
		return NextResponse.json(
			{ error: "Invalid QStash signature" },
			{ status: 401 },
		);
	}

	let body: unknown;
	try {
		body = await request.json();
	} catch {
		return NextResponse.json(
			{ error: "Invalid JSON body" },
			{ status: 400 },
		);
	}

	const { niscOrderId } = body as NiscOrderPayload;
	if (!niscOrderId) {
		return NextResponse.json(
			{ error: "Missing niscOrderId" },
			{ status: 400 },
		);
	}

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
		return NextResponse.json(
			{ error: "Order not found" },
			{ status: 404 },
		);
	}

	if (order.status !== "PENDING") {
		return NextResponse.json(
			{ message: "Order already processed", status: order.status },
			{ status: 200 },
		);
	}

	try {
		const result = await processNiscOrder(niscOrderId);

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

		let recipientEmail: string | null =
			order.user?.email ??
			(order.team?.createdById
				? (
						await prisma.user.findUnique({
							where: { id: order.team.createdById },
							select: { email: true },
						})
					)?.email ?? null
				: null);

		const customerName =
			order.user?.name ??
			(recipientEmail
				? (await prisma.user.findFirst({
						where: { email: recipientEmail },
						select: { name: true },
					}))?.name ?? null
				: null) ??
			"Customer";

		if (recipientEmail && orderAfter) {
			try {
				if (result.ok && result.status === "COMPLETED") {
					const html = await renderNiscOrderConfirmationEmail({
						customerName: customerName ?? undefined,
						orderNumber: orderAfter.orderNumber,
						orderDate: orderAfter.createdAt.toISOString().slice(0, 10),
						totalAmount: orderAfter.total,
						currency: orderAfter.currency,
						orderItems: orderAfter.orderItems.map((i) => ({
							name: `${i.product.name} - ${i.productPlan.name}`,
							price: i.itemSubtotal,
						})),
						orderLink,
					});
					await sendEmail({
						to: recipientEmail,
						subject: `Order confirmed: ${orderAfter.orderNumber}`,
						html,
					});
				} else if (!result.ok || result.status === "PARTIAL") {
					const failedItems = orderAfter.orderItems
						.filter((i) => i.status === "FAILED")
						.map((i) => ({
							name: `${i.product.name} - ${i.productPlan.name}`,
							error: i.provisioningError ?? undefined,
						}));
					const html = await renderNiscOrderFailedEmail({
						customerName: customerName ?? undefined,
						orderNumber: orderAfter.orderNumber,
						failedItems: failedItems.length > 0 ? failedItems : undefined,
						failureReason: result.failureReason,
						retryLink,
					});
					await sendEmail({
						to: recipientEmail,
						subject: `Order could not be completed: ${orderAfter.orderNumber}`,
						html,
					});
				}
			} catch (emailErr) {
				console.error("NISC order notification email failed:", emailErr);
			}
		}

		return NextResponse.json({
			success: true,
			niscOrderId,
			status: result.status,
			failureReason: result.failureReason ?? undefined,
		});
	} catch (error) {
		const errorMessage = error instanceof Error ? error.message : String(error);
		console.error("NISC order processing failed:", error);

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
