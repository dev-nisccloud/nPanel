"use client";

import * as React from "react";
import debounce from "lodash.debounce";
import { Cloud, CloudOff, Redo2, Save, Undo2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { NebSpinner } from "../neb-loading";
import { cn } from "@/lib/utils";
import { trpc } from "@/utils/trpc";

import { stripEditorArtifactsFromHtml } from "@npanel/api/lib/nisc-email-builder/html-sanitize-for-save";
import { useSaveNebHtmlContent } from "../../_api/use-save-neb-html-content";

import { EmailEditCanvas } from "./email-edit-canvas";
import { EmailEditInspector } from "./email-edit-inspector";
import type { NebElementSnapshot } from "./html-edit-client";
import { useEmailEditState } from "./use-email-edit-state";

function htmlForSaveCompare(html: string): string {
	return stripEditorArtifactsFromHtml(html);
}

const AUTOSAVE_MS = 2500;

type SaveStatus = "idle" | "saving" | "saved" | "error";

type EmailEditViewProps = {
	designId: string;
	htmlContent: string;
	previewWidth: "desktop" | "mobile";
	onSaved?: () => void;
	onDirtyChange?: (dirty: boolean) => void;
	/** Latest serialized HTML for preview tab and export while editing */
	onDraftHtmlChange?: (html: string) => void;
};

export function EmailEditView({
	designId,
	htmlContent,
	previewWidth,
	onSaved,
	onDirtyChange,
	onDraftHtmlChange,
}: EmailEditViewProps) {
	const utils = trpc.useUtils();
	const {
		draftHtml,
		dirty,
		canUndo,
		canRedo,
		iframeDocRef,
		lastSerializedRef,
		applySnapshotToDraft,
		captureFromIframe,
		recordChange,
		undo,
		redo,
		markSaved,
	} = useEmailEditState(htmlContent);

	const [selectedId, setSelectedId] = React.useState<string | null>(null);
	const [snapshot, setSnapshot] = React.useState<NebElementSnapshot | null>(null);
	const [remountKey, setRemountKey] = React.useState(0);
	const [docRevision, setDocRevision] = React.useState(0);
	const [saveStatus, setSaveStatus] = React.useState<SaveStatus>("idle");
	const pendingHtmlRef = React.useRef<string | null>(null);
	const isSavingRef = React.useRef(false);
	/** Normalized HTML last known to match the server (post-save processed copy). */
	const lastPersistedRef = React.useRef(htmlForSaveCompare(htmlContent));
	const lastServerHtmlRef = React.useRef(htmlContent);

	React.useEffect(() => {
		if (dirty) return;
		if (htmlContent === lastServerHtmlRef.current) return;
		lastServerHtmlRef.current = htmlContent;
		lastPersistedRef.current = htmlForSaveCompare(htmlContent);
		lastSerializedRef.current = htmlContent;
		setRemountKey((k) => k + 1);
		setSelectedId(null);
		setSnapshot(null);
	}, [htmlContent, dirty, lastSerializedRef]);

	const handleSelect = React.useCallback(
		(id: string | null, snap: NebElementSnapshot | null) => {
			setSelectedId(id);
			setSnapshot(snap);
			setDocRevision((n) => n + 1);
		},
		[],
	);

	React.useEffect(() => {
		onDirtyChange?.(dirty);
	}, [dirty, onDirtyChange]);

	React.useEffect(() => {
		if (!dirty) return;
		const onBeforeUnload = (e: BeforeUnloadEvent) => {
			e.preventDefault();
		};
		window.addEventListener("beforeunload", onBeforeUnload);
		return () => window.removeEventListener("beforeunload", onBeforeUnload);
	}, [dirty]);

	const saveManualMutation = trpc.niscEmailBuilder.design.saveHtml.useMutation();
	const saveAutoMutation = useSaveNebHtmlContent();

	const scheduleAutoSaveRef = React.useRef<(html: string) => void>(() => {});

	const flushSave = React.useCallback(
		async (html: string, inPlace: boolean) => {
			const normalized = htmlForSaveCompare(html);
			if (inPlace && normalized === lastPersistedRef.current) {
				return;
			}
			if (isSavingRef.current) {
				pendingHtmlRef.current = html;
				return;
			}
			isSavingRef.current = true;
			setSaveStatus("saving");
			pendingHtmlRef.current = null;
			try {
				if (inPlace) {
					// Auto-save: Use immediate persistence (network resilient)
					const data = await saveAutoMutation.mutateAsync({
						designId,
						html,
					});
					lastPersistedRef.current = htmlForSaveCompare(html);
					const currentCapture = captureFromIframe();
					if (currentCapture) {
						lastSerializedRef.current = currentCapture;
					}
					setSaveStatus("saved");
				} else {
					// Manual save: Use full validation and versioning
					const data = await saveManualMutation.mutateAsync({
						designId,
						html,
						inPlace: false,
						changeSummary: "Manual visual edits",
					});
					const persisted = data.htmlContent ?? html;
					lastPersistedRef.current = htmlForSaveCompare(persisted);
					const currentCapture = captureFromIframe();
					if (currentCapture) {
						lastSerializedRef.current = currentCapture;
					}

					utils.niscEmailBuilder.design.get.setData({ designId }, (prev) =>
						prev
							? {
									...prev,
									htmlContent: persisted,
								}
							: prev,
					);

					setSaveStatus("saved");
					applySnapshotToDraft(persisted);
					markSaved(persisted);
					setRemountKey((k) => k + 1);
					toast.success("New version saved");
					if (data.warnings?.length) {
						toast.message("Saved with warnings", {
							description: data.warnings.join(" "),
						});
					}
					onSaved?.();
				}
			} catch (e) {
				setSaveStatus("error");
				toast.error(e instanceof Error ? e.message : "Save failed");
			} finally {
				isSavingRef.current = false;
				const pending = pendingHtmlRef.current;
				pendingHtmlRef.current = null;
				if (pending && htmlForSaveCompare(pending) !== lastPersistedRef.current) {
					void flushSave(pending, true);
				}
			}
		},
		[
			designId,
			saveManualMutation,
			saveAutoMutation,
			utils,
			applySnapshotToDraft,
			markSaved,
			onSaved,
			captureFromIframe,
			lastSerializedRef,
		],
	);

	const flushSaveRef = React.useRef(flushSave);
	flushSaveRef.current = flushSave;

	const debouncedAutoSave = React.useMemo(
		() =>
			debounce((html: string) => {
				if (htmlForSaveCompare(html) === lastPersistedRef.current) return;
				void flushSaveRef.current(html, true);
			}, AUTOSAVE_MS),
		[],
	);

	scheduleAutoSaveRef.current = (html: string) => {
		if (htmlForSaveCompare(html) === lastPersistedRef.current) return;
		debouncedAutoSave(html);
	};

	React.useEffect(() => () => debouncedAutoSave.cancel(), [debouncedAutoSave]);

	// Flush once on unmount / tab close - stable effect (no save spam on re-renders).
	React.useEffect(() => {
		const onBeforeUnload = () => {
			debouncedAutoSave.cancel();
			const html = captureFromIframe();
			if (!html || htmlForSaveCompare(html) === lastPersistedRef.current) return;
			pendingHtmlRef.current = html;
			if (!isSavingRef.current) {
				void flushSaveRef.current(html, true);
			}
		};
		window.addEventListener("beforeunload", onBeforeUnload);
		return () => {
			window.removeEventListener("beforeunload", onBeforeUnload);
			debouncedAutoSave.cancel();
			const html = captureFromIframe();
			if (!html || htmlForSaveCompare(html) === lastPersistedRef.current) return;
			void flushSaveRef.current(html, true);
		};
		// eslint-disable-next-line react-hooks/exhaustive-deps -- mount/unmount only
	}, []);

	const handleEditorChange = React.useCallback(() => {
		const html = recordChange();
		if (!html) return;
		onDraftHtmlChange?.(html);
		setDocRevision((n) => n + 1);
		scheduleAutoSaveRef.current(html);
	}, [recordChange, onDraftHtmlChange]);

	const width = previewWidth === "desktop" ? 640 : 375;

	const handleSave = () => {
		debouncedAutoSave.cancel();
		// Let blur handlers on dimension inputs apply before we serialize.
		requestAnimationFrame(() => {
			const html = captureFromIframe() ?? draftHtml;
			void flushSave(html, false);
		});
	};

	const handleUndo = () => {
		debouncedAutoSave.cancel();
		undo();
		setRemountKey((k) => k + 1);
		setSelectedId(null);
		setSnapshot(null);
		const html = lastSerializedRef.current;
		onDraftHtmlChange?.(html);
		scheduleAutoSaveRef.current(html);
	};

	const handleRedo = () => {
		debouncedAutoSave.cancel();
		redo();
		setRemountKey((k) => k + 1);
		setSelectedId(null);
		setSnapshot(null);
		const html = lastSerializedRef.current;
		onDraftHtmlChange?.(html);
		scheduleAutoSaveRef.current(html);
	};

	return (
		<div className="flex min-h-0 flex-1 min-w-0 overflow-hidden">
			<div className="flex min-h-0 flex-1 flex-col items-center overflow-y-auto overscroll-contain bg-zinc-100 px-4 py-6 dark:bg-zinc-900">
				<EmailEditCanvas
					html={draftHtml}
					width={width}
					iframeDocRef={iframeDocRef}
					selectedId={selectedId}
					onSelect={handleSelect}
					remountKey={remountKey}
				/>
			</div>

			<div className="flex h-full min-h-0 w-[320px] shrink-0 flex-col overflow-hidden border-l bg-background">
				<div className="flex min-h-0 flex-1 flex-col overflow-hidden">
					<EmailEditInspector
						doc={iframeDocRef.current}
						docRevision={docRevision}
						selectedId={selectedId}
						snapshot={snapshot}
						onChange={handleEditorChange}
					/>
				</div>
				<div className="shrink-0 border-t px-3 py-3 flex flex-col gap-2">
					<div className="flex items-center gap-1.5 text-xs text-muted-foreground min-h-4">
						{saveStatus === "saving" ? (
							<>
								<NebSpinner context="inline" size={12} />
								<span>Saving…</span>
							</>
						) : saveStatus === "saved" ? (
							<>
								<Cloud className="size-3.5 text-emerald-600" />
								<span className="text-emerald-600">Saved to cloud</span>
							</>
						) : saveStatus === "error" ? (
							<>
								<CloudOff className="size-3.5 text-destructive" />
								<span className="text-destructive">Save failed - retry with Save</span>
							</>
						) : dirty ? (
							<span>Editing…</span>
						) : (
							<span>All changes saved</span>
						)}
					</div>
					<div className="flex items-center gap-2">
						<Button
							type="button"
							variant="outline"
							size="icon"
							className="size-9 rounded-full shrink-0"
							disabled={!canUndo}
							onClick={handleUndo}
							title="Undo"
						>
							<Undo2 className="size-4" />
						</Button>
						<Button
							type="button"
							variant="outline"
							size="icon"
							className="size-9 rounded-full shrink-0"
							disabled={!canRedo}
							onClick={handleRedo}
							title="Redo"
						>
							<Redo2 className="size-4" />
						</Button>
						<Button
							type="button"
							className={cn("flex-1 h-10 rounded-lg font-semibold gap-2")}
							disabled={!dirty || saveManualMutation.isPending}
							onClick={handleSave}
						>
							{saveManualMutation.isPending ? (
								<NebSpinner context="button" size={14} />
							) : (
								<Save className="size-4" />
							)}
							Save version
						</Button>
					</div>
				</div>
			</div>
		</div>
	);
}
