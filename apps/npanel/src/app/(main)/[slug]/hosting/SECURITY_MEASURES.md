# Customer-Side Hosting Security Measures

This document lists all security measures and filters in place to protect hosting resources and prevent customers from accessing wrong hosting resources.

## 1. API-Level Security (Backend)

### A. Ownership Verification in `getDetailWithSubscription` Endpoint
**Location:** `packages/api/src/routers/hosting.ts`

**Measures:**
- **Team ID Verification**: When `teamId` is provided, the endpoint verifies that the hosting subscription belongs to that team
- **Plesk Filter ID Check**: If `pleskFilterId` is empty or missing, access is immediately denied
- **ServiceSubscription Ownership Check**: Uses efficient database query to verify ownership via `ServiceSubscription` table:
  ```typescript
  const hasAccess = await prisma.serviceSubscription.findFirst({
    where: {
      teamId: input.teamId,
      hostingSubscription: {
        pleskFilterId: pleskFilterId,
      },
      niscServicePlan: {
        planType: "HOSTING",
      },
    },
  });
  ```
- **Unauthorized Access Logging**: All unauthorized access attempts are logged to `UserActivityLog` with action `UNAUTHORIZED_RESOURCE_ACCESS`
- **Error Response**: Returns `FORBIDDEN` error code when access is denied

### B. Filtered Subscription List via `getByTeamFilterIds`
**Location:** `packages/api/src/routers/plesk/subscriptions.ts`

**Measures:**
- **Team-Based Filtering**: Only returns subscriptions that belong to the specified `teamId`
- **Hosting Subtype Filtering**: Filters by `hostingSubType` (e.g., "WEB_HOSTING") to ensure customers only see relevant subscriptions
- **ServiceSubscription Verification**: Checks `ServiceSubscription` table to ensure team ownership before fetching Plesk data
- **Early Return**: If team has no service subscriptions, returns early without querying Plesk
- **Filter ID Validation**: Only includes subscriptions with valid `pleskFilterId` values

## 2. Frontend-Level Security

### A. Team ID Extraction and Verification
**Location:** `apps/npanel/src/app/(main)/[slug]/hosting/_components/use-hosting-subscriptions.ts`

**Measures:**
- **Team Slug Extraction**: Extracts team slug from URL pathname
- **Team ID Lookup**: Uses `trpc.teams.getTeamIdBySlug.useQuery` to get team ID from slug
- **Query Gating**: Only executes Plesk query when `teamId` is available
- **Hosting Subtype Filter**: Passes `hostingSubType: "WEB_HOSTING"` to filter subscriptions

### B. Detail Page Ownership Verification
**Location:** `apps/npanel/src/app/(main)/[slug]/hosting/_components/use-hosting-detail-batched.ts`

**Measures:**
- **Team ID Passing**: Extracts team slug and converts to team ID before making detail query
- **Ownership Verification**: Passes `teamId` to `getDetailWithSubscription` endpoint for backend verification
- **Query Gating**: Only executes query when both `subscriptionId` and `teamId` are available
- **Error Handling**: Handles `FORBIDDEN` errors by showing `UnauthorizedAccess` component

### C. Route-Level Protection
**Location:** `apps/npanel/src/app/(main)/[slug]/layout.tsx`

**Measures:**
- **Role Verification**: Uses `requireRole(["CUSTOMER"])` to ensure only customers can access
- **Agency User Blocking**: Redirects agency users away from customer routes
- **Team Access Verification**: Uses `verifyTeamAccess(slug)` to ensure user has access to the team
- **Slug Validation**: Prevents `/agency` routes from matching customer `[slug]` layout

## 3. UI-Level Security

### A. Unauthorized Access Component
**Location:** `apps/npanel/src/app/(main)/[slug]/hosting/_components/unauthorized-access.tsx`

**Measures:**
- **Error Display**: Shows user-friendly message when access is denied
- **No Resource Details**: Does not reveal information about the resource that was denied

### B. Detail Page Error Handling
**Location:** `apps/npanel/src/app/(main)/[slug]/hosting/_components/hosting-detail-page.tsx`

**Measures:**
- **FORBIDDEN Error Handling**: Shows `UnauthorizedAccess` component when `FORBIDDEN` error is received
- **NOT_FOUND Error Handling**: Shows `NotFoundPage` component for non-existent resources
- **Team Slug Extraction**: Extracts team slug from pathname for navigation

## 4. Custom Logic for Customer Side

### A. Empty State with Pricing Plans
**Location:** `apps/npanel/src/app/(main)/[slug]/hosting/_components/hosting-data-table.tsx`

**Measures:**
- **Service Subscription Check**: Checks `hasServiceSubscriptions` flag from API
- **Pricing Display**: Shows `HostingPricing` component when team has no service subscriptions
- **Empty State Message**: Shows appropriate message when subscriptions exist but no Plesk data is found

### B. Pricing Plan Loading
**Location:** `apps/npanel/src/app/(main)/[slug]/hosting/_components/hosting-pricing.tsx`

**Measures:**
- **Active Plans Only**: Only loads active hosting plans (`isActive: true`)
- **Hosting Subtype Filter**: Filters to `WEB_HOSTING` subtype only
- **Plan Type Filter**: Filters to `HOSTING` plan type

## Summary

All customer-side hosting access is protected by:
1. **Backend ownership verification** via ServiceSubscription table
2. **Team-based filtering** at the API level
3. **Route-level authentication** and role checks
4. **Frontend team ID extraction** and passing to backend
5. **Error handling** that prevents information leakage
6. **Query gating** that prevents unnecessary API calls

These measures ensure customers can only access hosting resources that belong to their team.
