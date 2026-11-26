const BASE = "https://498a-197-232-51-43.ngrok-free.app";
const AUDITOR = { regrId: "Admin", regrNm: "Admin", modrId: "Admin", modrNm: "Admin" };
const tin = "P600005001A";
const rfd = "20261103120000";
const line = {
    itemSeq: 1,
    itemCd: "KE1NTBA0000001",
    itemClsCd: "1010150100",
    itemNm: "nPanel Cert VAT16",
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

async function post(proc: string, body: unknown) {
    const res = await fetch(`${BASE}/trpc/${proc}`, {
        method: "POST",
        headers: { "ngrok-skip-browser-warning": "1", "Content-Type": "application/json" },
        body: JSON.stringify(body),
    });
    const j = await res.json();
    const s = JSON.stringify(j);
    const msg =
        s.match(/"errorMessage"\s*:\s*"([^"]+)/)?.[1] ??
        s.match(/"resultMsg"\s*:\s*"([^"]+)/)?.[1] ??
        s.slice(0, 280);
    const cd = s.match(/"resultCd"\s*:\s*"(\d+)"/)?.[1] ?? "-";
    const ok = /"success":true/.test(s) && !/"errorMessage"/.test(s);
    console.log(`${ok ? "ok" : "FAIL"} ${proc} cd=${cd} ${msg.slice(0, 240)}`);
    return ok;
}

async function main() {
    const cn = {
        trdInvcNo: `NPCN${Date.now().toString().slice(-6)}`,
        invcNo: 4,
        orgInvcNo: 3,
        custTin: tin,
        custNm: "Application Test Customer",
        salesTyCd: "N",
        rcptTyCd: "R",
        pmtTyCd: "01",
        salesSttsCd: "02",
        cfmDt: rfd,
        salesDt: "20261103",
        stockRlsDt: rfd,
        rfdDt: rfd,
        rfdRsnCd: "06",
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
        prchrAcptcYn: "N",
        remark: "probe CN org3 noon via sendCreditNote",
        ...AUDITOR,
        receipt: {
            custTin: tin,
            custMblNo: "0700000000",
            rcptPbctDt: rfd,
            trdeNm: "nPanel 7",
            adrs: "Nairobi",
            prchrAcptcYn: "N",
        },
        itemList: [line],
    };
    if (await post("etimsCert.sales.sendCreditNote", { transaction: cn })) return;

    const mix = {
        ...cn,
        trdInvcNo: `NPMIX${Date.now().toString().slice(-6)}`,
        orgInvcNo: 0,
        salesTyCd: "N",
        rcptTyCd: "S",
        rfdDt: null,
        rfdRsnCd: null,
        totItemCnt: 2,
        taxblAmtA: 1000,
        taxblAmtB: 1000,
        totTaxblAmt: 2000,
        totTaxAmt: 160,
        totAmt: 2160,
        remark: "probe mixed AB",
        itemList: [
            line,
            {
                ...line,
                itemSeq: 2,
                itemCd: "KE1NTBA0000002",
                itemClsCd: "1000000000",
                itemNm: "nPanel Cert Exempt",
                taxTyCd: "A",
                prc: 1000,
                splyAmt: 1000,
                taxblAmt: 1000,
                taxAmt: 0,
                totAmt: 1000,
            },
        ],
    };
    if (await post("etimsCert.sales.sendSalesTransaction", { transaction: mix })) return;

    const disc = {
        ...cn,
        trdInvcNo: `NPDC${Date.now().toString().slice(-6)}`,
        orgInvcNo: 0,
        salesTyCd: "N",
        rcptTyCd: "S",
        rfdDt: null,
        rfdRsnCd: null,
        taxblAmtB: 900,
        totTaxblAmt: 900,
        taxAmtB: 144,
        totTaxAmt: 144,
        totAmt: 1044,
        remark: "probe discount 10",
        itemList: [{ ...line, dcRt: 10, dcAmt: 116, splyAmt: 1044, taxblAmt: 900, taxAmt: 144, totAmt: 1044 }],
    };
    await post("etimsCert.sales.sendSalesTransaction", { transaction: disc });
}

main().catch((e) => {
    console.error(e);
    process.exit(1);
});
