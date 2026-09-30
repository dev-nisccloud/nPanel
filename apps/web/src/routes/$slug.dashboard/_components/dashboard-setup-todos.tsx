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
} from "lucide-react";

import { Button } from "@/components/ui/button";
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

export function DashboardSetupTodos() {
	const { pathname } = useLocation();
	const teamSlug = pathname?.split("/")[1] ?? "";

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
	const isLoading =
		isProfileLoading || isTeamLoading || isBillingLoading || mfaLoading;

	if (isLoading) {
		return (
			<section className="flex h-full flex-col rounded-xl border bg-card p-5">
				<Skeleton className="h-5 w-32" />
				<Skeleton className="mt-2 h-4 w-48" />
				<div className="mt-4 flex flex-1 flex-col gap-2">
					{[1, 2, 3, 4].map((i) => (
						<Skeleton key={i} className="h-16 w-full rounded-lg" />
					))}
				</div>
			</section>
		);
	}

	return (
		<section data-customer-guide="todos" className="flex h-full flex-col rounded-xl border bg-card p-5">
			<div>
				<h2 className="text-base font-semibold">Your to-dos</h2>
				<p className="mt-1 text-sm text-muted-foreground">
					{completedSteps} of {steps.length} complete. Finished steps stay here.
				</p>
			</div>

			<ul className="mt-4 flex flex-1 flex-col gap-2">
				{steps.map((step) => {
					const Icon = step.icon;
					return (
						<li
							key={step.id}
							data-customer-guide={`todo-${step.id}`}
							className={cn(
								"rounded-lg border px-3 py-2.5",
								step.completed &&
									"border-green-200 bg-green-50 dark:border-green-900 dark:bg-green-950/30",
							)}
						>
							<div className="flex items-start gap-2.5">
								{step.completed ? (
									<CheckCircle2 className="mt-0.5 size-4 shrink-0 text-green-600 dark:text-green-400" />
								) : (
									<Icon className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
								)}
								<div className="min-w-0 flex-1">
									<p
										className={cn(
											"text-sm font-medium",
											step.completed &&
												"text-green-700 line-through decoration-green-700/70 dark:text-green-400 dark:decoration-green-400/70",
										)}
									>
										{step.title}
									</p>
									<p className="mt-0.5 line-clamp-2 text-xs text-muted-foreground">{step.description}</p>
									<div className="mt-1.5">
										{step.href ? (
											<Button
												asChild
												size="sm"
												variant="ghost"
												className="h-7 px-0 text-xs hover:bg-transparent"
											>
												<Link to={step.href}>
													{step.ctaText}
													<ArrowRight className="ml-1 size-3" />
												</Link>
											</Button>
										) : (
											<Button
												size="sm"
												variant="ghost"
												className="h-7 px-0 text-xs hover:bg-transparent"
												onClick={step.onAction}
												disabled={step.actionPending}
											>
												{step.ctaText}
												<ArrowRight className="ml-1 size-3" />
											</Button>
										)}
									</div>
								</div>
							</div>
						</li>
					);
				})}
			</ul>
		</section>
	);
}
