import React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { CheckCircle2, Copy, ShieldAlert } from "lucide-react";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
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
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/shadcn-io/spinner";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/components/ui/sonner";
import { trpc } from "@/utils/trpc";

const createSchema = z.object({
	displayName: z
		.string()
		.trim()
		.min(1, "Name is required")
		.max(200, "Name must be 200 characters or fewer"),
	email: z.string().trim().email("Enter a valid email").max(320),
});

type CreateValues = z.infer<typeof createSchema>;

type IssuedUser = {
	id: string;
	token: string;
	displayName: string;
	email: string;
	setupUrl: string;
	mcpUrl: string;
};

function shareText(user: IssuedUser): string {
	return [
		`NISC Cloud Mail access for ${user.displayName} (${user.email})`,
		"",
		"Access token (keep this private):",
		user.token,
		"",
		"1. Open the setup page and paste the token:",
		user.setupUrl,
		"2. Connect the mailbox and wait for the first sync.",
		"3. In Claude or ChatGPT, add this MCP server and sign in with the same token:",
		user.mcpUrl,
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

export function CreateMailMcpUserDialog({
	open,
	onOpenChange,
	onCreated,
}: {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	onCreated?: () => void;
}) {
	const [issued, setIssued] = React.useState<IssuedUser | null>(null);
	const [copied, setCopied] = React.useState<"token" | "instructions" | null>(null);

	const form = useForm<CreateValues>({
		resolver: zodResolver(createSchema),
		defaultValues: { displayName: "", email: "" },
	});

	const createMutation = trpc.mailMcp.create.useMutation({
		onSuccess: (data) => {
			setIssued(data);
			onCreated?.();
		},
		onError: (error) => {
			toast.error("Could not create the Mail MCP user", { description: error.message });
		},
	});

	const handleClose = () => {
		onOpenChange(false);
		setTimeout(() => {
			setIssued(null);
			setCopied(null);
			form.reset();
		}, 200);
	};

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

	return (
		<Dialog open={open} onOpenChange={handleClose}>
			<DialogContent className="sm:max-w-lg">
				<DialogHeader>
					<DialogTitle>{issued ? "Share this access token" : "Create Mail MCP user"}</DialogTitle>
					<DialogDescription>
						{issued
							? "The token is shown once. Send it to the person who will connect the mailbox."
							: "Creates an account on the Mail MCP service for someone else. They use the token to connect their mailbox."}
					</DialogDescription>
				</DialogHeader>

				{issued ? (
					<div className="flex flex-col gap-4">
						<Alert className="border-green-500/50 bg-green-500/10 text-green-700 dark:text-green-500">
							<CheckCircle2 className="h-4 w-4" />
							<AlertTitle>User created</AlertTitle>
							<AlertDescription>
								{issued.displayName} ({issued.email}). This token cannot be retrieved again. Deleting the user is the way to revoke it.
							</AlertDescription>
						</Alert>

						<div className="flex flex-col gap-2">
							<p className="text-sm font-medium">Access token</p>
							<div className="flex items-center gap-2">
								<Input readOnly value={issued.token} className="font-mono" onFocus={(e) => e.target.select()} />
								<Button type="button" size="icon" variant="outline" onClick={() => void handleCopy("token")}>
									{copied === "token" ? <CheckCircle2 className="h-4 w-4 text-green-600" /> : <Copy className="h-4 w-4" />}
								</Button>
							</div>
						</div>

						<div className="flex flex-col gap-2">
							<p className="text-sm font-medium">Message to send</p>
							<Textarea readOnly value={shareText(issued)} className="min-h-40 font-mono text-xs" />
							<Button type="button" variant="outline" onClick={() => void handleCopy("instructions")}>
								{copied === "instructions" ? <CheckCircle2 className="mr-2 h-4 w-4" /> : <Copy className="mr-2 h-4 w-4" />}
								Copy instructions
							</Button>
						</div>

						<div className="flex justify-end">
							<Button type="button" onClick={handleClose}>
								I have saved the token
							</Button>
						</div>
					</div>
				) : (
					<Form {...form}>
						<form
							className="flex flex-col gap-4"
							onSubmit={form.handleSubmit((values) => createMutation.mutate(values))}
						>
							<Alert>
								<ShieldAlert className="h-4 w-4" />
								<AlertTitle>This token is the mailbox login</AlertTitle>
								<AlertDescription>
									Anyone with it can read and send mail for the mailbox they connect. Share it only with that person.
								</AlertDescription>
							</Alert>
							<FormField
								control={form.control}
								name="displayName"
								render={({ field }) => (
									<FormItem>
										<FormLabel>Name</FormLabel>
										<FormControl>
											<Input placeholder="Finey Akwoyo" autoComplete="off" {...field} />
										</FormControl>
										<FormMessage />
									</FormItem>
								)}
							/>
							<FormField
								control={form.control}
								name="email"
								render={({ field }) => (
									<FormItem>
										<FormLabel>Email</FormLabel>
										<FormControl>
											<Input type="email" placeholder="finey@nisccloud.com" autoComplete="off" {...field} />
										</FormControl>
										<FormMessage />
									</FormItem>
								)}
							/>
							<div className="flex justify-end gap-2">
								<Button type="button" variant="outline" onClick={handleClose} disabled={createMutation.isPending}>
									Cancel
								</Button>
								<Button type="submit" disabled={createMutation.isPending}>
									{createMutation.isPending ? <Spinner className="mr-2 size-4" /> : null}
									Create user
								</Button>
							</div>
						</form>
					</Form>
				)}
			</DialogContent>
		</Dialog>
	);
}
