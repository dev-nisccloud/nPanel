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

export const FACEBOOK_WORKSPACE_CONNECTED_KEY = "npanel_facebook_workspace_connected";
