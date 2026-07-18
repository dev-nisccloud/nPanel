import { Context } from "hono";
import { db, eq } from "@npanel/db";
import { niscOrder, user as userTable, backgroundRemoverGenerationActivityLog, backgroundRemoverGeneration } from "@npanel/db/schema";
import { getQStashSigningKeys } from "@npanel/api/lib/qstash/client";
import { processNiscOrder } from "@npanel/api/lib/nisc-order-processor";
import { niscLog } from "@npanel/api/lib/nisc-order-logger";
import {
	renderOrderConfirmationEmail,
	renderNiscOrderConfirmationEmail,
	renderNiscOrderFailedEmail,
} from "@npanel/api/lib/email-templates";
import { sendEmail, sendEmailBatch } from "@npanel/api/lib/email";
import {
	niscOrderSkipsInvoice,
	runPreProvisioningInvoiceForOrder,
} from "@npanel/api/lib/nisc-order-invoice-delivery";
import { formatNiscDateTime } from "@npanel/api/lib/nisc-datetime-format";
import { buildNiscOrderReceivedEmailItems } from "@npanel/api/lib/nisc-order-received-email";
import { verifySignature } from "../../lib/qstash-verify";
import { getNormalizedPublicAppUrl, joinPublicAppPath } from "@npanel/api/lib/public-app-url";

interface NiscOrderPayload {
	niscOrderId: string;
}

export async function handleProcessNiscOrder(c: Context) {
	const request = c.req.raw;
	await niscLog("worker_request_received", { step: "start" });

	try {
		const signingKeys = getQStashSigningKeys();
		await verifySignature(request, {
			currentSigningKey: signingKeys.current ?? undefined,
			nextSigningKey: signingKeys.next ?? undefined,
		});
		await niscLog("worker_signature_verified", { step: "signature_ok" });
	} catch (error) {
		await niscLog("worker_signature_failed", { step: "signature_invalid" });
		return c.json({ error: "Invalid QStash signature" }, 401);
	}

	let body: NiscOrderPayload;
	try {
		body = await request.clone().json();
	} catch {
		await niscLog("worker_invalid_body", { step: "json_parse_failed" });
		return c.json({ error: "Invalid JSON body" }, 400);
	}

	const { niscOrderId } = body;
	if (!niscOrderId) {
		await niscLog("worker_missing_payload", { step: "missing_niscOrderId" });
		return c.json({ error: "Missing niscOrderId" }, 400);
	}
	await niscLog("worker_payload_parsed", { niscOrderId, step: "payload_ok" });

	const order = await db.query.niscOrder.findFirst({
		where: eq(niscOrder.id, niscOrderId),
		with: {
			user: { columns: { email: true, name: true } },
			team: { columns: { createdById: true, slug: true } },
			orderItems: {
				with: {
					product: { columns: { name: true, serviceType: true } },
					productPlan: { columns: { name: true } },
				},
			},
		},
	});

	if (!order) {
		await niscLog("worker_order_not_found", { niscOrderId });
		return c.json({ error: "Order not found" }, 404);
	}

	await niscLog("worker_order_loaded", {
		niscOrderId,
		orderNumber: order.orderNumber,
		status: order.status,
		itemCount: order.orderItems.length,
	});

	if (order.status !== "PENDING") {
		await niscLog("worker_order_skip_not_pending", { niscOrderId, status: order.status });
		return c.json({ message: "Order already processed", status: order.status }, 200);
	}

	try {
		await runPreProvisioningInvoiceForOrder(niscOrderId);

		await niscLog("worker_processor_start", { niscOrderId });
		const result = await processNiscOrder(niscOrderId);
		const skipCustomerEmails = niscOrderSkipsInvoice(order.metadata);
		await niscLog("worker_processor_done", {
			niscOrderId,
			ok: result.ok,
			status: result.status,
			failureReason: result.failureReason ?? null,
		});

		const orderAfter = await db.query.niscOrder.findFirst({
			where: eq(niscOrder.id, niscOrderId),
			with: {
				orderItems: {
					with: {
						product: { columns: { name: true, serviceType: true } },
						productPlan: { columns: { name: true } },
					},
				},
			},
		});

		const baseUrl = getNormalizedPublicAppUrl();
		const orderLink = joinPublicAppPath(
			`/agency/nisc-service-orders?order=${encodeURIComponent(niscOrderId)}`,
		);
		const retryLink = joinPublicAppPath("/agency/nisc-service-orders");

		let customerName = order.user?.name ?? null;
		if (!customerName && order.team?.createdById) {
			const creator = await db.query.user.findFirst({
				where: eq(userTable.id, order.team.createdById),
				columns: { name: true },
			});
			customerName = creator?.name ?? null;
		}
		if (!customerName) customerName = "Customer";

		if (
			!skipCustomerEmails &&
			result.ok &&
			result.status === "COMPLETED" &&
			orderAfter
		) {
			const billingSettings = order.teamId
				? await db.query.teamBillingSettings.findFirst({
					where: (fields, { eq }) => eq(fields.teamId, order.teamId as string),
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
					const { orderItems: confirmationItems, totalAmount: confirmationTotal } =
						buildNiscOrderReceivedEmailItems({
							createdAt: orderAfter.createdAt,
							currency: orderAfter.currency,
							subtotal: orderAfter.subtotal,
							orderItems: orderAfter.orderItems.map((i) => ({
								itemPrice: i.itemPrice,
								itemSubtotal: i.itemSubtotal,
								primaryDomain: i.primaryDomain,
								billingCycle: i.billingCycle,
								description: i.description,
								product: {
									name: i.product?.name ?? "Service",
									serviceType: i.product?.serviceType ?? null,
								},
								productPlan: i.productPlan,
							})),
						});
					const orderConfirmationHtml = await renderOrderConfirmationEmail({
						customerName: customerName ?? undefined,
						orderNumber: orderAfter.orderNumber,
						orderDate: formatNiscDateTime(orderAfter.createdAt),
						totalAmount: confirmationTotal,
						currency: orderAfter.currency,
						orderItems: confirmationItems,
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

		const superAdmins = await db.query.user.findMany({
			where: (fields, { and, eq }) => and(eq(fields.role, "AGENCY_SUPER_ADMIN"), eq(fields.status, "ACTIVE")),
			columns: { email: true },
		});
		const superAdminEmails = superAdmins
			.map((u) => u.email)
			.filter((e): e is string => typeof e === "string" && e.trim().length > 0);

		if (superAdminEmails.length > 0 && orderAfter) {
			try {
				if (result.ok && result.status === "COMPLETED") {
					const { orderItems: adminConfirmationItems, totalAmount: adminConfirmationTotal } =
						buildNiscOrderReceivedEmailItems({
							createdAt: orderAfter.createdAt,
							currency: orderAfter.currency,
							subtotal: orderAfter.subtotal,
							orderItems: orderAfter.orderItems.map((i) => ({
								itemPrice: i.itemPrice,
								itemSubtotal: i.itemSubtotal,
								primaryDomain: i.primaryDomain,
								billingCycle: i.billingCycle,
								description: i.description,
								product: {
									name: i.product?.name ?? "Service",
									serviceType: i.product?.serviceType ?? null,
								},
								productPlan: i.productPlan,
							})),
						});
					const html = await renderNiscOrderConfirmationEmail({
						customerName: customerName ?? undefined,
						orderNumber: orderAfter.orderNumber,
						orderDate: formatNiscDateTime(orderAfter.createdAt),
						totalAmount: adminConfirmationTotal,
						currency: orderAfter.currency,
						orderItems: adminConfirmationItems.map((line, idx) => ({
							...line,
							status: orderAfter.orderItems[idx]?.status,
						})),
						orderLink,
					});
					await sendEmailBatch(
						superAdminEmails.map((to) => ({
							to,
							subject: `[Nisc Admin] Order confirmed: ${orderAfter!.orderNumber}`,
							html,
						})),
					);
				} else if (!result.ok || result.status === "PARTIAL") {
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
				}
			} catch (emailErr) {
				const emailErrMsg = emailErr instanceof Error ? emailErr.message : String(emailErr);
				await niscLog("worker_email_failed", {
					niscOrderId,
					recipients: "super_admins",
					error: emailErrMsg,
				});
			}
		}

		return c.json({
			success: true,
			niscOrderId,
			status: result.status,
			failureReason: result.failureReason ?? undefined,
		});
	} catch (error) {
		const errorMessage = error instanceof Error ? error.message : String(error);
		await niscLog("worker_processor_exception", {
			niscOrderId,
			error: errorMessage,
		});

		const isRetryable =
			errorMessage.includes("timeout") ||
			errorMessage.includes("network") ||
			errorMessage.includes("ECONNREFUSED");

		return c.json(
			{ error: errorMessage, niscOrderId, retryable: isRetryable },
			isRetryable ? 500 : 200
		);
	}
}
