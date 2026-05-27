# Google Sign-In Setup   GCP to Code

This guide covers everything needed to add "Continue with Google" to nPanel.  
The app uses **Better Auth** for authentication and deploys both services  
(`npanel-server`, `npanel-web`) to **Google Cloud Run** via GitHub Actions.

---

## What you will have when this is done

- Users can click **Continue with Google** on the login and register pages.
- A Google account signs in or creates a new nPanel account automatically.
- Works in local development and production (Cloud Run).
- One OAuth client serves every customer   no per-customer configuration.

---

## Part 1   Google Cloud Console (GCP)

Complete these steps in the GCP console **before touching any code**.

### Step 1.1   Choose which GCP project to use

Your deploy pipeline uses **two separate GCP projects** for Cloud Run:
- Staging → `GCP_PROJECT_ID` (GitHub secret)
- Production → `GCP_PROJECT_ID_PRODUCTION` (GitHub secret)

OAuth credentials (Client ID + Secret) are **not tied to a Cloud Run project**   they are just values you store in environment variables. So you have two sensible options:

**Option A   One OAuth client for everything (recommended for most teams)**  
Create the OAuth consent screen and client in your **production** GCP project. Add all redirect URIs (local, staging, and production) to that single client. Both staging and production Cloud Run services use the same `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET`. Simpler to manage.

**Option B   One OAuth client per project (isolated environments)**  
Create a separate OAuth client in each project (one in the staging project, one in the production project). Staging and production get different credentials. More work to set up but staging tokens are completely isolated from production.

For most teams Option A is fine. The steps below assume Option A.

1. Open [console.cloud.google.com](https://console.cloud.google.com).
2. Click the project picker at the top left and select your **production** GCP project (the one matching `GCP_PROJECT_ID_PRODUCTION`).
3. Note the **Project ID**   you will see it in the project picker once selected.

---

### Step 1.2   Enable the Google Identity API (one-time)

1. Go to **APIs & Services → Library**.
2. Search for **"Google Identity"** and select **Google Identity Toolkit API** (also listed as **Identity Platform**).
3. Click **Enable**.

> If you skip this, the OAuth screen may still work for basic OAuth sign-in   but enabling it is best practice.

---

### Step 1.3   Configure the OAuth consent screen (one-time)

This is the page users see when they click "Continue with Google".

1. Go to **APIs & Services → OAuth consent screen**.
2. Select **External** (allows any Google account   your customers).  
   *(Internal restricts sign-in to your own Google Workspace org.)*
3. Click **Create** and fill in:

   | Field | Value |
   |-------|-------|
   | App name | `nPanel` (or your brand name) |
   | User support email | your email address |
   | App logo | upload your logo (optional but recommended) |
   | App domain   Homepage | your production URL, e.g. `https://npanel.example.com` |
   | App domain   Privacy policy | link to your privacy policy (required for production) |
   | App domain   Terms of service | link to your terms of service |
   | Developer contact email | your email address |

4. Click **Save and Continue**.

5. **Scopes**   click **Add or Remove Scopes** and add:
   - `openid`
   - `email`
   - `profile`

   These three are all Better Auth needs for Google sign-in. Do **not** add any other scopes unless you have a specific reason.

6. Click **Save and Continue**.

7. **Test users**   while the app is in *Testing* status, only listed email addresses can sign in. Add your own email and any teammates who need to test.  
   *(You will change this to "In production" in Step 1.6 when ready for real users.)*

8. Click **Save and Continue** → **Back to Dashboard**.

---

### Step 1.4   Create the OAuth 2.0 Client ID

1. Go to **APIs & Services → Credentials**.
2. Click **+ Create Credentials → OAuth client ID**.
3. Set **Application type** to **Web application**.
4. Set **Name** to something descriptive, e.g. `nPanel Web (Sign In)`.
5. Under **Authorized redirect URIs**, add **all of the following**:

   | Environment | URI |
   |-------------|-----|
   | Local dev | `http://localhost:5173/api/auth/callback/google` (or your Vite dev port) |
   | Staging (Cloud Run web) | `https://<your-npanel-web-staging-url>/api/auth/callback/google` |
   | Production (Cloud Run web) | `https://<your-npanel-web-production-url>/api/auth/callback/google` |
   | Custom domain (if you have one) | `https://<your-custom-domain>/api/auth/callback/google` |

   > The callback must use the **user-facing web origin** (`npanel-web`), not `npanel-server`.
   > Production proxies `/api/*` on the web service to the API so OAuth state cookies stay
   > first-party (see [Better Auth cookies / cross-domain](https://www.better-auth.com/docs/concepts/cookies)).
   > Set `BETTER_AUTH_URL` / `CORS_ORIGIN` to the **web** URL (no trailing slash).

6. Under **Authorized JavaScript origins** (optional but good practice), add:
   - `http://localhost:3002`
   - Your production web URL (e.g. `https://npanel-web.example.com`)

7. Click **Create**.

8. A dialog shows your credentials. Copy and save both:
   - **Client ID**   looks like `XXXXXXXX.apps.googleusercontent.com`
   - **Client Secret**   a short alphanumeric string

   > Keep the Client Secret private. Never commit it to git.  
   > You can return to Credentials to view the Client ID at any time, but the secret is only shown once (or you can download the JSON).

---

### Step 1.5   Verify consent screen branding (before going live)

Before switching to production, Google may require you to submit the app for verification if you request sensitive scopes. For `openid`, `email`, and `profile` (basic sign-in), Google generally does **not** require verification   you can publish without it.

To check:
1. **APIs & Services → OAuth consent screen**.
2. If there is a **Publish App** button, you can click it to switch to production without going through verification (for basic scopes).
3. If Google shows a "verification required" notice, follow the verification steps   this typically takes 1-3 days and requires a privacy policy URL.

---

### Step 1.6   Go live for all customers

When you are ready for real users (not just test accounts):

1. **APIs & Services → OAuth consent screen**.
2. Click **Publish App** (or the equivalent "Move to production" button).
3. Confirm. Status changes from *Testing* to *In production*.
4. From this point, any Google account can sign in without needing to be added as a test user.

---

## Part 2   Repository and CI/CD Configuration

Once you have the Client ID and Client Secret from Part 1, configure this repo.

### Step 2.1   Add secrets to GitHub Actions

The deployment pipeline (`deploy.yml`) passes env vars directly to Cloud Run.  
Add two new **repository secrets** in GitHub:

1. Go to your GitHub repo → **Settings → Secrets and variables → Actions**.
2. Click **New repository secret** for each:

   | Secret name | Value |
   |-------------|-------|
   | `GOOGLE_CLIENT_ID` | the Client ID from Step 1.4 |
   | `GOOGLE_CLIENT_SECRET` | the Client Secret from Step 1.4 |

> If you have separate staging and production GitHub environments (currently the  
> repo uses `staging` and `production` environments in `deploy.yml`), add the  
> secrets to both environments. You can use the **same** OAuth client for both  
>   Google allows multiple redirect URIs on one client.

---

### Step 2.2   Add secrets to `.github/workflows/deploy.yml`

In `deploy.yml`, find the `env_vars` block inside the **deploy-server** steps (staging and production) and add the two new variables alongside the existing ones:

```yaml
env_vars: |
  NODE_ENV=production
  DATABASE_URL=${{ secrets.DATABASE_URL }}
  HOSTNAME=0.0.0.0
  BETTER_AUTH_SECRET=${{ secrets.BETTER_AUTH_SECRET }}
  BETTER_AUTH_URL=${{ secrets.CORS_ORIGIN }}
  CORS_ORIGIN=${{ secrets.CORS_ORIGIN }}
  GOOGLE_CLIENT_ID=${{ secrets.GOOGLE_CLIENT_ID }}
  GOOGLE_CLIENT_SECRET=${{ secrets.GOOGLE_CLIENT_SECRET }}
```

Do this for **both** the staging deploy step and the production deploy step (they are separate jobs in the file).

---

### Step 2.3   Add variables to the env schema (`packages/env/src/server.ts`)

The env validation schema in `packages/env/src/server.ts` currently validates only the existing server vars. Add the two new ones:

```typescript
server: {
  DATABASE_URL: z.string().min(1),
  BETTER_AUTH_SECRET: z.string().min(32),
  BETTER_AUTH_URL: z.url(),
  CORS_ORIGIN: z.url(),
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
  // Add these two:
  GOOGLE_CLIENT_ID: z.string().min(1),
  GOOGLE_CLIENT_SECRET: z.string().min(1),
},
```

---

### Step 2.4   Enable the Google provider in Better Auth (`packages/auth/src/index.ts`)

Better Auth has first-class Google support via `socialProviders`. Add it to the `betterAuth` config:

```typescript
import { env } from "@npanel/env/server";

export const auth = betterAuth<BetterAuthOptions>({
  // ... existing config ...

  socialProviders: {
    google: {
      clientId: env.GOOGLE_CLIENT_ID,
      clientSecret: env.GOOGLE_CLIENT_SECRET,
    },
  },

  // ... rest of existing config ...
});
```

No additional packages are required   `better-auth` has Google OAuth built in.

---

### Step 2.5   Wire the Google button in the login and register forms

The `GoogleButton` component already exists at  
`apps/web/src/routes/auth/_components/social-auth/google-button.tsx`.  
It is a visual-only button. You need to attach a click handler that calls Better Auth's social sign-in.

In your login form and register form, import the auth client and call:

```typescript
import { authClient } from "@/lib/auth-client"; // adjust import path to your actual auth client

// In the button's onClick:
await authClient.signIn.social({
  provider: "google",
  callbackURL: "/",          // where to redirect after successful sign-in
  errorCallbackURL: "/auth/login?error=oauth", // where to redirect on failure
});
```

Pass this as the `onClick` prop to `<GoogleButton>`.

---

### Step 2.6   Local development environment

For local testing, create or update the `.env` file in `apps/server/` (wherever your server reads its environment from) and add:

```env
GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-client-secret
```

Make sure `BETTER_AUTH_URL` in your local server `.env` matches the **frontend** origin (the URL in the browser), not the API port alone:

```env
BETTER_AUTH_URL=http://localhost:5173
CORS_ORIGIN=http://localhost:5173
```

Vite proxies `/api/*` to the server; OAuth callbacks must stay on the same origin as the SPA.
Redirect URI in GCP: `http://localhost:5173/api/auth/callback/google`.

> Do not commit `.env` files. They should already be in `.gitignore`.

---

## Part 3   Account Merging Behaviour (important to decide upfront)

When a user signs in with Google using an email that already exists in the database from a previous email/password signup, Better Auth will either:

- **Link the accounts** (default in recent Better Auth versions): the Google sign-in attaches to the existing account. The user can sign in with either method.
- **Reject** with an error if account linking is disabled.

Check the Better Auth docs for `allowDifferentPrimitiveTypes` or `accountLinking` options and decide what behaviour you want before going live. No action is needed to use the default.

---

## Part 4   Hooks for Google sign-in (optional)

The current `packages/auth/src/index.ts` has `after` hooks that run on email/password sign-in to:
- Log activity to `userActivityLog`
- Create a login notification

These hooks match on `ctx.path === "/sign-in/email"`. Google sign-in uses a different path (`/sign-in/social/google` or `/callback/google`). If you want the same activity logging for Google sign-ins, you will need to add a matching condition to the `after` hook   or add a new hook block   that handles social sign-in paths.

This is optional for the initial release but good to add before going to production.

---

## Part 5   Full checklist

| # | Step | Where | Status |
|---|------|--------|--------|
| 1 | Create/select GCP project | GCP Console | |
| 2 | Enable Google Identity API | GCP → APIs & Services → Library | |
| 3 | Configure OAuth consent screen (External) | GCP → APIs & Services → OAuth consent screen | |
| 4 | Create OAuth 2.0 Client ID (Web application) | GCP → APIs & Services → Credentials | |
| 5 | Add all redirect URIs (local + staging + prod) | GCP → Credentials → OAuth Client | |
| 6 | Copy Client ID and Client Secret | GCP → Credentials | |
| 7 | Add `GOOGLE_CLIENT_ID` secret to GitHub repo | GitHub → Settings → Secrets | |
| 8 | Add `GOOGLE_CLIENT_SECRET` secret to GitHub repo | GitHub → Settings → Secrets | |
| 9 | Add both vars to `env_vars` in `deploy.yml` (staging + prod) | `.github/workflows/deploy.yml` | |
| 10 | Add both vars to `packages/env/src/server.ts` schema | `packages/env` | |
| 11 | Add `socialProviders.google` to Better Auth config | `packages/auth/src/index.ts` | |
| 12 | Wire `GoogleButton` click handler in login + register forms | `apps/web/src/routes/auth/` | |
| 13 | Add local `.env` vars for development | `apps/server/.env` (or wherever) | |
| 14 | Test locally (click button, check redirect, check DB account) | Local | |
| 15 | Deploy to staging and test | Cloud Run staging | |
| 16 | Publish OAuth consent screen to "In production" | GCP Console | |
| 17 | Deploy to production and verify | Cloud Run production | |

---

## Troubleshooting

| Symptom | Cause | Fix |
|---------|-------|-----|
| `state_mismatch` on server URL (`/?error=state_mismatch`) | OAuth state cookie blocked: frontend calls API cross-origin; `BETTER_AUTH_URL` pointed at server | Proxy `/api` through web; set `BETTER_AUTH_URL` to web URL (`CORS_ORIGIN`); register Google redirect URI on **web** origin |
| `redirect_uri_mismatch` error on Google | Callback URI at runtime doesn't match GCP | Set `BETTER_AUTH_URL` to the **web** origin (no trailing slash); add `https://<web-domain>/api/auth/callback/google` in GCP |
| `invalid_client` error | Wrong Client ID or Secret | Re-copy from GCP Credentials; check for extra spaces or quotes in the env var |
| Button does nothing | `onClick` not wired, or `authClient.signIn.social` import path wrong | Check browser console for errors; confirm `authClient` import path |
| "Access blocked: this app is in testing" | Consent screen is still in Testing mode | Either add the user's email as a test user, or publish the consent screen (Step 1.6) |
| Google user gets a new account instead of merging with existing email | Account linking is disabled | Check Better Auth `accountLinking` config |
| Works locally but fails on Cloud Run | `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` not in Cloud Run env | Check `deploy.yml` env_vars and GitHub secrets are set for the correct environment |

---

## References

- [Better Auth   Social Sign-In / Google](https://www.better-auth.com/docs/authentication/google)
- [Google OAuth 2.0 for Web Server Applications](https://developers.google.com/identity/protocols/oauth2/web-server)
- [Google Cloud   OAuth Consent Screen](https://console.cloud.google.com/apis/credentials/consent)
- [Google Cloud   Credentials](https://console.cloud.google.com/apis/credentials)
