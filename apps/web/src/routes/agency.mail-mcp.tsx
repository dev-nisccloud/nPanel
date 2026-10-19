"use client";

import * as React from "react";
import { ExternalLink, KeyRound, Plus, ShieldAlert, Trash2 } from "lucide-react";

import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { CleanListCell } from "@/components/ui/clean-list";
import { SearchableCleanList } from "@/components/ui/searchable-clean-list";
import { ViewDetailsButton } from "@/components/ui/list-row-actions";
import { Spinner } from "@/components/ui/shadcn-io/spinner";
import { toast } from "@/components/ui/sonner";
import { authClient } from "@/lib/auth-client";
import { trpc } from "@/utils/trpc";
import { CreateMailMcpUserDialog } from "./agency.mail-mcp/_components/create-mail-mcp-user-dialog";
import { MailMcpUserSheet } from "./agency.mail-mcp/_components/user-view-sheet";

const ACTION_BTN = "h-7 px-2.5 text-xs";

type MailMcpListUser = {
	id: string;
	displayName: string;
	email: string;
	mailboxes: { id: string; email: string; displayName: string }[];
};

type IssuedToken = {
	id: string;
	token: string;
	displayName: string;
	email: string;
	setupUrl: string;
	mcpUrl: string;
};

export default function MailMcpPage() {
	const { data: session, isPending: sessionPending } = authClient.useSession();
	const isSuperAdmin =
		(session?.user as { role?: string } | undefined)?.role === "AGENCY_SUPER_ADMIN";
	const [isCreateOpen, setIsCreateOpen] = React.useState(false);
	const [selectedId, setSelectedId] = React.useState<string | null>(null);
	const [sheetOpen, setSheetOpen] = React.useState(false);
	const [issued, setIssued] = React.useState<IssuedToken | null>(null);
	const [pendingDelete, setPendingDelete] = React.useState<MailMcpListUser | null>(null);
	const [pendingRotate, setPendingRotate] = React.useState<MailMcpListUser | null>(null);
	const [searchQuery, setSearchQuery] = React.useState("");

	const utils = trpc.useUtils();
	const usersQuery = trpc.mailMcp.list.useQuery(undefined, { enabled: isSuperAdmin });
	const urlsQuery = trpc.mailMcp.urls.useQuery(undefined, { enabled: isSuperAdmin });

	const deleteMutation = trpc.mailMcp.delete.useMutation({
		onSuccess: () => {
			toast.success("Mail MCP user deleted");
			void utils.mailMcp.list.invalidate();
			setPendingDelete(null);
			setSheetOpen(false);
			setSelectedId(null);
		},
		onError: (error) => {
			toast.error("Could not delete the user", { description: error.message });
		},
	});

	const rotateMutation = trpc.mailMcp.rotateToken.useMutation({
		onSuccess: (data) => {
			setIssued(data);
			setSelectedId(data.id);
			setSheetOpen(true);
			setPendingRotate(null);
			void utils.mailMcp.list.invalidate();
			void utils.mailMcp.get.invalidate({ id: data.id });
			toast.success("New token issued", { description: "Copy it from the account sheet. The previous token has stopped working." });
		},
		onError: (error) => {
			toast.error("Could not issue a new token", { description: error.message });
			setPendingRotate(null);
		},
	});

	const openUser = (user: MailMcpListUser) => {
		setSelectedId(user.id);
		setSheetOpen(true);
	};

	const openSetup = () => {
		const url = urlsQuery.data?.setupUrl;
		if (!url) {
			toast.error("Setup page is unavailable");
			return;
		}
		window.open(url, "_blank", "noopener,noreferrer");
	};

	const users = usersQuery.data ?? [];
	const filteredUsers = React.useMemo(() => {
		const query = searchQuery.trim().toLowerCase();
		if (!query) return users;
		return users.filter((user) => {
			const mailboxHit = user.mailboxes.some(
				(mailbox) =>
					mailbox.email.toLowerCase().includes(query) ||
					mailbox.displayName.toLowerCase().includes(query),
			);
			return (
				user.displayName.toLowerCase().includes(query) ||
				user.email.toLowerCase().includes(query) ||
				mailboxHit
			);
		});
	}, [searchQuery, users]);

	if (sessionPending) {
		return (
			<div className="@container/main flex flex-col gap-4 px-4 py-4 md:px-6 md:py-6 lg:px-8">
				<div className="mx-auto flex w-full max-w-7xl items-center justify-center py-12">
					<Spinner size={32} />
				</div>
			</div>
		);
	}

	if (!isSuperAdmin) {
		return (
			<div className="@container/main flex flex-col gap-4 px-4 py-4 md:px-6 md:py-6 lg:px-8">
				<div className="mx-auto flex w-full max-w-7xl flex-col items-center justify-center gap-3 py-12 text-center">
					<ShieldAlert className="h-8 w-8 text-destructive" />
					<p className="text-sm font-semibold">You don&apos;t have access to Mail MCP.</p>
					<p className="max-w-md text-xs text-muted-foreground">
						Only agency super admins can create mailbox access tokens.
					</p>
				</div>
			</div>
		);
	}

	return (
		<div className="@container/main flex flex-col gap-4 px-4 py-4 md:gap-6 md:px-6 md:py-6 lg:px-8">
			<div className="mx-auto flex w-full max-w-7xl flex-col gap-6">
				<div className="flex flex-col justify-between gap-4 md:flex-row md:items-start">
					<div className="flex flex-col gap-2">
						<h1 className="text-base font-semibold tracking-tight">Mail MCP</h1>
						<p className="text-sm text-muted-foreground">
							Nisc Cloud Mail MCP accounts.
						</p>
					</div>
				</div>

				<SearchableCleanList
					items={filteredUsers.map((user) => ({
						key: user.id,
						title: user.displayName,
						description: user.email,
						onClick: () => openUser(user),
						cells: {
							mailboxes: (
								<CleanListCell>
									{user.mailboxes.length === 0
										? "None connected"
										: user.mailboxes
												.map((mailbox) => mailbox.displayName || mailbox.email)
												.join(", ")}
								</CleanListCell>
							),
						},
						actions: (
							<>
								<Button
									type="button"
									variant="outline"
									size="sm"
									className={ACTION_BTN}
									onClick={openSetup}
								>
									<ExternalLink className="mr-1 h-3.5 w-3.5" />
									Setup
								</Button>
								<ViewDetailsButton onClick={() => openUser(user)} />
								<Button
									type="button"
									variant="outline"
									size="sm"
									className={ACTION_BTN}
									onClick={() => setPendingRotate(user)}
								>
									<KeyRound className="mr-1 h-3.5 w-3.5" />
									New token
								</Button>
								<Button
									type="button"
									variant="outline"
									size="sm"
									className={`${ACTION_BTN} text-destructive hover:text-destructive`}
									onClick={() => setPendingDelete(user)}
								>
									<Trash2 className="mr-1 h-3.5 w-3.5" />
									Delete
								</Button>
							</>
						),
					}))}
					searchQuery={searchQuery}
					onSearchChange={setSearchQuery}
					totalCount={users.length}
					isLoading={usersQuery.isLoading}
					isError={!!usersQuery.error}
					error={usersQuery.error as Error | null}
					onRetry={() => void usersQuery.refetch()}
					searchPlaceholder="Search name, email, or mailbox"
					emptyMessage="No Mail MCP users yet."
					errorTitle="Failed to load Mail MCP users"
					columns={[
						{ key: "name", label: "Account" },
						{ key: "mailboxes", label: "Mailboxes", hideBelow: "@md" },
						{ key: "actions", label: "Actions", align: "end" },
					]}
					toolbarActions={
						<Button type="button" variant="outline" size="sm" onClick={() => setIsCreateOpen(true)}>
							<Plus className="mr-2 h-4 w-4" />
							Create user
						</Button>
					}
				/>
			</div>

			<CreateMailMcpUserDialog
				open={isCreateOpen}
				onOpenChange={setIsCreateOpen}
				onCreated={() => void utils.mailMcp.list.invalidate()}
			/>

			<MailMcpUserSheet
				open={sheetOpen}
				onOpenChange={setSheetOpen}
				userId={selectedId}
				issued={issued}
				issuing={rotateMutation.isPending}
				onIssueToken={() => {
					const user = (usersQuery.data ?? []).find((row) => row.id === selectedId);
					if (user) setPendingRotate(user);
				}}
			/>

			<AlertDialog open={!!pendingDelete} onOpenChange={(open) => { if (!open) setPendingDelete(null); }}>
				<AlertDialogContent>
					<AlertDialogHeader>
						<AlertDialogTitle>Delete this Mail MCP user?</AlertDialogTitle>
						<AlertDialogDescription>
							{pendingDelete
								? `${pendingDelete.email} will lose access immediately. Their token, mailboxes, and indexed mail are removed.`
								: "This user will lose access immediately."}
						</AlertDialogDescription>
					</AlertDialogHeader>
					<AlertDialogFooter>
						<AlertDialogCancel disabled={deleteMutation.isPending}>Cancel</AlertDialogCancel>
						<AlertDialogAction
							className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
							disabled={deleteMutation.isPending || !pendingDelete}
							onClick={() => {
								if (!pendingDelete) return;
								deleteMutation.mutate({ id: pendingDelete.id });
							}}
						>
							{deleteMutation.isPending ? <Spinner className="mr-2 size-4" /> : null}
							Delete user
						</AlertDialogAction>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>

			<AlertDialog open={!!pendingRotate} onOpenChange={(open) => { if (!open && !rotateMutation.isPending) setPendingRotate(null); }}>
				<AlertDialogContent>
					<AlertDialogHeader>
						<AlertDialogTitle>Issue a new access token?</AlertDialogTitle>
						<AlertDialogDescription>
							{pendingRotate
								? `The token for ${pendingRotate.email} stops working immediately. Claude, ChatGPT, and the setup page signed in with it will need the new token.`
								: "The current token stops working immediately."}
						</AlertDialogDescription>
					</AlertDialogHeader>
					<AlertDialogFooter>
						<AlertDialogCancel disabled={rotateMutation.isPending}>Cancel</AlertDialogCancel>
						<AlertDialogAction
							disabled={rotateMutation.isPending || !pendingRotate}
							onClick={() => {
								if (!pendingRotate) return;
								rotateMutation.mutate({ id: pendingRotate.id });
							}}
						>
							{rotateMutation.isPending ? <Spinner className="mr-2 size-4" /> : null}
							Issue new token
						</AlertDialogAction>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>
		</div>
	);
}
