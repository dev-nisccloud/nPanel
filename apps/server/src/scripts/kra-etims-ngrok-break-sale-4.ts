const BASE = "https://498a-197-232-51-43.ngrok-free.app";
const tin = "P600005001A";
const AUDITOR = { regrId: "Admin", regrNm: "Admin", modrId: "Admin", modrNm: "Admin" };

async function main() {
    const transaction = {
        trdInvcNo: "NP1",
        invcNo: 1,
        orgInvcNo: 0,
        custTin: tin,
        custNm: "Application Test Customer",
        salesTyCd: "N",
        rcptTyCd: "S",
        pmtTyCd: "01",
        salesSttsCd: "02",
        cfmDt: "20261103120000",
        salesDt: "20261103",
        stockRlsDt: "20261103120000",
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
        remark: "OSCU verification sale",
        ...AUDITOR,
        receipt: {
            custTin: tin,
            custMblNo: "0700000000",
            rcptPbctDt: "20261103120000",
            trdeNm: "nPanel 7",
            adrs: "Nairobi",
            prchrAcptcYn: "N",
        },
        itemList: [
            {
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
            },
        ],
    };
    const res = await fetch(`${BASE}/trpc/etimsCert.sales.sendSalesTransaction`, {
        method: "POST",
        headers: { "ngrok-skip-browser-warning": "1", "Content-Type": "application/json" },
        body: JSON.stringify({ transaction }),
    });
    const text = await res.text();
    console.log(text.slice(0, 1500));
    const ok = /"resultCd":"000"/.test(text) && /"success":true/.test(text);
    if (!ok) process.exitCode = 1;
}

main().catch((e) => {
    console.error(e);
    process.exit(1);
});
