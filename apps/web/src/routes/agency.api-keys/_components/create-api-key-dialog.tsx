import React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Copy, CheckCircle2, ShieldAlert, ArrowRight, ArrowLeft } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Spinner } from "@/components/ui/shadcn-io/spinner";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";

import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
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
import { Button } from "@/components/ui/button";
import { trpc } from "@/utils/trpc";
import { toast } from "@/components/ui/sonner";

const createApiKeySchema = z.object({
	name: z.string().min(1, "Name is required"),
	permissions: z.array(z.string()).min(1, "Select at least one permission"),
});

type CreateApiKeyFormValues = z.infer<typeof createApiKeySchema>;

interface CreateApiKeyDialogProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	onSuccess?: () => void;
}

export function CreateApiKeyDialog({ open, onOpenChange, onSuccess }: CreateApiKeyDialogProps) {
	const [step, setStep] = React.useState<0 | 1 | 2>(0);
	const [generatedKey, setGeneratedKey] = React.useState<string | null>(null);
	const [hasCopied, setHasCopied] = React.useState(false);

	const { data: procedures, isLoading: isLoadingProcedures } = trpc.apiKeys.getAvailableProcedures.useQuery(undefined, {
		enabled: open && step === 1,
	});

	const form = useForm<CreateApiKeyFormValues>({
		resolver: zodResolver(createApiKeySchema),
		defaultValues: {
			name: "",
			permissions: ["*"],
		},
	});

	const createMutation = trpc.apiKeys.create.useMutation({
		onSuccess: (data) => {
			setGeneratedKey(data.key);
			setStep(2);
			if (onSuccess) onSuccess();
		},
		onError: (error) => {
			toast.error("Failed to create API key", { description: error.message });
		},
	});

	const onSubmit = (data: CreateApiKeyFormValues) => {
		if (step === 0) {
			setStep(1);
			return;
		}
		
		createMutation.mutate({
			name: data.name,
			permissions: data.permissions,
		});
	};

	const handleCopy = async () => {
		if (generatedKey) {
			try {
				// Try modern Clipboard API first
				if (navigator?.clipboard?.writeText) {
					await navigator.clipboard.writeText(generatedKey);
				} else {
					// Fallback for non-secure contexts or older browsers
					const textArea = document.createElement("textarea");
					textArea.value = generatedKey;
					
					// Position off-screen to avoid layout shifts or visibility issues
					textArea.style.position = "fixed";
					textArea.style.left = "-9999px";
					textArea.style.top = "0";
					textArea.style.padding = "0";
					textArea.style.border = "none";
					textArea.style.outline = "none";
					textArea.style.boxShadow = "none";
					textArea.style.background = "transparent";
					
					document.body.appendChild(textArea);
					textArea.focus();
					textArea.select();
					
					try {
						const successful = document.execCommand("copy");
						if (!successful) throw new Error("copy command returned false");
					} catch (err) {
						console.error("execCommand fallback failed", err);
						throw err;
					} finally {
						document.body.removeChild(textArea);
					}
				}
				
				setHasCopied(true);
				toast.success("API Key copied to clipboard");
				setTimeout(() => {
					setHasCopied(false);
				}, 3000);
			} catch (err) {
				console.error("Final copy failure:", err);
				toast.error("Failed to auto-copy", {
					description: "Please select and copy the key manually from the field below."
				});
			}
		}
	};

	const handleClose = () => {
		onOpenChange(false);
		setTimeout(() => {
			setGeneratedKey(null);
			setStep(0);
			form.reset();
		}, 300);
	};

	return (
		<Dialog open={open} onOpenChange={handleClose}>
			<DialogContent className="sm:max-w-2xl w-11/12 max-h-[90vh] overflow-y-auto">
				<DialogHeader>
					<DialogTitle>Create API key</DialogTitle>
					<DialogDescription>
						Generate a key to securely access the nPanel API endpoints from external services.
					</DialogDescription>
				</DialogHeader>

				{step === 2 && generatedKey ? (
					<div className="flex flex-col gap-6">
						<Alert variant="default" className="border-green-500/50 bg-green-500/10 text-green-600 dark:text-green-500">
							<CheckCircle2 className="h-4 w-4" />
							<AlertTitle>Successfully generated!</AlertTitle>
							<AlertDescription>Your new API key is ready.</AlertDescription>
						</Alert>

						<div className="flex flex-col gap-2">
							<p className="text-sm font-medium">Please copy your API key now</p>
							<p className="text-sm text-muted-foreground">
								For your security, we only store a cryptographic hash.{" "}
								<strong>You will not be able to see this key again!</strong> If you lose it,
								you must revoke it and generate a new one.
							</p>
						</div>

						<div className="flex items-center gap-2">
							<Input 
								readOnly 
								value={generatedKey} 
								className="font-mono" 
								onFocus={(e) => e.target.select()} 
							/>
							<Button size="icon" variant="outline" onClick={handleCopy} type="button">
								{hasCopied ? <CheckCircle2 className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
							</Button>
						</div>

						<div className="mt-2 flex justify-end">
							<Button onClick={handleClose}>I have copied my key</Button>
						</div>
					</div>
				) : (
					<div className="flex flex-col gap-4 py-2">
						{step === 0 && (
							<Alert variant="default">
								<ShieldAlert className="h-4 w-4" />
								<AlertTitle>Security Info</AlertTitle>
								<AlertDescription>
									The generated key acts as your account and inherits your current access levels. Hand it out carefully.
								</AlertDescription>
							</Alert>
						)}

						<Form {...form}>
							<form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
								{step === 0 && (
									<FormField
										control={form.control}
										name="name"
										render={({ field }) => (
											<FormItem>
												<FormLabel>Key Name</FormLabel>
												<FormControl>
													<Input placeholder="e.g. Zapier Integration, Production Sync" {...field} />
												</FormControl>
												<FormMessage />
											</FormItem>
										)}
									/>
								)}

								{step === 1 && (
									<FormField
										control={form.control}
										name="permissions"
										render={({ field }) => {
											const isFullAccess = field.value.includes("*");
											
											return (
												<FormItem>
													<div className="mb-4">
														<FormLabel className="text-base text-foreground">Endpoint Permissions</FormLabel>
														<FormDescription>
															Select which endpoints this API key can access.
														</FormDescription>
													</div>
													
													<div className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4 mb-4 bg-muted/20">
														<FormControl>
															<Checkbox
																id="full-access"
																checked={isFullAccess}
																onCheckedChange={(checked) => {
																	return checked ? field.onChange(["*"]) : field.onChange([]);
																}}
															/>
														</FormControl>
														<div className="space-y-1.5 leading-none">
															<FormLabel htmlFor="full-access" className="cursor-pointer text-sm font-medium">
																Full Access (Wildcard)
															</FormLabel>
															<p className="text-xs text-muted-foreground">
																Allow access to all current and future endpoints without restriction.
															</p>
														</div>
													</div>

													{!isFullAccess && (
														<div className="rounded-md border p-4 space-y-4">
															<div className="flex items-center justify-between">
																<h4 className="text-sm font-medium leading-none">Specific Endpoints</h4>
																{isLoadingProcedures && (
																	<div className="flex items-center text-xs text-muted-foreground gap-1.5">
																		<Spinner className="size-3" />
																		<span>Loading routes...</span>
																	</div>
																)}
															</div>
															
															{isLoadingProcedures ? (
																<div className="flex h-32 items-center justify-center p-4">
																	<div className="flex flex-col items-center gap-2">
																		<Spinner className="size-8 text-primary" />
																		<span className="text-sm text-muted-foreground">Discovering API routes...</span>
																	</div>
																</div>
															) : (
																<ScrollArea className="h-64 rounded-md border p-4 bg-card">
																	<div className="space-y-4">
																		{(procedures || []).map((proc: string) => (
																			<div key={proc} className="flex items-start space-x-3">
																				<Checkbox 
																					id={`proc-${proc}`}
																					checked={field.value.includes(proc)}
																					onCheckedChange={(checked) => {
																						if (checked) {
																							field.onChange([...field.value.filter(v => v !== "*"), proc]);
																						} else {
																							field.onChange(field.value.filter(v => v !== proc && v !== "*"));
																						}
																					}}
																					className="mt-0.5"
																				/>
																				<FormLabel 
																					htmlFor={`proc-${proc}`} 
																					className="font-mono text-xs cursor-pointer select-none leading-relaxed break-words whitespace-normal break-all sm:break-normal w-full"
																				>
																					{proc}
																				</FormLabel>
																			</div>
																		))}
																	</div>
																</ScrollArea>
															)}
														</div>
													)}
													<FormMessage />
												</FormItem>
											);
										}}
									/>
								)}

								<div className="flex justify-between gap-2 pt-2">
									{step === 1 ? (
										<Button variant="outline" type="button" onClick={() => setStep(0)}>
											<ArrowLeft className="mr-2 h-4 w-4" /> Back
										</Button>
									) : (
										<div /> // alignment spacer
									)}
									
									<div className="flex gap-2">
										<Button variant="outline" type="button" onClick={handleClose}>
											Cancel
										</Button>
										
										{step === 0 ? (
											<Button type="submit">
												Next Step <ArrowRight className="ml-2 h-4 w-4" />
											</Button>
										) : (
											<Button type="submit" disabled={createMutation.isPending}>
												{createMutation.isPending && (
													<Spinner className="mr-2 size-4" />
												)}
												Create Key
											</Button>
										)}
									</div>
								</div>
							</form>
						</Form>
					</div>
				)}
			</DialogContent>
		</Dialog>
	);
}
