import { FileText, Globe, ImageIcon, Search, Server, type LucideIcon } from "lucide-react";

export type ZeepoAiCapabilityShortcut = {
	id: string;
	label: string;
	starter: string;
	icon: LucideIcon;
	enableSearch?: boolean;
	compactHide?: boolean;
};

/** Landing + dashboard chips. Keep in sync with what Zeepo AI actually does. */
export const ZEEPO_AI_CAPABILITY_SHORTCUTS: readonly ZeepoAiCapabilityShortcut[] = [
	{
		id: "image",
		label: "Create an image",
		starter: "Create an image of ",
		icon: ImageIcon,
	},
	{
		id: "document",
		label: "Write a document",
		starter: "Write a document about ",
		icon: FileText,
	},
	{
		id: "domain",
		label: "Check a domain",
		starter: "Check domain availability for ",
		icon: Globe,
	},
	{
		id: "search",
		label: "Search the web",
		starter: "Search the web for ",
		icon: Search,
		enableSearch: true,
		compactHide: true,
	},
	{
		id: "hosting",
		label: "Find hosting",
		starter: "Help me find a hosting plan for ",
		icon: Server,
		compactHide: true,
	},
];
