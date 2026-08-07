"use client";

import { captureEvent } from "@/lib/posthog";

import * as React from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { toast } from "@/components/ui/sonner";
import { ChevronLeft, ChevronRight, Check } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
	Sheet,
	SheetContent,
	SheetDescription,
	SheetFooter,
	SheetHeader,
	SheetTitle,
} from "@/components/npanel-ui/sheet";
import {
	Form,
	FormControl,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { Checkbox } from "@/components/ui/checkbox";
import { Spinner } from "@/components/ui/shadcn-io/spinner";
import { trpc } from "@/utils/trpc";
import {
	agencyMenuKeysUi,
	createRoleFormSchema,
	type CreateRoleFormData,
} from "./schema";

const steps = ["Role details", "Sidebar access"] as const;

interface CreateRoleSheetProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	onSuccess?: () => void;
}

const groupByCategory = (keys: readonly string[]) => {
	const groups: Record<string, string[]> = {};

	keys.forEach((key) => {
		let category = "Other";
		if (key.startsWith("/agency/domains")) category = "Domains";
		else if (key.startsWith("/agency/hosting") || key.startsWith("/agency/wordpress")) category = "Hosting & WordPress";
		else if (key.startsWith("/agency/social-media-marketing")) category = "Social Media";
		else if (key.startsWith("/agency/ad-campaigns")) category = "Ad Campaigns";
		else if (key.startsWith("/agency/email-marketing")) category = "Email Marketing";
		else if (key.startsWith("/agency/seo")) category = "SEO";
		else if (key.startsWith("/agency/creative-assets")) category = "Creatives";
		else if (key.startsWith("/agency/gen-ai")) category = "Gen AI";
		else if (key.startsWith("/agency/nisc-")) category = "Nisc Services";
		else if (key.startsWith("/agency/clients") || key.startsWith("/agency/manage-")) category = "Clients & Organizations";
		else if (key.startsWith("/agency/billing") || key === "/agency/transactions") category = "Billing Overview";
		else if (key.startsWith("/agency/invoices") || key.startsWith("/agency/subscriptions") || key.startsWith("/agency/quotations"))
			category = "Billing Details";
		else if (key.startsWith("/agency/kra-etims")) category = "KRA eTIMS";
		else if (key.startsWith("/agency/reports")) category = "Reports";
		else if (key === "/agency/dashboard") category = "Dashboard";

		if (!groups[category]) groups[category] = [];
		groups[category]!.push(key);
	});

	return groups;
};

export function CreateRoleSheet({ open, onOpenChange, onSuccess }: CreateRoleSheetProps) {
	const [currentStep, setCurrentStep] = React.useState<0 | 1>(0);

	const form = useForm<CreateRoleFormData>({
		resolver: zodResolver(createRoleFormSchema),
		defaultValues: {
			name: "",
			description: "",
			permissionKeys: [],
			menus: [],
		},
	});

	const utils = trpc.useUtils();

	const rolePermissionsSetMutation = trpc.agencyRbac.rolePermissionsSet.useMutation({
		onError: (error) => {
			toast.error(error.message || "Role created, but updating permissions failed");
		},
	});

	const createRoleMutation = trpc.agencyRbac.roleCreate.useMutation({
		onSuccess: async (role) => {
			const menus = form.getValues("menus");
			const permissionKeys = form.getValues("permissionKeys");
			if (menus.length > 0 || permissionKeys.length > 0) {
				await rolePermissionsSetMutation.mutateAsync({
					roleId: role.id,
					permissionKeys: Array.from(new Set([...menus, ...permissionKeys])),
				});
				await Promise.all([
					utils.agencyRbac.rolesList.invalidate(),
					utils.agencyRbac.permissionsList.invalidate(),
					utils.agencyRbac.myMenuAccess.invalidate(),
				]);
			}

			toast.success("Agency role created");
			captureEvent("agency_role_created");
			form.reset({
				name: "",
				description: "",
				permissionKeys: [],
				menus: [],
			});
			setCurrentStep(0);
			onOpenChange(false);
			onSuccess?.();
		},
		onError: (error) => {
			toast.error(error.message || "Failed to create role");
		},
	});

	const isSubmitting = createRoleMutation.isPending;

	const onSubmit = (data: CreateRoleFormData) => {
		if (currentStep === 0) {
			setCurrentStep(1);
			return;
		}

		createRoleMutation.mutate({
			name: data.name,
			description: data.description,
			menus: data.menus,
		});
	};

	const groups = React.useMemo(() => groupByCategory(agencyMenuKeysUi), []);

	const handleOpenChange = (nextOpen: boolean) => {
		if (!nextOpen) {
			form.reset({
				name: "",
				description: "",
				permissionKeys: [],
				menus: [],
			});
			setCurrentStep(0);
		}
		onOpenChange(nextOpen);
	};

	return (
		<Sheet open={open} onOpenChange={handleOpenChange}>
			<SheetContent className="flex h-full w-full flex-col p-0 sm:max-w-2xl">
				<div className="flex h-full flex-col overflow-hidden">
					<SheetHeader className="flex-shrink-0 px-6 pt-6 pb-4 border-b">
						<SheetTitle>Create Agency Role</SheetTitle>
						<SheetDescription>
							Define a reusable role and choose which parts of the agency experience it can access.
						</SheetDescription>
					</SheetHeader>

					<div className="flex-shrink-0 px-6 pt-3 pb-2">
						<div className="flex items-center gap-2 text-xs text-muted-foreground">
							{steps.map((label, index) => (
								<div key={label} className="flex items-center gap-1">
									<div
										className={[
											"flex h-5 w-5 items-center justify-center rounded-full border text-[10px]",
											index <= currentStep
												? "border-primary bg-primary text-primary-foreground"
												: "border-border",
										].join(" ")}
									>
										{index < currentStep ? <Check className="h-3 w-3" /> : index + 1}
									</div>
									<span className={index === currentStep ? "font-medium text-foreground" : ""}>{label}</span>
									{index < steps.length - 1 && <span className="mx-1 h-px w-4 bg-border" />}
								</div>
							))}
						</div>
					</div>

					<Form {...form}>
						<form
							onSubmit={form.handleSubmit(onSubmit)}
							className="flex min-h-0 flex-1 flex-col"
						>
							<div className="flex-1 min-h-0 overflow-hidden">
								<ScrollArea className="h-full">
									<div className="space-y-6 px-6 pb-6">
								{currentStep === 0 && (
									<div className="space-y-6">
										<div className="grid gap-4">
											<FormField
												control={form.control}
												name="name"
												render={({ field }) => (
													<FormItem>
														<FormLabel>Role name</FormLabel>
														<FormControl>
															<Input
																placeholder="e.g. Account Manager, Billing Only"
																{...field}
															/>
														</FormControl>
														<FormMessage />
													</FormItem>
												)}
											/>

											<FormField
												control={form.control}
												name="description"
												render={({ field }) => (
													<FormItem>
														<FormLabel>Description</FormLabel>
														<FormControl>
															<Input
																placeholder="Short description to help other admins understand this role"
																{...field}
															/>
														</FormControl>
														<FormMessage />
													</FormItem>
												)}
											/>
										</div>
									</div>
								)}

								{currentStep === 1 && (
									<div className="space-y-4">
										<p className="text-xs text-muted-foreground">
											Choose which menus and sections this role can see in the agency experience. You can adjust
											this later at any time.
										</p>
										{Object.entries(groups).map(([category, items]) => (
											<div
												key={category}
												className="rounded-md border bg-muted/40 px-3 py-2.5 space-y-2"
											>
												<p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
													{category}
												</p>
												<div className="grid gap-2 sm:grid-cols-2">
													{items.map((key) => (
														<FormField
															key={key}
															control={form.control}
															name="menus"
															render={({ field }) => {
																const checked = field.value?.includes(key as never);
																return (
																	<FormItem className="flex flex-row items-start space-x-2 space-y-0 rounded-md border bg-background px-2 py-1.5 text-xs">
																		<FormControl>
																			<Checkbox
																				checked={checked}
																				onCheckedChange={(isChecked) => {
																					if (isChecked) {
																						field.onChange([...(field.value ?? []), key]);
																					} else {
																						field.onChange(
																							(field.value ?? []).filter((v) => v !== key),
																						);
																					}
																				}}
																			/>
																		</FormControl>
																		<div className="flex flex-col gap-0.5">
																			<span className="font-medium">
																				{key.replace("/agency/", "").replace(/-/g, " ")}
																			</span>
																			<span className="text-[10px] text-muted-foreground">{key}</span>
																		</div>
																	</FormItem>
																);
															}}
														/>
													))}
												</div>
											</div>
										))}
									</div>
								)}
									</div>
									<ScrollBar orientation="vertical" />
								</ScrollArea>
							</div>

							<SheetFooter className="mt-4 gap-2 px-6 pb-6 sm:gap-0">
								<Button
									type="button"
									variant="outline"
									onClick={() => {
										if (currentStep === 1) {
											setCurrentStep(0);
										} else {
											handleOpenChange(false);
										}
									}}
									disabled={isSubmitting}
								>
									{currentStep === 1 ? (
										<>
											<ChevronLeft className="mr-1 h-4 w-4" />
											Back
										</>
									) : (
										"Cancel"
									)}
								</Button>
								<Button type="submit" disabled={isSubmitting}>
									{isSubmitting ? (
										<>
											<Spinner size={16} className="mr-2" />
											Saving...
										</>
									) : currentStep === 0 ? (
										<>
											Next
											<ChevronRight className="ml-1 h-4 w-4" />
										</>
									) : (
										<>
											Create role
											<Check className="ml-1 h-4 w-4" />
										</>
									)}
								</Button>
							</SheetFooter>
						</form>
					</Form>
				</div>
			</SheetContent>
		</Sheet>
	);
}

