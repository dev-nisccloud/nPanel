"use client";

import * as React from "react";
import { UserPlus } from "lucide-react";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { ComboboxDropdown, type ComboboxItem } from "@npanel/ui/components/combobox-dropdown";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "@/components/ui/sonner";
import { trpc } from "@/utils/trpc";

interface AddMemberDialogProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	teamId: string;
	/** User IDs already on the team — excluded from the picker. */
	existingMemberUserIds?: string[];
	onSuccess?: () => void;
}

export function AddMemberDialog({
	open,
	onOpenChange,
	teamId,
	existingMemberUserIds = [],
	onSuccess,
}: AddMemberDialogProps) {
	const [userId, setUserId] = React.useState("");
	const [role, setRole] = React.useState<"OWNER" | "ADMIN" | "MEMBER" | "VIEWER">("MEMBER");

	React.useEffect(() => {
		if (!open) {
			setUserId("");
			setRole("MEMBER");
		}
	}, [open]);

	const { data: customers = [], isLoading: loadingCustomers } =
		trpc.userProfile.listCustomersForRegistrant.useQuery(undefined, {
			enabled: open,
		});

	const existingSet = React.useMemo(
		() => new Set(existingMemberUserIds),
		[existingMemberUserIds],
	);

	const userItems = React.useMemo((): ComboboxItem[] => {
		return customers
			.filter((c) => !existingSet.has(c.id))
			.map((c) => ({
				id: c.id,
				label: c.name ? `${c.name} (${c.email})` : c.email,
			}));
	}, [customers, existingSet]);

	const selectedUser = userItems.find((i) => i.id === userId);

	const addMemberMutation = trpc.teams.addMember.useMutation({
		onSuccess: () => {
			toast.success("Member added to the team");
			setUserId("");
			setRole("MEMBER");
			onOpenChange(false);
			onSuccess?.();
		},
		onError: (error) => {
			toast.error(error.message || "Failed to add member");
		},
	});

	const handleSubmit = () => {
		if (!userId.trim()) {
			toast.error("Select a user to add");
			return;
		}
		addMemberMutation.mutate({
			teamId,
			userId: userId.trim(),
			role,
		});
	};

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
				<DialogHeader>
					<DialogTitle>Add team member</DialogTitle>
					<DialogDescription>
						Add an existing customer account to this team immediately. No invitation email is
						sent. Use Invite if the person does not have an account yet.
					</DialogDescription>
				</DialogHeader>

				<div className="space-y-6 py-4">
					<div className="flex items-center gap-2">
						<UserPlus className="h-5 w-5 text-primary" />
						<h2 className="text-lg font-semibold">Add existing user</h2>
					</div>

					<div className="space-y-2">
						<Label className="text-sm font-medium">
							User <span className="text-destructive">*</span>
						</Label>
						{loadingCustomers ? (
							<Skeleton className="h-11 w-full" />
						) : (
							<ComboboxDropdown
								items={userItems}
								selectedItem={selectedUser}
								onSelect={(item) => setUserId(item.id)}
								placeholder="Search customers by name or email..."
								searchPlaceholder="Search..."
								emptyResults="No matching customers"
								disabled={addMemberMutation.isPending}
							/>
						)}
					</div>

					<div className="space-y-2">
						<Label htmlFor="addMemberRole" className="text-sm font-medium">
							Role
						</Label>
						<Select
							value={role}
							onValueChange={(value) => setRole(value as typeof role)}
							disabled={addMemberMutation.isPending}
						>
							<SelectTrigger id="addMemberRole" className="h-11 w-full">
								<SelectValue placeholder="Select role" />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value="MEMBER">Member</SelectItem>
								<SelectItem value="ADMIN">Admin</SelectItem>
								<SelectItem value="OWNER">Owner</SelectItem>
								<SelectItem value="VIEWER">Viewer</SelectItem>
							</SelectContent>
						</Select>
					</div>

					<div className="flex gap-3 pt-2">
						<Button
							variant="outline"
							onClick={() => onOpenChange(false)}
							className="flex-1 h-11"
							disabled={addMemberMutation.isPending}
						>
							Cancel
						</Button>
						<Button
							onClick={handleSubmit}
							className="flex-1 h-11"
							disabled={addMemberMutation.isPending || !userId}
						>
							{addMemberMutation.isPending ? "Adding..." : "Add member"}
						</Button>
					</div>
				</div>
			</DialogContent>
		</Dialog>
	);
}
