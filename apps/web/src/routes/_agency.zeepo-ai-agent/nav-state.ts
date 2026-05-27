export type ZeepoComposeHandoffState = {
  initialMessage?: string;
  initialSkillId?: string;
  initialAttachments?: Array<{ url: string; name: string; mimeType: string }>;
  /** Set when navigating from the landing compose screen for a continuous transition. */
  fromCompose?: boolean;
};

export function hasComposeHandoff(
  state: unknown,
): state is ZeepoComposeHandoffState & { fromCompose: true } {
  if (!state || typeof state !== "object") return false;
  const s = state as ZeepoComposeHandoffState;
  if (!s.fromCompose) return false;
  return Boolean(
    s.initialMessage?.trim() ||
      (s.initialAttachments && s.initialAttachments.length > 0),
  );
}

export function buildComposeHandoffState(opts: {
  message: string;
  skillId?: string;
  attachments?: Array<{ url: string; name: string; mimeType: string }>;
}): ZeepoComposeHandoffState {
  return {
    fromCompose: true,
    initialMessage: opts.message,
    initialSkillId: opts.skillId,
    initialAttachments: opts.attachments?.length ? opts.attachments : undefined,
  };
}

/** Wrap navigation in the View Transitions API when supported. */
export function startViewTransitionNavigate(navigate: () => void) {
  if (
    typeof document !== "undefined" &&
    "startViewTransition" in document &&
    typeof document.startViewTransition === "function"
  ) {
    document.startViewTransition(() => navigate());
    return;
  }
  navigate();
}
