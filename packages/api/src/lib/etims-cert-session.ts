import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { TRPCError } from "@trpc/server";
import {
    createEtimsClient,
    type EtimsClientConfig,
    type EtimsOscuClient,
    type EtimsOscuHeaders,
} from "./etims-client";

const REQUIRED = [
    "ETIMS_CERT_TIN",
    "ETIMS_CERT_BHF_ID",
    "ETIMS_CERT_DEVICE_SERIAL",
    "ETIMS_CERT_APP_TEST_PIN",
    "ETIMS_APIGEE_APP_ID",
    "ETIMS_CONSUMER_KEY",
    "ETIMS_CONSUMER_SECRET",
] as const;

export type EtimsCertEnv = {
    envPath: string;
    tin: string;
    integratorPin: string;
    bhfId: string;
    dvcSrlNo: string;
    tisName: string;
    tisVersion: string;
    /** Optional. Sandbox 902 often returns data:null — reuse this instead of the live DB. */
    storedCmcKey: string | null;
    clientConfig: EtimsClientConfig;
};

type CertRuntime = {
    fingerprint: string;
    env: EtimsCertEnv;
    client: EtimsOscuClient;
    cmcKey: string | null;
};

let runtime: CertRuntime | null = null;

function parseEnvFile(filePath: string): Record<string, string> {
    const out: Record<string, string> = {};
    for (const raw of readFileSync(filePath, "utf8").split(/\r?\n/)) {
        const line = raw.trim();
        if (!line || line.startsWith("#")) continue;
        const eq = line.indexOf("=");
        if (eq <= 0) continue;
        const key = line.slice(0, eq).trim();
        let value = line.slice(eq + 1).trim();
        if (
            (value.startsWith('"') && value.endsWith('"')) ||
            (value.startsWith("'") && value.endsWith("'"))
        ) {
            value = value.slice(1, -1);
        }
        out[key] = value;
    }
    return out;
}

function trimUrl(value: string | undefined, fallback: string): string {
    const raw = (value && value.trim()) || fallback;
    return raw.replace(/\/+$/, "");
}

/** Resolve apps/server/.env.etims-certification without touching process.env or the live .env. */
export function resolveEtimsCertEnvPath(): string {
    if (process.env.ETIMS_CERT_ENV_PATH?.trim()) {
        return path.resolve(process.env.ETIMS_CERT_ENV_PATH.trim());
    }
    const here = path.dirname(fileURLToPath(import.meta.url));
    const candidates = [
        path.resolve(process.cwd(), ".env.etims-certification"),
        path.resolve(process.cwd(), "apps/server/.env.etims-certification"),
        path.resolve(here, "../../../../apps/server/.env.etims-certification"),
    ];
    const found = candidates.find((p) => existsSync(p));
    if (found) return found;
    throw new TRPCError({
        code: "PRECONDITION_FAILED",
        message:
            "Missing apps/server/.env.etims-certification. Isolated cert routes do not use the live .env.",
    });
}

export function loadEtimsCertEnv(): EtimsCertEnv {
    const envPath = resolveEtimsCertEnvPath();
    const file = parseEnvFile(envPath);
    if (!file.ETIMS_CONSUMER_KEY?.trim() && file.CONSUMER_KEY?.trim()) {
        file.ETIMS_CONSUMER_KEY = file.CONSUMER_KEY.trim();
    }
    if (!file.ETIMS_CONSUMER_SECRET?.trim() && file.CONSUMER_SECRET?.trim()) {
        file.ETIMS_CONSUMER_SECRET = file.CONSUMER_SECRET.trim();
    }
    const missing = REQUIRED.filter((k) => !file[k]?.trim());
    if (missing.length) {
        throw new TRPCError({
            code: "PRECONDITION_FAILED",
            message: `Missing in .env.etims-certification: ${missing.join(", ")}`,
        });
    }
    return {
        envPath,
        tin: file.ETIMS_CERT_APP_TEST_PIN.trim(),
        integratorPin: file.ETIMS_CERT_TIN.trim(),
        bhfId: file.ETIMS_CERT_BHF_ID.trim(),
        dvcSrlNo: file.ETIMS_CERT_DEVICE_SERIAL.trim(),
        tisName: file.ETIMS_CERT_TIS_NAME?.trim() || "nPanel 4",
        tisVersion: file.ETIMS_CERT_TIS_VERSION?.trim() || "1.0.0",
        storedCmcKey: file.ETIMS_CERT_CMC_KEY?.trim() || null,
        clientConfig: {
            baseUrl: trimUrl(
                file.ETIMS_SANDBOX_BASE_URL ?? file.ETIMS_BASE_URL,
                "https://sbx.kra.go.ke/etims-oscu/api/v1",
            ),
            tokenUrl: trimUrl(
                file.ETIMS_SANDBOX_TOKEN_URL ?? file.ETIMS_TOKEN_URL,
                "https://sbx.kra.go.ke/v1/token/generate",
            ),
            consumerKey: file.ETIMS_CONSUMER_KEY.trim(),
            consumerSecret: file.ETIMS_CONSUMER_SECRET.trim(),
            apigeeAppId: file.ETIMS_APIGEE_APP_ID.trim(),
            memoryTokenOnly: true,
        },
    };
}

function fingerprint(env: EtimsCertEnv): string {
    const c = env.clientConfig;
    return [
        c.consumerKey,
        c.consumerSecret,
        c.apigeeAppId ?? "",
        c.baseUrl,
        c.tokenUrl,
        env.tin,
        env.bhfId,
        env.dvcSrlNo,
    ].join("|");
}

/** Isolated runtime: cert env file + in-memory cmcKey. No DB, no Redis, no live process.env OAuth. */
export function getEtimsCertRuntime(): CertRuntime {
    const env = loadEtimsCertEnv();
    const fp = fingerprint(env);
    if (!runtime || runtime.fingerprint !== fp) {
        runtime = {
            fingerprint: fp,
            env,
            client: createEtimsClient(env.clientConfig),
            cmcKey: null,
        };
    }
    return runtime;
}

function certSessionPath(envPath: string): string {
    return path.join(path.dirname(envPath), ".etims-certification", "session.json");
}

type CertSessionFile = {
    tin: string;
    bhfId: string;
    dvcSrlNo: string;
    apigeeAppId: string;
    cmcKey: string;
};

function readCertSessionFile(env: EtimsCertEnv): string | null {
    const filePath = certSessionPath(env.envPath);
    if (!existsSync(filePath)) return null;
    try {
        const parsed = JSON.parse(readFileSync(filePath, "utf8")) as CertSessionFile;
        if (
            parsed.tin === env.tin &&
            parsed.bhfId === env.bhfId &&
            parsed.dvcSrlNo === env.dvcSrlNo &&
            parsed.apigeeAppId === (env.clientConfig.apigeeAppId ?? "") &&
            typeof parsed.cmcKey === "string" &&
            parsed.cmcKey.trim()
        ) {
            return parsed.cmcKey.trim();
        }
    } catch {
        return null;
    }
    return null;
}

function writeCertSessionFile(env: EtimsCertEnv, cmcKey: string): void {
    const filePath = certSessionPath(env.envPath);
    mkdirSync(path.dirname(filePath), { recursive: true });
    const payload: CertSessionFile = {
        tin: env.tin,
        bhfId: env.bhfId,
        dvcSrlNo: env.dvcSrlNo,
        apigeeAppId: env.clientConfig.apigeeAppId ?? "",
        cmcKey,
    };
    writeFileSync(filePath, `${JSON.stringify(payload, null, 2)}\n`, "utf8");
}

export function setEtimsCertCmcKey(cmcKey: string): void {
    const rt = getEtimsCertRuntime();
    rt.cmcKey = cmcKey.trim();
    writeCertSessionFile(rt.env, rt.cmcKey);
}

export function certIdentityMatchesEnv(
    env: EtimsCertEnv,
    input?: { tin?: string; bhfId?: string; dvcSrlNo?: string } | null,
): boolean {
    const tin = input?.tin?.trim() || env.tin;
    const bhfId = input?.bhfId?.trim() || env.bhfId;
    const dvcSrlNo = input?.dvcSrlNo?.trim() || env.dvcSrlNo;
    return tin === env.tin && bhfId === env.bhfId && dvcSrlNo === env.dvcSrlNo;
}

/** 902 returns data:null. Reuse cert-local key (body → env → session file → memory), never live DB. */
export function resolveReusedCmcKey(opts: {
    bodyKey?: string | null;
    env: EtimsCertEnv;
    memoryKey: string | null;
    identityMatchesEnv: boolean;
}): string | null {
    const bodyKey = opts.bodyKey?.trim() || null;
    if (bodyKey) return bodyKey;
    if (!opts.identityMatchesEnv) return opts.memoryKey?.trim() || null;
    return opts.env.storedCmcKey || readCertSessionFile(opts.env) || opts.memoryKey?.trim() || null;
}

export function extractResultCd(result: unknown): string | null {
    if (!result || typeof result !== "object") return null;
    const root = result as Record<string, unknown>;
    const wrapped = root.responseBody;
    const payload =
        wrapped && typeof wrapped === "object" && !Array.isArray(wrapped)
            ? (wrapped as Record<string, unknown>)
            : root;
    const nested = payload.data;
    const fromNested =
        nested && typeof nested === "object" && !Array.isArray(nested)
            ? (nested as Record<string, unknown>).resultCd
            : undefined;
    const cd = payload.resultCd ?? fromNested;
    return typeof cd === "string" && cd.trim() ? cd.trim() : null;
}

export function extractCmcKey(result: unknown): string | null {
    if (!result || typeof result !== "object") return null;
    const root = result as Record<string, unknown>;
    const wrapped = root.responseBody;
    const payload =
        wrapped && typeof wrapped === "object" && !Array.isArray(wrapped)
            ? (wrapped as Record<string, unknown>)
            : root;
    const data = payload.data as Record<string, unknown> | undefined;
    const info = data?.info as Record<string, unknown> | undefined;
    const key = info?.cmcKey ?? payload.cmcKey ?? data?.cmcKey;
    return typeof key === "string" && key.trim() ? key.trim() : null;
}

export function getEtimsCertOscu(): { client: EtimsOscuClient; oscu: EtimsOscuHeaders; env: EtimsCertEnv } {
    const rt = getEtimsCertRuntime();
    if (!rt.cmcKey) {
        throw new TRPCError({
            code: "PRECONDITION_FAILED",
            message:
                "etimsCert is not initialized. POST etimsCert.initialization.initializeDevice first (cmcKey is kept in memory only, not the DB).",
        });
    }
    return {
        client: rt.client,
        env: rt.env,
        oscu: { tin: rt.env.tin, bhfId: rt.env.bhfId, cmcKey: rt.cmcKey },
    };
}
