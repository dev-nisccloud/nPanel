"use client";

import * as React from "react";
import { Link } from "react-router";
import {
	CheckCircle2,
	Circle,
	Globe,
	Users,
	Sparkles,
	Send,
	ChevronRight,
	X,
	Info,
	ArrowRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { trpc } from "@/utils/trpc";
import { useNiscEmailMarketingRoute } from "./nisc-email-marketing-route-context";
import { cn } from "@/lib/utils";

type OnboardingStep = "domains" | "audiences" | "builder" | "campaign";

interface StepConfig {
	id: OnboardingStep;
	title: string;
	description: string;
	icon: React.ElementType;
	ctaText: string;
	href: string;
	completed: boolean;
	count?: number;
}

const ONBOARDING_STORAGE_KEY = "nisc-em-onboarding-dismissed";

export function NiscEmailMarketingOnboarding() {
	const route = useNiscEmailMarketingRoute();
	const [dismissed, setDismissed] = React.useState(false);
	const [expandedStep, setExpandedStep] = React.useState<OnboardingStep | null>(null);

	// Load dismissal state from localStorage
	React.useEffect(() => {
		try {
			const stored = localStorage.getItem(ONBOARDING_STORAGE_KEY);
			if (stored === "true") {
				setDismissed(true);
			}
		} catch {
			// Ignore localStorage errors
		}
	}, []);

	// Fetch current progress
	const { data: domainsData } = trpc.niscEmailMarketing.domains.list.useQuery(
		route.isCustomer && route.teamId ? { teamId: route.teamId, limit: 100, offset: 0 } : { limit: 100, offset: 0 },
		{ enabled: route.isCustomer ? !!route.teamId : true },
	);

	const { data: audiencesData } = trpc.niscEmailMarketing.audiences.list.useQuery(
		route.isCustomer && route.teamId ? { teamId: route.teamId } : {},
		{ enabled: route.isCustomer ? !!route.teamId : true },
	);

	const { data: campaignsData } = trpc.niscEmailMarketing.campaigns.list.useQuery(
		route.isCustomer && route.teamId ? { teamId: route.teamId } : {},
		{ enabled: route.isCustomer ? !!route.teamId : true },
	);

	const { data: emailDesignsData } = trpc.niscEmailBuilder.design.list.useQuery(
		route.isCustomer && route.teamId ? { teamId: route.teamId } : {},
		{ enabled: route.isCustomer ? !!route.teamId : true },
	);

	const verifiedDomains = domainsData?.domains?.filter((d) => d.status === "VERIFIED") ?? [];
	const audiencesCount = audiencesData?.audiences?.length ?? 0;
	const campaignsCount = campaignsData?.campaigns?.length ?? 0;
	const emailDesignsCount = emailDesignsData?.designs?.length ?? 0;

	const steps: StepConfig[] = [
		{
			id: "domains",
			title: "Connect Your Domain",
			description:
				"Add and verify a domain to send emails. This ensures your emails reach inboxes and not spam folders.",
			icon: Globe,
			ctaText: verifiedDomains.length > 0 ? "Manage Domains" : "Add Your First Domain",
			href: `${route.basePath}/domain-configuration`,
			completed: verifiedDomains.length > 0,
			count: verifiedDomains.length,
		},
		{
			id: "audiences",
			title: "Build Your Audience",
			description:
				"Create contact lists to organize your subscribers. You can import contacts or add them manually.",
			icon: Users,
			ctaText: audiencesCount > 0 ? "Manage Audiences" : "Create Your First Audience",
			href: `${route.basePath}/audiences`,
			completed: audiencesCount > 0,
			count: audiencesCount,
		},
		{
			id: "builder",
			title: "Design Your Email",
			description:
				"Use our AI-powered email builder to create beautiful, professional emails in minutes.",
			icon: Sparkles,
			ctaText: emailDesignsCount > 0 ? "View Email Designs" : "Create Your First Email",
			href: route.emailBuilderBasePath,
			completed: emailDesignsCount > 0,
			count: emailDesignsCount,
		},
		{
			id: "campaign",
			title: "Send Your Campaign",
			description:
				"Launch your first email campaign and reach your audience. Track opens, clicks, and engagement.",
			icon: Send,
			ctaText: campaignsCount > 0 ? "View Campaigns" : "Create Your First Campaign",
			href: `${route.basePath}/campaigns`,
			completed: campaignsCount > 0,
			count: campaignsCount,
		},
	];

	const completedSteps = steps.filter((s) => s.completed).length;
	const progressPercent = (completedSteps / steps.length) * 100;

	// Auto-expand next incomplete step
	React.useEffect(() => {
		if (!expandedStep) {
			const nextIncomplete = steps.find((s) => !s.completed);
			if (nextIncomplete) {
				setExpandedStep(nextIncomplete.id);
			}
		}
	}, [expandedStep, steps]);

	const handleDismiss = () => {
		setDismissed(true);
		try {
			localStorage.setItem(ONBOARDING_STORAGE_KEY, "true");
		} catch {
			// Ignore localStorage errors
		}
	};

	if (dismissed) {
		return null;
	}

	// Don't show if everything is complete
	const allComplete = verifiedDomains.length > 0 && audiencesCount > 0 && emailDesignsCount > 0 && campaignsCount > 0;

	return (
		<div className="@container/onboarding w-full">
			<Card className="border-primary/20 bg-gradient-to-br from-background to-muted/20">
				<CardHeader className="relative pb-4">
					<div className="flex items-start justify-between gap-4">
						<div className="flex-1 space-y-1.5">
							<div className="flex items-center gap-2">
								<CardTitle className="text-base md:text-lg">
									{allComplete ? "You're All Set!" : "Get Started with Email Marketing"}
								</CardTitle>
								{!allComplete && (
									<Badge variant="secondary" className="text-xs">
										{completedSteps}/{steps.length} Complete
									</Badge>
								)}
							</div>
							<CardDescription className="text-xs md:text-sm">
								{allComplete
									? "Your email marketing is ready. Continue managing your campaigns below."
									: "Follow these simple steps to launch your first successful email campaign."}
							</CardDescription>
						</div>
						<Button
							variant="ghost"
							size="icon"
							className="h-7 w-7 shrink-0"
							onClick={handleDismiss}
						>
							<X className="h-4 w-4" />
							<span className="sr-only">Dismiss onboarding</span>
						</Button>
					</div>
					{!allComplete && (
						<div className="mt-4">
							<Progress value={progressPercent} className="h-2" />
						</div>
					)}
				</CardHeader>

				<CardContent className="space-y-3">
					{!allComplete && (
						<Alert className="border-blue-200/50 bg-blue-50/50 dark:border-blue-800/30 dark:bg-blue-950/20">
							<Info className="h-4 w-4 text-blue-600 dark:text-blue-400" />
							<AlertDescription className="text-xs text-blue-900 dark:text-blue-100">
								{route.isCustomer
									? "Adding domains for this organization keeps your email sending organized and professional."
									: "You can view and manage all domains across your agency."}
							</AlertDescription>
						</Alert>
					)}

					<div className="grid gap-3 @lg/onboarding:grid-cols-2">
						{steps.map((step, index) => {
							const isExpanded = expandedStep === step.id;
							
							// Campaign step logic: only blocked if missing prerequisites AND no campaigns exist
							let isBlocked = false;
							if (step.id === "campaign" && campaignsCount === 0) {
								// Block if missing any prerequisite
								isBlocked = verifiedDomains.length === 0 || audiencesCount === 0 || emailDesignsCount === 0;
							}

							return (
								<div
									key={step.id}
									className={cn(
										"group relative rounded-lg border bg-card p-4 transition-all",
										step.completed && "border-green-500/30 bg-green-50/30 dark:bg-green-950/10",
										isExpanded && !step.completed && "border-primary shadow-md",
										isBlocked && "opacity-60",
									)}
								>
									<div className="flex items-start gap-3">
										<div
											className={cn(
												"flex h-10 w-10 shrink-0 items-center justify-center rounded-full",
												step.completed
													? "bg-green-500 text-white"
													: "bg-muted text-muted-foreground",
											)}
										>
											{step.completed ? (
												<CheckCircle2 className="h-5 w-5" />
											) : (
												<step.icon className="h-5 w-5" />
											)}
										</div>

										<div className="flex-1 min-w-0 space-y-2">
											<div className="space-y-0.5">
												<div className="flex items-center gap-2">
													<h3 className="font-semibold text-sm leading-none">{step.title}</h3>
													{step.completed && step.count !== undefined && (
														<Badge variant="secondary" className="text-[10px] px-1.5 py-0">
															{step.count}
														</Badge>
													)}
												</div>
												<p className="text-xs text-muted-foreground line-clamp-2">
													{step.description}
												</p>
											</div>

											{isExpanded && !step.completed && (
												<div className="space-y-2 pt-2">
													{step.id === "domains" && verifiedDomains.length === 0 && (
														<p className="text-xs text-muted-foreground">
															<strong>Why this matters:</strong> Verified domains improve email
															deliverability and build trust with recipients. We'll guide you through DNS
															setup.
														</p>
													)}
													{step.id === "audiences" && audiencesCount === 0 && (
														<p className="text-xs text-muted-foreground">
															<strong>Quick tip:</strong> Start with a small test audience. You can import
															from CSV or add contacts one by one.
														</p>
													)}
													{step.id === "builder" && emailDesignsCount === 0 && (
														<p className="text-xs text-muted-foreground">
															<strong>Get creative:</strong> Our AI builder helps you create stunning emails in
															minutes. Describe what you need and watch it come to life.
														</p>
													)}
													{step.id === "campaign" && campaignsCount === 0 && (
														<p className="text-xs text-muted-foreground">
															<strong>Ready to launch?</strong> Make sure you have a verified domain, an
															audience, and an email design before creating your campaign.
														</p>
													)}
												</div>
											)}

											<div className="flex items-center gap-2 pt-1">
												<Button
													asChild
													size="sm"
													variant={step.completed ? "outline" : "default"}
													className="h-8 text-xs"
													disabled={isBlocked}
												>
													<Link to={step.href}>
														{step.ctaText}
														<ArrowRight className="ml-1.5 h-3 w-3" />
													</Link>
												</Button>

												{!step.completed && (
													<Button
														variant="ghost"
														size="sm"
														className="h-8 text-xs"
														onClick={() =>
															setExpandedStep(isExpanded ? null : step.id)
														}
													>
														{isExpanded ? "Less" : "Learn More"}
													</Button>
												)}
											</div>
										</div>
									</div>

									{isBlocked && (
										<div className="absolute inset-0 flex items-center justify-center rounded-lg bg-background/80 backdrop-blur-[1px]">
											<div className="text-center px-4">
												<Badge variant="secondary" className="text-xs mb-2">
													Prerequisites needed
												</Badge>
												<p className="text-[10px] text-muted-foreground">
													{verifiedDomains.length === 0 && "Add a verified domain"}
													{verifiedDomains.length > 0 && audiencesCount === 0 && "Create an audience"}
													{verifiedDomains.length > 0 && audiencesCount > 0 && emailDesignsCount === 0 && "Design an email"}
												</p>
											</div>
										</div>
									)}
								</div>
							);
						})}
					</div>

					{allComplete && (
						<div className="mt-4 rounded-lg bg-green-50 dark:bg-green-950/20 p-4 text-center">
							<CheckCircle2 className="mx-auto h-8 w-8 text-green-600 dark:text-green-400 mb-2" />
							<p className="text-sm font-medium text-green-900 dark:text-green-100">
								All set! Your email marketing is ready to go.
							</p>
							<p className="text-xs text-green-700 dark:text-green-300 mt-1">
								Continue creating campaigns, building audiences, or fine-tuning your domains.
							</p>
						</div>
					)}
				</CardContent>
			</Card>
		</div>
	);
}
