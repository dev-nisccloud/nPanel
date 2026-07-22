/**
 * One-shot helper: copy OAuth secrets from apps/server/.env into
 * .env.etims-certification and stamp portal identity fields.
 *
 *   bun run src/scripts/write-etims-cert-env.ts
 */
import { config } from "dotenv";
import { writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
config({ path: path.join(root, ".env") });

const get = (k: string) => process.env[k]?.trim() ?? "";
for (const k of [
    "ETIMS_CONSUMER_KEY",
    "ETIMS_CONSUMER_SECRET",
    "ETIMS_APIGEE_APP_ID",
] as const) {
    if (!get(k)) throw new Error(`Missing ${k} in .env`);
}

const apigee = get("ETIMS_APIGEE_APP_ID");
// Prefer classic OSCU host (pre-2ffc841e working shape). Override via .env if needed.
const sandboxBase =
    get("ETIMS_SANDBOX_BASE_URL") || "https://etims-api-sbx.kra.go.ke/etims-api";
const sandboxToken =
    get("ETIMS_SANDBOX_TOKEN_URL") || "https://sbx.kra.go.ke/v1/token/generate";

const out = `# KRA eTIMS certification credentials
# Used ONLY by certification / probe scripts (see etims:certification).
# Do not commit. Built from portal session + apps/server/.env secrets.
#
# Working shape (bisect): classic OSCU host + /select* paths (pre-2ffc841e).
# Dev Platform + Apigee UUID still UNIQUE-2 on KRA side.

# ── Portal identity (explicit) ──
ETIMS_CERT_TIN=P052377334H
ETIMS_CERT_BHF_ID=01
ETIMS_CERT_DEVICE_SERIAL=KRACUO100069163
ETIMS_CERT_APP_TEST_PIN=P600003938A
ETIMS_CERT_INTEGRATOR_TYPE=SELF
ETIMS_CERT_SOLUTION=OSCU
ETIMS_CERT_TIS_NAME=nPanel
ETIMS_CERT_TIS_VERSION=1.0.0
ETIMS_CERT_SANDBOX=true

# ── Apigee / OAuth (copied from server .env) ──
ETIMS_APIGEE_APP_ID=${apigee}
ETIMS_CONSUMER_KEY=${get("ETIMS_CONSUMER_KEY")}
ETIMS_CONSUMER_SECRET=${get("ETIMS_CONSUMER_SECRET")}
ETIMS_SANDBOX_BASE_URL=${sandboxBase}
ETIMS_SANDBOX_TOKEN_URL=${sandboxToken}
ETIMS_BASE_URL=${get("ETIMS_BASE_URL") || sandboxBase}
ETIMS_TOKEN_URL=${get("ETIMS_TOKEN_URL") || sandboxToken}
ETIMS_CERTIFICATION_PUBLIC=${get("ETIMS_CERTIFICATION_PUBLIC") || "true"}

# Optional: ETIMS_CERT_CMC_KEY=
`;

const dest = path.join(root, ".env.etims-certification");
writeFileSync(dest, out, "utf8");
console.log("Wrote", dest);
console.log("Apigee prefix:", apigee.slice(0, 12));
console.log("Portal TIN/BHF/SERIAL/APP_TEST_PIN stamped.");
