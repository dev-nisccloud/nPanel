/**
 * Bisect pre-cert (2bbc404e) vs post-cert (2ffc841e) client shapes.
 *
 * Pre-cert: legacy host + /select* paths + NO apigee_app_id
 * Post-cert: DEV host + /initialize paths + apigee_app_id
 *
 *   bun run etims:certification:probe
 */
import { fetchCmcKeyFromCertDb } from "./load-etims-cert-env";
import { request } from "undici";

const PRE_PATHS = {
    init: "/selectInitOsdcInfo",
    codeList: "/selectCodeList",
    itemCls: "/selectItemClsList",
    saveItem: "/saveItem",
} as const;

const POST_PATHS = {
    init: "/initialize",
    codeList: "/selectCodeList",
    itemCls: "/selectItemClass",
    saveItem: "/saveItem",
} as const;

const LEGACY = "https://etims-api-sbx.kra.go.ke/etims-api";
const DEV = "https://sbx.kra.go.ke/etims-oscu/api/v1";
const TOKEN_URL = "https://sbx.kra.go.ke/v1/token/generate";

type Paths = typeof PRE_PATHS;

async function getToken(consumerKey: string, consumerSecret: string) {
    const auth = Buffer.from(`${consumerKey}:${consumerSecret}`).toString("base64");
    const url = `${TOKEN_URL}?grant_type=client_credentials`;
    const res = await request(url, {
        method: "GET",
        headers: { Authorization: `Basic ${auth}` },
    });
    const text = await res.body.text();
    let json: { access_token?: string } = {};
    try {
        json = JSON.parse(text) as { access_token?: string };
    } catch {
        throw new Error(`token HTTP ${res.statusCode}: ${text.slice(0, 200)}`);
    }
    if (!json.access_token) {
        throw new Error(`token HTTP ${res.statusCode}: ${text.slice(0, 200)}`);
    }
    return json.access_token;
}

function summarize(status: number, text: string) {
    let parsed: Record<string, unknown> | null = null;
    try {
        parsed = JSON.parse(text) as Record<string, unknown>;
    } catch {
        /* html 404 etc */
    }
    const hdr = (parsed?.responseHeader ?? null) as Record<string, unknown> | null;
    const body = (parsed?.responseBody ?? parsed) as Record<string, unknown> | null;
    const debug = String(
        hdr?.debugMessage ?? body?.resultMsg ?? text.slice(0, 120),
    ).replace(/\s+/g, " ");
    const resultCd = String(body?.resultCd ?? "");
    const ok =
        status === 200 &&
        (resultCd === "000" || resultCd === "001" || resultCd === "902");
    const flag = /unique result|2 results/i.test(debug)
        ? "UNIQUE-2"
        : /TestSessionApiLog|getApiNo/i.test(debug)
          ? "NO-SESSION"
          : /not valid device/i.test(debug)
            ? "BAD-DVC"
            : ok
              ? "OK"
              : status === 404
                ? "404"
                : "FAIL";
    return { status, resultCd, ok, flag, debug: debug.slice(0, 140) };
}

async function post(
    token: string,
    baseUrl: string,
    kraPath: string,
    body: Record<string, unknown>,
    headers: Record<string, string>,
) {
    const url = `${baseUrl.replace(/\/+$/, "")}${kraPath}`;
    const res = await request(url, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
            Authorization: `Bearer ${token}`,
            ...headers,
        },
        body: JSON.stringify(body),
    });
    const text = await res.body.text();
    return { url, ...summarize(res.statusCode, text) };
}

type Variant = {
    name: string;
    baseUrl: string;
    paths: Paths;
    /** undefined = omit header entirely (pre-cert). string = send that value */
    apigee?: string;
};

async function main() {
    const tin = process.env.ETIMS_CERT_TIN?.trim() ?? "";
    const bhfId = process.env.ETIMS_CERT_BHF_ID?.trim() || "01";
    const serial = process.env.ETIMS_CERT_DEVICE_SERIAL?.trim() ?? "";
    if (!tin || !serial) {
        throw new Error("Missing ETIMS_CERT_TIN / ETIMS_CERT_DEVICE_SERIAL in .env.etims-certification");
    }
    const cmcKey = await fetchCmcKeyFromCertDb(serial);
    const apigee = (process.env.ETIMS_APIGEE_APP_ID ?? "").trim();
    const consumerKey = (process.env.ETIMS_CONSUMER_KEY ?? "").trim();
    const consumerSecret = (process.env.ETIMS_CONSUMER_SECRET ?? "").trim();

    console.log("═══ Pre-cert vs post-cert client bisect ═══");
    console.log(`Suspect commit: 2ffc841e (cert support) vs parent 2bbc404e`);
    console.log(`TIN=${tin} bhf=${bhfId} serial=${serial}`);
    console.log(`Pre-cert default host was LEGACY; post-cert default is DEV + apigee_app_id\n`);

    const token = await getToken(consumerKey, consumerSecret);

    const variants: Variant[] = [
        {
            name: "1 PRE-CERT shape (legacy host + /select* + NO apigee)",
            baseUrl: LEGACY,
            paths: PRE_PATHS,
        },
        {
            name: "2 PRE paths + legacy + apigee UUID",
            baseUrl: LEGACY,
            paths: PRE_PATHS,
            apigee,
        },
        {
            name: "3 PRE paths + DEV host + NO apigee",
            baseUrl: DEV,
            paths: PRE_PATHS,
        },
        {
            name: "4 PRE paths + DEV + apigee UUID",
            baseUrl: DEV,
            paths: PRE_PATHS,
            apigee,
        },
        {
            name: "5 POST paths + DEV + NO apigee",
            baseUrl: DEV,
            paths: POST_PATHS,
        },
        {
            name: "6 POST-CERT shape (DEV + /initialize + apigee UUID) CURRENT",
            baseUrl: DEV,
            paths: POST_PATHS,
            apigee,
        },
        {
            name: "7 POST paths + DEV + apigee=ckey",
            baseUrl: DEV,
            paths: POST_PATHS,
            apigee: consumerKey,
        },
        {
            name: "8 POST paths + legacy + NO apigee",
            baseUrl: LEGACY,
            paths: POST_PATHS,
        },
    ];

    type Score = { name: string; ok: number; total: number; fails: string[] };
    const scores: Score[] = [];

    for (const v of variants) {
        console.log(`── ${v.name} ──`);
        const oscuHdr: Record<string, string> = {
            tin,
            bhfId,
            cmcKey,
        };
        if (v.apigee !== undefined) oscuHdr.apigee_app_id = v.apigee;

        const initHdr: Record<string, string> = { tin, bhfId };
        if (v.apigee !== undefined) initHdr.apigee_app_id = v.apigee;

        const calls: Array<{
            label: string;
            path: string;
            body: Record<string, unknown>;
            hdr: Record<string, string>;
        }> = [
            {
                label: "init",
                path: v.paths.init,
                body: { tin, bhfId, dvcSrlNo: serial },
                hdr: initHdr,
            },
            {
                label: "codeList",
                path: v.paths.codeList,
                body: { tin, bhfId, cmcKey, lastReqDt: "20180101000000" },
                hdr: oscuHdr,
            },
            {
                label: "itemCls",
                path: v.paths.itemCls,
                body: { tin, bhfId, cmcKey, lastReqDt: "20180101000000" },
                hdr: oscuHdr,
            },
            {
                label: "saveItem",
                path: v.paths.saveItem,
                body: {
                    tin,
                    bhfId,
                    cmcKey,
                    itemCd: "KE1NTBA0000021",
                    itemClsCd: "1010150100",
                    itemTyCd: "1",
                    itemNm: "Cert Goods Parent",
                    itemStdNm: "Cert Goods Parent",
                    orgnNatCd: "KE",
                    pkgUnitCd: "NT",
                    qtyUnitCd: "BA",
                    taxTyCd: "B",
                    dftPrc: 1000,
                    grpPrcL1: 1000,
                    grpPrcL2: 1000,
                    grpPrcL3: 1000,
                    grpPrcL4: 1000,
                    grpPrcL5: 0,
                    sftyQty: 0,
                    isrcAplcbYn: "N",
                    useYn: "Y",
                    regrId: "Admin",
                    regrNm: "Admin",
                    modrId: "Admin",
                    modrNm: "Admin",
                },
                hdr: oscuHdr,
            },
        ];

        let ok = 0;
        const fails: string[] = [];
        for (const c of calls) {
            const r = await post(token, v.baseUrl, c.path, c.body, c.hdr);
            if (r.ok) ok++;
            else fails.push(`${c.label}(${r.flag})`);
            console.log(
                `  [${r.flag}] ${c.label} ${c.path}  HTTP ${r.status} resultCd=${r.resultCd}`,
            );
            if (!r.ok) console.log(`         ${r.debug}`);
        }
        scores.push({ name: v.name, ok, total: calls.length, fails });
        console.log(`  score ${ok}/${calls.length}\n`);
    }

    scores.sort((a, b) => b.ok - a.ok);
    console.log("═══ VERDICT ═══");
    for (const s of scores) {
        console.log(
            `${s.ok}/${s.total}  ${s.name}` +
                (s.fails.length ? `  fails=[${s.fails.join(", ")}]` : "  ALL OK"),
        );
    }
    const best = scores.filter((s) => s.ok === s.total);
    if (best.length) {
        console.log(`\nWORKING: ${best.map((b) => b.name).join(" | ")}`);
        console.log(
            "If #1 works: revert client defaults to pre-2ffc841e (legacy host + paths, no apigee) or dual-mode.",
        );
    }
}

main().catch((e) => {
    console.error(e);
    process.exit(1);
});
