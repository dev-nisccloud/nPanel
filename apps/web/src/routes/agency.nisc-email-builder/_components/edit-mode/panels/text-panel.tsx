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
	SelectGroup,
	SelectItem,
	SelectLabel,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

import { EmojiInsertPopover } from "../emoji-insert-popover";
import { InspectorSection } from "../inspector-section";
import {
	FONT_WEIGHT_OPTIONS,
	GOOGLE_EMAIL_FONTS,
	GOOGLE_EMAIL_FONTS_BY_CATEGORY,
	normalizeFontWeight,
} from "../email-fonts";
import {
	applyInlineStyle,
	applyTextContent,
	ensureGoogleFontsLink,
	matchGoogleFontId,
	type NebElementSnapshot,
} from "../html-edit-client";
import { FontFamilyPreview, useInspectorGoogleFonts } from "../font-picker-preview";
import {
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
	useInspectorGoogleFonts();

	const [text, setText] = React.useState(snapshot.textContent.trim());

	React.useEffect(() => {
		setText(snapshot.textContent.trim());
	}, [snapshot.id, snapshot.textContent]);

	const listStyle = listStyleFromHtml(snapshot.innerHTML);
	const fontId = matchGoogleFontId(snapshot.fontFamily);
	const selectedFont =
		GOOGLE_EMAIL_FONTS.find((f) => f.id === fontId) ?? GOOGLE_EMAIL_FONTS[0]!;
	const fontWeight = normalizeFontWeight(snapshot.fontWeight);

	const toggleWeight = () => {
		const bold = Number.parseInt(fontWeight, 10) >= 600;
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
			<div className="space-y-4 min-w-0">
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

				<div className="grid grid-cols-[minmax(0,1fr)_5.5rem] gap-2 min-w-0">
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
						<SelectTrigger className="h-10 w-full min-w-0 max-w-full items-center">
							<SelectValue className="min-w-0">
								<FontFamilyPreview font={selectedFont} variant="trigger" />
							</SelectValue>
						</SelectTrigger>
						<SelectContent
							className="max-h-[min(360px,70vh)] w-[min(280px,calc(100vw-2rem))]"
							position="popper"
						>
							{GOOGLE_EMAIL_FONTS_BY_CATEGORY.map((group) => (
								<SelectGroup key={group.category}>
									<SelectLabel className="font-sans text-[11px] uppercase tracking-wide">
										{group.label}
									</SelectLabel>
									{group.fonts.map((f) => (
										<SelectItem
											key={f.id}
											value={f.id}
											className="py-2 pl-2 pr-8"
										>
											<FontFamilyPreview font={f} variant="item" />
										</SelectItem>
									))}
								</SelectGroup>
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
						<SelectTrigger className="h-9 w-full min-w-0 shrink-0">
							<SelectValue />
						</SelectTrigger>
						<SelectContent className="max-h-[min(280px,60vh)]">
							{FONT_SIZE_OPTIONS.map((size) => (
								<SelectItem key={size} value={size}>
									{size}px
								</SelectItem>
							))}
						</SelectContent>
					</Select>
				</div>

				<InspectorControlRow label="Font weight">
					<Select
						value={fontWeight}
						onValueChange={(w) => {
							applyInlineStyle(element, { fontWeight: w });
							onChange();
						}}
					>
						<SelectTrigger className="h-9 w-[11rem] min-w-0">
							<SelectValue />
						</SelectTrigger>
						<SelectContent>
							{FONT_WEIGHT_OPTIONS.map((opt) => (
								<SelectItem key={opt.value} value={opt.value}>
									{opt.label} ({opt.value})
								</SelectItem>
							))}
						</SelectContent>
					</Select>
				</InspectorControlRow>

				<InspectorControlRow label="Formatting">
					<div className="flex gap-0.5 rounded-lg border bg-muted/30 p-0.5">
						<Button
							type="button"
							variant={
								Number.parseInt(fontWeight, 10) >= 600 ? "secondary" : "ghost"
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
