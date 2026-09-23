import {
	CalendarClock,
	FileText,
	Globe,
	ImageIcon,
	Search,
	Server,
	type LucideIcon,
} from "lucide-react";

export type ZeepoAiCapabilityShortcut = {
	id: string;
	label: string;
	starter: string;
	icon: LucideIcon;
	enableSearch?: boolean;
	compactHide?: boolean;
};

/** Dashboard + chat sample prompts. Cover Zeepo tools and Nisc Cloud services. */
export const ZEEPO_AI_CAPABILITY_SHORTCUTS: readonly ZeepoAiCapabilityShortcut[] = [
	{
		id: "domain",
		label: "Is mybrand.co.ke available?",
		starter:
			"Check if mybrand.co.ke is available and suggest strong .ke and .com alternatives I can register with Nisc Cloud.",
		icon: Globe,
	},
	{
		id: "hosting",
		label: "Best hosting for WordPress?",
		starter:
			"Recommend a Nisc Cloud hosting or WordPress plan for a small business website that needs SSL, backups, and business email.",
		icon: Server,
	},
	{
		id: "renewals",
		label: "What expires in 30 days?",
		starter:
			"Review my domains and hosting and tell me what expires or needs attention in the next 30 days.",
		icon: CalendarClock,
	},
	{
		id: "image",
		label: "Create a product launch image",
		starter:
			"Create a clean, professional social image for a Kenyan brand launching a new product. Leave space for a short headline.",
		icon: ImageIcon,
	},
	{
		id: "document",
		label: "Draft a hosting proposal",
		starter:
			"Write a short proposal covering domain registration, hosting, and business email from Nisc Cloud.",
		icon: FileText,
		compactHide: true,
	},
	{
		id: "search",
		label: "Typical ad costs in Kenya?",
		starter:
			"Search the web for typical digital advertising and website costs for small businesses in Kenya this year.",
		icon: Search,
		enableSearch: true,
		compactHide: true,
	},
];
