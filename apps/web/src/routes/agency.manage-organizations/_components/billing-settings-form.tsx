"use client";

import * as React from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { toast } from "@/components/ui/sonner";
import { Button } from "@/components/ui/button";
import {
	Form,
	FormControl,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Spinner } from "@/components/ui/shadcn-io/spinner";
import { trpc } from "@/utils/trpc";

const billingSettingsFormSchema = z.object({
	legalName: z.string().min(1, "Legal name is required"),
	billingEmail: z.string().email("Enter a valid billing email"),
	billingPhone: z.string().optional().nullable(),
	addressLine1: z.string().min(1, "Address line 1 is required"),
	addressLine2: z.string().optional().nullable(),
	city: z.string().min(1, "City is required"),
	state: z.string().optional().nullable(),
	country: z.string().min(1, "Country is required"),
	postalCode: z.string().optional().nullable(),
	taxId: z.string().optional().nullable(),
	additionalNotes: z.string().optional().nullable(),
});

type FormData = z.infer<typeof billingSettingsFormSchema>;

interface BillingSettingsFormProps {
	teamId: string;
	initialData?: {
		legalName: string;
		billingEmail: string;
		billingPhone: string | null;
		addressLine1: string;
		addressLine2: string | null;
		city: string;
		state: string | null;
		country: string;
		postalCode: string | null;
		taxId: string | null;
		additionalNotes: string | null;
	};
	onSuccess?: () => void;
	onCancel?: () => void;
}

export function BillingSettingsForm({
	teamId,
	initialData,
	onSuccess,
	onCancel,
}: BillingSettingsFormProps) {
	const form = useForm<FormData>({
		resolver: zodResolver(billingSettingsFormSchema),
		defaultValues: {
			legalName: initialData?.legalName ?? "",
			billingEmail: initialData?.billingEmail ?? "",
			billingPhone: initialData?.billingPhone ?? "",
			addressLine1: initialData?.addressLine1 ?? "",
			addressLine2: initialData?.addressLine2 ?? "",
			city: initialData?.city ?? "",
			state: initialData?.state ?? "",
			country: initialData?.country ?? "",
			postalCode: initialData?.postalCode ?? "",
			taxId: initialData?.taxId ?? "",
			additionalNotes: initialData?.additionalNotes ?? "",
		},
	});

	React.useEffect(() => {
		if (initialData) {
			form.reset({
				legalName: initialData.legalName,
				billingEmail: initialData.billingEmail,
				billingPhone: initialData.billingPhone ?? "",
				addressLine1: initialData.addressLine1,
				addressLine2: initialData.addressLine2 ?? "",
				city: initialData.city,
				state: initialData.state ?? "",
				country: initialData.country,
				postalCode: initialData.postalCode ?? "",
				taxId: initialData.taxId ?? "",
				additionalNotes: initialData.additionalNotes ?? "",
			});
		}
	}, [initialData, form]);

	const upsertMutation = trpc.teamBilling.upsert.useMutation({
		onSuccess: () => {
			toast.success(
				initialData ? "Billing settings updated successfully" : "Billing settings created successfully"
			);
			onSuccess?.();
		},
		onError: (error) => {
			toast.error(error.message || "Failed to save billing settings");
		},
	});

	const onSubmit = (data: FormData) => {
		upsertMutation.mutate({
			teamId,
			legalName: data.legalName,
			billingEmail: data.billingEmail,
			billingPhone: data.billingPhone || null,
			addressLine1: data.addressLine1,
			addressLine2: data.addressLine2 || null,
			city: data.city,
			state: data.state || null,
			country: data.country,
			postalCode: data.postalCode || null,
			taxId: data.taxId || null,
			additionalNotes: data.additionalNotes || null,
		});
	};

	return (
		<div className="min-w-0 w-full space-y-4">
			<div className="flex items-center justify-between gap-2">
				<h3 className="text-lg font-semibold truncate">
					{initialData ? "Edit Billing Settings" : "Add Billing Settings"}
				</h3>
			</div>

			<Form {...form}>
				<form onSubmit={form.handleSubmit(onSubmit)} className="min-w-0 space-y-4">
					<div className="grid grid-cols-1 gap-4 min-w-0">
						<FormField
							control={form.control}
							name="legalName"
							render={({ field }) => (
								<FormItem className="min-w-0">
									<FormLabel>Legal Name *</FormLabel>
									<FormControl>
										<Input placeholder="Company Legal Name" {...field} />
									</FormControl>
									<FormMessage />
								</FormItem>
							)}
						/>

						<FormField
							control={form.control}
							name="billingEmail"
							render={({ field }) => (
								<FormItem className="min-w-0">
									<FormLabel>Billing Email *</FormLabel>
									<FormControl>
										<Input type="email" placeholder="billing@example.com" {...field} />
									</FormControl>
									<FormMessage />
								</FormItem>
							)}
						/>

						<FormField
							control={form.control}
							name="billingPhone"
							render={({ field }) => (
								<FormItem className="min-w-0">
									<FormLabel>Billing Phone</FormLabel>
									<FormControl>
										<Input
											type="tel"
											placeholder="+1234567890"
											value={field.value || ""}
											onChange={(e) => field.onChange(e.target.value || null)}
										/>
									</FormControl>
									<FormMessage />
								</FormItem>
							)}
						/>

						<FormField
							control={form.control}
							name="addressLine1"
							render={({ field }) => (
								<FormItem className="min-w-0">
									<FormLabel>Address Line 1 *</FormLabel>
									<FormControl>
										<Input placeholder="Street Address" {...field} />
									</FormControl>
									<FormMessage />
								</FormItem>
							)}
						/>

						<FormField
							control={form.control}
							name="addressLine2"
							render={({ field }) => (
								<FormItem className="min-w-0">
									<FormLabel>Address Line 2</FormLabel>
									<FormControl>
										<Input
											placeholder="Apartment, Suite, etc."
											value={field.value || ""}
											onChange={(e) => field.onChange(e.target.value || null)}
										/>
									</FormControl>
									<FormMessage />
								</FormItem>
							)}
						/>

						<FormField
							control={form.control}
							name="city"
							render={({ field }) => (
								<FormItem className="min-w-0">
									<FormLabel>City *</FormLabel>
									<FormControl>
										<Input placeholder="City" {...field} />
									</FormControl>
									<FormMessage />
								</FormItem>
							)}
						/>

						<FormField
							control={form.control}
							name="state"
							render={({ field }) => (
								<FormItem className="min-w-0">
									<FormLabel>State/Province</FormLabel>
									<FormControl>
										<Input
											placeholder="State or Province"
											value={field.value || ""}
											onChange={(e) => field.onChange(e.target.value || null)}
										/>
									</FormControl>
									<FormMessage />
								</FormItem>
							)}
						/>

						<FormField
							control={form.control}
							name="country"
							render={({ field }) => (
								<FormItem className="min-w-0">
									<FormLabel>Country *</FormLabel>
									<FormControl>
										<Input placeholder="Country" {...field} />
									</FormControl>
									<FormMessage />
								</FormItem>
							)}
						/>

						<FormField
							control={form.control}
							name="postalCode"
							render={({ field }) => (
								<FormItem className="min-w-0">
									<FormLabel>Postal Code</FormLabel>
									<FormControl>
										<Input
											placeholder="ZIP/Postal Code"
											value={field.value || ""}
											onChange={(e) => field.onChange(e.target.value || null)}
										/>
									</FormControl>
									<FormMessage />
								</FormItem>
							)}
						/>

						<FormField
							control={form.control}
							name="taxId"
							render={({ field }) => (
								<FormItem className="min-w-0">
									<FormLabel>Tax ID</FormLabel>
									<FormControl>
										<Input
											placeholder="Tax Identification Number"
											value={field.value || ""}
											onChange={(e) => field.onChange(e.target.value || null)}
										/>
									</FormControl>
									<FormMessage />
								</FormItem>
							)}
						/>
					</div>

					<FormField
						control={form.control}
						name="additionalNotes"
						render={({ field }) => (
							<FormItem className="min-w-0">
								<FormLabel>Additional Notes</FormLabel>
								<FormControl>
									<Textarea
										placeholder="Any additional billing information..."
										className="resize-none"
										rows={3}
										value={field.value || ""}
										onChange={(e) => field.onChange(e.target.value || null)}
									/>
								</FormControl>
								<FormMessage />
							</FormItem>
						)}
					/>

					<div className="flex flex-wrap items-center justify-end gap-2 pt-4">
						<Button
							type="button"
							variant="outline"
							onClick={onCancel}
							disabled={upsertMutation.isPending}
						>
							Cancel
						</Button>
						<Button type="submit" disabled={upsertMutation.isPending}>
							{upsertMutation.isPending ? (
								<>
									<Spinner size={16} className="mr-2" />
									{initialData ? "Updating..." : "Creating..."}
								</>
							) : (
								initialData ? "Update" : "Create"
							)}
						</Button>
					</div>
				</form>
			</Form>
		</div>
	);
}

