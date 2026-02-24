# Google Sign-In (OAuth): Full Guide — Development to Production

This guide walks you through enabling **“Continue with Google”** for your app from local development through to production so **all your customers** can sign in with Google.

---

## Overview

- **What:** Users can sign in or register using their Google account (no password needed).
- **Scope:** One OAuth client in Google Cloud serves **all customers**; you do not create separate clients per customer.
- **Flow:** Development (local) → Google Cloud setup → Production (Firebase App Hosting) → Going live.

---

## Part 1: Development (Local)

### 1.1 Google Cloud project

1. Go to [Google Cloud Console](https://console.cloud.google.com/apis/dashboard).
2. Select an existing project or **Create project** (e.g. “nPanel”).
3. Keep this project for both development and production; you’ll add multiple redirect URIs (local + production) to the same OAuth client.

### 1.2 OAuth consent screen (one-time)

1. **APIs & Services → OAuth consent screen**.
2. Choose **External** (so any Google user can sign in).
3. Fill:
   - **App name:** e.g. “nPanel”
   - **User support email:** your email
   - **Developer contact:** your email
4. **Scopes:** Add only what you need for sign-in. For “Sign in with Google” only, the default openid/email/profile is enough. Save.
5. **Test users (optional):** While the app is “Testing”, only listed test users can sign in. For **going live**, you’ll switch to “In production” so all customers can use it.

### 1.3 OAuth client (Web application)

1. **APIs & Services → Credentials → Create Credentials → OAuth client ID**.
2. **Application type:** Web application.
3. **Name:** e.g. “nPanel Web (Sign in with Google)”.
4. **Authorized redirect URIs** — add **both** now so the same client works in dev and prod:
   - **Local:**  
     `http://localhost:3000/api/auth/callback/google`  
     (If your dev server uses another port, e.g. 3002, use `http://localhost:3002/api/auth/callback/google`.)
   - **Production:**  
     `https://<your-production-domain>/api/auth/callback/google`  
     Example: `https://npanel-961768926506.africa-south1.run.app/api/auth/callback/google`  
     Replace with your real App Hosting URL.
5. **Create** → copy **Client ID** and **Client Secret** (keep the secret safe).

### 1.4 Local environment variables

In your app’s `.env` (e.g. `apps/npanel/.env`), add:

```env
GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-client-secret
```

For local dev, Better Auth can infer the callback from the request, so you often don’t need `BETTER_AUTH_URL` locally. If you do (e.g. custom port or tunnel), set:

```env
BETTER_AUTH_URL=http://localhost:3000
```

Use the same port as your dev server.

### 1.5 Run and test locally

1. Start the app: `pnpm run dev` (or your usual command).
2. Open the login/register page and click **Continue with Google**.
3. You should be redirected to Google, then back to your app and signed in.
4. If you see **redirect_uri_mismatch**, the redirect URI in Google Cloud must match exactly (scheme, host, port, path: `/api/auth/callback/google`).

---

## Part 2: Production (Firebase App Hosting)

### 2.1 Production URL

Confirm your live URL (e.g. from Firebase App Hosting or custom domain). Example:

- `https://npanel-961768926506.africa-south1.run.app`

That URL must be the one users see in the browser (no trailing slash when used as base).

### 2.2 Redirect URI in Google Cloud

In the same OAuth client you created in Part 1:

1. **APIs & Services → Credentials → your OAuth 2.0 Client ID**.
2. Under **Authorized redirect URIs**, ensure you have:
   - `https://<your-production-domain>/api/auth/callback/google`
3. Save. No code change needed—same client serves all customers.

### 2.3 Firebase App Hosting secrets (runtime)

Your app reads config from env at **runtime**. Set these as **secrets** (not plain values in `apphosting.yaml`):

```bash
# From repo root or apps/npanel
firebase apphosting:secrets:set GOOGLE_CLIENT_ID
# Paste the Client ID when prompted.

firebase apphosting:secrets:set GOOGLE_CLIENT_SECRET
# Paste the Client Secret when prompted.

firebase apphosting:secrets:set BETTER_AUTH_URL
# Paste your production URL with no trailing slash, e.g. https://npanel-961768926506.africa-south1.run.app
```

If you use a script (e.g. `scripts/set-apphosting-secrets.mjs`), add these three to the list and run the script so they’re set in App Hosting.

### 2.4 Expose secrets in apphosting.yaml

In `apps/npanel/apphosting.yaml`, under `env`, add entries so the app can read the new secrets at runtime:

```yaml
  - variable: GOOGLE_CLIENT_ID
    secret: GOOGLE_CLIENT_ID
  - variable: GOOGLE_CLIENT_SECRET
    secret: GOOGLE_CLIENT_SECRET
  - variable: BETTER_AUTH_URL
    secret: BETTER_AUTH_URL
```

If `BETTER_AUTH_URL` is already provided by another mechanism (e.g. same as `NEXT_PUBLIC_APP_URL`), you can reuse that value, but the app must receive it as `BETTER_AUTH_URL` so Better Auth can build the callback URL.

### 2.5 Deploy

1. Commit and push (including the `apphosting.yaml` env changes).
2. Let Firebase App Hosting build and deploy (or trigger deploy from Firebase Console).
3. After deploy, open your production login page and try **Continue with Google** again.

---

## Part 3: Going Live for All Customers

### 3.1 OAuth consent screen status

- **Testing:** Only test users listed in the OAuth consent screen can sign in.
- **In production:** Any Google user can sign in (all your customers).

To go live:

1. **APIs & Services → OAuth consent screen**.
2. Complete any required fields (privacy policy, terms of service if requested).
3. Click **Publish app** / set status to **In production**.
4. After review (if applicable), all customers will be able to use “Continue with Google”.

### 3.2 No per-customer configuration

- One OAuth client and one set of env vars (GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, BETTER_AUTH_URL) serve **all users**.
- You do not create separate OAuth clients or redirect URIs per customer.
- New customers can use Google sign-in as soon as they open your login/register page.

### 3.3 Optional: custom domain

If you later use a custom domain (e.g. `https://app.yourcompany.com`):

1. Add a new **Authorized redirect URI** in Google Cloud:  
   `https://app.yourcompany.com/api/auth/callback/google`
2. Set `BETTER_AUTH_URL` (and any app URL env) to `https://app.yourcompany.com` in production secrets.
3. Redeploy. No code change required.

---

## Part 4: Checklist Summary

| Step | Where | What |
|------|--------|------|
| OAuth consent screen | Google Cloud Console | External, app name, support email; later set to “In production” |
| OAuth client (Web) | Credentials | Redirect URIs: local + production `/api/auth/callback/google` |
| Local env | `.env` | `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` (optional `BETTER_AUTH_URL`) |
| Production secrets | Firebase App Hosting | `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `BETTER_AUTH_URL` |
| apphosting.yaml | Repo | `env` entries mapping secrets to `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `BETTER_AUTH_URL` |
| Go live | OAuth consent screen | Publish app / In production so all customers can sign in |

---

## Troubleshooting

| Issue | What to check |
|-------|----------------|
| **redirect_uri_mismatch** | Redirect URI in Google Cloud must match exactly: scheme, host, port (if not 443), path `/api/auth/callback/google`. `BETTER_AUTH_URL` must be the URL users see (no trailing slash). |
| **Invalid client** | Correct `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` in secrets; no extra spaces or quotes. |
| **Access blocked: app not verified** | For “In production”, Google may show a warning until app verification is completed. You can still use “Testing” with test users. |
| **Button does nothing / wrong redirect** | Ensure frontend calls `authClient.signIn.social({ provider: "google", callbackURL: "/" })` and that auth API is mounted at `/api/auth/[...all]`. |

---

## References

- [Better Auth – Google](https://www.better-auth.com/docs/authentication/google)
- [Firebase App Hosting – Configure](https://firebase.google.com/docs/app-hosting/configure)
- [Google OAuth 2.0](https://developers.google.com/identity/protocols/oauth2)
