"use client";

import * as React from "react";
import { ChevronDown } from "lucide-react";

import { cn } from "@/lib/utils";

import { useInspectorAccordion } from "./inspector-accordion";

export function InspectorSection({
	title,
	sectionId,
	defaultOpen = false,
	children,
}: {
	title: string;
	/** Stable id for accordion grouping; defaults to slugified title */
	sectionId?: string;
	defaultOpen?: boolean;
	children: React.ReactNode;
}) {
	const accordion = useInspectorAccordion();
	const id = sectionId ?? title.toLowerCase().replace(/\s+/g, "-");
	const [localOpen, setLocalOpen] = React.useState(defaultOpen);

	const open = accordion ? accordion.openId === id : localOpen;

	const handleToggle = () => {
		if (accordion) {
			accordion.setOpenId(id);
			return;
		}
		setLocalOpen((o) => !o);
	};

	return (
		<div className="border-b last:border-b-0">
			<button
				type="button"
				className="flex w-full items-center justify-between px-4 py-3 text-sm font-semibold hover:bg-muted/40"
				onClick={handleToggle}
				aria-expanded={open}
			>
				{title}
				<ChevronDown
					className={cn("size-4 transition-transform", open && "rotate-180")}
				/>
			</button>
			{open ? <div className="space-y-3 px-4 pb-4">{children}</div> : null}
		</div>
	);
}
