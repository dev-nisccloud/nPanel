export type ZeepoAiMessageRole = "user" | "assistant";

export type ZeepoAiMessageStatus = "streaming" | "complete" | "error" | "cancelled";
export type ZeepoAiReasoningStatus = "idle" | "streaming" | "complete";

export type ZeepoAiClarifyingQuestion = {
  question: string;
  options: string[];
  allow_upload?: boolean;
};

export type ZeepoAiToolResult = {
  toolName: string;
  toolUseId: string;
  result: unknown;
};

export type ZeepoAiMessageAttachment = {
  url: string;
  name: string;
  mimeType: string;
};

export type ZeepoAiMessage = {
  id: string;
  role: ZeepoAiMessageRole;
  content: string;
  createdAt: string;
  reasoning?: string;
  reasoningDurationMs?: number;
  status?: ZeepoAiMessageStatus;
  reasoningStatus?: ZeepoAiReasoningStatus;
  clarifyingQuestions?: ZeepoAiClarifyingQuestion[];
  toolResults?: ZeepoAiToolResult[];
  feedback?: "like" | "dislike" | null;
  interrupted?: boolean;
  attachments?: ZeepoAiMessageAttachment[];
};

export type ZeepoAiGenerationKind =
  | "image"
  | "document"
  | "presentation"
  | "image-presentation"
  | "video"
  | "audio"
  | string;

export type ZeepoAiGenerationStatus =
  | "QUEUED"
  | "PROCESSING"
  | "COMPLETED"
  | "FAILED"
  | "CANCELLED";

export type ZeepoAiPresentationSlide = {
  title?: string;
  body?: string;
  subtitle?: string;
  bullets?: string[];
  layout?: string;
};

export type ZeepoAiPresentationData = {
  title: string;
  theme?: string;
  slides: ZeepoAiPresentationSlide[];
};

export type ZeepoAiGeneration = {
  id: string;
  kind: ZeepoAiGenerationKind;
  status: ZeepoAiGenerationStatus;
  provider: string;
  modelId: string;
  messageId?: string;
  sessionId?: string;
  prompt?: string;
  title?: string;
  createdAt: string;
  imageUrl?: string;
  documentContent?: string;
  presentation?: ZeepoAiPresentationData;
  errorMessage?: string;
};

export type ZeepoAiActivePanel =
  | { type: "image"; generationId: string; url: string; prompt?: string; title?: string; failed?: boolean; errorMessage?: string }
  | { type: "document"; generationId: string; title: string; content: string }
  | { type: "presentation"; generationId: string; data: ZeepoAiPresentationData }
  | null;

export type ZeepoAiChatSession = {
  id: string;
  title: string;
  updatedAt: string;
  messages: ZeepoAiMessage[];
  generations: ZeepoAiGeneration[];
};

export type ZeepoAiSkill = {
  id: string;
  category: string;
  title: string;
  description: string;
  starterPrompt: string;
  available?: boolean;
};

/** Local fallback catalog when skills.list is unavailable. */
export const ZEEPO_AI_SKILLS: ZeepoAiSkill[] = [
  {
    id: "validate-business-idea",
    category: "STRATEGY",
    title: "Validate my business idea",
    description: "Describe your idea, get honest feedback on viability, risks, and next steps.",
    starterPrompt: "Help me validate this business idea: ",
  },
  {
    id: "define-value-proposition",
    category: "STRATEGY",
    title: "Define my value proposition",
    description: "Describe what you sell, get a clear “why you and not them” statement.",
    starterPrompt: "Help me define a sharp value proposition for: ",
  },
  {
    id: "review-pricing",
    category: "STRATEGY",
    title: "Review my pricing",
    description: "Share your current prices and costs, get feedback on pricing and margins.",
    starterPrompt: "Review my pricing model. Here’s what I charge today: ",
  },
  {
    id: "set-quarterly-goals",
    category: "STRATEGY",
    title: "Set quarterly goals",
    description: "Share where you are now, get 3–5 goals with milestones.",
    starterPrompt: "Help me set focused quarterly goals. Current stage: ",
  },
  {
    id: "brainstorm-business-names",
    category: "BRAND & IDENTITY",
    title: "Brainstorm business names",
    description: "Describe your business, get name ideas with domain tips.",
    starterPrompt: "Brainstorm brandable business names for: ",
  },
  {
    id: "define-brand-voice",
    category: "BRAND & IDENTITY",
    title: "Define my brand voice",
    description: "Answer a few questions, get a brand voice guide.",
    starterPrompt: "Help me define my brand voice. We serve: ",
  },
  {
    id: "pick-color-palette",
    category: "BRAND & IDENTITY",
    title: "Pick a color palette",
    description: "Describe your vibe, get palettes with hex codes and usage tips.",
    starterPrompt: "Suggest color palettes for a brand that feels: ",
  },
];

export function generationToPanel(
  g: ZeepoAiGeneration,
): NonNullable<ZeepoAiActivePanel> | null {
  if (g.kind === "image") {
    // Allow opening failed images to show error details
    if (g.status === "FAILED") {
      return {
        type: "image",
        generationId: g.id,
        url: "", // No image URL for failed generations
        prompt: g.prompt,
        title: g.title,
        failed: true,
        errorMessage: g.errorMessage,
      };
    }
    if (g.imageUrl) {
      return {
        type: "image",
        generationId: g.id,
        url: g.imageUrl,
        prompt: g.prompt,
        title: g.title,
      };
    }
  }
  if (g.kind === "document" && g.documentContent) {
    return {
      type: "document",
      generationId: g.id,
      title: g.title || "Document",
      content: g.documentContent,
    };
  }
  if (
    (g.kind === "presentation" || g.kind === "image-presentation") &&
    g.presentation
  ) {
    return {
      type: "presentation",
      generationId: g.id,
      data: g.presentation,
    };
  }
  return null;
}

export function compileClarifyingAnswers(
  questions: ZeepoAiClarifyingQuestion[],
  answers: string[],
): string {
  return questions
    .map((q, i) => `${i + 1}. ${q.question}\n   → ${answers[i] ?? "(no answer)"}`)
    .join("\n\n");
}

export function titleFromMessage(text: string): string {
  const cleaned = text.replace(/\s+/g, " ").trim();
  if (!cleaned) return "New chat";
  return cleaned.length > 56 ? `${cleaned.slice(0, 56)}…` : cleaned;
}

export function mapApiGeneration(row: {
  id: string;
  kind: string;
  status: string;
  provider: string;
  modelId: string;
  messageId?: string | null;
  sessionId?: string;
  prompt?: string | null;
  outputs?: unknown;
  createdAt: string | Date;
}): ZeepoAiGeneration {
  const outputs = (row.outputs ?? {}) as {
    document?: { title?: string; content?: string };
    presentation?: ZeepoAiPresentationData;
    imageUrl?: string;
    error?: string;
  };
  return {
    id: row.id,
    kind: row.kind,
    status: row.status as ZeepoAiGenerationStatus,
    provider: row.provider,
    modelId: row.modelId,
    messageId: row.messageId ?? undefined,
    sessionId: row.sessionId,
    prompt: row.prompt ?? undefined,
    title: outputs.document?.title ?? outputs.presentation?.title ?? row.prompt ?? undefined,
    createdAt:
      typeof row.createdAt === "string" ? row.createdAt : row.createdAt.toISOString(),
    documentContent: outputs.document?.content,
    presentation: outputs.presentation,
    imageUrl: outputs.imageUrl,
    errorMessage: outputs.error,
  };
}

export function mapApiMessage(
  row: {
    id: string;
    role: string;
    content?: string | null;
    reasoning?: string | null;
    status?: string | null;
    metadata?: unknown;
    createdAt: string | Date;
  },
  toolResults?: ZeepoAiToolResult[],
  attachments?: ZeepoAiMessageAttachment[],
): ZeepoAiMessage | null {
  if (row.role !== "user" && row.role !== "assistant") return null;
  const meta = (row.metadata ?? {}) as {
    feedback?: "like" | "dislike" | null;
    interrupted?: boolean;
    clarifyingQuestions?: ZeepoAiClarifyingQuestion[];
  };
  const status = (row.status ?? "complete") as ZeepoAiMessageStatus;
  return {
    id: row.id,
    role: row.role,
    content: row.content ?? "",
    createdAt:
      typeof row.createdAt === "string" ? row.createdAt : row.createdAt.toISOString(),
    reasoning: row.reasoning ?? undefined,
    status,
    reasoningStatus:
      status === "streaming"
        ? row.reasoning
          ? "streaming"
          : "idle"
        : row.reasoning
          ? "complete"
          : "idle",
    clarifyingQuestions: meta.clarifyingQuestions,
    toolResults: toolResults?.length ? toolResults : undefined,
    feedback: meta.feedback ?? null,
    interrupted: Boolean(meta.interrupted),
    attachments: attachments?.length ? attachments : undefined,
  };
}

export function mapApiToolInvocations(
  rows: Array<{
    id: string;
    messageId?: string | null;
    toolName: string;
    status?: string | null;
    result?: unknown;
  }>,
): Map<string, ZeepoAiToolResult[]> {
  const byMessage = new Map<string, ZeepoAiToolResult[]>();
  for (const row of rows) {
    if (!row.messageId || !row.result) continue;
    if (row.status && row.status !== "succeeded" && row.status !== "failed") continue;
    const list = byMessage.get(row.messageId) ?? [];
    list.push({
      toolName: row.toolName,
      toolUseId: row.id,
      result: row.result,
    });
    byMessage.set(row.messageId, list);
  }
  return byMessage;
}
