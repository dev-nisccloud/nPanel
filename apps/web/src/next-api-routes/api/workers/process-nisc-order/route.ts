import { verifySignatureAppRouter } from "@/lib/qstash-verify";
import prisma from "@npanel/db";
import { getQStashSigningKeys } from "@npanel/api/lib/qstash/client";
import { processNiscOrder } from "@npanel/api/lib/nisc-order-processor";
import { niscLog } from "@npanel/api/lib/nisc-order-logger";
import {
	renderOrderConfirmationEmail,
	renderNiscOrderConfirmationEmail,
	renderNiscOrderFailedEmail,
} from "@npanel/api/lib/email-templates";
import { sendEmail, sendEmailBatch } from "@npanel/api/lib/email";
import { runPreProvisioningInvoiceForOrder } from "@npanel/api/lib/nisc-order-invoice-delivery";
import { getNormalizedPublicAppUrl, joinPublicAppPath } from "@npanel/api/lib/public-app-url";

interface NiscOrderPayload {
	niscOrderId: string;
}

/**
 * QStash worker: process a Nisc order (provision items, create subscriptions, send emails).
 */
export async function POST(request: Request) {
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
		return Response.json(
			{ error: "Invalid QStash signature" },
			{ status: 401 },
		);
	}

	let body: unknown;
	try {
		body = await request.json();
	} catch {
		await niscLog("worker_invalid_body", { step: "json_parse_failed" });
		return Response.json(
			{ error: "Invalid JSON body" },
			{ status: 400 },
		);
	}

	const { niscOrderId } = body as NiscOrderPayload;
	if (!niscOrderId) {
		await niscLog("worker_missing_payload", { step: "missing_niscOrderId" });
		return Response.json(
			{ error: "Missing niscOrderId" },
			{ status: 400 },
		);
	}
	await niscLog("worker_payload_parsed", { niscOrderId, step: "payload_ok" });

	const order = await prisma.niscOrder.findUnique({
		where: { id: niscOrderId },
		include: {
			user: { select: { email: true, name: true } },
			team: { select: { createdById: true, slug: true } },
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
		return Response.json(
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
		return Response.json(
			{ message: "Order already processed", status: order.status },
			{ status: 200 },
		);
	}

	try {
		await runPreProvisioningInvoiceForOrder(niscOrderId);

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

		const baseUrl = getNormalizedPublicAppUrl();
		const orderLink = joinPublicAppPath(
			`/agency/nisc-service-orders?order=${encodeURIComponent(niscOrderId)}`,
		);
		const retryLink = joinPublicAppPath("/agency/nisc-service-orders");

		// Customer name for email body (order placed by).
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

		// On success: send order confirmation to customer (invoice was emailed before provisioning).
		if (result.ok && result.status === "COMPLETED" && orderAfter) {
			const billingSettings = order.teamId
				? await prisma.teamBillingSettings.findUnique({
					where: { teamId: order.teamId },
				})
				: null;
			const customerEmail =
				order.user?.email ??
				(billingSettings?.billingEmail?.trim() ? billingSettings.billingEmail : null);

			if (customerEmail) {
				try {
					const customerOrderLink =
						order.team?.slug != null
							? joinPublicAppPath(`/${order.team.slug}/subscriptions`)
							: joinPublicAppPath("/dashboard");
					const orderConfirmationHtml = await renderOrderConfirmationEmail({
						customerName: customerName ?? undefined,
						orderNumber: orderAfter.orderNumber,
						orderDate: orderAfter.createdAt.toISOString().slice(0, 10),
						totalAmount: orderAfter.total,
						currency: orderAfter.currency,
						orderItems: orderAfter.orderItems.map((i) => ({
							name: [i.product?.name, i.productPlan?.name].filter(Boolean).join(" - ") || i.primaryDomain || "Order item",
							price: i.itemSubtotal,
						})),
						supportEmail: "accounts@nisccloud.com",
						supportPhone: "+254 748 777 666",
						orderLink: customerOrderLink,
					});
					await sendEmail({
						to: customerEmail,
						subject: `Order Confirmation - ${orderAfter.orderNumber} from Nisc Cloud®`,
						html: orderConfirmationHtml,
					});
					await niscLog("worker_email_sent", {
						niscOrderId,
						emailType: "order_confirmation",
						recipients: "customer",
					});
				} catch (customerEmailErr) {
					const errMsg = customerEmailErr instanceof Error ? customerEmailErr.message : String(customerEmailErr);
					await niscLog("worker_email_failed", {
						niscOrderId,
						recipients: "customer",
						error: errMsg,
					});
				}
			}

		}

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
						orderItems: orderAfter.orderItems.map((i) => {
							const name =
								[i.product?.name, i.productPlan?.name].filter(Boolean).join(" - ") ||
								i.primaryDomain ||
								"Order item";
							const domain = i.primaryDomain?.trim();
							const nameHasDomain =
								domain && name.toLowerCase().includes(domain.toLowerCase());
							return {
								name,
								description: domain && !nameHasDomain ? domain : undefined,
								price: `${orderAfter.currency} ${i.itemSubtotal}`,
								status: i.status,
							};
						}),
						orderLink,
					});
					await sendEmailBatch(
						superAdminEmails.map((to) => ({
							to,
							subject: `[Nisc Admin] Order confirmed: ${orderAfter!.orderNumber}`,
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
							subject: `[Nisc Admin] Order could not be completed: ${orderAfter!.orderNumber}`,
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
		return Response.json({
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

		return Response.json(
			{ error: errorMessage, niscOrderId, retryable: isRetryable },
			{ status: isRetryable ? 500 : 200 },
		);
	}
}
