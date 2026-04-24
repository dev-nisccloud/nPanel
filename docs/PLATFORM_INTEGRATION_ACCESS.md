# Platform Integration Access Map

This document tracks endpoint intent for the future model:

- Admin/agency users connect and manage platform tokens.
- Allowed team users consume linked assets/accounts without owning the OAuth connection.

## Agency Token Management Endpoints

These are intentionally restricted to agency roles and should remain so.

- `social-media-marketing/linkedin/auth.ts`
  - `generateToken`
  - `refreshToken`
  - `generateAuthUrl`
  - `getStoredCredentials`
- `social-media-marketing/meta/auth.ts`
  - `generateToken`
  - `getPageToken`
  - `generateAuthUrl`
  - `getStoredCredentials`
- `google-ads/auth.ts`
  - `generateAuthUrl`
  - `generateToken`
  - `getStoredCredentials`
  - `revokeToken`
- `linkedin-ads/auth.ts`
  - `getStoredCredentials`
  - `generateAuthUrl`
- `meta-ads/auth.ts`
  - `getStoredCredentials`

## Team-Scoped Consumption Endpoints

These support team-shared usage:
- agency can access globally
- non-agency can access only linked team-scoped resources they can read

- `social-media-marketing/linkedin/pages-list.ts`
  - `getOrganizations`
  - `getPageTokenId`
  - `getOrganization`
- `social-media-marketing/meta/pages-list.ts`
  - `getPages`
  - `getPageTokenId`
  - `getPage`
  - `getPageInsights`
- `meta-ads/accounts.ts`
  - `listAdAccounts`
  - `getAccountDetails`
  - `getConnectedInstagramAccounts`
- `google-ads/accounts.ts`
  - `listAccessibleAccounts`
  - `getAccountDetails`
- `google-ads/campaigns.ts`
  - `listCampaigns`
  - `getCampaignDetails`
  - `getCampaignTargeting`
  - `getBulkAdGroupTargeting`
- `google-ads/ad-groups.ts`
  - `listAdGroups`
- `google-ads/ads.ts`
  - `listAds`
  - `listAdsBulk`
- `google-ads/insights.ts`
  - `getDailyPerformance`
  - `getBreakdowns`
  - `getKeywordsPerformance`
  - `getNetworkBreakdown`
  - `getTimeOfDayBreakdown`

## Shared Access Helpers

- `google-ads/access.ts`
  - `getGoogleAdsExecutionContext(...)` enforces:
    - agency: latest active integration flow
    - non-agency: team-linked account checks before integration use

## Guardrail Notes

- Never expose raw OAuth token generation/refresh to non-agency users.
- For non-agency users, resource lookup should always anchor on:
  - linked account/page/org token record
  - accessible team relation (`teamMember` or team creator)
- If a new router uses platform APIs, classify it in this file as either:
  - `Agency Token Management`
  - `Team-Scoped Consumption`
