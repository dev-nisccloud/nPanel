/**
 * Compatibility shim — prefer importing from zeepo-ai-types.
 * Kept so any lingering mock imports resolve during the API cutover.
 */
export {
  ZEEPO_AI_SKILLS,
  compileClarifyingAnswers,
  generationToPanel,
  mapApiGeneration,
  mapApiMessage,
  titleFromMessage,
  type ZeepoAiActivePanel,
  type ZeepoAiChatSession,
  type ZeepoAiClarifyingQuestion,
  type ZeepoAiGeneration,
  type ZeepoAiGenerationKind,
  type ZeepoAiGenerationStatus,
  type ZeepoAiMessage,
  type ZeepoAiMessageRole,
  type ZeepoAiMessageStatus,
  type ZeepoAiPresentationData,
  type ZeepoAiPresentationSlide,
  type ZeepoAiReasoningStatus,
  type ZeepoAiSkill,
} from "@/components/zeepo/zeepo-ai-types";
