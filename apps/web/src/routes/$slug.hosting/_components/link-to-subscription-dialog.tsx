"use client";

import * as React from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Link2 } from "lucide-react";
import { toast } from "@/components/ui/sonner";

import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@npanel/ui/components/dialog";
import {
	Form,
	FormControl,
	FormDescription,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { ComboboxDropdown, type ComboboxItem } from "@npanel/ui/components/combobox-dropdown";
import { DatePicker } from "@/components/npanel-ui/date-picker";
import { Spinner } from "@/components/ui/shadcn-io/spinner";
import { trpc } from "@/utils/trpc";

const formSchema = z.object({
	niscServicePlanId: z.string().min(1, "Service plan is required"),
	teamId: z.string().min(1, "Company is required"),
	hostingPlanId: z.string().min(1, "Hosting plan is required"),
	subscriptionDate: z.date().optional(),
	billingCycle: z.enum(["YEARLY", "MONTHLY", "BIENNIALLY", "CUSTOM"]),
	expiryDate: z.date().optional(),
	primaryDomain: z.string().optional(),
	status: z.enum(["ACTIVE", "PENDING", "SUSPENDED", "CANCELLED", "EXPIRED", "PROCESSING", "FAILED"]),
	autoRenew: z.boolean().default(false),
	notes: z.string().optional(),
});

type FormData = z.infer<typeof formSchema>;

interface LinkToSubscriptionDialogProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	subscriptionId: string;
	pleskFilterId: string;
	hostingType?: string;
	subscriptionName?: string;
	onSuccess?: () => void;
}

export function LinkToSubscriptionDialog({
	open,
	onOpenChange,
	subscriptionId,
	pleskFilterId,
	hostingType,
	subscriptionName,
	onSuccess,
}: LinkToSubscriptionDialogProps) {
	const form = useForm<FormData>({
		resolver: zodResolver(formSchema),
		defaultValues: {
			autoRenew: false,
			billingCycle: "MONTHLY",
			status: "PENDING",
			primaryDomain: subscriptionName || "",
		},
	});

	// Update primaryDomain when subscriptionName changes or dialog opens
	React.useEffect(() => {
		if (open) {
			if (subscriptionName) {
				form.setValue("primaryDomain", subscriptionName);
			} else {
				form.setValue("primaryDomain", "");
			}
		}
	}, [open, subscriptionName, form]);

	// Watch billing cycle and subscription date to calculate next renewal date
	const billingCycle = form.watch("billingCycle");
	const subscriptionDate = form.watch("subscriptionDate");

	// Calculate next renewal date and expiry date based on billing cycle and subscription date
	const nextRenewalDate = React.useMemo(() => {
		if (!subscriptionDate || !billingCycle) return null;

		const date = new Date(subscriptionDate);
		switch (billingCycle) {
			case "MONTHLY":
				date.setMonth(date.getMonth() + 1);
				break;
			case "YEARLY":
				date.setFullYear(date.getFullYear() + 1);
				break;
			case "BIENNIALLY":
				date.setFullYear(date.getFullYear() + 2);
				break;
			case "CUSTOM":
				return null;
		}
		return date;
	}, [subscriptionDate, billingCycle]);

	// Expiry date is the same as next renewal date
	const expiryDate = nextRenewalDate;

	// Update expiryDate in form when calculated
	React.useEffect(() => {
		if (expiryDate) {
			form.setValue("expiryDate", expiryDate);
		} else {
			form.setValue("expiryDate", undefined);
		}
	}, [expiryDate, form]);

	// Fetch teams for combobox
	const { data: teams = [], isLoading: isLoadingTeams } = trpc.teams.getUserTeams.useQuery(undefined, {
		enabled: open,
	});

	// Fetch service plans for combobox (including inactive plans)
	const { data: servicePlans = [], isLoading: isLoadingPlans } = trpc.hostingPlans.getAll.useQuery(
		undefined,
		{
			enabled: open,
		}
	);

	// Fetch hosting plans for combobox (for HostingSubscription creation)
	// Filter to HOSTING type plans only since we're creating a HostingSubscription
	const { data: hostingPlansRaw = [], isLoading: isLoadingHostingPlans } = trpc.hostingPlans.getAll.useQuery(
		undefined,
		{
			enabled: open,
		}
	);
	
	// Filter to only HOSTING type plans
	const hostingPlans = React.useMemo(() => {
		return hostingPlansRaw.filter((plan) => plan.planType === "HOSTING");
	}, [hostingPlansRaw]);

	// Create mutation
	const linkToSubscriptionMutation = trpc.serviceSubscriptions.linkToSubscription.useMutation({
		onSuccess: () => {
			toast.success("Subscription linked successfully");
			form.reset();
			onOpenChange(false);
			onSuccess?.();
		},
		onError: (error) => {
			toast.error(error.message || "Failed to link subscription");
		},
	});

	const onSubmit = (data: FormData) => {
		// Map Plesk htype to our enum format
		const validHostingTypes = ["WEB_HOSTING", "EMAIL_HOSTING", "RESELLER_HOSTING", "VPS_HOSTING", "DEDICATED_HOSTING"] as const;
		
		const htypeMap: Record<string, typeof validHostingTypes[number]> = {
			"vrt_hst": "WEB_HOSTING",
			"standard": "WEB_HOSTING",
			"web_hosting": "WEB_HOSTING",
			"email_hosting": "EMAIL_HOSTING",
			"reseller_hosting": "RESELLER_HOSTING",
			"vps_hosting": "VPS_HOSTING",
			"dedicated_hosting": "DEDICATED_HOSTING",
		};
		
		let validHostingType: typeof validHostingTypes[number] | undefined = undefined;
		if (hostingType) {
			if (validHostingTypes.includes(hostingType.toUpperCase() as any)) {
				validHostingType = hostingType.toUpperCase() as typeof validHostingTypes[number];
			} else if (htypeMap[hostingType.toLowerCase()]) {
				validHostingType = htypeMap[hostingType.toLowerCase()];
			}
		}

		// Ensure dates are Date objects
		const expiryDate = data.expiryDate 
			? (data.expiryDate instanceof Date ? data.expiryDate : new Date(data.expiryDate))
			: undefined;

		linkToSubscriptionMutation.mutate({
			subscriptionId,
			pleskFilterId,
			niscServicePlanId: data.niscServicePlanId,
			teamId: data.teamId,
			hostingPlanId: data.hostingPlanId,
			hostingType: validHostingType,
			subscriptionDate: data.subscriptionDate,
			billingCycle: data.billingCycle,
			expiryDate,
			primaryDomain: data.primaryDomain?.trim() || undefined,
			status: data.status,
			autoRenew: data.autoRenew,
			notes: data.notes?.trim() || undefined,
		});
	};

	// Convert teams to combobox items
	const teamItems: ComboboxItem[] = React.useMemo(() => {
		return teams.map((team) => ({
			id: team.id,
			label: team.name,
		}));
	}, [teams]);

	// Helper function to format plan type
	const formatPlanType = (planType: string): string => {
		const typeMap: Record<string, string> = {
			HOSTING: "Hosting",
			SEO: "SEO",
			VIDEOGRAPHY: "Videography",
			VISUAL_CREATIVE: "Visual Creative",
			SOCIAL_MEDIA_MARKETING: "Social Media Marketing",
			PAY_PER_CLICK_ADVERTISING: "Pay Per Click Advertising",
		};
		return typeMap[planType] || planType;
	};

	// Helper function to format hosting sub-type
	const formatHostingSubType = (subType: string | null | undefined): string => {
		if (!subType) return "";
		const subTypeMap: Record<string, string> = {
			WEB_HOSTING: "Web Hosting",
			EMAIL_HOSTING: "Email Hosting",
			RESELLER_HOSTING: "Reseller Hosting",
			VPS_HOSTING: "VPS Hosting",
			DEDICATED_HOSTING: "Dedicated Hosting",
		};
		return subTypeMap[subType] || subType;
	};

	// Convert service plans to combobox items
	const servicePlanItems: ComboboxItem[] = React.useMemo(() => {
		return servicePlans.map((plan) => {
			const planTypeLabel = formatPlanType(plan.planType);
			const subTypeLabel = formatHostingSubType(plan.hostingSubType);
			const typeSuffix = subTypeLabel 
				? `(${planTypeLabel} - ${subTypeLabel})`
				: `(${planTypeLabel})`;
			
			return {
				id: plan.id,
				label: `${plan.name} ${typeSuffix}`,
			};
		});
	}, [servicePlans]);

	// Convert hosting plans to combobox items (for HostingSubscription)
	const hostingPlanItems: ComboboxItem[] = React.useMemo(() => {
		return hostingPlans.map((plan) => ({
			id: plan.id,
			label: plan.name,
		}));
	}, [hostingPlans]);

	const selectedTeam = React.useMemo(() => {
		const teamId = form.watch("teamId");
		return teamItems.find((team) => team.id === teamId);
	}, [form.watch("teamId"), teamItems]);

	const selectedServicePlan = React.useMemo(() => {
		const planId = form.watch("niscServicePlanId");
		return servicePlanItems.find((plan) => plan.id === planId);
	}, [form.watch("niscServicePlanId"), servicePlanItems]);

	const selectedHostingPlan = React.useMemo(() => {
		const planId = form.watch("hostingPlanId");
		return hostingPlanItems.find((plan) => plan.id === planId);
	}, [form.watch("hostingPlanId"), hostingPlanItems]);

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto p-6" hideClose>
				<DialogHeader className="pb-4">
					<DialogTitle>Link to Subscription</DialogTitle>
					<DialogDescription>
						Link this hosting subscription to a service subscription for billing and lifecycle management.
					</DialogDescription>
				</DialogHeader>

				<Form {...form}>
					<form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
						{/* Service Plan Selection */}
						<FormField
							control={form.control}
							name="niscServicePlanId"
							render={({ field }) => (
								<FormItem>
									<FormLabel>Service Plan</FormLabel>
									<FormControl>
										{isLoadingPlans ? (
											<div className="flex items-center justify-center h-10 border rounded-md">
												<Spinner size={20} />
												<span className="ml-2 text-sm text-muted-foreground">Loading service plans...</span>
											</div>
										) : (
											<ComboboxDropdown
												items={servicePlanItems}
												selectedItem={selectedServicePlan}
												onSelect={(plan) => field.onChange(plan.id)}
												placeholder="Select a service plan..."
												searchPlaceholder="Search service plans..."
												emptyResults="No service plans found"
											/>
										)}
									</FormControl>
									<FormMessage />
								</FormItem>
							)}
						/>

						<Separator />

						{/* Hosting Plan Selection */}
						<FormField
							control={form.control}
							name="hostingPlanId"
							render={({ field }) => (
								<FormItem>
									<FormLabel>Hosting Plan</FormLabel>
									<FormControl>
										{isLoadingHostingPlans ? (
											<div className="flex items-center justify-center h-10 border rounded-md">
												<Spinner size={20} />
												<span className="ml-2 text-sm text-muted-foreground">Loading hosting plans...</span>
											</div>
										) : (
											<ComboboxDropdown
												items={hostingPlanItems}
												selectedItem={selectedHostingPlan}
												onSelect={(plan) => field.onChange(plan.id)}
												placeholder="Select a hosting plan..."
												searchPlaceholder="Search hosting plans..."
												emptyResults="No hosting plans found"
											/>
										)}
									</FormControl>
									<FormMessage />
								</FormItem>
							)}
						/>

						<Separator />

						{/* Company Selection */}
						<FormField
							control={form.control}
							name="teamId"
							render={({ field }) => (
								<FormItem>
									<FormLabel>Company</FormLabel>
									<FormControl>
										{isLoadingTeams ? (
											<div className="flex items-center justify-center h-10 border rounded-md">
												<Spinner size={20} />
												<span className="ml-2 text-sm text-muted-foreground">Loading companies...</span>
											</div>
										) : (
											<ComboboxDropdown
												items={teamItems}
												selectedItem={selectedTeam}
												onSelect={(team) => field.onChange(team.id)}
												placeholder="Select a company..."
												searchPlaceholder="Search companies..."
												emptyResults="No companies found"
											/>
										)}
									</FormControl>
									<FormMessage />
								</FormItem>
							)}
						/>

						<Separator />

						{/* Optional Fields */}
						<div className="space-y-4">
							<FormField
								control={form.control}
								name="subscriptionDate"
								render={({ field }) => (
									<FormItem>
										<FormLabel>Subscription Date</FormLabel>
										<FormDescription>
											The date when the subscription was created/purchased
										</FormDescription>
										<FormControl>
											<DatePicker
												value={field.value}
												onChange={field.onChange}
												placeholder="Pick a date"
											/>
										</FormControl>
										<FormMessage />
									</FormItem>
								)}
							/>

							<FormField
								control={form.control}
								name="billingCycle"
								render={({ field }) => (
									<FormItem>
										<FormLabel>Billing Cycle</FormLabel>
										<Select
											onValueChange={field.onChange}
											value={field.value}
										>
											<FormControl>
												<SelectTrigger className="w-full">
													<SelectValue placeholder="Select cycle" />
												</SelectTrigger>
											</FormControl>
											<SelectContent>
												<SelectItem value="MONTHLY">Monthly</SelectItem>
												<SelectItem value="YEARLY">Yearly</SelectItem>
												<SelectItem value="BIENNIALLY">Biennially</SelectItem>
												<SelectItem value="CUSTOM">Custom</SelectItem>
											</SelectContent>
										</Select>
										<FormDescription>
											Next renewal date will be automatically calculated based on this cycle
										</FormDescription>
										<FormMessage />
									</FormItem>
								)}
							/>

							{nextRenewalDate && (
								<FormItem>
									<FormLabel>Next Renewal Date</FormLabel>
									<FormDescription>
										Automatically calculated based on subscription date and billing cycle
									</FormDescription>
									<FormControl>
										<Input
											value={nextRenewalDate.toLocaleDateString()}
											disabled
											className="bg-muted"
										/>
									</FormControl>
								</FormItem>
							)}

							{expiryDate && (
								<FormItem>
									<FormLabel>Expiry Date</FormLabel>
									<FormDescription>
										Automatically calculated based on subscription date and billing cycle
									</FormDescription>
									<FormControl>
										<Input
											value={expiryDate.toLocaleDateString()}
											disabled
											className="bg-muted"
										/>
									</FormControl>
								</FormItem>
							)}

							<FormField
								control={form.control}
								name="primaryDomain"
								render={({ field }) => (
									<FormItem>
										<FormLabel>Primary Domain (Optional)</FormLabel>
										<FormDescription>
											{subscriptionName 
												? "Auto-filled from subscription name. Edit if needed."
												: "The primary domain for this hosting subscription"}
										</FormDescription>
										<FormControl>
											<Input 
												placeholder="example.com" 
												{...field} 
												disabled={!!subscriptionName}
											/>
										</FormControl>
										<FormMessage />
									</FormItem>
								)}
							/>

							<FormField
								control={form.control}
								name="status"
								render={({ field }) => (
									<FormItem>
										<FormLabel>Status</FormLabel>
										<Select
											onValueChange={field.onChange}
											value={field.value}
										>
											<FormControl>
												<SelectTrigger className="w-full">
													<SelectValue placeholder="Select status" />
												</SelectTrigger>
											</FormControl>
											<SelectContent>
												<SelectItem value="ACTIVE">Active</SelectItem>
												<SelectItem value="PENDING">Pending</SelectItem>
												<SelectItem value="SUSPENDED">Suspended</SelectItem>
												<SelectItem value="CANCELLED">Cancelled</SelectItem>
												<SelectItem value="EXPIRED">Expired</SelectItem>
												<SelectItem value="PROCESSING">Processing</SelectItem>
												<SelectItem value="FAILED">Failed</SelectItem>
											</SelectContent>
										</Select>
										<FormMessage />
									</FormItem>
								)}
							/>

							<FormField
								control={form.control}
								name="notes"
								render={({ field }) => (
									<FormItem>
										<FormLabel>Notes</FormLabel>
										<FormDescription>
											Additional notes about this subscription
										</FormDescription>
										<FormControl>
											<Textarea
												placeholder="Enter any additional notes..."
												className="resize-none"
												rows={3}
												{...field}
											/>
										</FormControl>
										<FormMessage />
									</FormItem>
								)}
							/>

							<FormField
								control={form.control}
								name="autoRenew"
								render={({ field }) => (
									<FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
										<FormControl>
											<Checkbox
												checked={field.value}
												onCheckedChange={field.onChange}
											/>
										</FormControl>
										<div className="space-y-1 leading-none">
											<FormLabel>Auto Renew</FormLabel>
											<FormDescription>
												Automatically renew this subscription when it expires
											</FormDescription>
										</div>
									</FormItem>
								)}
							/>
						</div>

						<DialogFooter className="pt-6">
							<Button
								type="button"
								variant="outline"
								onClick={() => {
									form.reset();
									onOpenChange(false);
								}}
								disabled={linkToSubscriptionMutation.isPending}
							>
								Cancel
							</Button>
							<Button
								type="submit"
								disabled={linkToSubscriptionMutation.isPending}
							>
								{linkToSubscriptionMutation.isPending ? (
									<>
										<Spinner size={16} className="mr-2" />
										Linking...
									</>
								) : (
									<>
										<Link2 className="mr-2 h-4 w-4" />
										Link to Subscription
									</>
								)}
							</Button>
						</DialogFooter>
					</form>
				</Form>
			</DialogContent>
		</Dialog>
	);
}


