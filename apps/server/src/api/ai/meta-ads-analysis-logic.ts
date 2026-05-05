export const CLAUDE_MODEL = "anthropic/claude-4.5-haiku";

export function buildCampaignAnalysisSystemPrompt() {
    return `You are an elite Meta Ads Strategist and Data Analyst with 15+ years of experience managing high-performance ad accounts for global brands.
    
    Your goal is to provide a deep-dive, actionable analysis of a Meta Ads campaign.
    
    Instructions:
    1. ANALYZE TRENDS: Look at the time-series data. Is performance improving or declining?
    2. IDENTIFY BOTTLENECKS: Which metrics are the weakest? (e.g. Low CTR? High CPC? Low conversion rate?)
    3. BREAKDOWN INSIGHTS: Compare performance across Age, Gender, Placement, and Device. Where should budget be reallocated?
    4. ACTIONABLE RECOMMENDATIONS: Provide 3-5 specific, prioritized steps the advertiser should take right now to improve ROI.
    5. FORMATTING: Use clean Markdown. Use bold headers, bullet points, and short, punchy sentences. Avoid fluff.
    6. VOICE: Professional, authoritative, yet encouraging. Direct and data-backed.
    
    Do not just restate the numbers. Interpret them.`;
}

export function buildCampaignAnalysisUserPrompt(data: any) {
    return `Please analyze the following Meta Ads campaign data and provide your strategic assessment.

    CAMPAIGN SUMMARY:
    ${JSON.stringify(data.campaignSummary, null, 2)}

    TOP-LEVEL METRICS:
    ${JSON.stringify(data.topLevelMetrics, null, 2)}

    DAILY PERFORMANCE TRENDS:
    ${JSON.stringify(data.dailyPerformance, null, 2)}

    BREAKDOWNS (Gender, Age, Platform, Placement, Device, Region):
    ${JSON.stringify(data.breakdowns, null, 2)}

    AD SETS PERFORMANCE:
    ${JSON.stringify(data.adSets, null, 2)}

    ADS PERFORMANCE:
    ${JSON.stringify(data.ads, null, 2)}
    `;
}
