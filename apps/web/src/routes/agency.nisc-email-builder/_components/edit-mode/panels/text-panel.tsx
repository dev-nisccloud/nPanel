"use client";

import * as React from "react";
import {
	AlignCenter,
	AlignLeft,
	AlignRight,
	Bold,
	Italic,
	Underline,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

import { EmojiInsertPopover } from "../emoji-insert-popover";
import { InspectorSection } from "../inspector-section";
import {
	applyInlineStyle,
	applyTextContent,
	ensureGoogleFontsLink,
	GOOGLE_EMAIL_FONTS,
	matchGoogleFontId,
	type NebElementSnapshot,
} from "../html-edit-client";
import {
	FontFamilyTrigger,
	FONT_SIZE_OPTIONS,
	IconToggleGroup,
	InspectorControlRow,
	listStyleFromHtml,
	ListStyleToggle,
} from "../inspector-ui";

type TextPanelProps = {
	element: HTMLElement;
	snapshot: NebElementSnapshot;
	onChange: () => void;
};

function appendToElementText(element: HTMLElement, extra: string): void {
	const li = element.querySelector("li");
	if (li) {
		li.textContent = (li.textContent ?? "") + extra;
		return;
	}
	applyTextContent(element, (element.textContent ?? "") + extra);
}

export function TextPanel({ element, snapshot, onChange }: TextPanelProps) {
	const [text, setText] = React.useState(snapshot.textContent.trim());

	React.useEffect(() => {
		setText(snapshot.textContent.trim());
	}, [snapshot.id, snapshot.textContent]);

	const listStyle = listStyleFromHtml(snapshot.innerHTML);
	const fontId = matchGoogleFontId(snapshot.fontFamily);
	const fontLabel = GOOGLE_EMAIL_FONTS.find((f) => f.id === fontId)?.label ?? "Inter";

	const toggleWeight = () => {
		const bold = Number.parseInt(snapshot.fontWeight, 10) >= 600;
		applyInlineStyle(element, { fontWeight: bold ? "400" : "700" });
		onChange();
	};

	const toggleItalic = () => {
		applyInlineStyle(element, {
			fontStyle: snapshot.fontStyle === "italic" ? "normal" : "italic",
		});
		onChange();
	};

	const toggleUnderline = () => {
		applyInlineStyle(element, {
			textDecoration: snapshot.textDecoration.includes("underline")
				? "none"
				: "underline",
		});
		onChange();
	};

	const applyListStyle = (style: "none" | "bullet" | "number") => {
		const content = text.trim() || "Item";
		if (style === "bullet") {
			element.innerHTML = `<ul><li>${content}</li></ul>`;
		} else if (style === "number") {
			element.innerHTML = `<ol><li>${content}</li></ol>`;
		} else {
			applyTextContent(element, content);
		}
		setText(content);
		onChange();
	};

	const insertEmoji = (emoji: string) => {
		appendToElementText(element, emoji);
		setText((prev) => prev + emoji);
		onChange();
	};

	return (
		<InspectorSection title="Text" sectionId="text">
			<div className="space-y-4">
				<div className="space-y-2">
					<Label>Content</Label>
					<Textarea
						rows={4}
						value={text}
						onChange={(e) => setText(e.target.value)}
						onBlur={() => {
							const trimmed = text.trim();
							if (listStyle === "bullet") {
								element.innerHTML = `<ul><li>${trimmed || "Item"}</li></ul>`;
							} else if (listStyle === "number") {
								element.innerHTML = `<ol><li>${trimmed || "Item"}</li></ol>`;
							} else {
								applyTextContent(element, trimmed);
							}
							onChange();
						}}
					/>
				</div>

				<div className="grid grid-cols-2 gap-2">
					<Select
						value={fontId}
						onValueChange={(id) => {
							const font = GOOGLE_EMAIL_FONTS.find((f) => f.id === id);
							if (!font) return;
							ensureGoogleFontsLink(element.ownerDocument);
							applyInlineStyle(element, { fontFamily: font.fontFamily });
							onChange();
						}}
					>
						<SelectTrigger className="h-9">
							<SelectValue>
								<FontFamilyTrigger label={fontLabel} />
							</SelectValue>
						</SelectTrigger>
						<SelectContent>
							{GOOGLE_EMAIL_FONTS.map((f) => (
								<SelectItem key={f.id} value={f.id}>
									<span style={{ fontFamily: f.fontFamily }}>{f.label}</span>
								</SelectItem>
							))}
						</SelectContent>
					</Select>

					<Select
						value={snapshot.fontSize || "16"}
						onValueChange={(size) => {
							applyInlineStyle(element, { fontSize: `${size}px` });
							onChange();
						}}
					>
						<SelectTrigger className="h-9">
							<SelectValue />
						</SelectTrigger>
						<SelectContent>
							{FONT_SIZE_OPTIONS.map((size) => (
								<SelectItem key={size} value={size}>
									{size}px
								</SelectItem>
							))}
						</SelectContent>
					</Select>
				</div>

				<InspectorControlRow label="Formatting">
					<div className="flex gap-0.5 rounded-lg border bg-muted/30 p-0.5">
						<Button
							type="button"
							variant={
								Number.parseInt(snapshot.fontWeight, 10) >= 600
									? "secondary"
									: "ghost"
							}
							size="icon"
							className="size-7 rounded-md"
							onClick={toggleWeight}
						>
							<Bold className="size-3.5" />
						</Button>
						<Button
							type="button"
							variant={snapshot.fontStyle === "italic" ? "secondary" : "ghost"}
							size="icon"
							className="size-7 rounded-md"
							onClick={toggleItalic}
						>
							<Italic className="size-3.5" />
						</Button>
						<Button
							type="button"
							variant={
								snapshot.textDecoration.includes("underline")
									? "secondary"
									: "ghost"
							}
							size="icon"
							className="size-7 rounded-md"
							onClick={toggleUnderline}
						>
							<Underline className="size-3.5" />
						</Button>
					</div>
				</InspectorControlRow>

				<InspectorControlRow label="Alignment">
					<IconToggleGroup
						value={snapshot.textAlign || "left"}
						onValueChange={(v) => {
							applyInlineStyle(element, { textAlign: v });
							onChange();
						}}
						items={[
							{ value: "left", label: "Left", icon: <AlignLeft className="size-4" /> },
							{
								value: "center",
								label: "Center",
								icon: <AlignCenter className="size-4" />,
							},
							{ value: "right", label: "Right", icon: <AlignRight className="size-4" /> },
						]}
					/>
				</InspectorControlRow>

				<InspectorControlRow label="List style">
					<ListStyleToggle value={listStyle} onValueChange={applyListStyle} />
				</InspectorControlRow>

				<EmojiInsertPopover onInsert={insertEmoji} />
			</div>
		</InspectorSection>
	);
}
