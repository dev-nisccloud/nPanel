"use client";

import { InspectorSection } from "../inspector-section";
import { ColorFieldPair } from "../inspector-ui";
import { applyInlineStyle, type NebElementSnapshot } from "../html-edit-client";

type ColorsPanelProps = {
	element: HTMLElement;
	snapshot: NebElementSnapshot;
	onChange: () => void;
};

export function ColorsPanel({ element, snapshot, onChange }: ColorsPanelProps) {
	return (
		<InspectorSection title="Colors" sectionId="colors">
			<ColorFieldPair
				textColor={snapshot.color}
				backgroundColor={snapshot.backgroundColor}
				onTextChange={(hex) => {
					applyInlineStyle(element, { color: hex });
					onChange();
				}}
				onBackgroundChange={(hex) => {
					applyInlineStyle(element, { backgroundColor: hex });
					onChange();
				}}
			/>
		</InspectorSection>
	);
}
