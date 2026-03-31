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
	renderInvoiceSuccessEmail,
} from "@npanel/api/lib/email-templates";
import { sendEmail, sendEmailBatch } from "@npanel/api/lib/email";
import {
	isTeamBillingComplete,
	createInvoiceForNiscOrder,
} from "@npanel/api/lib/nisc-order-auto-invoice";
import { verifySignature } from "../../lib/qstash-verify";

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
					product: { columns: { name: true } },
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
		await niscLog("worker_processor_start", { niscOrderId });
		const result = await processNiscOrder(niscOrderId);
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
						product: { columns: { name: true } },
						productPlan: { columns: { name: true } },
					},
				},
			},
		});

		const baseUrl = (process.env.VITE_PUBLIC_APP_URL ?? "").replace(/\/$/, "");
		const orderLink = `${baseUrl}/agency/nisc-service-orders?order=${niscOrderId}`;
		const retryLink = `${baseUrl}/agency/nisc-service-orders`;

		let customerName = order.user?.name ?? null;
		if (!customerName && order.team?.createdById) {
			const creator = await db.query.user.findFirst({
				where: eq(userTable.id, order.team.createdById),
				columns: { name: true },
			});
			customerName = creator?.name ?? null;
		}
		if (!customerName) customerName = "Customer";

		if (result.ok && result.status === "COMPLETED" && orderAfter) {
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
							? `${baseUrl}/${order.team.slug}/subscriptions`
							: `${baseUrl}/dashboard`;
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
						subject: `Order Confirmation - ${orderAfter.orderNumber} from Nisc Cloud Limited`,
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

			if (order.teamId && order.createdBy) {
				if (!isTeamBillingComplete(billingSettings)) {
					await niscLog("invoice_not_created", {
						niscOrderId,
						reason: "team_billing_settings_incomplete_or_missing",
					});
				} else {
					try {
						const invoiceResult = await createInvoiceForNiscOrder(
							db as any,
							orderAfter as any,
							billingSettings!,
							order.createdBy,
						);
						if (invoiceResult) {
							const toEmail = billingSettings!.billingEmail.trim();
							if (toEmail) {
								const initiator = await db.query.user.findFirst({
									where: eq(userTable.id, order.createdBy),
									columns: { email: true },
								});
								const ccList: string[] = [];
								if (initiator?.email && typeof initiator.email === "string" && initiator.email.trim()) {
									const initiatorEmail = initiator.email.trim();
									if (initiatorEmail.toLowerCase() !== toEmail.toLowerCase()) {
										ccList.push(initiatorEmail);
									}
								}
								const invoiceDashboardUrl =
									baseUrl && order.team?.slug
										? `${baseUrl}/${order.team.slug}/invoices`
										: undefined;
								const invoiceSuccessHtml = await renderInvoiceSuccessEmail({
									customerName: billingSettings!.legalName ?? undefined,
									invoiceNumber: invoiceResult.invoiceNumber,
									orderNumber: orderAfter.orderNumber,
									totalAmount: orderAfter.total,
									currency: orderAfter.currency,
									supportEmail: "accounts@nisccloud.com",
									supportPhone: "+254 748 777 666",
									invoiceLink: invoiceDashboardUrl,
								});
								await sendEmail({
									to: toEmail,
									subject: `Your invoice ${invoiceResult.invoiceNumber} from Nisc Cloud Limited`,
									html: invoiceSuccessHtml,
									...(ccList.length > 0 && { cc: ccList }),
								});
								await niscLog("worker_invoice_created_and_sent", {
									niscOrderId,
									invoiceId: invoiceResult.invoiceId,
									invoiceNumber: invoiceResult.invoiceNumber,
									ccCount: ccList.length,
								});
							}
						}
					} catch (invoiceErr) {
						const errMsg = invoiceErr instanceof Error ? invoiceErr.message : String(invoiceErr);
						await niscLog("worker_invoice_creation_failed", {
							niscOrderId,
							error: errMsg,
						});
					}
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
