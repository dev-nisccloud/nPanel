# Firebase App Hosting – Environment Variables

## Quick checklist (fixes common errors)

| Log / error | Fix |
|-------------|-----|
| **Memory limit of 512 MiB exceeded** / **JavaScript heap out of memory** | `apphosting.yaml` now sets `runConfig.memoryMiB` and `cpu`. Redeploy. |
| **BETTER_AUTH_SECRET: You are using the default secret** | Set secret: `firebase apphosting:secrets:set BETTER_AUTH_SECRET` (or use `pnpm run apphosting:secrets` from `.env.production`). |
| **Misconfigured Secret** / **Error resolving secret version** / **Permission 'secretmanager.versions.get' denied** | The App Hosting backend must be allowed to read secrets. Run **once** (and after adding new secret refs): `pnpm run apphosting:secrets:grant`. See "Grant backend access to secrets" below. |
| **DATABASE_URL is not set or invalid** | Add secret and reference in `apphosting.yaml`. Set: `firebase apphosting:secrets:set DATABASE_URL` (or `pnpm run apphosting:secrets`), then `pnpm run apphosting:secrets:grant`. |
| **Worker endpoint not configured** / **LinkedIn worker endpoint not configured** | Set `VITE_PUBLIC_APP_URL` to your backend URL. Set secret and run `pnpm run apphosting:secrets:grant`. |

After adding or changing secrets, run **`pnpm run apphosting:secrets:grant`** so the backend can read them, then redeploy (push a commit or trigger a new build).

---

## PRISMA_BINARY_TARGETS (build)

Before `@npanel/db` is built, `prisma generate` runs and needs **`PRISMA_BINARY_TARGETS`** so the generated client includes the correct query engine for the **server** (App Hosting / Cloud Run), not only the build environment.

- **Set in:** `apphosting.yaml` under `env`, with `availability: [BUILD]`.
- **Format:** JSON array string, e.g. `'["native", "debian-openssl-3.0.x"]'`.
- **For App Hosting:** Use at least `debian-openssl-3.0.x` (Ubuntu 22 / Node runtime). `native` is the build container (also Linux).

If this is missing, you can see errors at runtime like “Query engine library for current platform could not be found”.

---

## Security: never commit secrets

**`apphosting.yaml` is committed to git.** Do **not** put real secrets (e.g. `DATABASE_URL`, API keys, passwords) as plain `value:` in this file — that would be a serious security risk.

- **Non-sensitive values** (e.g. `PRISMA_BINARY_TARGETS`, feature flags, public URLs): use `value: "..."` in `apphosting.yaml`. Safe to commit.
- **Secrets** (database URLs, API keys, tokens): use `secret: SECRET_NAME` in `apphosting.yaml` and store the actual value in Firebase / Cloud Secret Manager (see below). Only the secret **name** is in the file, not the value.

---

## Where to paste your actual env values (secrets)

**Do not paste real secrets into any file in your repo.** Use one of these:

### Option A: Firebase CLI (recommended)

**Bulk set from your .env file (easiest):** From your **project root**, run:

```bash
pnpm run apphosting:secrets
```

This reads `apps/npanel/.env.production` and sets **every** `KEY=VALUE` as a Firebase App Hosting secret (values are sent via stdin, never written to disk). To use a different file: `node scripts/set-apphosting-secrets.mjs path/to/your/.env`. Comment out lines you don't want uploaded.

**Or set one at a time:**

```bash
firebase apphosting:secrets:set DATABASE_URL
```

If you see “No currently active project”, set the project first: `firebase use nisccloud-npanel` (or `firebase use --project YOUR_PROJECT_ID`). The repo’s `.firebaserc` already sets the default project to `nisccloud-npanel`.

You’ll be prompted to enter the value (or paste it). Repeat for each secret, e.g.:

```bash
firebase apphosting:secrets:set DATABASE_URL
firebase apphosting:secrets:set DIRECT_URL
firebase apphosting:secrets:set BETTER_AUTH_SECRET
# … any other secret env vars
```

The values are stored in **Google Cloud Secret Manager** and are not in your repo. Then in `apphosting.yaml` you only reference the name: `secret: DATABASE_URL`.

### Option B: Google Cloud Console

1. Open [Google Cloud Console → Secret Manager](https://console.cloud.google.com/security/secret-manager).
2. Select your Firebase project.
3. **Create secret** → name it exactly as your env var (e.g. `DATABASE_URL`) → paste the value.
4. Back in your project, run so App Hosting can read it:
   ```bash
   firebase apphosting:secrets:grantaccess
   ```

### Listing, editing, and deleting secrets

Firebase CLI only has **set** for secrets. To **list**, **edit**, or **delete** you use **Google Cloud Secret Manager** (same project as your Firebase project).

**List existing secrets (names only):**

```bash
gcloud secrets list --project=YOUR_PROJECT_ID
```

Example with default project: `gcloud secrets list` (uses current gcloud project). To see your Firebase project: `firebase use` or `cat .firebaserc`.

**Edit / update a secret (new value):**

- **Option 1 – Firebase CLI (easiest):** Run set again; it creates a new version and App Hosting will use the latest.
  ```bash
  firebase apphosting:secrets:set BETTER_AUTH_URL
  # Paste the new value when prompted.
  ```
- **Option 2 – gcloud:** Add a new version (never overwrites; Secret Manager is versioned).
  ```bash
  echo -n "new-secret-value" | gcloud secrets versions add SECRET_NAME --data-file=-
  ```
  Example: `echo -n "https://myapp.run.app" | gcloud secrets versions add BETTER_AUTH_URL --data-file=-`

After updating a secret, **redeploy** the backend (e.g. push a commit or trigger a new rollout) so the running app picks up the new value.

**List versions of one secret:**

```bash
gcloud secrets versions list SECRET_NAME
```

**Delete a secret (use with care):**

- In [Google Cloud Console → Secret Manager](https://console.cloud.google.com/security/secret-manager): select the secret → Delete.  
- Or with gcloud: `gcloud secrets delete SECRET_NAME`  
- Only delete if the secret is no longer referenced in `apphosting.yaml` or you will break the next deploy.

**Grant backend access to secrets (required for build and runtime):** After setting secrets (Option A or B), run **once**—and again whenever you add new secret references to `apphosting.yaml`:

```bash
pnpm run apphosting:secrets:grant
```

This grants the App Hosting backend access to every secret in `apphosting.yaml` (script: `scripts/grant-apphosting-secrets-access.mjs`). If your backend has a different name, use `--backend YOUR_BACKEND_ID`. Backend name: Firebase Console → App Hosting, or `firebase apphosting:backends:list`.

### Copying from an existing .env file

You can keep using `apps/npanel/.env` locally (and add it to `.gitignore` if it isn’t already). For App Hosting, **each** of those secret values must be set separately via Option A or B above — there is no “paste whole .env file” in the Firebase UI; you create one secret per variable.

---

## Where to set env variable names (apphosting.yaml)

Environment variables for Firebase App Hosting are configured in **`apphosting.yaml`** at the **root of your repo** (or the directory you set as the app root when creating the backend).

- **File:** `apphosting.yaml` (create it if it doesn’t exist)
- **CLI:** `firebase init apphosting` creates a starter file
- **Docs:** [Configure and manage App Hosting backends](https://firebase.google.com/docs/app-hosting/configure)

## Options in apphosting.yaml

1. **Plain values** (non-sensitive):
   ```yaml
   env:
     - variable: MY_VAR
       value: "my-value"
       availability: [BUILD, RUNTIME]  # optional; default is both
   ```

2. **Secrets** (API keys, `DATABASE_URL`, etc.):
   - Create the secret:  
     `firebase apphosting:secrets:set SECRET_NAME`  
     (e.g. `DATABASE_URL`, `DIRECT_URL`)
   - Reference it in `apphosting.yaml`:
   ```yaml
   env:
     - variable: DATABASE_URL
       secret: DATABASE_URL
     - variable: DIRECT_URL
       secret: DIRECT_URL
   ```
   - If needed, grant access:  
     `firebase apphosting:secrets:grantaccess`

## For this project (nPanel)

- **Build:** The `@npanel/db` build runs `prisma generate`; it does **not** require a real database. If your Prisma schema still expects `DATABASE_URL`/`DIRECT_URL` at generate time, define them for **BUILD** (e.g. placeholder value or the same secret).
- **Runtime:** The app expects these secrets to be set (referenced in `apphosting.yaml`):
  - **DATABASE_URL** – Postgres connection string (use pooler URL if using Supabase/Neon).
  - **DIRECT_URL** – Direct Postgres URL (no pooler) for migrations/schema.
  - **BETTER_AUTH_SECRET** – Strong random secret for auth; never use the default in production.
  - **VITE_PUBLIC_APP_URL** – Your backend’s public URL (e.g. the App Hosting/Cloud Run URL like `https://xxx---nisccloud-npanel-xxx.a.run.app`). Used for auth callbacks and QStash worker endpoints.

Set them all at once from `apps/npanel/.env.production` with:

```bash
pnpm run apphosting:secrets
```

Or set one by one: `firebase apphosting:secrets:set DATABASE_URL`, etc.

After editing `apphosting.yaml` or secrets, commit and push (or trigger a new build); the next App Hosting build will use the new env configuration.
