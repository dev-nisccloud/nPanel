"use client";

import * as React from "react";
import { Link, useLocation } from "react-router";
import {
	ArrowRight,
	Building2,
	CheckCircle2,
	Mail,
	ShieldCheck,
	UserRound,
	X,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { fetchMfaStatus } from "@/lib/mfa-auth";
import { authClient } from "@/lib/auth-client";
import { isRegistrantProfileComplete } from "@/lib/profile-completion";
import { isTeamBillingComplete } from "@/lib/team-billing-completion";
import { cn } from "@/lib/utils";
import { toast } from "@/components/ui/sonner";
import { trpc } from "@/utils/trpc";

type SetupStepId = "email" | "profile" | "billing" | "mfa";

interface StepConfig {
	id: SetupStepId;
	title: string;
	description: string;
	icon: React.ElementType;
	ctaText: string;
	href?: string;
	onAction?: () => void;
	actionPending?: boolean;
	completed: boolean;
}

function storageKeyForTeam(teamId: string) {
	return `customer-dashboard-todos-dismissed:${teamId}`;
}

export function DashboardSetupTodos() {
	const { pathname } = useLocation();
	const teamSlug = pathname?.split("/")[1] ?? "";

	const [dismissed, setDismissed] = React.useState(false);
	const [mfaEnabled, setMfaEnabled] = React.useState(false);
	const [mfaLoading, setMfaLoading] = React.useState(true);
	const [isSendingVerification, setIsSendingVerification] = React.useState(false);

	React.useEffect(() => {
		let cancelled = false;
		const run = async () => {
			try {
				setMfaLoading(true);
				const status = await fetchMfaStatus();
				if (!cancelled) {
					setMfaEnabled(Boolean(status.enabled ?? status.required));
				}
			} catch {
				if (!cancelled) {
					setMfaEnabled(false);
				}
			} finally {
				if (!cancelled) {
					setMfaLoading(false);
				}
			}
		};
		void run();
		return () => {
			cancelled = true;
		};
	}, []);

	const { data: userInfo, isLoading: isProfileLoading } =
		trpc.userProfile.getUserInfo.useQuery();

	const { data: teamData, isLoading: isTeamLoading } =
		trpc.teams.getTeamIdBySlug.useQuery(
			{ slug: teamSlug },
			{ enabled: !!teamSlug, staleTime: 5 * 60 * 1000 },
		);

	const teamId = teamData?.id;

	React.useEffect(() => {
		if (!teamId) {
			setDismissed(false);
			return;
		}
		try {
			const stored = localStorage.getItem(storageKeyForTeam(teamId));
			setDismissed(stored === "true");
		} catch {
			setDismissed(false);
		}
	}, [teamId]);

	const { data: billingSettings, isLoading: isBillingLoading } =
		trpc.teamBilling.getByTeam.useQuery(
			{ teamId: teamId! },
			{ enabled: !!teamId },
		);

	const profileComplete = isRegistrantProfileComplete(userInfo?.profile);
	const billingComplete = isTeamBillingComplete(billingSettings);
	const emailVerified = Boolean(userInfo?.emailVerified);

	const sendVerificationEmail = async () => {
		const email = userInfo?.email?.trim();
		if (!email || isSendingVerification) return;
		try {
			setIsSendingVerification(true);
			const result = await authClient.sendVerificationEmail({
				email,
				callbackURL: `/${teamSlug}/dashboard`,
			});
			if (result.error) {
				throw new Error(result.error.message || "Failed to send verification email");
			}
			toast.success("Verification email sent", {
				description: "Check your inbox and follow the link to verify your account.",
			});
		} catch (error) {
			toast.error("Could not send verification email", {
				description: error instanceof Error ? error.message : "Please try again.",
			});
		} finally {
			setIsSendingVerification(false);
		}
	};

	const steps: StepConfig[] = [
		{
			id: "email",
			title: "Verify your email",
			description:
				"Confirm your email address so we can send invoices, domain notices, and account alerts.",
			icon: Mail,
			ctaText: emailVerified
				? "View profile"
				: isSendingVerification
					? "Sending..."
					: "Send verification email",
			href: emailVerified ? `/${teamSlug}/my-profile` : undefined,
			onAction: emailVerified ? undefined : () => void sendVerificationEmail(),
			actionPending: isSendingVerification,
			completed: emailVerified,
		},
		{
			id: "profile",
			title: "Complete profile information",
			description:
				"Add your contact details used for domain registration, invoices, and order fulfillment.",
			icon: UserRound,
			ctaText: profileComplete ? "View profile" : "Complete profile",
			href: `/${teamSlug}/my-profile`,
			completed: profileComplete,
		},
		{
			id: "billing",
			title: "Complete organization billing info",
			description:
				"Set your company legal name, billing email, and address so invoices and checkout work correctly.",
			icon: Building2,
			ctaText: billingComplete ? "Manage billing" : "Add billing details",
			href: `/${teamSlug}/settings`,
			completed: billingComplete,
		},
		{
			id: "mfa",
			title: "Enable multi-factor authentication",
			description:
				"Protect your account with an email verification code whenever you sign in.",
			icon: ShieldCheck,
			ctaText: mfaEnabled ? "Manage security" : "Enable MFA",
			href: `/${teamSlug}/my-profile?tab=security`,
			completed: mfaEnabled,
		},
	];

	const completedSteps = steps.filter((s) => s.completed).length;
	const progressPercent = (completedSteps / steps.length) * 100;
	const allComplete = completedSteps === steps.length;
	const isLoading =
		isProfileLoading || isTeamLoading || isBillingLoading || mfaLoading;

	const handleDismiss = () => {
		setDismissed(true);
		if (!teamId) return;
		try {
			localStorage.setItem(storageKeyForTeam(teamId), "true");
		} catch {
			// Ignore localStorage errors
		}
	};

	if (dismissed) {
		return null;
	}

	if (isLoading) {
		return (
			<div className="@container/onboarding w-full">
				<Card className="border-primary/20">
					<CardHeader className="pb-4">
						<Skeleton className="h-5 w-48" />
						<Skeleton className="mt-2 h-4 w-72" />
						<Skeleton className="mt-4 h-2 w-full" />
					</CardHeader>
					<CardContent>
						<div className="grid gap-3 @md/onboarding:grid-cols-2 @2xl/onboarding:grid-cols-4">
							{[1, 2, 3, 4].map((i) => (
								<Skeleton key={i} className="h-36 w-full rounded-lg" />
							))}
						</div>
					</CardContent>
				</Card>
			</div>
		);
	}

	return (
		<div className="@container/onboarding w-full">
			<Card className="border-primary/20 bg-gradient-to-br from-background to-muted/20">
				<CardHeader className="relative pb-4">
					<div className="flex items-start justify-between gap-4">
						<div className="flex-1 space-y-1.5">
							<div className="flex items-center gap-2">
								<CardTitle className="text-base md:text-lg">
									{allComplete ? "You're all set!" : "Your to-dos"}
								</CardTitle>
								{!allComplete && (
									<Badge variant="secondary" className="text-xs">
										{completedSteps}/{steps.length} Complete
									</Badge>
								)}
							</div>
							<CardDescription className="text-xs md:text-sm">
								{allComplete
									? "Your account essentials are ready. Keep exploring services from your dashboard."
									: "Finish these important steps so you can buy services, get billed correctly, and keep your account secure."}
							</CardDescription>
						</div>
						<Button
							variant="ghost"
							size="icon"
							className="h-7 w-7 shrink-0"
							onClick={handleDismiss}
						>
							<X className="h-4 w-4" />
							<span className="sr-only">Dismiss to-dos</span>
						</Button>
					</div>
					{!allComplete && (
						<div className="mt-4">
							<Progress value={progressPercent} className="h-2" />
						</div>
					)}
				</CardHeader>

				<CardContent className="space-y-3">
					<div className="grid gap-3 @md/onboarding:grid-cols-2 @2xl/onboarding:grid-cols-4">
						{steps.map((step) => (
							<div
								key={step.id}
								className={cn(
									"group relative rounded-lg border bg-card p-4 transition-all",
									step.completed &&
										"border-green-500/30 bg-green-50/30 dark:bg-green-950/10",
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

									<div className="min-w-0 flex-1 space-y-2">
										<div className="space-y-0.5">
											<h3 className="text-sm font-semibold leading-none">
												{step.title}
											</h3>
											<p className="line-clamp-2 text-xs text-muted-foreground">
												{step.description}
											</p>
										</div>

										<div className="flex items-center gap-2 pt-1">
											{step.href ? (
												<Button
													asChild
													size="sm"
													variant={step.completed ? "outline" : "default"}
													className="h-8 text-xs"
												>
													<Link to={step.href}>
														{step.ctaText}
														<ArrowRight className="ml-1.5 h-3 w-3" />
													</Link>
												</Button>
											) : (
												<Button
													size="sm"
													variant="default"
													className="h-8 text-xs"
													onClick={step.onAction}
													disabled={step.actionPending}
												>
													{step.ctaText}
													<ArrowRight className="ml-1.5 h-3 w-3" />
												</Button>
											)}
										</div>
									</div>
								</div>
							</div>
						))}
					</div>

					{allComplete && (
						<div className="mt-4 rounded-lg bg-green-50 p-4 text-center dark:bg-green-950/20">
							<CheckCircle2 className="mx-auto mb-2 h-8 w-8 text-green-600 dark:text-green-400" />
							<p className="text-sm font-medium text-green-900 dark:text-green-100">
								All set! Your email, profile, billing, and security are ready.
							</p>
						</div>
					)}
				</CardContent>
			</Card>
		</div>
	);
}
