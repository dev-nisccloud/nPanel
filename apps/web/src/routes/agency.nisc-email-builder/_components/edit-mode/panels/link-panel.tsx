"use client";

import * as React from "react";

import { Input } from "@/components/ui/input";

import { InspectorSection } from "../inspector-section";
import type { NebElementSnapshot } from "../html-edit-client";

type LinkPanelProps = {
	element: HTMLElement;
	snapshot: NebElementSnapshot;
	onChange: () => void;
};

export function LinkPanel({ element, snapshot, onChange }: LinkPanelProps) {
	const [href, setHref] = React.useState(snapshot.href);

	React.useEffect(() => {
		setHref(snapshot.href);
	}, [snapshot.id, snapshot.href]);

	const linkEl =
		element.tagName.toLowerCase() === "a"
			? element
			: (element.closest("a") as HTMLAnchorElement | null);

	return (
		<InspectorSection title="Add link" sectionId="link">
			<Input
				placeholder="Enter a link"
				className="h-9"
				value={href}
				onChange={(e) => setHref(e.target.value)}
				onBlur={() => {
					if (linkEl) {
						if (href.trim()) linkEl.setAttribute("href", href.trim());
						else linkEl.removeAttribute("href");
					} else if (href.trim() && element.tagName.toLowerCase() === "img") {
						const doc = element.ownerDocument;
						const wrapper = doc.createElement("a");
						wrapper.setAttribute("href", href.trim());
						element.parentNode?.insertBefore(wrapper, element);
						wrapper.appendChild(element);
					}
					onChange();
				}}
			/>
		</InspectorSection>
	);
}
