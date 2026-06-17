"use client";

import * as React from "react";

interface DigitaxPageShellProps {
	title: string;
	description: string;
	action?: React.ReactNode;
	children: React.ReactNode;
}

export function DigitaxPageShell({ title, description, action, children }: DigitaxPageShellProps) {
	return (
		<div className="@container/main flex flex-col gap-4 md:gap-6 px-4 md:px-6 lg:px-8 py-4 md:py-6">
			<div className="w-full max-w-7xl mx-auto">
				<div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
					<div>
						<h1 className="text-base font-semibold tracking-tight">{title}</h1>
						<p className="text-xs text-muted-foreground">{description}</p>
					</div>
					{action}
				</div>
				<div className="mt-6">{children}</div>
			</div>
		</div>
	);
}
