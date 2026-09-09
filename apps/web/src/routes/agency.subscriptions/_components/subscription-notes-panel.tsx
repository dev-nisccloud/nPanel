"use client";

import * as React from "react";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Spinner } from "@/components/ui/shadcn-io/spinner";
import { trpc } from "@/utils/trpc";
import { toast } from "@/components/ui/sonner";

function formatNoteDate(v: string | Date): string {
	const d = v instanceof Date ? v : new Date(v);
	return Number.isNaN(d.getTime()) ? "" : d.toLocaleString();
}

interface SubscriptionNotesPanelProps {
	subscriptionId: string;
	canWrite: boolean;
}

export function SubscriptionNotesPanel({
	subscriptionId,
	canWrite,
}: SubscriptionNotesPanelProps) {
	const utils = trpc.useUtils();
	const [draft, setDraft] = React.useState("");
	const [editingId, setEditingId] = React.useState<string | null>(null);
	const [editContent, setEditContent] = React.useState("");

	const { data: notes = [], isLoading } = trpc.clientSubscriptions.listNotes.useQuery(
		{ subscriptionId },
		{ enabled: !!subscriptionId },
	);

	const addNote = trpc.clientSubscriptions.addNote.useMutation({
		onSuccess: () => {
			setDraft("");
			void utils.clientSubscriptions.listNotes.invalidate({ subscriptionId });
			toast.success("Note added");
		},
		onError: (e) => toast.error(e.message),
	});

	const updateNote = trpc.clientSubscriptions.updateNote.useMutation({
		onSuccess: () => {
			setEditingId(null);
			setEditContent("");
			void utils.clientSubscriptions.listNotes.invalidate({ subscriptionId });
			toast.success("Note updated");
		},
		onError: (e) => toast.error(e.message),
	});

	const deleteNote = trpc.clientSubscriptions.deleteNote.useMutation({
		onSuccess: () => {
			void utils.clientSubscriptions.listNotes.invalidate({ subscriptionId });
			toast.success("Note deleted");
		},
		onError: (e) => toast.error(e.message),
	});

	const isBusy = addNote.isPending || updateNote.isPending || deleteNote.isPending;

	return (
		<section className="space-y-2">
			<h3 className="text-sm font-medium text-muted-foreground">Notes</h3>
			<div className="rounded-lg border bg-card p-4 space-y-4">
				{isLoading ? (
					<div className="flex justify-center py-6">
						<Spinner size={18} />
					</div>
				) : notes.length === 0 ? (
					<p className="text-sm text-muted-foreground">No notes yet.</p>
				) : (
					<ul className="space-y-3">
						{notes.map((note) => (
							<li key={note.id} className="rounded-md border p-3 space-y-2">
								<div className="flex items-start justify-between gap-2">
									<div className="min-w-0">
										<p className="text-sm font-medium truncate">
											{note.userName ?? "Team"}
										</p>
										<p className="text-xs text-muted-foreground">
											{formatNoteDate(note.createdAt)}
											{note.updatedAt &&
											new Date(note.updatedAt).getTime() !==
												new Date(note.createdAt).getTime()
												? " · edited"
												: ""}
										</p>
									</div>
									{canWrite ? (
										<div className="flex shrink-0 gap-1">
											<Button
												type="button"
												variant="ghost"
												size="icon"
												className="h-8 w-8"
												disabled={isBusy}
												onClick={() => {
													setEditingId(note.id);
													setEditContent(note.content);
												}}
											>
												<Pencil className="h-3.5 w-3.5" />
												<span className="sr-only">Edit note</span>
											</Button>
											<Button
												type="button"
												variant="ghost"
												size="icon"
												className="h-8 w-8 text-destructive"
												disabled={isBusy}
												onClick={() => deleteNote.mutate({ id: note.id })}
											>
												<Trash2 className="h-3.5 w-3.5" />
												<span className="sr-only">Delete note</span>
											</Button>
										</div>
									) : null}
								</div>
								{editingId === note.id ? (
									<div className="space-y-2">
										<Textarea
											value={editContent}
											onChange={(e) => setEditContent(e.target.value)}
											rows={3}
											className="resize-none"
											disabled={isBusy}
										/>
										<div className="flex justify-end gap-2">
											<Button
												type="button"
												variant="outline"
												size="sm"
												disabled={isBusy}
												onClick={() => {
													setEditingId(null);
													setEditContent("");
												}}
											>
												Cancel
											</Button>
											<Button
												type="button"
												size="sm"
												disabled={isBusy || !editContent.trim()}
												onClick={() =>
													updateNote.mutate({
														id: note.id,
														content: editContent.trim(),
													})
												}
											>
												Save
											</Button>
										</div>
									</div>
								) : (
									<p className="text-sm whitespace-pre-wrap">{note.content}</p>
								)}
							</li>
						))}
					</ul>
				)}

				{canWrite ? (
					<div className="space-y-2 pt-1">
						<Textarea
							placeholder="Add a note..."
							value={draft}
							onChange={(e) => setDraft(e.target.value)}
							rows={3}
							className="resize-none"
							disabled={isBusy}
						/>
						<div className="flex justify-end">
							<Button
								size="sm"
								disabled={isBusy || !draft.trim()}
								onClick={() =>
									addNote.mutate({
										subscriptionId,
										content: draft.trim(),
									})
								}
							>
								{addNote.isPending ? (
									<>
										<Spinner size={14} className="mr-2" />
										Adding...
									</>
								) : (
									<>
										<Plus className="mr-2 h-4 w-4" />
										Add note
									</>
								)}
							</Button>
						</div>
					</div>
				) : null}
			</div>
		</section>
	);
}
