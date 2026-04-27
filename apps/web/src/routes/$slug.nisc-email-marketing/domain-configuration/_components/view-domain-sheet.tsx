"use client";

import * as React from "react";
import { Globe, XIcon, CheckCircle2, Clock, XCircle, AlertCircle, Copy, RefreshCw, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
	Sheet,
	SheetClose,
	SheetContent,
	SheetDescription,
	SheetHeader,
	SheetTitle,
} from "@/components/npanel-ui/sheet";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { trpc, type RouterOutputs } from "@/utils/trpc";
import { toast } from "@/components/ui/sonner";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

type EmailDomainDetail = RouterOutputs["niscEmailMarketing"]["domains"]["getById"];

interface ViewDomainSheetProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	domainId: string | null;
}

const getStatusBadge = (status: string) => {
	switch (status) {
		case "VERIFIED":
			return (
				<Badge variant="outline" className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 border-green-200 dark:border-green-800">
					<CheckCircle2 className="mr-1 h-3 w-3" />
					Verified
				</Badge>
			);
		case "PENDING":
			return (
				<Badge variant="outline" className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200 border-yellow-200 dark:border-yellow-800">
					<Clock className="mr-1 h-3 w-3" />
					Pending
				</Badge>
			);
		case "FAILED":
			return (
				<Badge variant="outline" className="bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200 border-red-200 dark:border-red-800">
					<XCircle className="mr-1 h-3 w-3" />
					Failed
				</Badge>
			);
		default:
			return (
				<Badge variant="outline">
					{status}
				</Badge>
			);
	}
};

const formatDate = (value: Date | string | null | undefined) => {
	if (!value) return "- ";
	const d = value instanceof Date ? value : new Date(value);
	return Number.isNaN(d.getTime()) ? "- " : d.toLocaleString();
};

export function ViewDomainSheet({ open, onOpenChange, domainId }: ViewDomainSheetProps) {
	const [isVerifying, setIsVerifying] = React.useState(false);
	const [isTestEmailSheetOpen, setIsTestEmailSheetOpen] = React.useState(false);
	const [toEmail, setToEmail] = React.useState("");
	const [ccText, setCcText] = React.useState("");
	const [bccText, setBccText] = React.useState("");
	const utils = trpc.useUtils();

	const { data: domain, isLoading, refetch } = trpc.niscEmailMarketing.domains.getById.useQuery(
		{ id: domainId! },
		{
			enabled: open && !!domainId,
			refetchOnWindowFocus: false,
		}
	);

	const verifyMutation = trpc.niscEmailMarketing.domains.verify.useMutation({
		onSuccess: () => {
			toast.success("Domain verification checked", {
				description: "Verification status has been updated.",
			});
			// Refetch the current domain details
			refetch();
			// Invalidate the list query so the table updates
			utils.niscEmailMarketing.domains.listLegacy.invalidate();
			setIsVerifying(false);
		},
		onError: (e) => {
			toast.error("Failed to verify domain", { description: e.message });
			setIsVerifying(false);
		},
	});

	const sendTestEmailMutation = trpc.niscEmailMarketing.domains.sendTestEmail.useMutation({
		onSuccess: () => {
			toast.success("Test email sent", {
				description: "The domain test email has been sent successfully.",
			});
			setIsTestEmailSheetOpen(false);
			setToEmail("");
			setCcText("");
			setBccText("");
		},
		onError: (e) => {
			toast.error("Failed to send test email", { description: e.message });
		},
	});

	const handleVerify = async () => {
		if (!domainId) return;
		setIsVerifying(true);
		try {
			await verifyMutation.mutateAsync({ id: domainId });
		} catch (error) {
			// Error handled in mutation
		}
	};

	const copyToClipboard = (text: string) => {
		navigator.clipboard.writeText(text);
		toast.success("Copied to clipboard");
	};

	const parseEmailList = (value: string) =>
		value
			.split(/[,\n]/g)
			.map((v) => v.trim())
			.filter(Boolean);

	const handleSendTestEmail = async () => {
		if (!domainId) return;
		await sendTestEmailMutation.mutateAsync({
			domainId,
			to: toEmail.trim(),
			cc: parseEmailList(ccText),
			bcc: parseEmailList(bccText),
		});
	};

	return (
		<Sheet open={open} onOpenChange={onOpenChange}>
			<SheetContent className="w-full sm:max-w-2xl overflow-hidden flex flex-col p-0">
				<SheetHeader className="px-6 pt-6 pb-2 flex-shrink-0">
					<div className="flex items-center justify-between">
						<div className="flex items-center gap-3">
							<div className="p-2 bg-primary/10 rounded-lg">
								<Globe className="h-6 w-6 text-primary" />
							</div>
							<div>
								<SheetTitle>Domain Details</SheetTitle>
								<SheetDescription>
									View and manage domain configuration
								</SheetDescription>
							</div>
						</div>
						<SheetClose asChild>
							<Button
								size="icon"
								variant="ghost"
								className="p-0 m-0 size-auto hover:bg-transparent"
							>
								<XIcon className="size-5" />
							</Button>
						</SheetClose>
					</div>
				</SheetHeader>

				<ScrollArea className="flex-1 min-h-0 px-6 pr-4">
					{isLoading ? (
						<div className="space-y-4 py-4">
							<Skeleton className="h-8 w-full" />
							<Skeleton className="h-32 w-full" />
							<Skeleton className="h-64 w-full" />
						</div>
					) : domain ? (
						<div className="space-y-6 pb-6">
							{/* Domain Information */}
							<div className="space-y-4">
								<div className="flex items-center justify-end gap-2">
									<Button
										type="button"
										variant="outline"
										size="sm"
										onClick={handleVerify}
										disabled={isVerifying}
									>
										{isVerifying ? (
											<>
												<RefreshCw className="mr-2 h-4 w-4 animate-spin" />
												Refreshing...
											</>
										) : (
											<>
												<RefreshCw className="mr-2 h-4 w-4" />
												Refresh Status
											</>
										)}
									</Button>
									<Button
										type="button"
										variant="default"
										size="sm"
										onClick={() => setIsTestEmailSheetOpen(true)}
										disabled={domain.status !== "VERIFIED"}
									>
										<Mail className="mr-2 h-4 w-4" />
										Send test email
									</Button>
								</div>
								<div className="rounded-lg border bg-card p-4 space-y-3">
									<div className="flex items-center justify-between">
										<span className="text-sm text-muted-foreground">Domain Name</span>
										<span className="text-sm font-medium">{domain.domainName}</span>
									</div>
									<div className="flex items-center justify-between">
										<span className="text-sm text-muted-foreground">Status</span>
										{getStatusBadge(domain.status)}
									</div>
									{domain.verificationStatus && (
										<div className="flex items-center justify-between">
											<span className="text-sm text-muted-foreground">Verification Status</span>
											<Badge variant="outline" className="text-xs">
												{domain.verificationStatus}
											</Badge>
										</div>
									)}
									<div className="flex items-center justify-between">
										<span className="text-sm text-muted-foreground">Created At</span>
										<span className="text-sm">{formatDate(domain.createdAt)}</span>
									</div>
									{domain.verifiedAt && (
										<div className="flex items-center justify-between">
											<span className="text-sm text-muted-foreground">Verified At</span>
											<span className="text-sm">{formatDate(domain.verifiedAt)}</span>
										</div>
									)}
								</div>
							</div>

							{/* DNS Records */}
							{domain.dnsRecords && Array.isArray(domain.dnsRecords) ? (
								<div className="space-y-4" key="dns-records">
									<div className="flex items-center justify-between">
										<div>
											<h3 className="text-lg font-semibold mb-1">DNS Records</h3>
											<p className="text-sm text-muted-foreground">
												Add these DNS records to verify your domain
											</p>
										</div>
										<Button
											type="button"
											variant="outline"
											size="sm"
											onClick={handleVerify}
											disabled={isVerifying}
										>
											{isVerifying ? (
												<>
													<RefreshCw className="mr-2 h-4 w-4 animate-spin" />
													Checking...
												</>
											) : (
												<>
													<RefreshCw className="mr-2 h-4 w-4" />
													Check Verification
												</>
											)}
										</Button>
									</div>

									<div className="space-y-3">
										{(domain.dnsRecords as Array<{
											name: string;
											type: string;
											value: string;
											record: string;
											status?: string;
											priority?: number;
										}>).map((record, index) => (
											<div key={index} className="rounded-lg border bg-card p-4 space-y-3">
												<div className="flex items-center justify-between">
													<span className="text-sm font-medium">{record.record || record.type}</span>
													{record.status && (
														<span className={cn(
															"text-xs px-2 py-1 rounded",
															record.status === "verified" ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200" :
															record.status === "not_started" ? "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200" :
															"bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200"
														)}>
															{record.status}
														</span>
													)}
												</div>
												<div className="space-y-3 text-sm">
													<div>
														<span className="text-muted-foreground">Name</span>
														<div className="flex items-center gap-2 mt-1">
															<code className="flex-1 px-2 py-1 bg-muted rounded text-xs font-mono min-w-0 break-all">
																{record.name}
															</code>
															<Button
																type="button"
																variant="ghost"
																size="icon"
																className="h-7 w-7 flex-shrink-0"
																onClick={() => copyToClipboard(record.name)}
															>
																<Copy className="h-3 w-3" />
															</Button>
														</div>
													</div>

													<div>
														<span className="text-muted-foreground">Type</span>
														<div className="flex items-center gap-2 mt-1">
															<code className="flex-1 px-2 py-1 bg-muted rounded text-xs font-mono min-w-0 break-all">
																{record.type}
															</code>
															<Button
																type="button"
																variant="ghost"
																size="icon"
																className="h-7 w-7 flex-shrink-0"
																onClick={() => copyToClipboard(record.type)}
															>
																<Copy className="h-3 w-3" />
															</Button>
														</div>
													</div>

													{record.priority !== undefined && (
														<div>
															<span className="text-muted-foreground">Priority</span>
															<div className="flex items-center gap-2 mt-1">
																<code className="flex-1 px-2 py-1 bg-muted rounded text-xs font-mono min-w-0 break-all">
																	{record.priority}
																</code>
																<Button
																	type="button"
																	variant="ghost"
																	size="icon"
																	className="h-7 w-7 flex-shrink-0"
																	onClick={() => copyToClipboard(String(record.priority))}
																>
																	<Copy className="h-3 w-3" />
																</Button>
															</div>
														</div>
													)}

													<div>
														<span className="text-muted-foreground">Value</span>
														<div className="flex items-start gap-2 mt-1">
															<code className="flex-1 p-2 bg-muted rounded text-xs font-mono min-w-0 break-all">
																{record.value}
															</code>
															<Button
																type="button"
																variant="ghost"
																size="icon"
																className="h-7 w-7 flex-shrink-0"
																onClick={() => copyToClipboard(record.value)}
															>
																<Copy className="h-3 w-3" />
															</Button>
														</div>
													</div>
												</div>
											</div>
										))}
									</div>

									{domain.status !== "VERIFIED" && (
										<div className="rounded-lg border border-blue-200 bg-blue-50 dark:bg-blue-950 dark:border-blue-800 p-4">
											<p className="text-sm text-blue-900 dark:text-blue-100">
												<strong>Note:</strong> After adding these DNS records to your domain's DNS settings, 
												click "Check Verification" to verify the domain. It may take a few minutes for DNS 
												changes to propagate.
											</p>
										</div>
									)}
								</div>
							) : null}
						</div>
					) : (
						<div className="py-8 text-center text-muted-foreground">
							<p>Domain not found</p>
						</div>
					)}
				</ScrollArea>
			</SheetContent>

			<Sheet open={isTestEmailSheetOpen} onOpenChange={setIsTestEmailSheetOpen}>
				<SheetContent side="right" className="w-full sm:max-w-xl overflow-hidden flex flex-col p-0">
					<SheetHeader className="px-6 pt-6 pb-2 flex-shrink-0">
						<div className="flex items-center justify-between">
							<div>
								<SheetTitle>Send test email</SheetTitle>
								<SheetDescription>
									Send one test email for domain verification using a fixed nPanel message body.
								</SheetDescription>
							</div>
							<SheetClose asChild>
								<Button size="icon" variant="ghost" className="p-0 m-0 size-auto hover:bg-transparent">
									<XIcon className="size-5" />
								</Button>
							</SheetClose>
						</div>
					</SheetHeader>

					<ScrollArea className="flex-1 min-h-0 px-6 pr-4">
						<div className="space-y-4 pb-6">
							<div className="space-y-2">
								<p className="text-sm font-medium">To (single recipient)</p>
								<Input
									type="email"
									placeholder="recipient@example.com"
									value={toEmail}
									onChange={(e) => setToEmail(e.target.value)}
								/>
							</div>
							<div className="space-y-2">
								<p className="text-sm font-medium">CC (optional, unlimited)</p>
								<Textarea
									placeholder="cc1@example.com, cc2@example.com"
									value={ccText}
									onChange={(e) => setCcText(e.target.value)}
									rows={3}
								/>
							</div>
							<div className="space-y-2">
								<p className="text-sm font-medium">BCC (optional, unlimited)</p>
								<Textarea
									placeholder="bcc1@example.com, bcc2@example.com"
									value={bccText}
									onChange={(e) => setBccText(e.target.value)}
									rows={3}
								/>
							</div>
							<div className="space-y-2">
								<p className="text-sm font-medium">Message (fixed)</p>
								<div className="rounded-md border bg-muted/30 p-3 text-sm text-muted-foreground">
									This is a test email from nPanel - timestamp to test the domain name -{" "}
									<span className="font-medium text-foreground">{domain?.domainName ?? "-"}</span> verification on npanel.
								</div>
							</div>
							<div className="flex justify-end gap-2 pt-2">
								<Button
									type="button"
									variant="outline"
									onClick={() => setIsTestEmailSheetOpen(false)}
									disabled={sendTestEmailMutation.isPending}
								>
									Cancel
								</Button>
								<Button
									type="button"
									onClick={handleSendTestEmail}
									disabled={sendTestEmailMutation.isPending || !toEmail.trim()}
								>
									{sendTestEmailMutation.isPending ? "Sending..." : "Send test email"}
								</Button>
							</div>
						</div>
					</ScrollArea>
				</SheetContent>
			</Sheet>
		</Sheet>
	);
}
