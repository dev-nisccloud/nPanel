"use client";

import { Clock } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
	Tooltip,
	TooltipContent,
	TooltipProvider,
	TooltipTrigger,
} from "@/components/ui/tooltip";

export type DeploymentType = "dedicated" | "vps" | "vds";

interface DeploymentTimeBadgeProps {
	type: DeploymentType;
}

export function DeploymentTimeBadge({ type }: DeploymentTimeBadgeProps) {
	const isDedicated = type === "dedicated";
	const timeText = isDedicated ? "10 Min+" : "7 min +";
	const tooltipText = isDedicated
		? "Instant devices are deployed right away and it usually takes 10 minutes for deployment to finish. In some cases it can take a bit longer."
		: "Virtual devices are deployed right away and it usually takes between 5 and 7 minutes for deployment to finish. In some cases it can take a bit longer.";

	return (
		<TooltipProvider>
			<Tooltip>
				<TooltipTrigger asChild>
					<Badge
						variant="outline"
						className="flex items-center gap-1.5 cursor-help bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300 border-blue-200 dark:border-blue-800 font-medium"
					>
						<Clock className="h-3 w-3" />
						{timeText}
					</Badge>
				</TooltipTrigger>
				<TooltipContent className="max-w-[250px] text-xs">
					{tooltipText}
				</TooltipContent>
			</Tooltip>
		</TooltipProvider>
	);
}
