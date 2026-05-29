"use client";

import * as React from "react";

type InspectorAccordionContextValue = {
	openId: string | null;
	setOpenId: (id: string) => void;
};

const InspectorAccordionContext =
	React.createContext<InspectorAccordionContextValue | null>(null);

export function InspectorAccordionProvider({
	defaultOpenId,
	children,
}: {
	defaultOpenId: string;
	children: React.ReactNode;
}) {
	const [openId, setOpenId] = React.useState<string | null>(defaultOpenId);

	const setOpenIdExclusive = React.useCallback((id: string) => {
		setOpenId(id);
	}, []);

	return (
		<InspectorAccordionContext.Provider
			value={{ openId, setOpenId: setOpenIdExclusive }}
		>
			{children}
		</InspectorAccordionContext.Provider>
	);
}

export function useInspectorAccordion() {
	return React.useContext(InspectorAccordionContext);
}
