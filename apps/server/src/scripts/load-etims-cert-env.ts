/**
 * Sole env loader for eTIMS certification / probe scripts.
 * Loads apps/server/.env.etims-certification only — never the live app .env OAuth.
 * DATABASE_URL is read from apps/server/.env solely to look up a stored cmcKey
 * when SKIP_INIT=1 (do not use SKIP_INIT if the cert app is not the live app).
 */
import { config } from "dotenv";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import type { EtimsClientConfig } from "@npanel/api/lib/etims-client";

const SERVER_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
export const CERT_ENV_PATH = path.join(SERVER_ROOT, ".env.etims-certification");

if (!existsSync(CERT_ENV_PATH)) {
    throw new Error(
        `Missing ${CERT_ENV_PATH}. Certification scripts use only this file (not apps/server/.env).`,
    );
}

const loaded = config({ path: CERT_ENV_PATH, override: true });
if (loaded.error) throw loaded.error;

if (!process.env.ETIMS_CONSUMER_KEY?.trim() && process.env.CONSUMER_KEY?.trim()) {
    process.env.ETIMS_CONSUMER_KEY = process.env.CONSUMER_KEY.trim();
}
if (!process.env.ETIMS_CONSUMER_SECRET?.trim() && process.env.CONSUMER_SECRET?.trim()) {
    process.env.ETIMS_CONSUMER_SECRET = process.env.CONSUMER_SECRET.trim();
}

const REQUIRED = [
    "ETIMS_CERT_TIN",
    "ETIMS_CERT_BHF_ID",
    "ETIMS_CERT_DEVICE_SERIAL",
    "ETIMS_CERT_APP_TEST_PIN",
    "ETIMS_CERT_TIS_NAME",
    "ETIMS_APIGEE_APP_ID",
    "ETIMS_CONSUMER_KEY",
    "ETIMS_CONSUMER_SECRET",
] as const;

const missing = REQUIRED.filter((k) => !process.env[k]?.trim());
if (missing.length) {
    throw new Error(`Missing in .env.etims-certification: ${missing.join(", ")}`);
}

function trimUrl(value: string | undefined, fallback: string): string {
    const raw = (value && value.trim()) || fallback;
    return raw.replace(/\/+$/, "");
}

export function buildCertClientConfig(): EtimsClientConfig {
    const consumerKey = process.env.ETIMS_CONSUMER_KEY!.trim();
    const consumerSecret = process.env.ETIMS_CONSUMER_SECRET!.trim();
    return {
        baseUrl: trimUrl(
            process.env.ETIMS_SANDBOX_BASE_URL ?? process.env.ETIMS_BASE_URL,
            "https://sbx.kra.go.ke/etims-oscu/api/v1",
        ),
        tokenUrl: trimUrl(
            process.env.ETIMS_SANDBOX_TOKEN_URL ?? process.env.ETIMS_TOKEN_URL,
            "https://sbx.kra.go.ke/v1/token/generate",
        ),
        consumerKey,
        consumerSecret,
        apigeeAppId: process.env.ETIMS_APIGEE_APP_ID!.trim(),
    };
}

function envFileValue(filePath: string, key: string): string {
    if (!existsSync(filePath)) return "";
    const m = readFileSync(filePath, "utf8").match(new RegExp(`^${key}=(.*)$`, "m"));
    if (!m) return "";
    let v = m[1].trim();
    if (
        (v.startsWith('"') && v.endsWith('"')) ||
        (v.startsWith("'") && v.endsWith("'"))
    ) {
        v = v.slice(1, -1);
    }
    return v;
}

function readDatabaseUrl(): string {
    return (
        process.env.DATABASE_URL?.trim() ||
        process.env.DATABASE_POOLER_URL?.trim() ||
        envFileValue(path.join(SERVER_ROOT, ".env"), "DATABASE_POOLER_URL") ||
        envFileValue(path.join(SERVER_ROOT, ".env"), "DATABASE_URL")
    );
}

/** Reuse the cmcKey already stored in etims_configuration. */
export async function fetchCmcKeyFromCertDb(serial: string): Promise<string> {
    const url = readDatabaseUrl();
    if (!url) {
        throw new Error("Cannot load cmcKey: DATABASE_URL is missing from apps/server/.env");
    }

    const sql = new Bun.SQL({ url, prepare: false, max: 1 });
    try {
        const rows = (await sql.unsafe(
            `select cmc_key
             from etims_configuration
             where cmc_key is not null and btrim(cmc_key) <> ''
             order by case when device_serial_number = $1 then 0 else 1 end, updated_at desc
             limit 1`,
            [serial],
        )) as Array<{ cmc_key?: string | null }>;
        const key = rows[0]?.cmc_key?.trim();
        if (!key) {
            throw new Error(
                "No cmcKey in etims_configuration. Initialize the device in Settings first.",
            );
        }
        return key;
    } finally {
        await sql.close();
    }
}
