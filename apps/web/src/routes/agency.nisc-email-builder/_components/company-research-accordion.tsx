"use client";

import {
	Accordion,
	AccordionContent,
	AccordionItem,
	AccordionTrigger,
} from "@/components/ui/accordion";
import { AiMarkdownRenderer } from "@/components/ai/ai-markdown-renderer";

type CompanyResearchAccordionProps = {
	content: string;
};

export function CompanyResearchAccordion({ content }: CompanyResearchAccordionProps) {
	return (
		<Accordion type="single" collapsible className="w-full border rounded-md px-3 bg-background">
			<AccordionItem value="research" className="border-0">
				<AccordionTrigger className="text-xs font-medium py-2 hover:no-underline">
					Company research (from web search)
				</AccordionTrigger>
				<AccordionContent>
					<div className="text-xs text-muted-foreground max-h-64 overflow-y-auto pr-1 pb-2">
						<AiMarkdownRenderer content={content} />
					</div>
				</AccordionContent>
			</AccordionItem>
		</Accordion>
	);
}
