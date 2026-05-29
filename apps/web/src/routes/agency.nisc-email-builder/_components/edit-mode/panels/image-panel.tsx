"use client";

import * as React from "react";
import { ImageIcon, Images } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import { ImageLibraryDialog } from "../image-library-dialog";
import { InspectorSection } from "../inspector-section";
import type { NebElementSnapshot } from "../html-edit-client";

type ImagePanelProps = {
	element: HTMLImageElement;
	snapshot: NebElementSnapshot;
	onChange: () => void;
};

export function ImagePanel({ element, snapshot, onChange }: ImagePanelProps) {
	const [libraryOpen, setLibraryOpen] = React.useState(false);

	const applyImage = (url: string) => {
		element.setAttribute("src", url);
		onChange();
		toast.success("Image updated");
	};

	return (
		<>
			<InspectorSection title="Image" sectionId="image">
				<div className="relative rounded-lg border overflow-hidden bg-muted/30">
					{snapshot.src ? (
						<img
							src={snapshot.src}
							alt={snapshot.alt || "Preview"}
							className="w-full h-36 object-cover"
						/>
					) : (
						<div className="h-36 flex items-center justify-center text-muted-foreground">
							<ImageIcon className="size-8 opacity-40" />
						</div>
					)}
					<Button
						type="button"
						size="sm"
						variant="secondary"
						className="absolute bottom-2 right-2 gap-1.5 h-8 shadow-sm"
						onClick={() => setLibraryOpen(true)}
					>
						<Images className="size-3.5" />
						Change image
					</Button>
				</div>
				<div className="space-y-1.5">
					<Label className="text-xs text-muted-foreground">Alt text</Label>
					<Input
						className="h-9"
						value={snapshot.alt}
						onChange={(e) => {
							element.setAttribute("alt", e.target.value);
							onChange();
						}}
					/>
				</div>
			</InspectorSection>

			<ImageLibraryDialog
				open={libraryOpen}
				onOpenChange={setLibraryOpen}
				currentSrc={snapshot.src}
				onSelect={applyImage}
			/>
		</>
	);
}
