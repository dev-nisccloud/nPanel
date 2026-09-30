"use client";

import {
	CalendarClock,
	FileText,
	Globe,
	ImageIcon,
	LifeBuoy,
	Mail,
	Megaphone,
	Receipt,
	Search,
	Server,
	type LucideIcon,
} from "lucide-react";

import { ZEEPO_AI_CAPABILITY_SHORTCUTS } from "@/components/zeepo/zeepo-ai-capabilities";
import { trpc } from "@/utils/trpc";

const ICONS = {
	globe: Globe,
	server: Server,
	calendar: CalendarClock,
	image: ImageIcon,
	document: FileText,
	search: Search,
	mail: Mail,
	invoice: Receipt,
	support: LifeBuoy,
	marketing: Megaphone,
} as const;

export type ZeepoHomeSuggestionItem = {
	id: string;
	label: string;
	starter: string;
	icon: LucideIcon;
	enableSearch?: boolean;
	compactHide?: boolean;
};

function staticItems(): ZeepoHomeSuggestionItem[] {
	return ZEEPO_AI_CAPABILITY_SHORTCUTS.map((item) => ({
		id: item.id,
		label: item.label,
		starter: item.starter,
		icon: item.icon,
		enableSearch: item.enableSearch,
		compactHide: item.compactHide,
	}));
}

/**
 * Customer home suggestions for the active team.
 * The query does not gate the composer: callers keep the text field usable and
 * show skeletons while `isLoading` is true.
 */
export function useZeepoAiHomeSuggestions(teamId: string | null, personalized: boolean) {
	const query = trpc.zeepoAi.suggestions.list.useQuery(
		{ teamId: teamId ?? "" },
		{
			enabled: personalized && Boolean(teamId),
			staleTime: 2 * 60_000,
			refetchOnWindowFocus: false,
			retry: 0,
		},
	);

	if (!personalized) {
		return { items: staticItems(), isLoading: false };
	}

	if (!teamId || query.isLoading) {
		return { items: null, isLoading: true };
	}

	if (query.isError || !query.data?.suggestions.length) {
		return { items: staticItems(), isLoading: false };
	}

	return {
		items: query.data.suggestions.map((item, index) => ({
			id: item.id,
			label: item.label,
			starter: item.starter,
			icon: ICONS[item.icon] ?? Globe,
			enableSearch: item.enableSearch,
			compactHide: index >= 4,
		})),
		isLoading: false,
	};
}
