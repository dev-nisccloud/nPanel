"use client";

import { useEffect } from "react";
import { useNavigate, useParams } from "react-router";
import { FormProvider, useForm } from "react-hook-form";
import { ArrowLeft } from "lucide-react";
import { trpc } from "@/utils/trpc";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/shadcn-io/spinner";
import { ServiceOrderContent } from "./agency.sales.service-orders/create/_components/service-order-content";
import { serviceOrderFormDefaults } from "./agency.sales.service-orders/create/defaults";
import { orderToFormValues } from "./agency.sales.service-orders/create/mapOrder";
import { SERVICE_ORDER_BASE } from "./agency.sales.service-orders/_lib/model";

export default function EditServiceOrderPage() {
	const params = useParams();
	const navigate = useNavigate();
	const orderId = params.id as string;
	const { data: order, isLoading, error } = trpc.salesServiceOrders.getById.useQuery(
		{ id: orderId },
		{ enabled: !!orderId },
	);
	const form = useForm({ defaultValues: serviceOrderFormDefaults });

	useEffect(() => {
		if (order) form.reset(orderToFormValues(order));
	}, [order, form]);

	if (isLoading) {
		return (
			<div className="@container/main flex flex-col gap-4 md:gap-6 min-h-screen items-center justify-center">
				<Spinner className="h-8 w-8" />
			</div>
		);
	}

	if (error || !order) {
		return (
			<div className="@container/main flex flex-col gap-4 md:gap-6 min-h-screen items-center justify-center">
				<div className="text-center">
					<h1 className="text-2xl font-semibold mb-2">Service Order Not Found</h1>
					<p className="text-muted-foreground mb-4">
						{error?.message ?? "The service order you're looking for doesn't exist."}
					</p>
					<Button onClick={() => navigate(SERVICE_ORDER_BASE)} variant="outline">
						<ArrowLeft className="mr-2 h-4 w-4" />
						Back to Service Orders
					</Button>
				</div>
			</div>
		);
	}

	return (
		<FormProvider {...form}>
			<ServiceOrderContent mode="edit" orderId={orderId} />
		</FormProvider>
	);
}
