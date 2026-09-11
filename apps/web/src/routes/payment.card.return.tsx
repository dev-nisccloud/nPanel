"use client";

import * as React from "react";
import { Link, useNavigate, useSearchParams } from "react-router";
import { CheckCircle2, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/npanel-ui/spinner";
import { trpc } from "@/utils/trpc";
import { authClient } from "@/lib/auth-client";
import { toast } from "@/components/ui/sonner";

const POLL_INTERVAL_MS = 2000;
const MAX_ATTEMPTS = 45;

export default function CardPaymentReturnPage() {
	const [searchParams] = useSearchParams();
	const navigate = useNavigate();
	const orderReference = searchParams.get("orderReference")?.trim() || "";
	const callbackStatus = searchParams.get("status")?.trim() || "";

	const { data: session, isPending: sessionPending } = authClient.useSession();
	const [attempts, setAttempts] = React.useState(0);
	const [phase, setPhase] = React.useState<
		"polling" | "creating" | "success" | "failed" | "timeout"
	>("polling");
	const [errorMessage, setErrorMessage] = React.useState<string | null>(null);
	const [orderNumber, setOrderNumber] = React.useState<string | null>(null);
	const [invoiceReturnPath, setInvoiceReturnPath] = React.useState<string | null>(null);
	const createStartedRef = React.useRef(false);

	const statusQuery = trpc.paymentGateway.jenga.getPaymentStatus.useQuery(
		{ orderReference },
		{
			enabled: Boolean(orderReference) && Boolean(session?.user) && phase === "polling",
			refetchInterval: (query) => {
				const status = query.state.data?.data?.status;
				if (status === "SUCCESS" || status === "FAILED" || status === "CANCELLED") {
					return false;
				}
				if (attempts >= MAX_ATTEMPTS) return false;
				return POLL_INTERVAL_MS;
			},
		},
	);

	const applyInvoicePayment = trpc.invoicing.applyCheckoutPayment.useMutation({
		onSuccess: () => {
			setPhase("success");
			toast.success("Payment confirmed.");
		},
		onError: (err) => {
			setErrorMessage(err.message || "Failed to apply payment to invoice.");
			setPhase("failed");
		},
	});

	const createOrder = trpc.niscServiceOrders.createFromJengaPayment.useMutation({
		onSuccess: (data: unknown) => {
			const result = data as { orderNumber?: string; niscOrderId?: string };
			setOrderNumber(result.orderNumber ?? result.niscOrderId ?? null);
			setPhase("success");
			toast.success("Payment confirmed and order created.");
		},
		onError: (err) => {
			setErrorMessage(err.message || "Failed to create order from payment.");
			setPhase("failed");
		},
	});

	React.useEffect(() => {
		if (phase !== "polling") return;
		const id = window.setInterval(() => {
			setAttempts((n) => n + 1);
		}, POLL_INTERVAL_MS);
		return () => window.clearInterval(id);
	}, [phase]);

	React.useEffect(() => {
		if (phase !== "polling") return;
		if (attempts >= MAX_ATTEMPTS) {
			setPhase("timeout");
			setErrorMessage(
				"Payment is taking longer than expected. If you were charged, contact support with your reference.",
			);
		}
	}, [attempts, phase]);

	React.useEffect(() => {
		const status = statusQuery.data?.data?.status;
		if (!status || phase !== "polling") return;

		if (status === "FAILED" || status === "CANCELLED") {
			setPhase("failed");
			setErrorMessage(
				statusQuery.data?.data?.gatewayMessage ||
					"Card payment was not completed.",
			);
			return;
		}

		if (status === "SUCCESS" && !createStartedRef.current) {
			createStartedRef.current = true;
			setPhase("creating");
			const invoiceId = statusQuery.data?.data?.invoiceId;
			const returnPath = statusQuery.data?.data?.invoiceReturnPath;
			if (invoiceId) {
				if (typeof returnPath === "string" && returnPath.startsWith("/")) {
					setInvoiceReturnPath(returnPath);
				} else {
					setInvoiceReturnPath(`/agency/invoices/${invoiceId}`);
				}
				applyInvoicePayment.mutate({ checkoutRequestId: orderReference });
				return;
			}
			createOrder.mutate({ orderReference });
		}
	}, [statusQuery.data, phase, orderReference, createOrder, applyInvoicePayment]);

	if (sessionPending) {
		return (
			<div className="flex min-h-[50vh] items-center justify-center">
				<Spinner variant="ellipsis" size={40} />
			</div>
		);
	}

	if (!session?.user) {
		return (
			<div className="mx-auto max-w-md px-4 py-16 text-center space-y-4">
				<p className="text-sm text-muted-foreground">
					Sign in to finish your card payment.
				</p>
				<Button asChild>
					<Link
						to={`/auth/login?redirect=${encodeURIComponent(
							`/payment/card/return?orderReference=${orderReference}&status=${callbackStatus}`,
						)}`}
					>
						Sign in
					</Link>
				</Button>
			</div>
		);
	}

	if (!orderReference) {
		return (
			<div className="mx-auto max-w-md px-4 py-16 text-center space-y-4">
				<XCircle className="mx-auto size-12 text-destructive" />
				<p className="font-medium">Missing payment reference</p>
				<Button onClick={() => navigate("/")}>Go home</Button>
			</div>
		);
	}

	return (
		<div className="mx-auto max-w-md px-4 py-16 text-center space-y-4">
			{(phase === "polling" || phase === "creating") && (
				<>
					<Spinner variant="ellipsis" size={48} className="mx-auto text-primary" />
					<p className="font-medium text-foreground">
						{phase === "creating"
							? invoiceReturnPath
								? "Payment confirmed  updating your invoice…"
								: "Payment confirmed  creating your order…"
							: "Confirming card payment…"}
					</p>
					<p className="text-xs text-muted-foreground">
						Reference: {orderReference}
					</p>
				</>
			)}

			{phase === "success" && (
				<>
					<CheckCircle2 className="mx-auto size-12 text-emerald-600" />
					<p className="font-semibold text-lg">Payment successful</p>
					{orderNumber ? (
						<p className="text-sm text-muted-foreground">Order {orderNumber}</p>
					) : null}
					<p className="text-xs text-muted-foreground">Reference: {orderReference}</p>
					<Button onClick={() => navigate(invoiceReturnPath || "/")}>
						{invoiceReturnPath ? "Back to invoice" : "Continue"}
					</Button>
				</>
			)}

			{(phase === "failed" || phase === "timeout") && (
				<>
					<XCircle className="mx-auto size-12 text-destructive" />
					<p className="font-semibold text-lg">
						{phase === "timeout" ? "Still confirming payment" : "Payment failed"}
					</p>
					<p className="text-sm text-muted-foreground">
						{errorMessage || "Something went wrong."}
					</p>
					<p className="text-xs text-muted-foreground">Reference: {orderReference}</p>
					<div className="flex justify-center gap-2">
						<Button variant="outline" onClick={() => window.location.reload()}>
							Retry
						</Button>
						<Button onClick={() => navigate("/")}>Go home</Button>
					</div>
				</>
			)}
		</div>
	);
}
