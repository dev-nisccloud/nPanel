/**
 * Live Gava Connect run — same order as the nPanel certification that scored.
 *
 *   cd apps/kra-etims-oscu
 *   bun run test:live
 *
 * Env (required):
 *   KRA_OSCU_CONSUMER_KEY
 *   KRA_OSCU_CONSUMER_SECRET
 * Optional:
 *   KRA_OSCU_ENV=sandbox|production
 *   KRA_OSCU_HOST=gava|classic          (default gava)
 *   KRA_OSCU_TIN                         (default Application Test Pin fixture)
 *   KRA_OSCU_BHF_ID=00
 *   KRA_OSCU_DEVICE_SERIAL
 *   KRA_OSCU_CMC_KEY                     (reuse when init returns 902)
 *   ONLY=01-init                         (run a single step id)
 *   SKIP_CREDIT_NOTE=1
 */

import { KraOscuError } from "../src/errors";
import { createKraOscuClient } from "../src/client";
import { parseExpectedCounter } from "../src/unwrap";
import { pickItemClassForTax, parseItemClassList, firstImportedItem } from "../src/parse";
import {
  buildBranchUser,
  buildComposition,
  buildConvertImportedItem,
  buildCreditNote,
  buildCustomer,
  buildInsurance,
  buildItem,
  buildPurchase,
  buildSale,
  buildSalesLine,
  buildStockIo,
  buildStockIoLine,
  buildStockMaster,
} from "../src/builders";
import { GAVA_CONNECT_LIVE_ORDER, type LiveStepId } from "./gava-connect-order";
import { SANDBOX_CERT_FIXTURE as F } from "./fixtures";

type Ctx = {
  tin: string;
  bhfId: string;
  dvcSrlNo: string;
  cmcKey: string;
  parentCd: string;
  childCd: string;
  clsB: string;
  clsA: string;
  invcNo: number;
  sarNo: number;
  saleSdcDateTime: string | null;
  saleRcptSign: string | null;
};

function env(name: string, fallback = ""): string {
  return (process.env[name] ?? fallback).trim();
}

function ok(resultCd: string | null | undefined): boolean {
  return resultCd === "000" || resultCd === "001" || resultCd === "902";
}

async function retryCounter<T>(label: string, run: (n: number) => Promise<T>, start: number, readMsg: (err: unknown) => string): Promise<T> {
  let n = start;
  for (let i = 0; i < 6; i++) {
    try {
      return await run(n);
    } catch (err) {
      const expected = parseExpectedCounter(readMsg(err));
      if (expected == null) throw err;
      console.log(`  ${label}: KRA expected ${expected}, retrying`);
      n = expected;
    }
  }
  throw new Error(`${label}: exhausted counter retries`);
}

async function main() {
  const consumerKey = env("KRA_OSCU_CONSUMER_KEY") || env("ETIMS_CONSUMER_KEY");
  const consumerSecret = env("KRA_OSCU_CONSUMER_SECRET") || env("ETIMS_CONSUMER_SECRET");
  if (!consumerKey || !consumerSecret) {
    console.error("Set KRA_OSCU_CONSUMER_KEY and KRA_OSCU_CONSUMER_SECRET");
    process.exit(1);
  }

  const client = createKraOscuClient({
    environment: env("KRA_OSCU_ENV", "sandbox") === "production" ? "production" : "sandbox",
    host: env("KRA_OSCU_HOST", "gava") === "classic" ? "classic" : "gava",
    consumerKey,
    consumerSecret,
    apigeeAppId: env("KRA_OSCU_APIGEE_APP_ID") || env("ETIMS_APIGEE_APP_ID") || consumerKey,
  });

  const ctx: Ctx = {
    tin: env("KRA_OSCU_TIN", F.tin),
    bhfId: env("KRA_OSCU_BHF_ID", F.bhfId),
    dvcSrlNo: env("KRA_OSCU_DEVICE_SERIAL", F.dvcSrlNo),
    cmcKey: env("KRA_OSCU_CMC_KEY") || env("ETIMS_CMC_KEY"),
    parentCd: F.items.parent.itemCd,
    childCd: F.items.child.itemCd,
    clsB: F.items.classes.B.itemClsCd,
    clsA: F.items.classes.A.itemClsCd,
    invcNo: F.sale.invcNo,
    sarNo: 1,
    saleSdcDateTime: null,
    saleRcptSign: null,
  };

  if (ctx.cmcKey) client.setIdentity({ tin: ctx.tin, bhfId: ctx.bhfId, cmcKey: ctx.cmcKey });

  const only = env("ONLY") as LiveStepId | "";
  const steps = only ? GAVA_CONNECT_LIVE_ORDER.filter((s) => s.id === only) : GAVA_CONNECT_LIVE_ORDER;
  if (env("SKIP_CREDIT_NOTE") === "1") {
    const i = steps.findIndex((s) => s.id === "26-credit-note");
    if (i >= 0) steps.splice(i, 1);
  }

  console.log(`Host ${client.host} ${client.baseUrl}`);
  console.log(`TIN ${ctx.tin} branch ${ctx.bhfId}`);
  console.log(`Steps: ${steps.map((s) => s.id).join(" → ")}\n`);

  for (const step of steps) {
    process.stdout.write(`${String(step.n).padStart(4)} ${step.id} ${step.testCase} → ${client.path(step.endpointKey)} ... `);
    try {
      const resultCd = await runStep(client, ctx, step.id);
      console.log(ok(resultCd) ? `ok (${resultCd})` : `resultCd=${resultCd}`);
    } catch (err) {
      const msg = err instanceof KraOscuError ? `${err.resultCd ?? err.statusCode} ${err.resultMsg}` : err instanceof Error ? err.message : String(err);
      console.log(`FAIL ${msg}`);
      process.exitCode = 1;
      if (!only) break;
    }
  }
}

async function runStep(
  client: ReturnType<typeof createKraOscuClient>,
  ctx: Ctx,
  id: LiveStepId,
): Promise<string | null> {
  const errMsg = (e: unknown) => (e instanceof KraOscuError ? e.resultMsg : e instanceof Error ? e.message : String(e));

  switch (id) {
    case "01-init": {
      const r = await client.initializeDevice({
        tin: ctx.tin,
        bhfId: ctx.bhfId,
        dvcSrlNo: ctx.dvcSrlNo,
        storedCmcKey: ctx.cmcKey,
      });
      ctx.cmcKey = r.cmcKey ?? ctx.cmcKey;
      if (!ctx.cmcKey) throw new Error("init returned no cmcKey — set KRA_OSCU_CMC_KEY if resultCd is 902");
      client.setIdentity({ tin: ctx.tin, bhfId: ctx.bhfId, cmcKey: ctx.cmcKey });
      return r.resultCd;
    }
    case "02-codes":
      return (await client.getCodeList(F.lastReqDt)).resultCd;
    case "03-item-class": {
      const r = await client.getItemClassList(F.lastReqDt);
      const list = parseItemClassList(r.data);
      ctx.clsB = pickItemClassForTax(list, "B")?.itemClsCd ?? ctx.clsB;
      ctx.clsA = pickItemClassForTax(list, "A")?.itemClsCd ?? ctx.clsA;
      return r.resultCd;
    }
    case "04-branches":
      return (await client.getBranchList(F.lastReqDt)).resultCd;
    case "05-notices":
      return (await client.getNotices(F.lastReqDt)).resultCd;
    case "06-customer":
      return (
        await client.saveCustomer(
          buildCustomer({
            custNo: F.customer.custNo,
            custTin: F.customer.custTin,
            custNm: F.customer.custNm,
            adrs: "Nairobi",
            telNo: "0700000000",
            email: "cert@example.com",
            remark: "OSCU library live test",
          }),
        )
      ).resultCd;
    case "07-user":
      return (
        await client.saveBranchUser(
          buildBranchUser({
            userId: F.user.userId,
            userNm: F.user.userNm,
            pwd: F.user.pwd,
            adrs: "Nairobi",
            cntc: "0700000001",
            authCd: "1",
            remark: "OSCU library live test",
          }),
        )
      ).resultCd;
    case "08-insurance":
      return (
        await client.saveBranchInsurance(
          buildInsurance({
            isrccCd: F.insurance.isrccCd,
            isrccNm: F.insurance.isrccNm,
            isrcRt: F.insurance.isrcRt,
          }),
        )
      ).resultCd;
    case "09-products":
      return (await client.getItemList(F.lastReqDt)).resultCd;
    case "10-save-item":
      return (
        await client.saveItem(
          buildItem({
            itemCd: ctx.parentCd,
            itemClsCd: ctx.clsB,
            itemTyCd: F.items.itemTyCd,
            itemNm: F.items.parent.itemNm,
            orgnNatCd: F.items.orgnNatCd,
            pkgUnitCd: F.items.pkgUnitCd,
            qtyUnitCd: F.items.qtyUnitCd,
            taxTyCd: F.items.parent.taxTyCd,
            dftPrc: F.sale.taxblAmt,
          }),
        )
      ).resultCd;
    case "10b-save-child-item":
      return (
        await client.saveItem(
          buildItem({
            itemCd: ctx.childCd,
            itemClsCd: ctx.clsA,
            itemTyCd: F.items.itemTyCd,
            itemNm: F.items.child.itemNm,
            orgnNatCd: F.items.orgnNatCd,
            pkgUnitCd: F.items.pkgUnitCd,
            qtyUnitCd: F.items.qtyUnitCd,
            taxTyCd: F.items.child.taxTyCd,
            dftPrc: 100,
          }),
        )
      ).resultCd;
    case "11-stock-io": {
      const r = await retryCounter(
        "stock I/O sarNo",
        (sarNo) => {
          ctx.sarNo = sarNo;
          return client.sendStockIO(
            buildStockIo({
              sarNo,
              sarTyCd: "06",
              remark: "cert adjustment in",
              itemList: [
                buildStockIoLine(
                  {
                    itemCd: ctx.parentCd,
                    itemClsCd: ctx.clsB,
                    itemNm: F.items.parent.itemNm,
                    pkgUnitCd: F.items.pkgUnitCd,
                    qtyUnitCd: F.items.qtyUnitCd,
                    taxTyCd: F.items.parent.taxTyCd,
                  },
                  { itemSeq: 1, qty: 10, taxblAmt: 0 },
                ),
                buildStockIoLine(
                  {
                    itemCd: ctx.childCd,
                    itemClsCd: ctx.clsA,
                    itemNm: F.items.child.itemNm,
                    pkgUnitCd: F.items.pkgUnitCd,
                    qtyUnitCd: F.items.qtyUnitCd,
                    taxTyCd: F.items.child.taxTyCd,
                  },
                  { itemSeq: 2, qty: 10, taxblAmt: 0 },
                ),
              ],
            }),
          );
        },
        ctx.sarNo,
        errMsg,
      );
      return r.resultCd;
    }
    case "12-composition":
      return (
        await client.saveItemComposition(
          buildComposition({
            itemCd: ctx.parentCd,
            cpstItemCd: ctx.childCd,
            cpstQty: 1,
          }),
        )
      ).resultCd;
    case "13-imports":
      return (await client.getImportedItems(F.lastReqDt)).resultCd;
    case "14-convert-import": {
      const listed = await client.getImportedItems(F.lastReqDt);
      const row = firstImportedItem(listed.data);
      const payload = buildConvertImportedItem({
        taskCd: String(row?.taskCd ?? F.importExample.taskCd),
        dclDe: String(row?.dclDe ?? F.importExample.dclDe),
        itemSeq: Number(row?.itemSeq ?? F.importExample.itemSeq),
        hsCd: String(row?.hsCd ?? F.importExample.hsCd),
        itemClsCd: ctx.clsB,
        itemCd: ctx.parentCd,
        imptItemSttsCd: "3",
      });
      return (await client.confirmImportedItem(payload)).resultCd;
    }
    case "15-sale": {
      const r = await retryCounter(
        "sale invcNo",
        (invcNo) => {
          ctx.invcNo = invcNo;
          return client.sendSalesTransaction(
            buildSale({
              trdInvcNo: `${F.sale.trdInvcNo}${String(Date.now()).slice(-6)}`,
              invcNo,
              custTin: ctx.tin,
              custNm: F.customer.custNm,
              pmtTyCd: F.sale.pmtTyCd,
              remark: "OSCU library live sale",
              itemList: [
                buildSalesLine({
                  itemSeq: 1,
                  itemCd: ctx.parentCd,
                  itemNm: F.items.parent.itemNm,
                  itemClsCd: ctx.clsB,
                  pkgUnitCd: F.items.pkgUnitCd,
                  qtyUnitCd: F.items.qtyUnitCd,
                  taxTyCd: F.items.parent.taxTyCd,
                  taxblAmt: F.sale.taxblAmt,
                  qty: 1,
                }),
              ],
            }),
          );
        },
        ctx.invcNo,
        errMsg,
      );
      ctx.saleSdcDateTime = r.fiscal?.sdcDateTime ?? null;
      ctx.saleRcptSign = r.fiscal?.rcptSign ?? null;
      return r.resultCd;
    }
    case "16-purchase-list":
      return (await client.getPurchaseTransactions(F.lastReqDt)).resultCd;
    case "17-purchase": {
      const r = await retryCounter(
        "purchase invcNo",
        (invcNo) =>
          client.sendPurchaseTransaction(
            buildPurchase({
              invcNo,
              spplrTin: ctx.tin,
              spplrNm: F.customer.custNm,
              spplrInvcNo: ctx.invcNo,
              remark: "OSCU library live purchase",
              itemList: [
                buildSalesLine({
                  itemSeq: 1,
                  itemCd: ctx.parentCd,
                  itemNm: F.items.parent.itemNm,
                  itemClsCd: ctx.clsB,
                  pkgUnitCd: F.items.pkgUnitCd,
                  qtyUnitCd: F.items.qtyUnitCd,
                  taxTyCd: F.items.parent.taxTyCd,
                  taxblAmt: F.sale.taxblAmt,
                  qty: 1,
                }),
              ],
            }),
          ),
        ctx.invcNo + 1,
        errMsg,
      );
      return r.resultCd;
    }
    case "18-stock-master":
      return (
        await client.saveStockMaster(
          buildStockMaster({
            itemCd: ctx.parentCd,
            rsdQty: 10,
          }),
        )
      ).resultCd;
    case "19-stock-movements":
      return (await client.getStockMovements(F.lastReqDt)).resultCd;
    case "20-invoice-details":
      return (await client.getInvoiceDetails(ctx.invcNo)).resultCd;
    case "21-sales-list":
      return (await client.getSalesTransactions(F.lastReqDt)).resultCd;
    case "22-customer-list":
      return (await client.getCustomerList(F.lastReqDt)).resultCd;
    case "23-taxpayer":
      return (await client.getTaxPayerInfo(F.lastReqDt)).resultCd;
    case "24-customer-pin":
      return (await client.getCustomerByPin(ctx.tin)).resultCd;
    case "25-notice-list":
      return (await client.getNoticeList(F.lastReqDt)).resultCd;
    case "26-credit-note": {
      if (!ctx.saleSdcDateTime) {
        throw new Error("No original sale sdcDateTime — run step 15-sale first");
      }
      const r = await retryCounter(
        "credit note invcNo",
        (invcNo) =>
          client.sendCreditNote(
            buildCreditNote({
              trdInvcNo: `CN${String(Date.now()).slice(-8)}`,
              invcNo,
              orgInvcNo: ctx.invcNo,
              rfdRsnCd: "06",
              originalSdcDateTime: ctx.saleSdcDateTime!,
              custTin: ctx.tin,
              custNm: F.customer.custNm,
              remark: "OSCU library live credit note",
              itemList: [
                buildSalesLine({
                  itemSeq: 1,
                  itemCd: ctx.parentCd,
                  itemNm: F.items.parent.itemNm,
                  itemClsCd: ctx.clsB,
                  pkgUnitCd: F.items.pkgUnitCd,
                  qtyUnitCd: F.items.qtyUnitCd,
                  taxTyCd: F.items.parent.taxTyCd,
                  taxblAmt: F.sale.taxblAmt,
                  qty: 1,
                }),
              ],
            }),
          ),
        ctx.invcNo + 1,
        errMsg,
      );
      return r.resultCd;
    }
    default:
      throw new Error(`Unknown step ${id}`);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
