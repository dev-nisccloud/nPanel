import {
	AUDITOR,
	aggregateTaxBands,
	kraDate8,
	kraDateTime14,
	round2,
} from "../../_lib/etims-kra";
import { isCreditNote, type EtimsSaleRecord } from "./etims-sale-utils";

function qtyUnitForKra(code?: unknown) {
	const raw = String(code ?? "NO").trim() || "NO";
	return raw === "U" ? "NO" : raw;
}

function mapCopyLine(line: Record<string, unknown>, idx: number) {
	const taxTyCd = String(line.taxTyCd ?? "B");
	const qty = Number(line.qty ?? 1) > 0 ? Number(line.qty ?? 1) : 1;
	return {
		itemSeq: idx + 1,
		itemCd: String(line.itemCd ?? ""),
		itemClsCd: line.itemClsCd ? String(line.itemClsCd) : undefined,
		itemNm: String(line.itemNm ?? "Item"),
		pkgUnitCd: String(line.pkgUnitCd ?? "OU"),
		pkg: 1,
		qtyUnitCd: qtyUnitForKra(line.qtyUnitCd),
		qty: round2(qty),
		prc: round2(Number(line.prc ?? 0)),
		splyAmt: round2(Number(line.splyAmt ?? 0)),
		dcRt: round2(Number(line.dcRt ?? 0)),
		dcAmt: round2(Number(line.dcAmt ?? 0)),
		taxTyCd,
		taxblAmt: round2(Number(line.taxblAmt ?? 0)),
		taxAmt: round2(Number(line.taxAmt ?? 0)),
		totAmt: round2(Number(line.totAmt ?? 0)),
	};
}

export function buildCopyReceiptPayload(sale: EtimsSaleRecord, invcNo: number) {
	const salesDt = kraDate8();
	const dt14 = kraDateTime14();
	const lines = Array.isArray(sale.itemList) ? sale.itemList : [];
	const itemList = lines.map((line, idx) => mapCopyLine(line, idx));
	const bands = aggregateTaxBands(itemList);
	const creditNote = isCreditNote(sale);
	const receipt = (sale.receipt ?? {}) as Record<string, unknown>;

	return {
		trdInvcNo: `COPY${invcNo}`,
		invcNo,
		orgInvcNo: creditNote ? Number(sale.orgInvcNo) || 0 : 0,
		custTin: sale.custTin ?? null,
		custNm: sale.custNm ?? null,
		salesTyCd: "C" as const,
		rcptTyCd: creditNote ? ("R" as const) : ("S" as const),
		pmtTyCd: sale.pmtTyCd ?? "01",
		salesSttsCd: "02",
		cfmDt: dt14,
		salesDt,
		stockRlsDt: null,
		...(creditNote
			? {
					rfdDt: dt14,
					rfdRsnCd: String(sale.rfdRsnCd ?? "06"),
				}
			: {}),
		totItemCnt: itemList.length,
		...bands,
		prchrAcptcYn: "N" as const,
		remark: `Copy of invoice ${sale.invcNo}`,
		...AUDITOR,
		receipt: {
			custTin: sale.custTin ?? receipt.custTin ?? null,
			custMblNo: receipt.custMblNo ? String(receipt.custMblNo) : null,
			rcptPbctDt: dt14,
			trdeNm: receipt.trdeNm ? String(receipt.trdeNm).slice(0, 20) : null,
			adrs: receipt.adrs ? String(receipt.adrs).slice(0, 200) : null,
			prchrAcptcYn: "N" as const,
		},
		itemList,
	};
}
