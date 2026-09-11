/**
 * Stamp portal identity + OAuth into .env.etims-certification.
 * Does not copy secrets from apps/server/.env. cmcKey is loaded from the DB at runtime.
 *
 *   bun run etims:certification:env
 */
import { writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const dest = path.join(root, ".env.etims-certification");

const out = `# KRA eTIMS certification credentials
# Used ONLY by certification / probe scripts (see etims:certification).
# Do not commit. This file is the sole env source for those scripts.

# ── Portal identity ──
ETIMS_CERT_TIN=P052377334H
ETIMS_CERT_BHF_ID=01
ETIMS_CERT_DEVICE_SERIAL=KRACUO100069163
ETIMS_CERT_APP_TEST_PIN=P600004448A
ETIMS_CERT_INTEGRATOR_TYPE=SELF
ETIMS_CERT_SOLUTION=OSCU
ETIMS_CERT_TIS_NAME="nPanel 2"
ETIMS_CERT_TIS_VERSION=1.0.0
ETIMS_CERT_SANDBOX=true

# ── Apigee / OAuth (Developer Portal app) ──
ETIMS_APIGEE_APP_ID=b009b20e-7bd9-452d-b483-a34dd4216cbc
ETIMS_CONSUMER_KEY=yuTE888zfZIMU8IipTpjO41iag46vR917OtZO58pAV4LBQdw
ETIMS_CONSUMER_SECRET=JAEBCsE4byXXgIiNPP70VGWQk8rigqXlxiGj5wO6UWyR5nbkmUMCYvO69kb2HiBA
CONSUMER_KEY=yuTE888zfZIMU8IipTpjO41iag46vR917OtZO58pAV4LBQdw
CONSUMER_SECRET=JAEBCsE4byXXgIiNPP70VGWQk8rigqXlxiGj5wO6UWyR5nbkmUMCYvO69kb2HiBA

ETIMS_SANDBOX_BASE_URL=https://sbx.kra.go.ke/etims-oscu/api/v1
ETIMS_SANDBOX_TOKEN_URL=https://sbx.kra.go.ke/v1/token/generate
ETIMS_BASE_URL=https://sbx.kra.go.ke/etims-oscu/api/v1
ETIMS_TOKEN_URL=https://sbx.kra.go.ke/v1/token/generate
ETIMS_CERTIFICATION_PUBLIC=1

# cmcKey is loaded from etims_configuration at runtime (not stored here)
`;

writeFileSync(dest, out, "utf8");
console.log("Wrote", dest);
console.log("Apigee prefix:", "b009b20e-7bd9");
console.log("TIS=nPanel 2  appTestPin=P600004448A");
