"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router";
import { Search, Send } from "lucide-react";
import { toast } from "@/components/ui/sonner";

import { ZeepoAiAutosizeTextarea } from "@/components/zeepo/zeepo-ai-autosize-textarea";
import { ZeepoMascot } from "@/components/zeepo/zeepo-mascot";
import { ZEEPO_AI_CAPABILITY_SHORTCUTS } from "@/components/zeepo/zeepo-ai-capabilities";
import { ZeepoAiBuyTokensDialog } from "@/components/zeepo/zeepo-ai-buy-tokens-dialog";
import { stashZeepoAiHandoff } from "@/components/zeepo/zeepo-ai-handoff";
import {
	useZeepoAiRoute,
	zeepoAiCreateSessionInput,
	zeepoAiSessionPath,
	ZeepoAiRouteProvider,
	type ZeepoAiRouteConfig,
} from "@/components/zeepo/zeepo-ai-route-context";
import { Spinner } from "@/components/ui/shadcn-io/spinner";
import {
	applyZeepoAiWelcomeGrantToCache,
	useZeepoAiTokenBalance,
} from "@/hooks/use-zeepo-ai-token-balance";
import { authClient } from "@/lib/auth-client";
import { captureEvent } from "@/lib/posthog";
import { getZeepoTokenBillingErrorReason } from "@/lib/zeepo-token-errors";
import { cn } from "@/lib/utils";
import { trpc } from "@/utils/trpc";

function getTimeGreeting(date = new Date()): "Hello" | "Good morning" | "Good afternoon" | "Good evening" {
	const hour = date.getHours();
	if (hour >= 5 && hour < 12) return "Good morning";
	if (hour >= 12 && hour < 17) return "Good afternoon";
	if (hour >= 17 && hour < 22) return "Good evening";
	return "Hello";
}

function getFirstName(fullName: string | null | undefined): string {
	const trimmed = fullName?.trim();
	if (!trimmed) return "";
	return trimmed.split(/\s+/)[0] ?? "";
}

function DashboardZeepoHeroInner() {
	const navigate = useNavigate();
	const route = useZeepoAiRoute();
	const { data: session } = authClient.useSession();
	const firstName = getFirstName(session?.user?.name);
	const userRole = (session?.user as { role?: string } | undefined)?.role;
	const inputRef = useRef<HTMLTextAreaElement>(null);
	const [inputValue, setInputValue] = useState("");
	const [searchEnabled, setSearchEnabled] = useState(false);
	const [isHandingOff, setIsHandingOff] = useState(false);
	const [buyOpen, setBuyOpen] = useState(false);

	const utils = trpc.useUtils();
	const createSession = trpc.zeepoAi.sessions.create.useMutation();
	const claimWelcomeGrant = trpc.zeepoAi.sessions.claimWelcomeGrant.useMutation();
	const welcomeClaimedRef = useRef(false);
	const {
		canAffordTurn,
		isLoading: tokensLoading,
		isAgency,
	} = useZeepoAiTokenBalance(route.teamId, userRole);

	const greeting = useMemo(() => {
		const salutation = getTimeGreeting();
		return firstName ? `${salutation}, ${firstName}` : salutation;
	}, [firstName]);

	useEffect(() => {
		if (!route.isCustomer || !route.teamId || !session?.user) return;
		if (welcomeClaimedRef.current) return;
		if (sessionStorage.getItem("zeepo-ai-welcome-shown") === "true") return;

		const teamId = route.teamId;
		welcomeClaimedRef.current = true;
		void claimWelcomeGrant
			.mutateAsync({ teamId })
			.then((result) => {
				sessionStorage.setItem("zeepo-ai-welcome-shown", "true");
				if (result.granted) {
					applyZeepoAiWelcomeGrantToCache(utils, teamId, result);
					toast.success(
						`Welcome to Zeepo AI  ${result.tokensGranted} free tokens are on your team wallet to try it out.`,
						{ duration: 7000 },
					);
				}
			})
			.catch(() => {
				welcomeClaimedRef.current = false;
			});
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [route.isCustomer, route.teamId, session?.user?.id]);

	const canSend = Boolean(inputValue.trim()) && !isHandingOff && Boolean(route.teamId);

	const applyStarter = (starter: string, enableSearch?: boolean) => {
		setInputValue(starter);
		if (enableSearch) setSearchEnabled(true);
		requestAnimationFrame(() => {
			const el = inputRef.current;
			if (!el) return;
			el.focus();
			const caret = starter.length;
			el.setSelectionRange(caret, caret);
		});
	};

	const handleSend = async () => {
		const message = inputValue.trim();
		if (!message || isHandingOff) return;
		if (!route.teamId) {
			toast.error("Organization is still loading. Try again in a moment.");
			return;
		}
		if (route.isCustomer && !isAgency && !tokensLoading && !claimWelcomeGrant.isPending && !canAffordTurn) {
			setBuyOpen(true);
			toast.error("Insufficient tokens. Purchase more tokens to continue.");
			return;
		}

		try {
			setIsHandingOff(true);
			const created = await createSession.mutateAsync({
				title: "New chat",
				...zeepoAiCreateSessionInput(route),
			});
			if (!created?.id) throw new Error("Could not create chat");

			stashZeepoAiHandoff(created.id, {
				content: message,
				searchEnabled,
				fromCompose: true,
			});

			captureEvent("dashboard_zeepo_started", { user_type: "customer" });
			setInputValue("");
			void utils.zeepoAi.sessions.list.invalidate();
			navigate(zeepoAiSessionPath(route.basePath, created.id), {
				viewTransition: true,
				state: {
					initialMessage: message,
					searchEnabled,
					fromCompose: true,
				},
			});
		} catch (error) {
			setIsHandingOff(false);
			const errorMessage = error instanceof Error ? error.message : "Failed to start chat";
			toast.error(errorMessage);
			if (getZeepoTokenBillingErrorReason(errorMessage)) setBuyOpen(true);
		}
	};

	return (
		<section className="flex h-full flex-col rounded-xl border bg-card p-5 text-left">
			<div className="flex items-start gap-3">
				<ZeepoMascot className="h-12 w-12 sm:h-14 sm:w-14" />
				<div className="flex min-w-0 flex-col gap-1 pt-0.5">
					<h2 className="text-base font-semibold text-foreground">{greeting}</h2>
					<p className="text-sm text-muted-foreground">
						Ask Zeepo about domains, hosting, invoices, or your account.
					</p>
				</div>
			</div>

			<div
				className={cn(
					"zeepo-ai-compose-surface zeepo-composer-shell mt-4 w-full overflow-hidden rounded-xl border border-border/70 bg-background text-left",
					isHandingOff && "pointer-events-none opacity-70",
				)}
			>
				<div className="px-4 pt-3 pb-1.5">
					<ZeepoAiAutosizeTextarea
						ref={inputRef}
						placeholder={isHandingOff ? "Starting chat…" : "Ask me anything..."}
						value={inputValue}
						disabled={isHandingOff}
						maxLines={5}
						aria-label="Message Zeepo"
						onChange={(event) => setInputValue(event.target.value)}
						onKeyDown={(event) => {
							if (event.key === "Enter" && !event.shiftKey) {
								event.preventDefault();
								void handleSend();
							}
						}}
					/>
				</div>
				<div className="flex items-center justify-between gap-2 px-3 pb-3 pt-0.5">
					<button
						type="button"
						onClick={() => setSearchEnabled((value) => !value)}
						className={cn(
							"inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-medium leading-none transition-colors",
							searchEnabled
								? "bg-primary/10 text-primary hover:bg-primary/15"
								: "bg-muted text-muted-foreground hover:bg-muted/80 hover:text-foreground",
						)}
					>
						<Search className="size-3.5" />
						<span className="hidden sm:inline">Search</span>
					</button>
					<button
						type="button"
						aria-label={isHandingOff ? "Starting chat" : "Send"}
						onClick={() => void handleSend()}
						disabled={!canSend}
						className={cn(
							"flex size-9 items-center justify-center rounded-full transition-colors sm:size-10",
							canSend || isHandingOff
								? "bg-primary text-primary-foreground hover:bg-primary/90"
								: "cursor-not-allowed bg-muted text-muted-foreground",
						)}
					>
						{isHandingOff ? (
							<Spinner size={16} className="text-current" />
						) : (
							<Send className="size-4" />
						)}
					</button>
				</div>
			</div>

			<div className="mt-4 flex w-full flex-wrap items-center gap-2">
				{ZEEPO_AI_CAPABILITY_SHORTCUTS.map((item) => {
					const Icon = item.icon;
					const selected = inputValue.startsWith(item.starter);
					return (
						<button
							key={item.id}
							type="button"
							disabled={isHandingOff}
							onClick={() => applyStarter(item.starter, item.enableSearch)}
							className={cn(
								"inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors",
								"focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
								"disabled:pointer-events-none disabled:opacity-50",
								selected
									? "border-primary/30 bg-primary/10 text-foreground"
									: "border-border bg-card text-muted-foreground hover:bg-muted hover:text-foreground",
							)}
						>
							<Icon className="size-3.5 shrink-0 opacity-70" aria-hidden />
							{item.label}
						</button>
					);
				})}
			</div>

			<ZeepoAiBuyTokensDialog open={buyOpen} onOpenChange={setBuyOpen} />
		</section>
	);
}

export function DashboardZeepoHero() {
	const { pathname } = useLocation();
	const teamSlug = pathname.split("/")[1] ?? "";
	const { data: teamData } = trpc.teams.getTeamIdBySlug.useQuery(
		{ slug: teamSlug },
		{ enabled: Boolean(teamSlug), staleTime: 5 * 60 * 1000 },
	);

	const config = useMemo<ZeepoAiRouteConfig>(
		() => ({
			basePath: `/${teamSlug}/zeepo-ai`,
			teamId: teamData?.id ?? null,
			teamSlug,
			isCustomer: true,
		}),
		[teamSlug, teamData?.id],
	);

	if (!teamSlug) return null;

	return (
		<ZeepoAiRouteProvider config={config}>
			<DashboardZeepoHeroInner />
		</ZeepoAiRouteProvider>
	);
}
