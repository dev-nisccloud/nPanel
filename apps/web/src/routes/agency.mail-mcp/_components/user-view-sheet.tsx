import { format } from "date-fns";
import { CheckCircle2, Copy, KeyRound, Mail } from "lucide-react";
import * as React from "react";

import { HOSTING_STATUS_ACTIVE_BADGE_CLASS } from "@/components/hosting/hosting-subscriptions-list";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Spinner } from "@/components/ui/shadcn-io/spinner";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/components/ui/sonner";
import {
	Sheet,
	SheetContent,
	SheetDescription,
	SheetHeader,
	SheetTitle,
} from "@/components/npanel-ui/sheet";
import { trpc } from "@/utils/trpc";

type IssuedToken = {
	id: string;
	token: string;
	displayName: string;
	email: string;
	setupUrl: string;
	mcpUrl: string;
};

function formatWhen(value: string | null | undefined, empty: string): string {
	if (!value) return empty;
	const date = new Date(value);
	if (Number.isNaN(date.getTime())) return empty;
	return format(date, "PPp");
}

function shareText(issued: IssuedToken): string {
	return [
		`NISC Cloud Mail access for ${issued.displayName} (${issued.email})`,
		"",
		"Access token (keep this private). The previous token no longer works:",
		issued.token,
		"",
		"1. Open the setup page and paste the token:",
		issued.setupUrl,
		"2. Connect the mailbox and wait for the first sync.",
		"3. In Claude or ChatGPT, add this MCP server and sign in with the same token:",
		issued.mcpUrl,
	].join("\n");
}

async function copyText(value: string): Promise<void> {
	if (navigator.clipboard?.writeText) {
		await navigator.clipboard.writeText(value);
		return;
	}
	const textArea = document.createElement("textarea");
	textArea.value = value;
	textArea.style.position = "fixed";
	textArea.style.left = "-9999px";
	document.body.appendChild(textArea);
	textArea.focus();
	textArea.select();
	const ok = document.execCommand("copy");
	document.body.removeChild(textArea);
	if (!ok) throw new Error("copy failed");
}

function DetailRow({ label, value }: { label: string; value: string }) {
	return (
		<div className="grid grid-cols-[8rem_1fr] gap-2 text-sm">
			<span className="text-muted-foreground">{label}</span>
			<span className="break-all">{value || "—"}</span>
		</div>
	);
}

export function MailMcpUserSheet({
	open,
	onOpenChange,
	userId,
	issued,
	onIssueToken,
	issuing,
}: {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	userId: string | null;
	issued: IssuedToken | null;
	onIssueToken: () => void;
	issuing: boolean;
}) {
	const [copied, setCopied] = React.useState<"token" | "instructions" | null>(null);
	const userQuery = trpc.mailMcp.get.useQuery(
		{ id: userId ?? "" },
		{ enabled: open && !!userId },
	);

	const handleCopy = async (kind: "token" | "instructions") => {
		if (!issued) return;
		try {
			await copyText(kind === "token" ? issued.token : shareText(issued));
			setCopied(kind);
			toast.success(kind === "token" ? "Token copied" : "Instructions copied");
			setTimeout(() => setCopied(null), 2500);
		} catch {
			toast.error("Could not copy", { description: "Select the text and copy it manually." });
		}
	};

	const user = userQuery.data;

	return (
		<Sheet open={open} onOpenChange={onOpenChange}>
			<SheetContent className="flex w-full flex-col p-0 sm:max-w-xl">
				<SheetHeader className="border-b p-6">
					<div className="flex items-center gap-3">
						<div className="rounded-full bg-primary/10 p-2">
							<Mail className="h-5 w-5 text-primary" />
						</div>
						<div>
							<SheetTitle>{user?.displayName || "Mail MCP user"}</SheetTitle>
							<SheetDescription>{user?.email || "Account details and connected mailboxes"}</SheetDescription>
						</div>
					</div>
				</SheetHeader>

				<ScrollArea className="flex-1">
					<div className="flex flex-col gap-6 p-6">
						{userQuery.isLoading ? (
							<div className="flex justify-center py-12">
								<Spinner size={28} />
							</div>
						) : userQuery.error ? (
							<p className="text-sm text-destructive">{userQuery.error.message}</p>
						) : user ? (
							<>
								<section className="flex flex-col gap-3">
									<h2 className="text-sm font-semibold">Account</h2>
									<DetailRow label="Name" value={user.displayName} />
									<DetailRow label="Email" value={user.email} />
									<DetailRow label="Created" value={formatWhen(user.createdAt, "—")} />
									<DetailRow label="Mailboxes" value={String(user.mailboxCount)} />
								</section>

								<Separator />

								<section className="flex flex-col gap-3">
									<div className="flex items-center justify-between gap-3">
										<h2 className="text-sm font-semibold">Access token</h2>
										<Button type="button" size="sm" variant="outline" onClick={onIssueToken} disabled={issuing}>
											{issuing ? <Spinner className="mr-2 size-4" /> : <KeyRound className="mr-2 h-4 w-4" />}
											Issue new token
										</Button>
									</div>
									<p className="text-sm text-muted-foreground">
										The current token is stored only as a hash, so it cannot be displayed. Issuing a new token revokes the previous one. Copy the new token before you close this sheet.
									</p>
									{issued && issued.id === user.id ? (
										<div className="flex flex-col gap-3 rounded-lg border p-3">
											<div className="flex items-center gap-2 text-sm text-green-700 dark:text-green-500">
												<CheckCircle2 className="h-4 w-4" />
												New token ready. The previous token has stopped working.
											</div>
											<div className="flex items-center gap-2">
												<Input readOnly value={issued.token} className="font-mono" onFocus={(event) => event.target.select()} />
												<Button type="button" size="icon" variant="outline" onClick={() => void handleCopy("token")}>
													{copied === "token" ? (
														<CheckCircle2 className="h-4 w-4 text-green-600" />
													) : (
														<Copy className="h-4 w-4" />
													)}
												</Button>
											</div>
											<Textarea readOnly value={shareText(issued)} className="min-h-36 font-mono text-xs" />
											<Button type="button" variant="outline" onClick={() => void handleCopy("instructions")}>
												{copied === "instructions" ? (
													<CheckCircle2 className="mr-2 h-4 w-4" />
												) : (
													<Copy className="mr-2 h-4 w-4" />
												)}
												Copy instructions
											</Button>
										</div>
									) : null}
								</section>

								<Separator />

								<section className="flex flex-col gap-3">
									<h2 className="text-sm font-semibold">Connected mailboxes</h2>
									{user.mailboxes.length === 0 ? (
										<p className="text-sm text-muted-foreground">
											No mailbox is connected yet. Send them a token and have them open the setup page.
										</p>
									) : (
										user.mailboxes.map((mailbox) => (
											<div key={mailbox.id} className="flex flex-col gap-3 rounded-lg border p-4">
												<div className="flex items-start justify-between gap-3">
													<div>
														<p className="font-medium">{mailbox.displayName || mailbox.email}</p>
														<p className="text-sm text-muted-foreground">{mailbox.email}</p>
													</div>
													<Badge
														variant={mailbox.lastSyncAt ? "outline" : "secondary"}
														className={mailbox.lastSyncAt ? HOSTING_STATUS_ACTIVE_BADGE_CLASS : undefined}
													>
														{mailbox.lastSyncAt ? "Synced" : "Not synced"}
													</Badge>
												</div>
												<DetailRow label="Connected" value={formatWhen(mailbox.createdAt, "—")} />
												<DetailRow label="Updated" value={formatWhen(mailbox.updatedAt, "—")} />
												<DetailRow label="Last sync" value={formatWhen(mailbox.lastSyncAt, "Never")} />
												{mailbox.lastSyncError ? (
													<DetailRow label="Sync error" value={mailbox.lastSyncError} />
												) : null}
												<DetailRow
													label="IMAP"
													value={`${mailbox.imapHost}:${mailbox.imapPort} · ${mailbox.imapSecurity} · ${mailbox.imapUsername}`}
												/>
												<DetailRow
													label="SMTP"
													value={`${mailbox.smtpHost}:${mailbox.smtpPort} · ${mailbox.smtpSecurity} · ${mailbox.smtpUsername}`}
												/>
											</div>
										))
									)}
								</section>
							</>
						) : null}
					</div>
				</ScrollArea>
			</SheetContent>
		</Sheet>
	);
}
