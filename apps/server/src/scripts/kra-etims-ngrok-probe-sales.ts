/**
 * Probe saveTrnsSalesOsdc field maps until one returns 000.
 *
 *   bun run src/scripts/kra-etims-ngrok-probe-sales.ts
 */
const BASE = (process.env.ETIMS_CERT_NGROK_URL ?? "https://498a-197-232-51-43.ngrok-free.app").replace(/\/$/, "");
const AUDITOR = { regrId: "Admin", regrNm: "Admin", modrId: "Admin", modrNm: "Admin" };
const PARENT = "KE1NTBA0000001";
const PARENT3 = "KE1NTBA0000003";

function unwrap(raw: unknown): unknown {
    const root = raw as Record<string, unknown>;
    const err = root?.error as Record<string, unknown> | undefined;
    if (err) throw new Error(String((err.data as { message?: string })?.message ?? err.message ?? JSON.stringify(err)));
    let cur: unknown = root?.result ?? root;
    if (cur && typeof cur === "object" && "data" in (cur as object)) cur = (cur as { data: unknown }).data;
    return cur;
}

async function call(procedure: string, input: unknown) {
    const res = await fetch(`${BASE}/trpc/${procedure}`, {
        method: "POST",
        headers: { "ngrok-skip-browser-warning": "1", "Content-Type": "application/json" },
        body: JSON.stringify(input),
    });
    const text = await res.text();
    let json: unknown;
    try {
        json = JSON.parse(text);
    } catch {
        return { success: false, errorMessage: `HTTP ${res.status}: ${text.slice(0, 180)}` };
    }
    try {
        return unwrap(json) as Record<string, unknown>;
    } catch (e) {
        return { success: false, errorMessage: e instanceof Error ? e.message : String(e) };
    }
}

function kraNow(hour12 = false) {
    const list = new Intl.DateTimeFormat("en-GB", {
        timeZone: "Africa/Nairobi",
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hour12: false,
    }).formatToParts(new Date());
    const g = (t: string) => list.find((p) => p.type === t)?.value ?? "00";
    const salesDt = `${g("year")}${g("month")}${g("day")}`;
    let hh = Number(g("hour") === "24" ? "00" : g("hour"));
    if (hour12) {
        if (hh === 0) hh = 12;
        else if (hh > 12) hh -= 12;
    }
    const cfmDt = `${salesDt}${String(hh).padStart(2, "0")}${g("minute")}${g("second")}`;
    return { salesDt, cfmDt, noon: `${salesDt}120000` };
}

function line(itemCd: string) {
    return {
        itemSeq: 1,
        itemCd,
        itemClsCd: "1010150100",
        itemNm: itemCd === PARENT3 ? "nPanel Cert VAT16 seq3" : "nPanel Cert VAT16",
        pkgUnitCd: "NT",
        pkg: 1,
        qtyUnitCd: "BA",
        qty: 1,
        prc: 1160,
        splyAmt: 1160,
        dcRt: 0,
        dcAmt: 0,
        taxTyCd: "B",
        taxblAmt: 1000,
        taxAmt: 160,
        totAmt: 1160,
    };
}

function classify(msg: string) {
    if (/already exists/i.test(msg)) return "924-exists";
    if (/expected:\s*(\d+)/i.test(msg) && /invcNo sequence/i.test(msg)) {
        return `seq-${msg.match(/expected:\s*(\d+)/i)?.[1]}`;
    }
    if (/ClockHourOfAmPm|could not be parsed/i.test(msg)) return "parse-12h";
    if (/future date/i.test(msg)) return "future-rfd";
    if (/RfdDt|rfdDt/i.test(msg)) return "rfdDt";
    if (/orgInvcNo|original/i.test(msg)) return "orgInvcNo";
    if (/itemCd/i.test(msg)) return "itemCd";
    if (/stock/i.test(msg)) return "stock";
    if (!msg || msg === "-") return "empty";
    return msg.replace(/\s+/g, " ").slice(0, 90);
}

type Map = {
    name: string;
    invcNo: number;
    orgInvcNo: number;
    salesTyCd: string;
    rcptTyCd: string;
    pmtTyCd?: string;
    salesSttsCd?: string;
    dates?: "24" | "12" | "noon" | "am";
    stockRls?: "same" | "null";
    rfd?: "null" | "same" | "12" | "noon";
    rfdRsnCd?: string | null;
    itemCd?: string;
    custTin?: "pin" | "null";
    prchrAcptcYn?: "N" | "Y";
};

async function main() {
    const cfg = (await (await fetch(`${BASE}/trpc/etimsCert.auth.getConfiguration`, {
        headers: { "ngrok-skip-browser-warning": "1" },
    })).json()) as { result?: { data?: { config?: { kraPin?: string; tisName?: string } } } };
    const tin = cfg.result?.data?.config?.kraPin ?? "";
    const tisName = cfg.result?.data?.config?.tisName ?? "nPanel 7";
    const t24 = kraNow(false);
    const t12 = kraNow(true);
    console.log(`probe ${BASE} tin=${tin} now24=${t24.cfmDt} now12=${t12.cfmDt}`);

    const maps: Map[] = [
        { name: "TS invc1 noon", invcNo: 1, orgInvcNo: 0, salesTyCd: "T", rcptTyCd: "S", dates: "noon" },
        { name: "TS invc1 12h", invcNo: 1, orgInvcNo: 0, salesTyCd: "T", rcptTyCd: "S", dates: "12" },
        { name: "CS invc1 noon stock", invcNo: 1, orgInvcNo: 0, salesTyCd: "C", rcptTyCd: "S", dates: "noon", stockRls: "same" },
        { name: "NS invc1 noon", invcNo: 1, orgInvcNo: 0, salesTyCd: "N", rcptTyCd: "S", dates: "noon" },
        { name: "PS invc1 noon", invcNo: 1, orgInvcNo: 0, salesTyCd: "P", rcptTyCd: "S", dates: "noon" },
        { name: "TS invc1 115959", invcNo: 1, orgInvcNo: 0, salesTyCd: "T", rcptTyCd: "S", dates: "am" },
        { name: "CS invc4 noon stock", invcNo: 4, orgInvcNo: 0, salesTyCd: "C", rcptTyCd: "S", dates: "noon", stockRls: "same" },
        { name: "NS invc4 115959 stock", invcNo: 4, orgInvcNo: 0, salesTyCd: "N", rcptTyCd: "S", dates: "am" },
        { name: "TS invc4 noon", invcNo: 4, orgInvcNo: 0, salesTyCd: "T", rcptTyCd: "S", dates: "noon" },
        { name: "NC invc4 org3 noon rfd noon", invcNo: 4, orgInvcNo: 3, salesTyCd: "N", rcptTyCd: "R", dates: "noon", rfd: "noon", rfdRsnCd: "06" },
        { name: "TS training new counter", invcNo: 1, orgInvcNo: 0, salesTyCd: "T", rcptTyCd: "S" },
        { name: "PS proforma new counter", invcNo: 1, orgInvcNo: 0, salesTyCd: "P", rcptTyCd: "S" },
        { name: "TS invc 4", invcNo: 4, orgInvcNo: 0, salesTyCd: "T", rcptTyCd: "S" },
        { name: "PS invc 4", invcNo: 4, orgInvcNo: 0, salesTyCd: "P", rcptTyCd: "S" },
        { name: "CS copy org0 stock null", invcNo: 4, orgInvcNo: 0, salesTyCd: "C", rcptTyCd: "S", stockRls: "null" },
        { name: "CS copy org3 stock null", invcNo: 4, orgInvcNo: 3, salesTyCd: "C", rcptTyCd: "S", stockRls: "null" },
        { name: "CS copy org0 same stock", invcNo: 4, orgInvcNo: 0, salesTyCd: "C", rcptTyCd: "S", stockRls: "same" },
        { name: "CS copy invc7 org0", invcNo: 7, orgInvcNo: 0, salesTyCd: "C", rcptTyCd: "S", stockRls: "null" },
        { name: "NS noon dates invc4", invcNo: 4, orgInvcNo: 0, salesTyCd: "N", rcptTyCd: "S", dates: "noon" },
        { name: "NS 12h dates invc4", invcNo: 4, orgInvcNo: 0, salesTyCd: "N", rcptTyCd: "S", dates: "12" },
        { name: "NS 24h item0000003", invcNo: 4, orgInvcNo: 0, salesTyCd: "N", rcptTyCd: "S", itemCd: PARENT3 },
        { name: "NS custTin null", invcNo: 4, orgInvcNo: 0, salesTyCd: "N", rcptTyCd: "S", custTin: "null" },
        { name: "NS pmt 02", invcNo: 4, orgInvcNo: 0, salesTyCd: "N", rcptTyCd: "S", pmtTyCd: "02" },
        { name: "NS pmt 05", invcNo: 4, orgInvcNo: 0, salesTyCd: "N", rcptTyCd: "S", pmtTyCd: "05" },
        { name: "NS pmt 07", invcNo: 4, orgInvcNo: 0, salesTyCd: "N", rcptTyCd: "S", pmtTyCd: "07" },
        { name: "NS stts 01", invcNo: 4, orgInvcNo: 0, salesTyCd: "N", rcptTyCd: "S", salesSttsCd: "01" },
        { name: "NS accept Y", invcNo: 4, orgInvcNo: 0, salesTyCd: "N", rcptTyCd: "S", prchrAcptcYn: "Y" },
        { name: "NS stock null", invcNo: 4, orgInvcNo: 0, salesTyCd: "N", rcptTyCd: "S", stockRls: "null" },
        { name: "NC rfd 12h org3", invcNo: 4, orgInvcNo: 3, salesTyCd: "N", rcptTyCd: "R", rfd: "12", rfdRsnCd: "06", dates: "12" },
        { name: "NC rfd 24h org3", invcNo: 4, orgInvcNo: 3, salesTyCd: "N", rcptTyCd: "R", rfd: "same", rfdRsnCd: "06" },
        { name: "NC rfd noon org3", invcNo: 4, orgInvcNo: 3, salesTyCd: "N", rcptTyCd: "R", rfd: "noon", rfdRsnCd: "06", dates: "noon" },
        { name: "NC rfd 12h rsn01", invcNo: 4, orgInvcNo: 3, salesTyCd: "N", rcptTyCd: "R", rfd: "12", rfdRsnCd: "01", dates: "12" },
        { name: "NC rfd 12h org1", invcNo: 4, orgInvcNo: 1, salesTyCd: "N", rcptTyCd: "R", rfd: "12", rfdRsnCd: "06", dates: "12" },
        { name: "NC rfd 12h invc7", invcNo: 7, orgInvcNo: 3, salesTyCd: "N", rcptTyCd: "R", rfd: "12", rfdRsnCd: "06", dates: "12" },
        { name: "CC copy credit org2", invcNo: 4, orgInvcNo: 2, salesTyCd: "C", rcptTyCd: "R", rfd: "12", rfdRsnCd: "06", dates: "12", stockRls: "null" },
        { name: "TC training credit", invcNo: 1, orgInvcNo: 1, salesTyCd: "T", rcptTyCd: "R", rfd: "12", rfdRsnCd: "06", dates: "12" },
        { name: "TS invc 4 noon", invcNo: 4, orgInvcNo: 0, salesTyCd: "T", rcptTyCd: "S", dates: "noon" },
        { name: "PS invc 4 noon", invcNo: 4, orgInvcNo: 0, salesTyCd: "P", rcptTyCd: "S", dates: "noon" },
        { name: "TS invc 7", invcNo: 7, orgInvcNo: 0, salesTyCd: "T", rcptTyCd: "S" },
        { name: "PS invc 7", invcNo: 7, orgInvcNo: 0, salesTyCd: "P", rcptTyCd: "S" },
        { name: "NS invc 7 noon", invcNo: 7, orgInvcNo: 0, salesTyCd: "N", rcptTyCd: "S", dates: "noon" },
        { name: "CS invc 4 noon stock null", invcNo: 4, orgInvcNo: 0, salesTyCd: "C", rcptTyCd: "S", dates: "noon", stockRls: "null" },
        { name: "NS invc 0", invcNo: 0, orgInvcNo: 0, salesTyCd: "N", rcptTyCd: "S" },
        { name: "NS orgInvcNo 3 still S", invcNo: 4, orgInvcNo: 3, salesTyCd: "N", rcptTyCd: "S" },
        { name: "NS pmt 03", invcNo: 4, orgInvcNo: 0, salesTyCd: "N", rcptTyCd: "S", pmtTyCd: "03" },
        { name: "NS pmt 04", invcNo: 4, orgInvcNo: 0, salesTyCd: "N", rcptTyCd: "S", pmtTyCd: "04" },
        { name: "NS pmt 06", invcNo: 4, orgInvcNo: 0, salesTyCd: "N", rcptTyCd: "S", pmtTyCd: "06" },
        { name: "NC rfd 12h rsn02", invcNo: 4, orgInvcNo: 3, salesTyCd: "N", rcptTyCd: "R", rfd: "12", rfdRsnCd: "02", dates: "12" },
        { name: "NC rfd 12h rsn05", invcNo: 4, orgInvcNo: 3, salesTyCd: "N", rcptTyCd: "R", rfd: "12", rfdRsnCd: "05", dates: "12" },
        { name: "CS copy of 1", invcNo: 4, orgInvcNo: 0, salesTyCd: "C", rcptTyCd: "S", stockRls: "null", dates: "12" },
        { name: "NS 12h item0000003", invcNo: 4, orgInvcNo: 0, salesTyCd: "N", rcptTyCd: "S", dates: "12", itemCd: PARENT3 },
        { name: "TS invc 4 12h", invcNo: 4, orgInvcNo: 0, salesTyCd: "T", rcptTyCd: "S", dates: "12" },
        { name: "PS invc 4 12h", invcNo: 4, orgInvcNo: 0, salesTyCd: "P", rcptTyCd: "S", dates: "12" },
        { name: "NS invc 8", invcNo: 8, orgInvcNo: 0, salesTyCd: "N", rcptTyCd: "S" },
        { name: "NS invc 2 (old CN slot)", invcNo: 2, orgInvcNo: 0, salesTyCd: "N", rcptTyCd: "S" },
        { name: "NC rfd 12h org2", invcNo: 4, orgInvcNo: 2, salesTyCd: "N", rcptTyCd: "R", rfd: "12", rfdRsnCd: "06", dates: "12" },
    ];

    const buckets = new Map<string, string[]>();
    let won: Map | null = null;
    let wonPayload: Record<string, unknown> | null = null;

    for (const m of maps) {
        const dates =
            m.dates === "12"
                ? t12
                : m.dates === "noon"
                  ? { salesDt: t24.salesDt, cfmDt: t24.noon }
                  : m.dates === "am"
                    ? { salesDt: t24.salesDt, cfmDt: `${t24.salesDt}115959` }
                    : t24;
        const rfdDt =
            m.rfd === "12" ? t12.cfmDt : m.rfd === "noon" ? t24.noon : m.rfd === "same" ? dates.cfmDt : null;
        const isCredit = m.rcptTyCd === "R";
        const body = {
            transaction: {
                trdInvcNo: `NP${Date.now().toString().slice(-8)}`,
                invcNo: m.invcNo,
                orgInvcNo: m.orgInvcNo,
                custTin: m.custTin === "null" ? null : tin,
                custNm: "Application Test Customer",
                salesTyCd: m.salesTyCd,
                rcptTyCd: m.rcptTyCd,
                pmtTyCd: m.pmtTyCd ?? "01",
                salesSttsCd: m.salesSttsCd ?? "02",
                cfmDt: dates.cfmDt,
                salesDt: dates.salesDt,
                stockRlsDt: m.stockRls === "null" ? null : dates.cfmDt,
                cnclReqDt: null,
                cnclDt: null,
                rfdDt: isCredit ? rfdDt ?? t12.cfmDt : rfdDt,
                rfdRsnCd: isCredit ? m.rfdRsnCd ?? "06" : m.rfdRsnCd ?? null,
                totItemCnt: 1,
                taxblAmtA: 0,
                taxblAmtB: 1000,
                taxblAmtC: 0,
                taxblAmtD: 0,
                taxblAmtE: 0,
                taxRtA: 0,
                taxRtB: 16,
                taxRtC: 0,
                taxRtD: 0,
                taxRtE: 0,
                taxAmtA: 0,
                taxAmtB: 160,
                taxAmtC: 0,
                taxAmtD: 0,
                taxAmtE: 0,
                totTaxblAmt: 1000,
                totTaxAmt: 160,
                totAmt: 1160,
                prchrAcptcYn: m.prchrAcptcYn ?? "N",
                remark: m.name,
                ...AUDITOR,
                receipt: {
                    custTin: m.custTin === "null" ? null : tin,
                    custMblNo: "0700000000",
                    rcptPbctDt: dates.cfmDt,
                    trdeNm: tisName,
                    adrs: "Nairobi",
                    prchrAcptcYn: m.prchrAcptcYn ?? "N",
                },
                itemList: [line(m.itemCd ?? PARENT)],
            },
        };
        const out = await call("etimsCert.sales.sendSalesTransaction", body);
        const msg = String(out.errorMessage ?? "");
        const text = JSON.stringify(out);
        const cd = text.match(/"resultCd"\s*:\s*"(\d+)"/)?.[1] ?? (out.success === true ? "000" : "-");
        const ok = out.success === true || cd === "000";
        const bucket = ok ? "000" : classify(msg);
        const row = `${m.name} | ${m.salesTyCd}${m.rcptTyCd} invc=${m.invcNo} org=${m.orgInvcNo} dt=${m.dates ?? "24"} stock=${m.stockRls ?? "same"} rfd=${m.rfd ?? "null"} item=${m.itemCd ?? PARENT} pmt=${m.pmtTyCd ?? "01"}`;
        if (!buckets.has(bucket)) buckets.set(bucket, []);
        buckets.get(bucket)!.push(row);
        console.log(`${ok ? "ok" : "FAIL"}  ${row.padEnd(92)} cd=${cd} ${bucket}${ok ? "" : ` ${msg.slice(0, 120)}`}`);
        if (ok) {
            won = m;
            wonPayload = body.transaction;
            break;
        }
        await Bun.sleep(250);
    }

    console.log("\n═══ error buckets ═══");
    for (const [k, rows] of buckets) {
        console.log(`\n[${k}] x${rows.length}`);
        for (const r of rows) console.log(`  ${r}`);
    }
    if (won) {
        console.log("\n═══ WORKING MAP ═══");
        console.log(JSON.stringify(won, null, 2));
        console.log("fields:", JSON.stringify(wonPayload, null, 2));
    } else {
        console.log("\nNo map returned 000.");
        process.exitCode = 1;
    }
}

main().catch((e) => {
    console.error(e instanceof Error ? e.message : e);
    process.exit(1);
});
