# Customer-Side Hosting   Security Measures

This document describes **all security measures** that protect customer-side hosting: how access is controlled, how ownership is enforced, and how we prevent customers from seeing or acting on other teams’ hosting resources.

---

## 1. Route & layout security

**Location:** `apps/npanel/src/app/(main)/[slug]/layout.tsx`

Customer hosting lives under `/{teamSlug}/hosting`. The `[slug]` layout runs **before** any page and enforces:

| Measure | Description |
|--------|-------------|
| **Agency slug block** | If `slug === "agency"`, redirect to `/agency/dashboard` so customer layout never runs for agency routes. |
| **Role check** | `requireRole(["CUSTOMER"])`   user must be authenticated and have role `CUSTOMER`. Non‑customers (e.g. agency) are redirected to the right dashboard. |
| **Agency user redirect** | If user has role containing `"AGENCY"`, redirect to `/agency/dashboard` so agency users cannot use customer routes. |
| **Team access** | `verifyTeamAccess(slug)` ensures the user is a **member** of the team for that slug (via `TeamMember`). If not, redirect to `/create-organization`. |
| **Team active** | Only teams with `isActive: true` are considered; inactive teams get no access. |

**Auth helpers (server):** `apps/npanel/src/lib/auth-server.ts`

- `requireRole(["CUSTOMER"])`: enforces login + ACTIVE account + CUSTOMER role; customers are ensured a team.
- `verifyTeamAccess(slug)`: loads team by slug, checks `TeamMember` for current user, updates `lastAccessedTeamId` and logs `TEAM_SWITCHED`.

**Result:** Only authenticated CUSTOMER users who are members of the given team can reach `/{teamSlug}/hosting` and its children.

---

## 2. List: which subscriptions the customer sees

**Location:** `packages/api/src/routers/plesk/subscriptions.ts`   `getByTeamFilterIds`

**Frontend:** `apps/npanel/src/app/(main)/[slug]/hosting/_components/use-hosting-subscriptions.ts`

### Backend

- **Auth:** `protectedProcedure`   requires valid session.
- **Input:** `teamId` (required), optional `hostingSubType` (e.g. `"WEB_HOSTING"`).
- **Logic:**
  1. Load **ServiceSubscription** rows where:
     - `teamId === input.teamId`
     - `niscServicePlan.planType === "HOSTING"`
     - optionally `niscServicePlan.hostingSubType === input.hostingSubType`
  2. From those, get linked **HostingSubscription** and their `pleskFilterId` values.
  3. If the team has no such subscriptions, return immediately with empty result and `hasServiceSubscriptions: false`.
  4. Otherwise call Plesk only for those filter IDs and return the filtered Plesk data.

So the list is **strictly team-scoped**: only subscriptions linked to that team via ServiceSubscription (and HostingSubscription) are ever requested from Plesk.

### Frontend

- **Team from URL:** Team slug is taken from pathname (`pathname.split("/")[1]`).
- **Team ID:** `trpc.teams.getTeamIdBySlug.useQuery({ slug: teamSlug })`   no Plesk call without a resolved team ID.
- **Query gating:** `getByTeamFilterIds` runs only when `!!teamData?.id`.
- **Subtype:** `hostingSubType: "WEB_HOSTING"` is passed so only web hosting subscriptions are shown.

**Result:** The customer only sees a list of Plesk subscriptions that belong to their team according to our DB (ServiceSubscription + HostingSubscription).

---

## 3. Detail: access to a single subscription

**Location:** `packages/api/src/routers/hosting.ts`   `getDetailWithSubscription`

**Frontend:** `apps/npanel/src/app/(main)/[slug]/hosting/_components/use-hosting-detail-batched.ts`  
**Page:** `apps/npanel/src/app/(main)/[slug]/hosting/_components/hosting-detail-page.tsx`

### Backend

- **Auth:** `protectedProcedure`   requires valid session.
- **Input:** `subscriptionId` (Plesk webspace id), optional `teamId` for ownership check.
- **Steps:**
  1. Fetch the subscription from Plesk by id (no team filter at Plesk level).
  2. Read `pleskFilterId` from the Plesk response (`filter-id`).
  3. **If `teamId` is provided (customer flow):**
     - If `pleskFilterId` is missing or empty:
       - Log **UNAUTHORIZED_RESOURCE_ACCESS** (resource not linked to any team).
       - Return **FORBIDDEN**.
     - Else:
       - Check **ServiceSubscription** for a row where:
         - `teamId === input.teamId`
         - `hostingSubscription.pleskFilterId === pleskFilterId`
         - `niscServicePlan.planType === "HOSTING"`
       - If no such row:
         - Log **UNAUTHORIZED_RESOURCE_ACCESS** (subscription does not belong to team).
         - Return **FORBIDDEN**.
  4. If ownership passes (or no teamId), return Plesk data plus subscription link / service subscription data.

So for customer requests we **always** pass `teamId`; the backend then ties the Plesk subscription to the team via HostingSubscription (pleskFilterId) and ServiceSubscription.

### Frontend

- **Team from URL:** Same as list   team slug from pathname, then `getTeamIdBySlug`.
- **Query gating:** `getDetailWithSubscription` runs only when `!!subscriptionId && !!teamData?.id`.
- **Ownership:** `teamId: teamData?.id` is sent so the backend can enforce the check above.
- **Errors:**
  - **FORBIDDEN** → render `<UnauthorizedAccess />` (no toast; no leak of resource details).
  - **NOT_FOUND** → render `<NotFoundPage />`.
  - Other errors → generic error UI and retry.

**Result:** A customer can only open the detail page for a subscription that (1) exists in Plesk and (2) is linked to their team in our DB. Otherwise they get FORBIDDEN or NOT_FOUND and never see the resource.

---

## 4. Unauthorized access logging

**Location:** `packages/api/src/routers/hosting.ts` (inside `getDetailWithSubscription`)

When access is denied we log to **UserActivityLog**:

- **Action:** `UNAUTHORIZED_RESOURCE_ACCESS`
- **Description:** Either “subscription not linked to any team” or “subscription does not belong to team”.
- **Metadata:** `resourceType: "hosting_subscription"`, `resourceId`, `teamId`, `pleskFilterId` (when available).

Logging is fire-and-forget so it does not affect response time.

---

## 5. UI security and error handling

### Unauthorized access component

**Location:** `apps/npanel/src/app/(main)/[slug]/hosting/_components/unauthorized-access.tsx`

- Shown when the detail API returns **FORBIDDEN**.
- Message is generic: “You do not have permission to access this hosting subscription. This resource belongs to a different team or account.”
- Does **not** reveal which resource or team.
- Provides a “Back to Hosting Subscriptions” link to `/{teamSlug}/hosting`.

### Not found

**Location:** `apps/npanel/src/app/(main)/[slug]/hosting/_components/not-found-page.tsx`

- Used when the subscription does not exist (NOT_FOUND).
- Keeps messaging generic so we don’t leak information.

### Detail page flow

**Location:** `apps/npanel/src/app/(main)/[slug]/hosting/_components/hosting-detail-page.tsx`

- Renders **UnauthorizedAccess** only for `error?.data?.code === "FORBIDDEN"`.
- Does **not** show toast for FORBIDDEN (handled silently by the component).
- All links and navigation use the team slug from the URL so the user stays in their team context.

---

## 6. Downstream operations (FTP, DNS, Mail, DB, WordPress, etc.)

**Location:** Various under `apps/npanel/src/app/(main)/[slug]/hosting/` (e.g. file manager, DNS table, mail table, databases, WordPress install).

- These features use **siteId** (Plesk subscription id) that comes from the **hosting detail** context.
- That **siteId** is only available after the user has successfully loaded the detail page, which in turn only succeeds if **getDetailWithSubscription** has already validated that this subscription belongs to the user’s team.
- So **no customer can obtain a valid siteId for another team’s subscription** through the normal UI; the list is team-filtered and the detail is team-gated.
- Plesk APIs (FTP, DNS, emails, databases, WordPress, etc.) are called with that same, already-validated siteId and the app’s Plesk credentials; they do not receive the user’s team id. **Ownership is enforced at list + detail level only**; downstream Plesk calls rely on the fact that the siteId was only ever exposed after passing the detail ownership check.

---

## 7. Data flow summary

```
User → [slug] layout
         → requireRole(["CUSTOMER"])
         → verifyTeamAccess(slug)  → only if member of team
         → children render

User → /{teamSlug}/hosting (list)
         → teamSlug from URL → getTeamIdBySlug
         → plesk.subscriptions.getByTeamFilterIds({ teamId, hostingSubType: "WEB_HOSTING" })
         → only ServiceSubscription + HostingSubscription for that team
         → Plesk returns only those subscriptions

User → /{teamSlug}/hosting/[id] (detail)
         → teamSlug from URL → getTeamIdBySlug
         → hosting.getDetailWithSubscription({ subscriptionId, teamId })
         → backend: load from Plesk, then check ServiceSubscription for (teamId, pleskFilterId)
         → if no access: FORBIDDEN + log UNAUTHORIZED_RESOURCE_ACCESS
         → if access: return data; UI uses same subscription for FTP/DNS/mail/etc.
```

---

## 8. Checklist of security measures

| # | Layer | Measure |
|---|--------|--------|
| 1 | Layout | Block `slug === "agency"` from customer layout. |
| 2 | Layout | Require CUSTOMER role; redirect others. |
| 3 | Layout | Verify team membership via `verifyTeamAccess(slug)`. |
| 4 | API list | List only subscriptions linked to the given `teamId` (ServiceSubscription + HostingSubscription). |
| 5 | API list | No Plesk call if team has no hosting subscriptions. |
| 6 | API detail | When `teamId` present, require non-empty `pleskFilterId` and matching ServiceSubscription. |
| 7 | API detail | Return FORBIDDEN on ownership failure; log UNAUTHORIZED_RESOURCE_ACCESS. |
| 8 | Frontend list | Resolve team from URL; gate all list queries on valid team ID. |
| 9 | Frontend detail | Pass `teamId` into detail query; gate on subscriptionId + teamId. |
| 10 | Frontend detail | Map FORBIDDEN to UnauthorizedAccess; no sensitive details in message. |
| 11 | Downstream | FTP/DNS/mail/DB/WordPress use siteId that was only exposed after detail ownership check. |

Together, these ensure **customers can only see and use hosting subscriptions that belong to their team** according to ServiceSubscription and HostingSubscription in our database.
