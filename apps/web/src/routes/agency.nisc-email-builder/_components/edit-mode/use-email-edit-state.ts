"use client";

import * as React from "react";

import { serializeDocumentHtml } from "./html-edit-client";

const MAX_UNDO = 40;

export function useEmailEditState(initialHtml: string) {
	const [draftHtml, setDraftHtml] = React.useState(initialHtml);
	const [dirty, setDirty] = React.useState(false);
	const [undoStack, setUndoStack] = React.useState<string[]>([]);
	const [redoStack, setRedoStack] = React.useState<string[]>([]);
	const iframeDocRef = React.useRef<Document | null>(null);
	const lastSerializedRef = React.useRef(initialHtml);
	const dirtyRef = React.useRef(false);
	dirtyRef.current = dirty;

	React.useEffect(() => {
		// Do not overwrite in-progress edits when the parent refetches design data.
		if (dirtyRef.current) return;
		setDraftHtml(initialHtml);
		lastSerializedRef.current = initialHtml;
		setDirty(false);
		setUndoStack([]);
		setRedoStack([]);
	}, [initialHtml]);

	const pushUndo = React.useCallback((snapshot: string) => {
		setUndoStack((prev) => [...prev.slice(-(MAX_UNDO - 1)), snapshot]);
		setRedoStack([]);
		setDirty(true);
	}, []);

	const captureFromIframe = React.useCallback(() => {
		const doc = iframeDocRef.current;
		if (!doc) return null;
		return serializeDocumentHtml(doc);
	}, []);

	const applySnapshotToDraft = React.useCallback((html: string) => {
		setDraftHtml(html);
	}, []);

	const undo = React.useCallback(() => {
		if (undoStack.length === 0) return;
		const current = captureFromIframe() ?? draftHtml;
		const previous = undoStack[undoStack.length - 1]!;
		setRedoStack((r) => [...r, current]);
		setUndoStack((prev) => prev.slice(0, -1));
		lastSerializedRef.current = previous;
		setDraftHtml(previous);
		setDirty(true);
	}, [captureFromIframe, draftHtml, undoStack]);

	const redo = React.useCallback(() => {
		if (redoStack.length === 0) return;
		const current = captureFromIframe() ?? lastSerializedRef.current;
		const upcoming = redoStack[redoStack.length - 1]!;
		setUndoStack((u) => [...u, current]);
		setRedoStack((prev) => prev.slice(0, -1));
		setDraftHtml(upcoming);
		lastSerializedRef.current = upcoming;
		setDirty(true);
	}, [captureFromIframe, redoStack]);

	/** Sync iframe DOM → draft state; returns serialized HTML when it changed. */
	const recordChange = React.useCallback((): string | null => {
		const next = captureFromIframe();
		if (!next || next === lastSerializedRef.current) return null;
		pushUndo(lastSerializedRef.current);
		lastSerializedRef.current = next;
		setDraftHtml(next);
		return next;
	}, [captureFromIframe, pushUndo]);

	const markSaved = React.useCallback((html: string) => {
		setDraftHtml(html);
		lastSerializedRef.current = html;
		setDirty(false);
		setUndoStack([]);
		setRedoStack([]);
	}, []);

	const canUndo = undoStack.length > 0;
	const canRedo = redoStack.length > 0;

	return {
		draftHtml,
		dirty,
		canUndo,
		canRedo,
		iframeDocRef,
		lastSerializedRef,
		applySnapshotToDraft,
		captureFromIframe,
		recordChange,
		pushUndo,
		undo,
		redo,
		markSaved,
	};
}
