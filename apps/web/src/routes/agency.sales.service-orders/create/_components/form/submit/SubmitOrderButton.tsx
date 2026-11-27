"use client";

import { Button } from "@/components/ui/button";
import { CheckCircle2, LoaderIcon, Save, Send } from "lucide-react";
import { useFormContext } from "react-hook-form";
import { useNavigate } from "react-router";
import { useState } from "react";
import { trpc } from "@/utils/trpc";
import { toast } from "@/components/ui/sonner";
import { useData } from "@/routes/agency.sales.service-orders/create/hooks/useData";
import { SERVICE_ORDER_BASE } from "@/routes/agency.sales.service-orders/_lib/model";
import { buildServiceOrderInput } from "./saveOrder";

export const SubmitOrderButton = ({ orderId }: { orderId?: string }) => {
	const [status, setStatus] = useState<"idle" | "saving" | "saved">("idle");
	const form = useFormContext();
	const navigate = useNavigate();
	const utils = trpc.useUtils();
	const data = useData();
	const linkedUserId = form.watch("linkedUserId") as string | undefined;
	const editing = !!orderId;

	const createOrder = trpc.salesServiceOrders.create.useMutation();
	const updateOrder = trpc.salesServiceOrders.update.useMutation();

	const handleSubmit = async () => {
		try {
			setStatus("saving");
			const payload = buildServiceOrderInput(data, linkedUserId);
			if (editing && orderId) {
				const { status: _status, orderNumber: _orderNumber, ...rest } = payload;
				await updateOrder.mutateAsync({ id: orderId, ...rest });
				await utils.salesServiceOrders.getById.invalidate({ id: orderId });
				await utils.salesServiceOrders.list.invalidate();
				toast.success("Service order updated");
				setStatus("saved");
				setTimeout(() => navigate(`${SERVICE_ORDER_BASE}/${orderId}`), 1000);
				return;
			}
			const created = await createOrder.mutateAsync(payload);
			await utils.salesServiceOrders.listCustomersSummary.invalidate();
			await utils.salesServiceOrders.getNextOrderNumber.invalidate();
			toast.success("Service order created", {
				description: "You can view, download, or email it from the order page.",
			});
			setStatus("saved");
			setTimeout(() => navigate(`${SERVICE_ORDER_BASE}/${created.id}`), 1000);
		} catch (error) {
			setStatus("idle");
			toast.error(editing ? "Failed to update service order" : "Failed to create service order", {
				description: error instanceof Error ? error.message : "An error occurred.",
			});
		}
	};

	return (
		<div className="flex min-h-[calc(100vh-280px)] flex-col items-center justify-center text-center">
			<div className="flex max-w-md flex-col items-center">
				<h2 className="text-2xl font-semibold tracking-tight">Your service order is ready</h2>
				<p className="text-sm text-muted-foreground pt-2 pb-6">
					Review the details carefully before submitting. The order will be saved and you can view or download it from the list.
				</p>
				<Button disabled={status !== "idle"} onClick={handleSubmit} type="button">
					{status === "idle" && (
						<>
							{editing ? <Save /> : <Send />} {editing ? "Save service order" : "Submit service order"}
						</>
					)}
					{status === "saving" && (
						<>
							<LoaderIcon className="animate-spin" /> {editing ? "Saving..." : "Submitting..."}
						</>
					)}
					{status === "saved" && (
						<>
							<CheckCircle2 /> {editing ? "Service order updated" : "Service order created"}
						</>
					)}
				</Button>
			</div>
		</div>
	);
};
