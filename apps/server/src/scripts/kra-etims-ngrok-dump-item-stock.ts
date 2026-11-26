const BASE = (process.env.ETIMS_CERT_NGROK_URL ?? "https://ffe3-197-232-51-43.ngrok-free.app").replace(/\/$/, "");

async function raw(method: string, procedure: string, input?: unknown) {
    const headers: Record<string, string> = { "ngrok-skip-browser-warning": "1" };
    let url = `${BASE}/trpc/${procedure}`;
    if (method === "GET" && input) url += `?input=${encodeURIComponent(JSON.stringify(input))}`;
    const init: RequestInit = { method, headers };
    if (method === "POST") {
        headers["Content-Type"] = "application/json";
        init.body = JSON.stringify(input ?? {});
    }
    const res = await fetch(url, init);
    const text = await res.text();
    console.log(`\n${method} ${procedure} HTTP ${res.status}`);
    console.log(text.slice(0, 2500));
}

await raw("GET", "etimsCert.items.getItemList", { lastReqDt: "20180101000000" });
await raw("GET", "etimsCert.items.getItemList", { lastReqDt: "20261111143500" });
await raw("POST", "etimsCert.stock.saveStockMaster", {
    stockMaster: {
        itemCd: "KE1NTBA0000001",
        rsdQty: 10,
        regrId: "Admin",
        regrNm: "Admin",
        modrId: "Admin",
        modrNm: "Admin",
    },
});
await raw("POST", "etimsCert.stock.saveStockMaster", {
    stockMaster: {
        itemCd: "KE1NTBA0000001",
        rsdQty: 20,
        regrId: "Admin",
        regrNm: "Admin",
        modrId: "Admin",
        modrNm: "Admin",
    },
});
