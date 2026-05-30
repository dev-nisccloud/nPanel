"use client";

import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "@/components/ui/sonner";
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
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { trpc } from "@/utils/trpc";
import { CountrySelect } from "@/components/account-settings/country-select";
import { SettingsSection } from "@/components/account-settings/settings-section";

const billingSchema = z.object({
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

export type CheckoutTeamBillingFormValues = z.infer<typeof billingSchema>;

export type CheckoutTeamBillingInitialData = {
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

type CheckoutTeamBillingFormProps = {
	teamId: string;
	formId?: string;
	isLoading?: boolean;
	initialData?: CheckoutTeamBillingInitialData | null;
	onSaved?: () => void;
};

export function CheckoutTeamBillingForm({
	teamId,
	formId = "checkout-team-billing-form",
	isLoading = false,
	initialData,
	onSaved,
}: CheckoutTeamBillingFormProps) {
	const utils = trpc.useUtils();

	const form = useForm<CheckoutTeamBillingFormValues>({
		resolver: zodResolver(billingSchema),
		defaultValues: {
			legalName: "",
			billingEmail: "",
			billingPhone: null,
			addressLine1: "",
			addressLine2: null,
			city: "",
			state: null,
			country: "",
			postalCode: null,
			taxId: null,
			additionalNotes: null,
		},
	});

	React.useEffect(() => {
		if (!initialData) return;
		form.reset({
			legalName: initialData.legalName,
			billingEmail: initialData.billingEmail,
			billingPhone: initialData.billingPhone ?? null,
			addressLine1: initialData.addressLine1,
			addressLine2: initialData.addressLine2 ?? null,
			city: initialData.city,
			state: initialData.state ?? null,
			country: initialData.country,
			postalCode: initialData.postalCode ?? null,
			taxId: initialData.taxId ?? null,
			additionalNotes: initialData.additionalNotes ?? null,
		});
	}, [initialData, form]);

	const upsertMutation = trpc.teamBilling.upsert.useMutation({
		onSuccess: async () => {
			await utils.teamBilling.getByTeam.invalidate({ teamId });
			toast.success("Company billing details saved");
			onSaved?.();
		},
		onError: (error: { message?: string }) => {
			toast.error(error.message ?? "Failed to save billing details");
		},
	});

	const onSubmit = (data: CheckoutTeamBillingFormValues) => {
		upsertMutation.mutate({
			teamId,
			legalName: data.legalName,
			billingEmail: data.billingEmail,
			billingPhone: data.billingPhone ?? null,
			addressLine1: data.addressLine1,
			addressLine2: data.addressLine2 ?? null,
			city: data.city,
			state: data.state ?? null,
			country: data.country,
			postalCode: data.postalCode ?? null,
			taxId: data.taxId ?? null,
			additionalNotes: data.additionalNotes ?? null,
		});
	};

	if (isLoading) {
		return (
			<div className="space-y-4">
				{Array.from({ length: 4 }).map((_, i) => (
					<Skeleton key={i} className="h-9 w-full" />
				))}
			</div>
		);
	}

	return (
		<div className="rounded-lg border bg-card">
			<Form {...form}>
				<form id={formId} onSubmit={form.handleSubmit(onSubmit)} className="divide-y">
					<div className="space-y-5 p-4">
						<SettingsSection
							title="Billing details"
							description="Company information used for invoices and receipts"
						>
							<FormField
								control={form.control}
								name="legalName"
								render={({ field }) => (
									<FormItem>
										<FormLabel className="text-xs">Legal name</FormLabel>
										<FormControl>
											<Input className="h-9" placeholder="Company Legal Name" {...field} />
										</FormControl>
										<FormMessage />
									</FormItem>
								)}
							/>

							<div className="grid gap-3 sm:grid-cols-2">
								<FormField
									control={form.control}
									name="billingEmail"
									render={({ field }) => (
										<FormItem>
											<FormLabel className="text-xs">Billing email</FormLabel>
											<FormControl>
												<Input className="h-9" type="email" placeholder="billing@example.com" {...field} />
											</FormControl>
											<FormMessage />
										</FormItem>
									)}
								/>
								<FormField
									control={form.control}
									name="billingPhone"
									render={({ field }) => (
										<FormItem>
											<FormLabel className="text-xs">Billing phone</FormLabel>
											<FormControl>
												<Input
													className="h-9"
													type="tel"
													placeholder="+254 700 000 000"
													value={field.value ?? ""}
													onChange={(e) => field.onChange(e.target.value || null)}
												/>
											</FormControl>
											<FormMessage />
										</FormItem>
									)}
								/>
							</div>
						</SettingsSection>

						<Separator />

						<SettingsSection title="Address">
							<FormField
								control={form.control}
								name="addressLine1"
								render={({ field }) => (
									<FormItem>
										<FormLabel className="text-xs">Address line 1</FormLabel>
										<FormControl>
											<Input className="h-9" placeholder="Street address" {...field} />
										</FormControl>
										<FormMessage />
									</FormItem>
								)}
							/>

							<FormField
								control={form.control}
								name="addressLine2"
								render={({ field }) => (
									<FormItem>
										<FormLabel className="text-xs">Address line 2</FormLabel>
										<FormControl>
											<Input
												className="h-9"
												placeholder="Apartment, suite, etc."
												value={field.value ?? ""}
												onChange={(e) => field.onChange(e.target.value || null)}
											/>
										</FormControl>
										<FormMessage />
									</FormItem>
								)}
							/>

							<div className="grid gap-3 sm:grid-cols-3">
								<FormField
									control={form.control}
									name="city"
									render={({ field }) => (
										<FormItem>
											<FormLabel className="text-xs">City</FormLabel>
											<FormControl>
												<Input className="h-9" placeholder="Nairobi" {...field} />
											</FormControl>
											<FormMessage />
										</FormItem>
									)}
								/>
								<FormField
									control={form.control}
									name="state"
									render={({ field }) => (
										<FormItem>
											<FormLabel className="text-xs">State / province</FormLabel>
											<FormControl>
												<Input
													className="h-9"
													placeholder="State or province"
													value={field.value ?? ""}
													onChange={(e) => field.onChange(e.target.value || null)}
												/>
											</FormControl>
											<FormMessage />
										</FormItem>
									)}
								/>
								<FormField
									control={form.control}
									name="postalCode"
									render={({ field }) => (
										<FormItem>
											<FormLabel className="text-xs">Postal code</FormLabel>
											<FormControl>
												<Input
													className="h-9"
													placeholder="00100"
													value={field.value ?? ""}
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
								name="country"
								render={({ field }) => (
									<FormItem>
										<FormLabel className="text-xs">Country</FormLabel>
										<FormControl>
											<CountrySelect
												value={field.value}
												onValueChange={field.onChange}
												placeholder="Select country..."
											/>
										</FormControl>
										<FormMessage />
									</FormItem>
								)}
							/>
						</SettingsSection>

						<Separator />

						<SettingsSection title="Additional">
							<FormField
								control={form.control}
								name="taxId"
								render={({ field }) => (
									<FormItem>
										<FormLabel className="text-xs">Tax ID</FormLabel>
										<FormControl>
											<Input
												className="h-9"
												placeholder="Tax identification number"
												value={field.value ?? ""}
												onChange={(e) => field.onChange(e.target.value || null)}
											/>
										</FormControl>
										<FormMessage />
									</FormItem>
								)}
							/>

							<FormField
								control={form.control}
								name="additionalNotes"
								render={({ field }) => (
									<FormItem>
										<FormLabel className="text-xs">Notes</FormLabel>
										<FormControl>
											<Textarea
												placeholder="Any additional billing information..."
												className="min-h-[72px] resize-none"
												rows={3}
												value={field.value ?? ""}
												onChange={(e) => field.onChange(e.target.value || null)}
											/>
										</FormControl>
										<FormMessage />
									</FormItem>
								)}
							/>
						</SettingsSection>
					</div>
				</form>
			</Form>
		</div>
	);
}
