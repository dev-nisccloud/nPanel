# Troubleshooting: Root Route 500 / ERR_FAILED and Docker/Cloud Run

This doc lists every angle that can cause "This site can't be reached" / ERR_FAILED or 500 on the root URL (`/`), and what was fixed or what to check.

---

## 1. **PORT: use Cloud Run’s default (no hardcoding)**

**Symptom:** First request fails (connection refused / ERR_FAILED), or deploy/build fails with a port conflict.

**Cause:** Cloud Run injects `PORT` at runtime (default **8080**). If you hardcode `PORT=3000` in the Dockerfile or deploy env, it can conflict with Cloud Run’s reserved behaviour and break the build or routing.

**Fix applied:**
- **Dockerfile:** No `PORT` env var; the app uses `process.env.PORT` so it listens on whatever Cloud Run injects (8080).
- **Deploy workflow:** No `--port=3000` and no `PORT` in `env_vars`; Cloud Run uses default port 8080 and injects `PORT=8080`.

**If it still fails:** In Cloud Run, leave the container port as default (8080) and do not set `PORT` in Variables & Secrets unless you explicitly configure a custom port in the service.

---

## 2. **The Docker image on GCP (what’s in it, where it is, how to check it)**

The image you deploy to Cloud Run is built by GitHub Actions and stored in **Artifact Registry**, then Cloud Run runs that image.

**What the final image contains (runner stage):**

- **Working directory:** `/app`
- **Contents:**
  - `apps/npanel/public/` – static assets
  - `apps/npanel/.next/standalone/` – copied to `/app`, so you have:
    - `node_modules/` (traced deps)
    - `apps/npanel/server.js` – Next.js server entry
    - other standalone output
  - `apps/npanel/.next/static/` – static build artifacts
  - `node_modules/@npanel/db/prisma/generated/` – Prisma client (we copy it in explicitly)
- **User:** `nextjs` (non-root)
- **Env:** `NODE_ENV=production`, `HOSTNAME=0.0.0.0`, `BETTER_AUTH_SECRET=…` (no `PORT`; Cloud Run injects it).
- **Command:** `node apps/npanel/server.js`

**Where the image lives in GCP:**

- **Registry:** Artifact Registry in your project.
- **Image URL pattern:**  
  `{REGION}-docker.pkg.dev/{PROJECT_ID}/{REPO_NAME}/{SERVICE_NAME}:{tag}`
- From the workflow: `REGION`, `PROJECT_ID`, `REPO_NAME`, `SERVICE_NAME` come from env (e.g. `secrets.GCP_REGION`, `secrets.GCP_PROJECT_ID`, etc.). Tag is `github.sha` (e.g. `1a45807d3da7e732705d39ce14e5932e3d3dab67`).
- In the GCP Console: **Artifact Registry** → select the repo (e.g. `npanel-repo`) → you’ll see the `npanel` image and tags.

**How to pull and run the same image locally (reproduce the 500):**

```bash
# Auth Docker to your Artifact Registry (use your region and project)
gcloud auth configure-docker africa-south1-docker.pkg.dev

# Pull the image (replace with your actual project/repo and a tag from Artifact Registry)
docker pull africa-south1-docker.pkg.dev/npanel/YOUR_REPO_NAME/npanel:YOUR_TAG

# Run with env similar to Cloud Run (Cloud Run injects PORT=8080 by default)
docker run --rm -p 8080:8080 \
  -e PORT=8080 \
  -e NODE_ENV=production \
  -e HOSTNAME=0.0.0.0 \
  -e DATABASE_URL="postgresql://..." \
  -e BETTER_AUTH_SECRET="..." \
  -e BETTER_AUTH_URL="https://your-staging-url.run.app" \
  -e NEXT_PUBLIC_APP_URL="https://your-staging-url.run.app" \
  africa-south1-docker.pkg.dev/npanel/YOUR_REPO_NAME/npanel:YOUR_TAG
```

Then open `http://localhost:8080/`. If you get 500 here too, the problem is in the image or env, not Cloud Run’s networking.

**How to inspect the image (files and env):**

```bash
# See env and entrypoint
docker inspect africa-south1-docker.pkg.dev/npanel/YOUR_REPO_NAME/npanel:YOUR_TAG

# Run a shell inside the image (override CMD)
docker run --rm -it --entrypoint sh africa-south1-docker.pkg.dev/npanel/YOUR_REPO_NAME/npanel:YOUR_TAG

# Then inside the container, for example:
# ls -la apps/npanel/
# ls -la node_modules/@npanel/db/prisma/generated
# cat apps/npanel/server.js | head -20
```

Use this to confirm `server.js` exists, Prisma generated files are present, and no expected files are missing.

---

## 3. **Docker build context and .dockerignore**

**Symptom:** Build uses wrong files, or image is huge and inconsistent.

**Cause:** Build is run as `docker build -f apps/npanel/Dockerfile .` (context = repo root). Only a **root** `.dockerignore` is used. The file at `apps/npanel/.dockerignore` is **not** used for this build.

**Fix applied:**
- **Root `.dockerignore`** added at repo root so `node_modules`, `.next`, `.git`, etc. are excluded and the context is consistent.

**If it still fails:** Run `docker build -f apps/npanel/Dockerfile .` locally and confirm the build context is small and doesn’t include host `node_modules` or `.next`.

---

## 4. **Next.js standalone + Prisma in monorepo**

**Symptom:** 500 or "Cannot find module" / "PrismaClient" errors in Cloud Run logs when any route uses the DB or auth.

**Cause:** With `output: 'standalone'`, Next only copies traced files. In a pnpm monorepo, workspace packages (e.g. `@npanel/db`) and the Prisma generated client can be missed or end up as broken symlinks.

**Fix applied:**
- **next.config.ts (Docker build only):**
  - `outputFileTracingRoot: path.join(__dirname, '../..')` so tracing runs from the monorepo root and pnpm symlinks resolve.
  - `outputFileTracingIncludes` to force-include `packages/db/**/*` and `@prisma/client` for relevant routes.
- **Dockerfile:** After copying standalone, we ensure the Prisma generated client exists:  
  `RUN mkdir -p node_modules/@npanel/db/prisma`  
  `COPY --from=builder .../packages/db/prisma/generated ./node_modules/@npanel/db/prisma/generated`

**If it still fails:** In Cloud Run logs, look for `MODULE_NOT_FOUND`, `PrismaClient`, or `@npanel/db`. If present, the standalone image is still missing the db package or generated client; confirm the COPY path matches the actual standalone layout (e.g. open the built image and inspect `node_modules/@npanel/db`).

---

## 5. **Root route not running on the server (app-level)**

**Already done in app code:**
- Root page is a **client component** that only calls `GET /api/auth/redirect-target` and redirects; no server-side auth/DB on `GET /`.
- Root layout uses a **minimal shell** for `pathname === '/'` (no `getPreference`, no heavy providers) so the first HTML response is as light and safe as possible.
- `/api/auth/redirect-target` never returns 5xx; on error it returns 200 with `{ redirect: "/auth/login" }`.

So the remaining failure modes for `/` are: **layout** throwing, **middleware** failing, or **infra** (PORT, tracing, Docker).

---

## 6. **Health check and startup**

**Symptom:** Deployment is marked unhealthy or the first request times out.

**Current setup:** The GitHub workflow health check uses `GET /api/health`, not `GET /`. So the root route is not used for health checks.

**If you use Cloud Run startup/liveness probes:** Point them at `/api/health` (or another route that returns 200 quickly), not at `/`, so a redirect or slow first paint on `/` doesn’t kill the instance.

---

## 7. **Cold start and timeouts**

**Symptom:** First request after deploy or after idle fails or times out; later requests work.

**Cause:** Cold start: Node + Next + Prisma can take several seconds. If the load balancer or client timeout is shorter, you get ERR_FAILED or 504.

**What to check:**
- Cloud Run: increase "Minimum number of instances" to 1 if you need to avoid cold starts.
- Cloud Run: increase "Request timeout" (e.g. 300s) so the first request isn’t cut off.
- In the app, ensure the root route and `/api/health` respond quickly (current design already avoids heavy work on `GET /`).

---

## 8. **Environment variables at runtime**

**Symptom:** 500 or auth/DB errors only in Cloud Run.

**Cause:** Missing or wrong env in the container (e.g. `DATABASE_URL`, `BETTER_AUTH_SECRET`, `BETTER_AUTH_URL`).

**What to check:** In Cloud Run, open the revision → "Variables & Secrets" and confirm at least:
- `DATABASE_URL`
- `BETTER_AUTH_SECRET`
- `BETTER_AUTH_URL` (or the URL the app uses for auth callbacks)
- `NEXT_PUBLIC_APP_URL`
- (Do not set PORT; Cloud Run injects it.)

---

## 9. **Finding the actual error in Cloud Run logs**

The log entry you see with `"status": 500` and `"logName": "run.googleapis.com%2Frequests"` is the **request log** only. It does **not** contain the exception message. The real error is in the **container logs** (stdout/stderr from your Node app).

### Option A: Cloud Run → LOGS tab (easiest)

1. Open **Cloud Run** → select service **npanel** (region **africa-south1**).
2. Click the **LOGS** tab (not “Metrics”).
3. Ensure you see **both** request and container logs (there may be a filter or “Show: All / Requests / Container”). Select **All** or **Container** so stdout/stderr are visible.
4. In the time range, pick the time of the 500 (e.g. 2026-02-24 06:10:55 UTC).
5. Look for entries **at or just before** that time that are **not** the request line: they may be severity **ERROR** or **WARNING**, or plain stdout/stderr with the Node/Next.js error and stack trace.

### Option B: Logs Explorer – use the trace ID from your request

Your request log includes a **trace** field, e.g.:

`"trace": "projects/npanel/traces/113025aa46b50b447d8fd2a78e692e0a"`

Use it to get every log for that request (including container logs):

1. Go to **Logging** → **Logs Explorer**.
2. In the query box, use:
   ```text
   resource.type="cloud_run_revision"
   resource.labels.service_name="npanel"
   resource.labels.location="africa-south1"
   trace="projects/npanel/traces/113025aa46b50b447d8fd2a78e692e0a"
   ```
   (Replace the trace ID with the one from your 500 request log.)
3. Run the query. You should see the request log **and** any container log entries (stdout/stderr) for that same request. The container entry with the error message or stack is the one you need.

### Option C: Logs Explorer – all errors for npanel

If you don’t have a trace ID, list recent errors from the container:

```text
resource.type="cloud_run_revision"
resource.labels.service_name="npanel"
resource.labels.location="africa-south1"
(severity>=ERROR OR textPayload=~"Error|error|Exception|MODULE_NOT_FOUND|\\[RootLayout\\]")
```

Then match by timestamp to your 500 (e.g. 06:10:55).

### What you’re looking for

- **From our app:** `[RootLayout] unexpected error: …` (if the layout catch ran).
- **From Node/Next:** `MODULE_NOT_FOUND`, Prisma/client errors, or a stack trace (file path + line). Those usually mean the error happened **before** the layout (e.g. during import or first render), which is why you only see the 500 in the request log and the real cause in container logs.

**If you still see only the request log:** In Logs Explorer, do **not** filter by `logName`. Container stdout/stderr can appear as different log names (e.g. `run.googleapis.com%2Fstderr` or the default container log). Use the trace or time-based query above and look at **all** entries for that revision in the time window.

---

## 10. **Quick checklist if the issue persists**

1. **Cloud Run logs:** Use the query above and check for the first error (e.g. `MODULE_NOT_FOUND`, Prisma, `[RootLayout]`, uncaught exception). That points to code vs infra.
2. **PORT:** Do not set PORT in the image or env; Cloud Run injects PORT (default 8080). The app must listen on `process.env.PORT`.
3. **Local Docker:** Run the same image locally with the same env and hit `http://localhost:3000/` and `http://localhost:3000/api/health`. If it works locally but not on Cloud Run, focus on Cloud Run (env, port, probes, timeouts).
4. **Build:** Rebuild the image after any change to `next.config.ts`, Dockerfile, or `.dockerignore` and redeploy.

5. **Root layout:** The root layout is now fully wrapped in try/catch; any throw (including for GET /) is logged and then we return 200 with redirect HTML instead of 500. If you still see 500 on GET /, the failure may be in middleware or in the Next.js runtime before the layout runs—check logs for the exact error.
