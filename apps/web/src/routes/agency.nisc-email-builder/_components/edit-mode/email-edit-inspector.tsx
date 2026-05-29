"use client";

import * as React from "react";

import { ColorsPanel } from "./panels/colors-panel";
import { ImagePanel } from "./panels/image-panel";
import { LayoutPanel } from "./panels/layout-panel";
import { LinkPanel } from "./panels/link-panel";
import { StylingPanel } from "./panels/styling-panel";
import { TextPanel } from "./panels/text-panel";
import {
	findElementById,
	snapshotElement,
	type NebElementSnapshot,
} from "./html-edit-client";
import { InspectorAccordionProvider } from "./inspector-accordion";

function defaultInspectorSectionId(opts: {
	isImage: boolean;
	showText: boolean;
}): string {
	if (opts.isImage) return "image";
	if (opts.showText) return "text";
	return "layout";
}

type EmailEditInspectorProps = {
	doc: Document | null;
	docRevision?: number;
	selectedId: string | null;
	snapshot: NebElementSnapshot | null;
	onChange: () => void;
};

export function EmailEditInspector({
	doc,
	docRevision = 0,
	selectedId,
	snapshot,
	onChange,
}: EmailEditInspectorProps) {
	const [refresh, setRefresh] = React.useState(0);

	const element = doc && selectedId ? findElementById(doc, selectedId) : null;
	const liveSnapshot =
		element && doc ? snapshotElement(element, doc) : snapshot;

	const bump = () => {
		setRefresh((r) => r + 1);
		onChange();
	};

	if (!element || !liveSnapshot) {
		return (
			<div className="flex flex-col h-full border-l bg-background w-[320px] shrink-0">
				<div className="border-b px-4 py-3">
					<h2 className="text-sm font-semibold">Edit</h2>
				</div>
				<div className="flex-1 flex items-center justify-center p-6 text-center text-sm text-muted-foreground">
					Click any text, image, or button in the email to edit it.
				</div>
			</div>
		);
	}

	void refresh;
	void docRevision;

	const kind = liveSnapshot.kind;
	const isImage = kind === "image" && element.tagName.toLowerCase() === "img";
	const showText = kind === "text" || kind === "button" || kind === "link";
	const showColors = showText || kind === "section";
	const showStyling = showText || isImage;
	const showLink = kind === "link" || kind === "button" || isImage;

	const defaultOpenId = defaultInspectorSectionId({ isImage, showText });

	return (
		<div className="flex flex-col h-full border-l bg-background w-[320px] shrink-0">
			<div className="border-b px-4 py-3">
				<h2 className="text-sm font-semibold">Edit</h2>
			</div>
			<InspectorAccordionProvider
				key={`${selectedId}-${defaultOpenId}`}
				defaultOpenId={defaultOpenId}
			>
				<div className="flex-1 overflow-y-auto">
					{/* Text: Text → Colors → Styling → Add link → Layout */}
					{isImage ? (
						<ImagePanel
							element={element as HTMLImageElement}
							snapshot={liveSnapshot}
							onChange={bump}
						/>
					) : null}
					{showText ? (
						<TextPanel element={element} snapshot={liveSnapshot} onChange={bump} />
					) : null}
					{showColors ? (
						<ColorsPanel element={element} snapshot={liveSnapshot} onChange={bump} />
					) : null}
					{showStyling ? (
						<StylingPanel
							element={element}
							snapshot={liveSnapshot}
							onChange={bump}
							variant={isImage ? "image" : "text"}
						/>
					) : null}
					{showLink ? (
						<LinkPanel element={element} snapshot={liveSnapshot} onChange={bump} />
					) : null}
					<LayoutPanel
						element={element}
						snapshot={liveSnapshot}
						onChange={bump}
						variant={isImage ? "image" : "text"}
					/>
				</div>
			</InspectorAccordionProvider>
		</div>
	);
}
