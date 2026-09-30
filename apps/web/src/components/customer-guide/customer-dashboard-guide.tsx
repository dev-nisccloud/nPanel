"use client";

import { useCallback, useEffect, useId, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useLocation, useNavigate } from "react-router";
import confetti from "canvas-confetti";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { authClient } from "@/lib/auth-client";
import { isRegistrantProfileComplete } from "@/lib/profile-completion";
import { isTeamBillingComplete } from "@/lib/team-billing-completion";
import { fetchMfaStatus } from "@/lib/mfa-auth";
import { captureEvent } from "@/lib/posthog";
import { toast } from "@/components/ui/sonner";
import { trpc } from "@/utils/trpc";

const STEPS = ["welcome", "todos", "email", "profile", "billing", "mfa", "teams"] as const;
type GuideStep = (typeof STEPS)[number];

type SavedGuide = { v: 1; step: GuideStep | "done" };

function storageKey(userId: string) {
	return `npanel:customer-guide:${userId}`;
}

function visitKey(userId: string, step: GuideStep) {
	return `npanel:customer-guide-visit:${userId}:${step}`;
}

function readGuide(userId: string): GuideStep | "done" {
	try {
		const raw = localStorage.getItem(storageKey(userId));
		if (!raw) return "welcome";
		const parsed = JSON.parse(raw) as SavedGuide;
		if (parsed?.v !== 1) return "welcome";
		if (parsed.step === "done") return "done";
		if (STEPS.includes(parsed.step as GuideStep)) return parsed.step as GuideStep;
		return "welcome";
	} catch {
		return "welcome";
	}
}

function writeGuide(userId: string, step: GuideStep | "done") {
	localStorage.setItem(storageKey(userId), JSON.stringify({ v: 1, step } satisfies SavedGuide));
}

function hasVisited(userId: string, step: GuideStep) {
	return sessionStorage.getItem(visitKey(userId, step)) === "1";
}

function markVisited(userId: string, step: GuideStep) {
	sessionStorage.setItem(visitKey(userId, step), "1");
}

const CONFETTI_COLORS = ["#7c3aed", "#3b82f6", "#06b6d4", "#10b981", "#f59e0b", "#f43f5e"];

function fireGuideConfetti() {
	const duration = 3_000;
	const end = Date.now() + duration;
	const base = {
		spread: 70,
		startVelocity: 45,
		gravity: 1,
		decay: 0.91,
		ticks: 180,
		scalar: 1,
		colors: CONFETTI_COLORS,
		zIndex: 100,
		disableForReducedMotion: true,
	};

	const shower = (heavy: boolean) => {
		const count = heavy ? 80 : 24;
		void confetti({
			...base,
			particleCount: count,
			angle: 60,
			origin: { x: 0, y: 0.65 },
		});
		void confetti({
			...base,
			particleCount: count,
			angle: 120,
			origin: { x: 1, y: 0.65 },
		});
		void confetti({
			...base,
			particleCount: heavy ? 90 : 16,
			angle: 90,
			spread: 100,
			origin: { x: 0.5, y: 0.35 },
		});
	};

	shower(true);
	const timer = window.setInterval(() => {
		if (Date.now() >= end) {
			window.clearInterval(timer);
			return;
		}
		shower(false);
	}, 220);
}

export const CUSTOMER_GUIDE_RESTART_EVENT = "npanel:customer-guide-restart";

/** Start the dashboard walkthrough over from the welcome step. */
export function restartCustomerGuide(userId: string) {
	writeGuide(userId, "welcome");
	for (const guideStep of STEPS) {
		sessionStorage.removeItem(visitKey(userId, guideStep));
	}
	window.dispatchEvent(new Event(CUSTOMER_GUIDE_RESTART_EVENT));
}

type Rect = { top: number; left: number; width: number; height: number };

function viewportBox() {
	const visual = window.visualViewport;
	return {
		width: visual?.width ?? window.innerWidth,
		height: visual?.height ?? window.innerHeight,
		offsetTop: visual?.offsetTop ?? 0,
	};
}

function measure(target: string | null): Rect | null {
	if (!target) return null;
	const el = document.querySelector(`[data-customer-guide="${target}"]`);
	if (!(el instanceof HTMLElement)) return null;
	const box = el.getBoundingClientRect();
	if (box.width < 2 || box.height < 2) return null;
	return { top: box.top, left: box.left, width: box.width, height: box.height };
}

/** Keep the ring on the part of the target that is actually on screen. */
function visibleSpotlight(rect: Rect, reserveBottom: number): Rect {
	const view = viewportBox();
	const top = Math.max(view.offsetTop + 8, rect.top);
	const left = Math.max(8, rect.left);
	const right = Math.min(view.width - 8, rect.left + rect.width);
	const bottom = Math.min(view.offsetTop + view.height - reserveBottom, rect.top + rect.height);
	return {
		top,
		left,
		width: Math.max(24, right - left),
		height: Math.max(24, bottom - top),
	};
}

function getScrollParent(el: HTMLElement): HTMLElement | null {
	let parent = el.parentElement;
	while (parent) {
		const style = getComputedStyle(parent);
		if (/(auto|scroll|overlay)/.test(style.overflowY) && parent.scrollHeight > parent.clientHeight + 1) {
			return parent;
		}
		parent = parent.parentElement;
	}
	return null;
}

function scrollTargetIntoBand(el: HTMLElement, reserveBottom: number) {
	const view = viewportBox();
	const topLimit = view.offsetTop + 72;
	const bottomLimit = view.offsetTop + view.height - reserveBottom - 12;
	const box = el.getBoundingClientRect();
	let delta = 0;
	if (box.top < topLimit) delta = box.top - topLimit;
	else if (box.bottom > bottomLimit) delta = box.bottom - bottomLimit;
	if (Math.abs(delta) < 2) return;
	const scroller = getScrollParent(el);
	if (scroller) scroller.scrollBy({ top: delta, behavior: "auto" });
	else window.scrollBy({ top: delta, behavior: "auto" });
}

function placeCard(
	rect: Rect | null,
	card: { width: number; height: number },
): { top: number; left?: number; right?: number } {
	const margin = 16;
	const vw = document.documentElement.clientWidth || window.innerWidth;
	const vh = window.innerHeight;
	const width = Math.min(card.width, vw - margin * 2);
	const gap = 14;

	const top = (() => {
		if (!rect) return Math.max(margin, (vh - card.height) / 2);
		const below = rect.top + rect.height + gap;
		if (below + card.height <= vh - margin) return below;
		const above = rect.top - card.height - gap;
		if (above >= margin) return above;
		return Math.max(margin, vh - card.height - margin);
	})();

	if (!rect) {
		return { top, left: Math.max(margin, (vw - width) / 2) };
	}

	const targetMid = rect.left + rect.width / 2;
	if (targetMid > vw * 0.55) {
		return { top, right: margin };
	}

	return {
		top,
		left: Math.min(Math.max(margin, rect.left), vw - width - margin),
	};
}

function teamSwitcherHole(rect: Rect) {
	const pad = 8;
	const top = Math.max(0, rect.top - pad);
	const left = Math.max(0, rect.left - pad);
	const right = rect.left + rect.width + pad;
	const bottom = rect.top + rect.height + pad;
	return `polygon(evenodd, 0 0, 100% 0, 100% 100%, 0 100%, 0 0, ${left}px ${top}px, ${right}px ${top}px, ${right}px ${bottom}px, ${left}px ${bottom}px, ${left}px ${top}px)`;
}

export function CustomerDashboardGuide() {
	const navigate = useNavigate();
	const { pathname } = useLocation();
	const teamSlug = pathname.split("/")[1] ?? "";
	const { data: session } = authClient.useSession();
	const userId = session?.user?.id ?? null;
	const titleId = useId();
	const [mounted, setMounted] = useState(false);
	const [step, setStep] = useState<GuideStep | "done" | null>(null);
	const [rect, setRect] = useState<Rect | null>(null);
	const scrolledFor = useRef<string | null>(null);
	const [emailSent, setEmailSent] = useState(false);
	const [sendingEmail, setSendingEmail] = useState(false);
	const [mfaEnabled, setMfaEnabled] = useState(false);

	const { data: userInfo } = trpc.userProfile.getUserInfo.useQuery(undefined, {
		enabled: Boolean(userId) && step !== null && step !== "done",
	});
	const { data: teamData } = trpc.teams.getTeamIdBySlug.useQuery(
		{ slug: teamSlug },
		{ enabled: Boolean(teamSlug) && step !== null && step !== "done", staleTime: 5 * 60 * 1000 },
	);
	const { data: billingSettings } = trpc.teamBilling.getByTeam.useQuery(
		{ teamId: teamData?.id ?? "" },
		{ enabled: Boolean(teamData?.id) && step !== null && step !== "done" },
	);

	useEffect(() => {
		setMounted(true);
	}, []);

	useEffect(() => {
		if (!userId) return;
		const saved = readGuide(userId);
		setStep(saved);
		if (saved === "welcome") {
			captureEvent("customer_guide_started");
		}
	}, [userId]);

	useEffect(() => {
		if (!userId) return;
		const onRestart = () => {
			scrolledFor.current = null;
			setEmailSent(false);
			setStep("welcome");
			captureEvent("customer_guide_started", { source: "replay" });
		};
		window.addEventListener(CUSTOMER_GUIDE_RESTART_EVENT, onRestart);
		return () => window.removeEventListener(CUSTOMER_GUIDE_RESTART_EVENT, onRestart);
	}, [userId]);

	useEffect(() => {
		if (!mounted) return;
		const active = step === "teams";
		document.body.toggleAttribute("data-customer-guide-team-preview", active);
		window.dispatchEvent(new Event("npanel:customer-guide-team-preview"));
		return () => {
			document.body.removeAttribute("data-customer-guide-team-preview");
			window.dispatchEvent(new Event("npanel:customer-guide-team-preview"));
		};
	}, [mounted, step]);

	useEffect(() => {
		if (!userId || step === null || step === "done" || step === "welcome") return;
		let cancelled = false;
		void fetchMfaStatus()
			.then((status) => {
				if (!cancelled) setMfaEnabled(Boolean(status.enabled ?? status.required));
			})
			.catch(() => {
				if (!cancelled) setMfaEnabled(false);
			});
		return () => {
			cancelled = true;
		};
	}, [userId, step]);

	const target =
		step === "todos"
			? "todos"
			: step === "email"
				? "todo-email"
				: step === "profile"
					? "todo-profile"
					: step === "billing"
						? "todo-billing"
						: step === "mfa"
							? "todo-mfa"
							: step === "teams"
								? "team-switcher"
								: null;

	useEffect(() => {
		if (!mounted || !step || step === "done") return;
		const update = () => {
			const el = target ? document.querySelector(`[data-customer-guide="${target}"]`) : null;
			if (el instanceof HTMLElement && target && scrolledFor.current !== target) {
				scrolledFor.current = target;
				if (target !== "team-switcher") {
					const box = el.getBoundingClientRect();
					const outside = box.top < 72 || box.bottom > window.innerHeight - 24;
					if (outside) el.scrollIntoView({ block: "center", inline: "nearest" });
				}
			}
			const nextRect = measure(target);
			setRect((prev) => {
				if (!nextRect && !prev) return prev;
				if (
					nextRect &&
					prev &&
					nextRect.top === prev.top &&
					nextRect.left === prev.left &&
					nextRect.width === prev.width &&
					nextRect.height === prev.height
				) {
					return prev;
				}
				return nextRect;
			});
		};
		update();
		const timer = window.setInterval(update, 400);
		window.addEventListener("resize", update);
		window.addEventListener("scroll", update, true);
		return () => {
			window.clearInterval(timer);
			window.removeEventListener("resize", update);
			window.removeEventListener("scroll", update, true);
		};
	}, [mounted, step, target]);

	const finish = useCallback(
		(reason: "done" | "skipped") => {
			if (!userId) return;
			writeGuide(userId, "done");
			setStep("done");
			if (reason === "done") fireGuideConfetti();
			captureEvent("customer_guide_finished", { reason });
		},
		[userId],
	);

	const advance = useCallback(() => {
		if (!userId || !step || step === "done") return;
		const index = STEPS.indexOf(step);
		const next = STEPS[index + 1];
		if (!next) {
			finish("done");
			return;
		}
		writeGuide(userId, next);
		setStep(next);
	}, [finish, step, userId]);

	const goBack = useCallback(() => {
		if (!userId || !step || step === "done") return;
		const prev = STEPS[STEPS.indexOf(step) - 1];
		if (!prev) return;
		scrolledFor.current = null;
		writeGuide(userId, prev);
		setStep(prev);
	}, [step, userId]);

	const sendVerificationEmail = useCallback(async () => {
		const email = userInfo?.email?.trim();
		if (!email || !userId || sendingEmail) return;
		try {
			setSendingEmail(true);
			const result = await authClient.sendVerificationEmail({
				email,
				callbackURL: `/${teamSlug}/dashboard`,
			});
			if (result.error) {
				throw new Error(result.error.message || "Failed to send verification email");
			}
			setEmailSent(true);
			sessionStorage.setItem(visitKey(userId, "email"), "1");
			toast.success("Verification email sent", {
				description: "Check your inbox and follow the link.",
			});
		} catch (error) {
			toast.error("Could not send verification email", {
				description: error instanceof Error ? error.message : "Please try again.",
			});
		} finally {
			setSendingEmail(false);
		}
	}, [sendingEmail, teamSlug, userId, userInfo?.email]);

	if (!mounted || !userId || !step || step === "done") return null;

	const emailVerified = Boolean(userInfo?.emailVerified);
	const profileComplete = isRegistrantProfileComplete(userInfo?.profile);
	const billingComplete = isTeamBillingComplete(billingSettings);
	const visited = hasVisited(userId, step);

	const copy = stepCopy(step, {
		emailVerified,
		profileComplete,
		billingComplete,
		mfaEnabled,
		visited: visited || emailSent,
	});

	const onNext = () => {
		if (step === "email" && !emailVerified && !emailSent && !visited) {
			void sendVerificationEmail();
			return;
		}
		const href = stepHref(step, teamSlug);
		const complete = isStepComplete(step, {
			emailVerified,
			profileComplete,
			billingComplete,
			mfaEnabled,
		});
		if (href && !complete && !visited) {
			markVisited(userId, step);
			navigate(href);
			return;
		}
		advance();
	};

	const nextLabel =
		step === "teams"
			? "Done"
			: step === "email" && !emailVerified && !emailSent && !visited
				? sendingEmail
					? "Sending..."
					: "Send email"
				: "Next";

	const viewWidth = document.documentElement.clientWidth || window.innerWidth;
	const cardWidth = Math.min(384, viewWidth - 32);
	const cardPos = placeCard(step === "welcome" ? null : rect, { width: cardWidth, height: 220 });
	const index = STEPS.indexOf(step);

	return createPortal(
		<div
			className={cn(
				"fixed inset-0 z-[70]",
				step === "teams" && "pointer-events-none",
			)}
			role="dialog"
			aria-modal={step === "teams" ? undefined : true}
			aria-labelledby={titleId}
		>
			{step !== "welcome" && rect ? (
				<div
					className="pointer-events-none fixed rounded-xl"
					style={{
						top: rect.top - 6,
						left: rect.left - 6,
						width: rect.width + 12,
						height: rect.height + 12,
						boxShadow: "0 0 0 2px rgba(255,255,255,0.95), 0 0 0 9999px rgba(15, 23, 42, 0.55)",
					}}
				/>
			) : (
				<div className="fixed inset-0 bg-slate-950/55" />
			)}
			{step === "teams" && rect ? (
				<div
					className="pointer-events-auto fixed inset-0"
					style={{ clipPath: teamSwitcherHole(rect) }}
				/>
			) : (
				<div className="fixed inset-0" />
			)}
			<div
				className={cn(
					"fixed rounded-xl border bg-card p-5 text-card-foreground shadow-lg",
					step === "teams" && "pointer-events-auto",
				)}
				style={{
					top: cardPos.top,
					left: cardPos.left,
					right: cardPos.right,
					width: cardWidth,
					maxWidth: "calc(100vw - 2rem)",
				}}
			>
				<div className="flex items-start justify-between gap-3">
					<p className="text-xs text-muted-foreground">
						{index + 1} of {STEPS.length}
					</p>
					<button
						type="button"
						onClick={() => finish("skipped")}
						className="text-sm text-muted-foreground hover:text-foreground"
					>
						Skip
					</button>
				</div>
				<h2 id={titleId} className="mt-1 text-base font-semibold">
					{copy.title}
				</h2>
				<p className="mt-2 text-sm leading-relaxed text-muted-foreground">{copy.body}</p>
				<div className="mt-4 flex items-center justify-between gap-3">
					{index > 0 ? (
						<Button type="button" size="sm" variant="outline" onClick={goBack}>
							Previous
						</Button>
					) : (
						<span />
					)}
					<Button type="button" size="sm" onClick={onNext} disabled={sendingEmail}>
						{nextLabel}
					</Button>
				</div>
			</div>
		</div>,
		document.body,
	);
}

function stepHref(step: GuideStep, teamSlug: string): string | null {
	if (step === "profile") return `/${teamSlug}/my-profile`;
	if (step === "billing") return `/${teamSlug}/settings`;
	if (step === "mfa") return `/${teamSlug}/my-profile?tab=security`;
	return null;
}

function isStepComplete(
	step: GuideStep,
	status: { emailVerified: boolean; profileComplete: boolean; billingComplete: boolean; mfaEnabled: boolean },
) {
	if (step === "email") return status.emailVerified;
	if (step === "profile") return status.profileComplete;
	if (step === "billing") return status.billingComplete;
	if (step === "mfa") return status.mfaEnabled;
	return true;
}

function stepCopy(
	step: GuideStep,
	status: {
		emailVerified: boolean;
		profileComplete: boolean;
		billingComplete: boolean;
		mfaEnabled: boolean;
		visited: boolean;
	},
): { title: string; body: string } {
	switch (step) {
		case "welcome":
			return {
				title: "Welcome to Nisc Cloud nPanel",
				body: "This is home for your organization. You can manage domains and hosting, pay invoices, ask Zeepo for help, and keep your account details ready for orders and renewals.",
			};
		case "todos":
			return {
				title: "Start with these",
				body: "These tasks keep your account ready for domains, invoices, and sign-in. We'll take them one at a time.",
			};
		case "email":
			return {
				title: "Verify your email",
				body: status.emailVerified
					? "Your email is confirmed. Invoices and notices can reach you."
					: status.visited
						? "We sent a link to your inbox. Open it when you can."
						: "Confirm your email so invoices and account notices reach you.",
			};
		case "profile":
			return {
				title: "Your details",
				body: status.profileComplete
					? "Your profile is filled in."
					: status.visited
						? "You can finish your name, phone, and address whenever you're ready."
						: "Add your name, phone, and address. We use them for domains and invoices.",
			};
		case "billing":
			return {
				title: "Billing details",
				body: status.billingComplete
					? "Billing details for this organization are saved."
					: status.visited
						? "You can add the billing name and address whenever you're ready."
						: "Add this organization's legal name, billing email, and address so invoices are right.",
			};
		case "mfa":
			return {
				title: "Protect sign-in",
				body: status.mfaEnabled
					? "An extra check is already on when you sign in."
					: status.visited
						? "You can turn on a sign-in code whenever you're ready."
						: "Add a code at sign-in so the account stays yours.",
			};
		case "teams":
			return {
				title: "Your organizations",
				body: "Open this to see your organizations. Choosing one switches you into it, so you can manage that organization's domains, hosting, and other services. Switching stays off for this tour.",
			};
	}
}
