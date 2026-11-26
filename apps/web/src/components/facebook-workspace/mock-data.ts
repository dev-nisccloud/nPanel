export type MockAdAccountStatus = "ACTIVE" | "DISABLED" | "PAUSED";

export type MockAdAccount = {
  accountId: string;
  accountName: string;
  status: MockAdAccountStatus;
  currency: string;
};

export type MockCampaign = {
  id: string;
  accountId: string;
  name: string;
  status: "ACTIVE" | "PAUSED" | "DELETED";
  objective: string;
  start_time: string;
  stop_time: string | null;
  budget?: number;
  insights?: {
    reach: number;
    impressions: number;
    clicks: number;
    ctr: string;
    spend: number;
    results?: number;
    costPerResult?: number;
  };
};

export type MockFacebookPage = {
  id: string;
  name: string;
  color: string;
};

export type ScheduledContentKind = "post" | "reel" | "story";
export type ScheduledContentStatus = "draft" | "scheduled" | "published";
export type ScheduledMediaKind = "photo" | "video";

/** Facebook publishes a feed carousel in this array order, up to 10 cards. */
export const FACEBOOK_CAROUSEL_MAX = 10;

export type ScheduledMedia = {
  id: string;
  kind: ScheduledMediaKind;
  name: string;
  /** Blob or file URL from this session. Seed items use `color` when this is absent. */
  src?: string;
  color: string;
};

export type MockScheduledContent = {
  id: string;
  pageId: string;
  title: string;
  caption: string;
  kind: ScheduledContentKind;
  status: ScheduledContentStatus;
  /** Local date-time, no timezone suffix, so the clock time stays stable in the UI. */
  scheduledAt: string;
  /** Publish order. One item is a single photo or video. Two or more is a carousel. */
  media?: ScheduledMedia[];
};

export function contentMediaRule(kind: ScheduledContentKind): {
  max: number;
  kinds: ScheduledMediaKind[];
  hint: string;
} {
  if (kind === "reel") {
    return { max: 1, kinds: ["video"], hint: "A reel is one video." };
  }
  if (kind === "story") {
    return { max: 1, kinds: ["photo", "video"], hint: "A story is one photo or one video." };
  }
  return {
    max: FACEBOOK_CAROUSEL_MAX,
    kinds: ["photo", "video"],
    hint: "One photo or video, or a carousel of up to 10. Facebook publishes the cards in this order.",
  };
}

export function trimMediaForKind(media: ScheduledMedia[], kind: ScheduledContentKind) {
  const rule = contentMediaRule(kind);
  return media.filter((item) => rule.kinds.includes(item.kind)).slice(0, rule.max);
}

export const MOCK_AD_ACCOUNTS: MockAdAccount[] = [
  { accountId: "act_100284719", accountName: "Nisc Cloud Ads", status: "ACTIVE", currency: "KES" },
  { accountId: "act_100284720", accountName: "Retail Kenya", status: "ACTIVE", currency: "KES" },
  { accountId: "act_100284721", accountName: "Brand Launch", status: "PAUSED", currency: "USD" },
  { accountId: "act_100284722", accountName: "Campus Outreach", status: "DISABLED", currency: "KES" },
];

export const MOCK_CAMPAIGNS: MockCampaign[] = [
  {
    id: "cmp_1",
    accountId: "act_100284719",
    name: "Q4 Cloud Hosting Awareness",
    status: "ACTIVE",
    objective: "OUTCOME_AWARENESS",
    start_time: "2026-09-01T00:00:00.000Z",
    stop_time: null,
    budget: 200000,
    insights: {
      reach: 184320,
      impressions: 412880,
      clicks: 7597,
      ctr: "1.84",
      spend: 186450,
      results: 8240,
      costPerResult: 22.63,
    },
  },
  {
    id: "cmp_2",
    accountId: "act_100284719",
    name: "WordPress Migration Leads",
    status: "ACTIVE",
    objective: "OUTCOME_LEADS",
    start_time: "2026-08-12T00:00:00.000Z",
    stop_time: "2026-10-31T00:00:00.000Z",
    budget: 100000,
    insights: {
      reach: 64210,
      impressions: 151004,
      clicks: 3639,
      ctr: "2.41",
      spend: 92400,
      results: 427,
      costPerResult: 216.39,
    },
  },
  {
    id: "cmp_3",
    accountId: "act_100284719",
    name: "Domain Renewal Retargeting",
    status: "PAUSED",
    objective: "OUTCOME_SALES",
    start_time: "2026-07-04T00:00:00.000Z",
    stop_time: "2026-09-15T00:00:00.000Z",
    budget: 35000,
    insights: {
      reach: 22140,
      impressions: 50880,
      clicks: 468,
      ctr: "0.92",
      spend: 31250,
      results: 34,
      costPerResult: 919.12,
    },
  },
  {
    id: "cmp_4",
    accountId: "act_100284719",
    name: "Always-on Brand Search",
    status: "ACTIVE",
    objective: "OUTCOME_TRAFFIC",
    start_time: "2026-01-15T00:00:00.000Z",
    stop_time: null,
  },
  {
    id: "cmp_5",
    accountId: "act_100284720",
    name: "Weekend Store Traffic",
    status: "ACTIVE",
    objective: "OUTCOME_TRAFFIC",
    start_time: "2026-09-18T00:00:00.000Z",
    stop_time: null,
    budget: 60000,
    insights: {
      reach: 90340,
      impressions: 210550,
      clicks: 6569,
      ctr: "3.12",
      spend: 54800,
      results: 1847,
      costPerResult: 29.67,
    },
  },
  {
    id: "cmp_6",
    accountId: "act_100284720",
    name: "Catalog Sales — Nairobi",
    status: "ACTIVE",
    objective: "OUTCOME_SALES",
    start_time: "2026-08-01T00:00:00.000Z",
    stop_time: "2026-11-01T00:00:00.000Z",
    budget: 150000,
    insights: {
      reach: 44120,
      impressions: 98010,
      clicks: 1519,
      ctr: "1.55",
      spend: 120300,
      results: 89,
      costPerResult: 1351.69,
    },
  },
  {
    id: "cmp_7",
    accountId: "act_100284721",
    name: "Launch Teaser",
    status: "PAUSED",
    objective: "OUTCOME_ENGAGEMENT",
    start_time: "2026-06-20T00:00:00.000Z",
    stop_time: "2026-07-20T00:00:00.000Z",
    budget: 10000,
    insights: {
      reach: 12004,
      impressions: 24080,
      clicks: 116,
      ctr: "0.48",
      spend: 8900,
      results: 324,
      costPerResult: 27.47,
    },
  },
  {
    id: "cmp_8",
    accountId: "act_100284722",
    name: "Student Open Day",
    status: "DELETED",
    objective: "OUTCOME_AWARENESS",
    start_time: "2026-03-01T00:00:00.000Z",
    stop_time: "2026-03-20T00:00:00.000Z",
  },
];

export const MOCK_FACEBOOK_PAGES: MockFacebookPage[] = [
  { id: "page_1", name: "Nisc Cloud", color: "#1877F2" },
  { id: "page_2", name: "Nisc Shop", color: "#E11D48" },
  { id: "page_3", name: "Events KE", color: "#16A34A" },
  { id: "page_4", name: "Support Desk", color: "#7C3AED" },
  { id: "page_5", name: "Campus", color: "#EA580C" },
  { id: "page_6", name: "Community", color: "#0891B2" },
  { id: "page_7", name: "Careers", color: "#CA8A04" },
  { id: "page_8", name: "Partners", color: "#0F766E" },
];

export const MOCK_SCHEDULED_CONTENT: MockScheduledContent[] = [
  {
    id: "cnt_1",
    pageId: "page_1",
    title: "September recap",
    caption: "A short look at uptime, new plans, and what shipped in September.",
    kind: "post",
    status: "published",
    scheduledAt: "2026-10-01T09:00:00",
    media: [
      { id: "med_1a", kind: "photo", name: "Uptime chart", color: "#0F766E" },
      { id: "med_1b", kind: "photo", name: "New plans", color: "#1877F2" },
      { id: "med_1c", kind: "video", name: "What shipped", color: "#111827" },
    ],
  },
  {
    id: "cnt_2",
    pageId: "page_1",
    title: "Hosting myth, busted",
    caption: "60 seconds on why shared hosting is not always the cheaper choice.",
    kind: "reel",
    status: "scheduled",
    scheduledAt: "2026-10-02T11:30:00",
    media: [{ id: "med_2", kind: "video", name: "Hosting myth", color: "#4C1D95" }],
  },
  {
    id: "cnt_3",
    pageId: "page_1",
    title: "Behind the racks",
    caption: "A quiet walk through the Nairobi cage before the Q4 push.",
    kind: "story",
    status: "draft",
    scheduledAt: "2026-10-03T15:00:00",
    media: [{ id: "med_3", kind: "photo", name: "Nairobi cage", color: "#92400E" }],
  },
  {
    id: "cnt_4",
    pageId: "page_2",
    title: "Weekend sale",
    caption: "Domains and email at 15% off through Sunday.",
    kind: "post",
    status: "scheduled",
    scheduledAt: "2026-10-04T14:00:00",
    media: [{ id: "med_4", kind: "photo", name: "Weekend sale", color: "#BE123C" }],
  },
  {
    id: "cnt_5",
    pageId: "page_1",
    title: "Q4 cloud checklist",
    caption: "Five things to check before traffic picks up: backups, SSL, DNS, PHP, and mail.",
    kind: "post",
    status: "scheduled",
    scheduledAt: "2026-10-05T09:00:00",
  },
  {
    id: "cnt_6",
    pageId: "page_1",
    title: "Migration in 60s",
    caption: "How we move a WordPress site without the downtime story.",
    kind: "reel",
    status: "scheduled",
    scheduledAt: "2026-10-05T16:00:00",
  },
  {
    id: "cnt_7",
    pageId: "page_1",
    title: "Domain renewal reminder",
    caption: "Renew before the grace period. Here is what happens if you wait.",
    kind: "post",
    status: "scheduled",
    scheduledAt: "2026-10-06T10:00:00",
  },
  {
    id: "cnt_8",
    pageId: "page_2",
    title: "New arrivals",
    caption: "Themes and plugins we actually recommend this month.",
    kind: "reel",
    status: "scheduled",
    scheduledAt: "2026-10-07T11:00:00",
  },
  {
    id: "cnt_9",
    pageId: "page_1",
    title: "Customer spotlight",
    caption: "How a Nairobi retailer moved checkout week without a blip.",
    kind: "story",
    status: "scheduled",
    scheduledAt: "2026-10-08T13:00:00",
  },
  {
    id: "cnt_10",
    pageId: "page_3",
    title: "Open day",
    caption: "Campus tour this Friday. Stories from the floor.",
    kind: "story",
    status: "scheduled",
    scheduledAt: "2026-10-09T17:00:00",
  },
  {
    id: "cnt_11",
    pageId: "page_1",
    title: "WordPress speed tips",
    caption: "Cache, images, and the one plugin we keep turning off.",
    kind: "post",
    status: "scheduled",
    scheduledAt: "2026-10-10T09:30:00",
    media: [{ id: "med_11", kind: "video", name: "Speed tips", color: "#1E3A8A" }],
  },
  {
    id: "cnt_12",
    pageId: "page_1",
    title: "New data center",
    caption: "A first look at the extra capacity going live this quarter.",
    kind: "reel",
    status: "scheduled",
    scheduledAt: "2026-10-14T18:00:00",
  },
  {
    id: "cnt_13",
    pageId: "page_1",
    title: "Black Friday teaser",
    caption: "Draft only. Pricing still needs a pass.",
    kind: "post",
    status: "draft",
    scheduledAt: "2026-10-18T08:30:00",
  },
  {
    id: "cnt_14",
    pageId: "page_1",
    title: "Support hours update",
    caption: "Chat stays open later on weekdays through December.",
    kind: "post",
    status: "scheduled",
    scheduledAt: "2026-10-22T12:00:00",
  },
  {
    id: "cnt_15",
    pageId: "page_1",
    title: "Welcome October",
    caption: "What we are shipping this month, in one post.",
    kind: "post",
    status: "published",
    scheduledAt: "2026-09-29T10:00:00",
  },
  {
    id: "cnt_16",
    pageId: "page_1",
    title: "November kickoff",
    caption: "Renewals, migrations, and the holiday freeze window.",
    kind: "post",
    status: "scheduled",
    scheduledAt: "2026-11-02T09:00:00",
  },
];
