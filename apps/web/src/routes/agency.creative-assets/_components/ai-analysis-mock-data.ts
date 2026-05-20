/**
 * Mock payloads for AI image analysis UI until the analyzer + DB reads are wired.
 *
 * Maps to DB columns on `creative_asset_ai_analysis`:
 * - `overall_rating_scale_max`, `overall_rating_value`, `overall_rating_reason`, `overall_rating_band`,
 *   `confidence_score`, `summary`
 * - Detail dimensions / bullets also mirrored in `result` (jsonb) when persisted.
 */

export type MockAiScore = {
  id: string;
  label: string;
  value: number;
  max: number;
  note: string;
};

export type MockAiSection = {
  title: string;
  body: string;
};

export type MockAiLatest = {
  headline: string;
  modelLabel: string;
  /** Denominator for headline score (persisted as overall_rating_scale_max) */
  overallRatingScaleMax: number;
  /** Headline score — persisted as overall_rating_value */
  overallRatingValue: number;
  /** Persisted as overall_rating_reason */
  overallRatingReason: string;
  /** Optional tier — persisted as overall_rating_band */
  overallRatingBand: string | null;
  /** 0–1 when available — persisted as confidence_score */
  confidenceScore: number | null;
  /** One-line card copy — persisted as summary */
  ratingSummary: string;
  /** Supporting narrative (can overlap with reason; often a shorter “context” blurb) */
  overallSummary: string;
  scores: MockAiScore[];
  sections: MockAiSection[];
  recommendations: string[];
};

export type MockAiHistoryItem = {
  id: string;
  createdAtLabel: string;
  /** e.g. "Internal v12" */
  versionLabel: string;
  summary: string;
  status: "COMPLETED" | "FAILED";
  /** Optional snippet when expanded / row detail */
  detail?: string;
  /** When COMPLETED, mirrors DB overall_rating_value / scale */
  overallRatingValue?: number;
  overallRatingScaleMax?: number;
  overallRatingBand?: string | null;
  /**
   * Full analysis payload for the history detail sheet (matches Latest tab layout).
   * Omitted when FAILED or legacy rows.
   */
  analysisDetail?: MockAiLatest | null;
};

export type MockAiBundle = {
  latest: MockAiLatest;
  history: MockAiHistoryItem[];
};

export function buildMockAiAnalysis(params: {
  fileName: string;
  creativeAssetId: string;
  versionId: string;
  internalVersionNumber: number;
}): MockAiBundle {
  const { fileName, creativeAssetId, versionId, internalVersionNumber } = params;
  const versionLabel = `Internal v${internalVersionNumber}`;

  const ratingScale = 10;
  const ratingValue = 8.4;
  const ratingReason =
    "We land at 8.4/10 because visual hierarchy and technical sharpness are reliably strong for paid social, while text-on-image zones and right-edge crowding keep the score from the top decile. Fixing crop balance and verifying contrast on the smallest placements would likely add another half point.";

  const latest: MockAiLatest = {
    headline: `Analysis · ${fileName}`,
    modelLabel: "Mock · vision-lite v0 (placeholder)",
    overallRatingScaleMax: ratingScale,
    overallRatingValue: ratingValue,
    overallRatingReason: ratingReason,
    overallRatingBand: "STRONG",
    confidenceScore: 0.82,
    ratingSummary: `${ratingValue.toFixed(1)}/${ratingScale} · Strong social-ready creative with minor crop and accessibility caveats`,
    overallSummary:
      "Beyond the headline score: composition reads quickly at thumbnail size, palette feels on-brief, and export quality is adequate for web—see dimension scores for where to polish.",
    scores: [
      {
        id: "composition",
        label: "Composition & balance",
        value: 82,
        max: 100,
        note: "Rule-of-thirds adherence is good; edge tension on the lower-right quadrant.",
      },
      {
        id: "brand",
        label: "Brand & tone fit",
        value: 76,
        max: 100,
        note: "Professional and approachable—verify logo clear space in tighter crops.",
      },
      {
        id: "technical",
        label: "Technical quality",
        value: 88,
        max: 100,
        note: "Sharp edges, acceptable noise profile for web delivery resolutions.",
      },
      {
        id: "accessibility",
        label: "Clarity / accessibility",
        value: 71,
        max: 100,
        note: "Text-on-image zones may need WCAG AAA review if legcopy is finalized.",
      },
    ],
    sections: [
      {
        title: "Visual hierarchy",
        body:
          "Primary subject reads within ~1 second at thumbnail scale. Secondary elements compete mildly with the headline lockup when scaled below 320px width.",
      },
      {
        title: "Campaign readiness",
        body:
          "Safe zones look adequate for Meta 4:5 and 1:1 after a light reposition. Carousel frame 2 may need alternate crop if headline remains left-aligned.",
      },
      {
        title: "Risks & watchouts",
        body:
          "Fine decorative lines may shimmer on compressed JPEG routes; prefer WebP export for crispness when possible.",
      },
    ],
    recommendations: [
      "Shift focal weight 5–8% left to balance negative space before final handoff.",
      "Export alternate 1080×1080 crop with tighter vertical padding for Stories.",
      "Add a subdued scrim layer behind eyebrow copy if localization lengthens headline strings.",
      "Archive this run alongside client feedback—the history tab will surface past analyses for asset " +
        creativeAssetId.slice(0, 8) +
        "… once persistence is enabled.",
      "This preview uses version ID " +
        versionId.slice(0, 8) +
        "… (" +
        versionLabel +
        "); re-runs append new rows linked to creative_asset_ai_analysis.",
    ],
  };

  const history1Detail: MockAiLatest = {
    headline: `Historical analysis · ${fileName}`,
    modelLabel: "Mock · vision-lite v0 (May 18 run)",
    overallRatingScaleMax: 10,
    overallRatingValue: 7.9,
    overallRatingReason:
      "A 7.9 reflects solid composition and brand fit, but the 9:16 crop introduced edge crowding and the footer legibility band missed ideal contrast for hero text-on-image. Addressing those two areas would likely push this into the low 8s.",
    overallRatingBand: "GOOD",
    confidenceScore: 0.76,
    ratingSummary:
      "7.9/10 · Strong foundation; minor crop/contrast friction vs the current baseline.",
    overallSummary:
      "Compared with the newest run: dimension scores dipped slightly on accessibility and balance—still release-capable with a tightened crop preset.",
    scores: [
      {
        id: "composition",
        label: "Composition & balance",
        value: 78,
        max: 100,
        note: "9:16 safe zone overlaps right-edge focal weight.",
      },
      {
        id: "brand",
        label: "Brand & tone fit",
        value: 74,
        max: 100,
        note: "Palette remains on-brief; logo clear space tighter than ideal.",
      },
      {
        id: "technical",
        label: "Technical quality",
        value: 86,
        max: 100,
        note: "Clean rasterization; JPEG grain mild in gradients.",
      },
      {
        id: "accessibility",
        label: "Clarity / accessibility",
        value: 63,
        max: 100,
        note: "Footer typography contrast flagged as marginal on dark overlays.",
      },
    ],
    sections: [
      {
        title: "Visual hierarchy",
        body:
          "Thumbnail read resolves in ~1.2s; eyebrow treatment competes with product lockup below 375px widths.",
      },
      {
        title: "Campaign readiness",
        body:
          "Stories placement needs 12px inward nudge left; Feed 4:5 only needs vertical trim on frame 3.",
      },
      {
        title: "Residual risks",
        body:
          "Localized longer headlines may collide with SKU chip—plan overflow rules before launch.",
      },
    ],
    recommendations: [
      "Re-export Stories master with −4% horizontal scale on foreground subject.",
      "Add 8% scrim under footer band or switch to high-contrast subhead style.",
      "Re-run analysis after contrast pass to confirm accessibility dimension clears 70+.",
    ],
  };

  const history2Detail: MockAiLatest = {
    headline: `Historical analysis · ${fileName}`,
    modelLabel: "Mock · vision-lite v0 (May 12 run)",
    overallRatingScaleMax: 10,
    overallRatingValue: 7.4,
    overallRatingReason:
      "7.4 captures a competent first-pass creative: composition and technical quality are ahead of brand/accessibility tuning, which is typical right after upload before reviewer feedback.",
    overallRatingBand: "GOOD",
    confidenceScore: 0.71,
    ratingSummary: "7.4/10 · Baseline upload pass — strong structure, refinements still pending.",
    overallSummary:
      "This run predates crop refinements; expect lower balance and brand scores until brand kit overlays are applied.",
    scores: [
      {
        id: "composition",
        label: "Composition & balance",
        value: 72,
        max: 100,
        note: "Center-weighted layout works for feed; Stories needs reframing.",
      },
      {
        id: "brand",
        label: "Brand & tone fit",
        value: 68,
        max: 100,
        note: "Awaiting final logo lockup and official gradient stops.",
      },
      {
        id: "technical",
        label: "Technical quality",
        value: 84,
        max: 100,
        note: "Adequate resolution for digital; slight banding risk in skies.",
      },
      {
        id: "accessibility",
        label: "Clarity / accessibility",
        value: 60,
        max: 100,
        note: "Initial pass—text stacks not yet audited for WCAG.",
      },
    ],
    sections: [
      {
        title: "First impressions",
        body:
          "Readable at thumbnail with clear product emphasis; whitespace feels generous versus current brand guidelines.",
      },
      {
        title: "Production notes",
        body:
          "Export uses sRGB JPEG q85 — acceptable MVP; migrate to WebP for hero carousel after approval.",
      },
    ],
    recommendations: [
      "Align headline grid to updated design tokens before second review.",
      "Schedule accessibility sweep once localized copydeck is merged.",
      "Bump export quality one notch if heavy sky gradients remain in finals.",
    ],
  };

  const history: MockAiHistoryItem[] = [
    {
      id: "mock-history-1",
      createdAtLabel: "May 18, 2026 · 4:22 PM",
      versionLabel,
      summary:
        "7.9/10 · Earlier pass flagged minor crop risk on 9:16; accessibility slightly weaker than today's run.",
      status: "COMPLETED",
      detail: "Compared to today's mock result, typography contrast in the footer band was flagged as marginal.",
      overallRatingValue: 7.9,
      overallRatingScaleMax: 10,
      overallRatingBand: "GOOD",
      analysisDetail: history1Detail,
    },
    {
      id: "mock-history-2",
      createdAtLabel: "May 12, 2026 · 11:06 AM",
      versionLabel: `Internal v${Math.max(1, internalVersionNumber - 1)}`,
      summary: "7.4/10 · Baseline analysis after asset upload — composition strong, palette neutral.",
      status: "COMPLETED",
      overallRatingValue: 7.4,
      overallRatingScaleMax: 10,
      overallRatingBand: "GOOD",
      analysisDetail: history2Detail,
    },
    {
      id: "mock-history-3",
      createdAtLabel: "May 2, 2026 · 9:51 AM",
      versionLabel: `Internal v${Math.max(1, internalVersionNumber - 2)}`,
      summary: "Provider timeout (mock FAILED row in history).",
      status: "FAILED",
      detail: "Simulated outage — no charges; safe to retry. Real failures will persist error_message.",
    },
  ];

  return { latest, history };
}
