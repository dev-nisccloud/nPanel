"use client";



import * as React from "react";



import { cn } from "@/lib/utils";



import {

	ensureGoogleFontsLink,

	injectEditIds,

	injectEditorStyles,

	setSelection,

	snapshotElement,

	type NebElementSnapshot,

} from "./html-edit-client";



/** Scrollbar hidden in iframe; outer panel scrolls. */

export function buildNoScrollSrcDoc(html: string): string {

	return html.replace(

		/<head([^>]*)>/i,

		`<head$1><style>html,body{overflow:hidden !important;scrollbar-width:none !important;}::-webkit-scrollbar{display:none !important;}</style>`,

	);

}



type EmailEditCanvasProps = {

	html: string;

	width: number;

	iframeDocRef: React.MutableRefObject<Document | null>;

	selectedId: string | null;

	onSelect: (id: string | null, snapshot: NebElementSnapshot | null) => void;

	/** Bump to force iframe remount when undo/redo applies new html */

	remountKey: number;

};



export function EmailEditCanvas({

	html,

	width,

	iframeDocRef,

	selectedId,

	onSelect,

	remountKey,

}: EmailEditCanvasProps) {

	const iframeRef = React.useRef<HTMLIFrameElement>(null);

	const [height, setHeight] = React.useState(800);

	const htmlAtMountRef = React.useRef(html);

	htmlAtMountRef.current = html;



	const selectedIdRef = React.useRef(selectedId);

	selectedIdRef.current = selectedId;

	const onSelectRef = React.useRef(onSelect);

	onSelectRef.current = onSelect;



	/** srcDoc only when remountKey changes - not on every draftHtml edit (DOM is source of truth). */

	const [srcDoc, setSrcDoc] = React.useState(() =>

		buildNoScrollSrcDoc(html),

	);



	React.useEffect(() => {

		setSrcDoc(buildNoScrollSrcDoc(htmlAtMountRef.current));

	}, [remountKey]);



	const measure = React.useCallback(() => {

		const doc = iframeRef.current?.contentDocument;

		if (!doc) return;

		const h = Math.max(

			doc.documentElement?.scrollHeight ?? 0,

			doc.body?.scrollHeight ?? 0,

			400,

		);

		setHeight(h);

	}, []);



	const cleanupRef = React.useRef<(() => void) | undefined>(undefined);



	const setupDoc = React.useCallback(() => {

		cleanupRef.current?.();

		const doc = iframeRef.current?.contentDocument;

		if (!doc) return;

		iframeDocRef.current = doc;

		ensureGoogleFontsLink(doc);

		injectEditorStyles(doc);

		injectEditIds(doc);

		setSelection(doc, selectedIdRef.current);

		measure();



		const onClick = (e: MouseEvent) => {

			const target = (e.target as HTMLElement | null)?.closest<HTMLElement>(

				"[data-neb-id]",

			);

			if (!target) {

				setSelection(doc, null);

				onSelectRef.current(null, null);

				return;

			}

			e.preventDefault();

			e.stopPropagation();

			const id = target.getAttribute("data-neb-id");

			setSelection(doc, id);

			onSelectRef.current(id, snapshotElement(target, doc));

		};



		const onHover = (e: MouseEvent) => {

			for (const el of doc.querySelectorAll<HTMLElement>(".neb-editable-hover")) {

				el.classList.remove("neb-editable-hover");

			}

			const target = (e.target as HTMLElement | null)?.closest<HTMLElement>(

				"[data-neb-id]",

			);

			if (target && !target.classList.contains("neb-selected")) {

				target.classList.add("neb-editable-hover");

			}

		};



		doc.body.addEventListener("click", onClick);

		doc.body.addEventListener("mouseover", onHover);



		const ro =

			typeof ResizeObserver !== "undefined"

				? new ResizeObserver(() => measure())

				: null;

		ro?.observe(doc.body);



		cleanupRef.current = () => {

			doc.body.removeEventListener("click", onClick);

			doc.body.removeEventListener("mouseover", onHover);

			ro?.disconnect();

		};

	}, [iframeDocRef, measure]);



	React.useEffect(() => () => cleanupRef.current?.(), []);



	React.useEffect(() => {

		const doc = iframeDocRef.current;

		if (doc) setSelection(doc, selectedId);

	}, [selectedId, iframeDocRef]);



	return (

		<iframe

			key={remountKey}

			ref={iframeRef}

			title="Email edit canvas"

			srcDoc={srcDoc}

			onLoad={() => {

				setupDoc();

			}}

			style={{ height: `${height}px`, width: `${width}px` }}

			className={cn("bg-white border shadow-sm rounded-sm block shrink-0")}

			sandbox="allow-same-origin"

		/>

	);

}


