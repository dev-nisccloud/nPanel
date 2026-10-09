"use client";

import * as React from "react";
import { toast } from "@/components/ui/sonner";

import { Button } from "@/components/ui/button";
import {
	Sheet,
	SheetContent,
	SheetDescription,
	SheetFooter,
	SheetHeader,
	SheetTitle,
} from "@/components/npanel-ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Spinner } from "@/components/ui/shadcn-io/spinner";
import { trpc } from "@/utils/trpc";
import {
	grantsFromEditor,
	RoleAccessEditor,
	type AgencyAccessLevel,
} from "@/routes/agency.agency-roles/_components/role-access-editor";

interface UserAccessSheetProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	userId: string | null;
}

export function UserAccessSheet({ open, onOpenChange, userId }: UserAccessSheetProps) {
	const [draft, setDraft] = React.useState<Record<string, AgencyAccessLevel>>({});

	const accessQuery = trpc.agencyRbac.userAccessGet.useQuery(
		{ userId: userId ?? "" },
		{ enabled: open && !!userId },
	);

	React.useEffect(() => {
		if (!accessQuery.data || accessQuery.data.userId !== userId) return;
		const next: Record<string, AgencyAccessLevel> = {};
		for (const grant of accessQuery.data.grants) {
			next[grant.key] = grant.access;
		}
		setDraft(next);
	}, [accessQuery.data, userId]);

	const utils = trpc.useUtils();
	const saveMutation = trpc.agencyRbac.userAccessSet.useMutation({
		onSuccess: async () => {
			toast.success("Permissions saved");
			if (userId) await utils.agencyRbac.userAccessGet.invalidate({ userId });
			await utils.agencyRbac.myPermissions.invalidate();
			onOpenChange(false);
		},
		onError: (error) => {
			toast.error(error.message || "Failed to save permissions");
		},
	});

	const access = accessQuery.data;
	const isSuperAdmin = access?.role === "AGENCY_SUPER_ADMIN";

	return (
		<Sheet open={open} onOpenChange={onOpenChange}>
			<SheetContent className="flex h-full w-full flex-col p-0 sm:max-w-2xl">
				<div className="flex h-full flex-col overflow-hidden">
					<SheetHeader className="flex-shrink-0 border-b px-6 pt-6 pb-4">
						<SheetTitle>Permissions and access</SheetTitle>
						<SheetDescription>
							{access ? `${access.name} · ${access.email}` : "Choose what this user can open."}
						</SheetDescription>
					</SheetHeader>

					{accessQuery.isLoading ? (
						<div className="flex flex-1 items-center justify-center">
							<Spinner size={28} />
						</div>
					) : accessQuery.error ? (
						<div className="flex flex-1 items-center justify-center px-6">
							<p className="text-sm text-destructive">{accessQuery.error.message}</p>
						</div>
					) : isSuperAdmin ? (
						<div className="flex flex-1 items-center justify-center px-6">
							<p className="text-sm text-muted-foreground">Super admins keep full access.</p>
						</div>
					) : access ? (
						<div className="flex min-h-0 flex-1 flex-col">
							<ScrollArea className="min-h-0 flex-1">
								<div className="space-y-4 px-6 py-6">
									{access.unrestricted ? (
										<p className="text-sm text-muted-foreground">
											This user currently has full access. Saving applies the list below.
										</p>
									) : null}
									<RoleAccessEditor value={draft} onChange={setDraft} />
								</div>
							</ScrollArea>
							<SheetFooter className="flex-shrink-0 gap-2 border-t px-6 py-4 sm:gap-0">
								<Button
									type="button"
									disabled={saveMutation.isPending || !userId}
									onClick={() => {
										if (!userId) return;
										saveMutation.mutate({
											userId,
											grants: grantsFromEditor(draft),
										});
									}}
								>
									{saveMutation.isPending ? (
										<>
											<Spinner size={16} className="mr-2" />
											Saving...
										</>
									) : (
										"Save permissions"
									)}
								</Button>
							</SheetFooter>
						</div>
					) : null}
				</div>
			</SheetContent>
		</Sheet>
	);
}
