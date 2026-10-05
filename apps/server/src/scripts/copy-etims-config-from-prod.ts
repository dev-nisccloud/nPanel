/**
 * One-off: copy etims_configuration (+ etims_item) from production into the
 * DATABASE_URL currently in apps/server/.env.
 *
 * Usage (from apps/server):
 *   bun run src/scripts/copy-etims-config-from-prod.ts
 */
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import pg from "pg";

function parseEnvFile(filePath: string): Record<string, string> {
    const out: Record<string, string> = {};
    const text = readFileSync(filePath, "utf8");
    for (const rawLine of text.split(/\r?\n/)) {
        const line = rawLine.trim();
        if (!line || line.startsWith("#")) continue;
        const eq = line.indexOf("=");
        if (eq < 1) continue;
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

function mask(value: string | null | undefined): string {
    if (!value) return "(null)";
    if (value.length <= 6) return "***";
    return `${value.slice(0, 3)}…${value.slice(-3)} (len ${value.length})`;
}

function summarizeConfig(row: Record<string, unknown>) {
    return {
        id: row.id,
        kraPin: row.kra_pin,
        branchId: row.branch_id,
        branchName: row.branch_name,
        deviceSerialNumber: row.device_serial_number,
        cmcKey: mask(row.cmc_key as string | null),
        isSandbox: row.is_sandbox,
        isInitialized: row.is_initialized,
        lastSyncAt: row.last_sync_at,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
    };
}

function sslForUrl(url: string): boolean | { rejectUnauthorized: boolean } {
    if (/sslmode=disable/i.test(url)) return false;
    if (/supabase|pooler/i.test(url)) return { rejectUnauthorized: false };
    return { rejectUnauthorized: false };
}

async function main() {
    const serverDir = resolve(import.meta.dir, "../..");
    const prodEnv = parseEnvFile(resolve(serverDir, ".env.production"));
    const localEnv = parseEnvFile(resolve(serverDir, ".env"));

    const prodUrl = prodEnv.DATABASE_URL;
    const localUrl = localEnv.DATABASE_URL;
    if (!prodUrl) throw new Error("Missing DATABASE_URL in apps/server/.env.production");
    if (!localUrl) throw new Error("Missing DATABASE_URL in apps/server/.env");

    const prodHost = new URL(prodUrl.replace(/^postgresql:\/\//, "postgres://")).host;
    const localHost = new URL(localUrl.replace(/^postgresql:\/\//, "postgres://")).host;
    console.log(`Source (prod): ${prodHost}`);
    console.log(`Target (env):  ${localHost}`);

    const prod = new pg.Client({ connectionString: prodUrl, ssl: sslForUrl(prodUrl) });
    const local = new pg.Client({ connectionString: localUrl, ssl: sslForUrl(localUrl) });

    await prod.connect();
    await local.connect();

    try {
        const prodConfigs = await prod.query("SELECT * FROM etims_configuration ORDER BY created_at");
        const localBefore = await local.query("SELECT * FROM etims_configuration ORDER BY created_at");
        const prodItems = await prod.query("SELECT * FROM etims_item ORDER BY created_at");
        const localItemsBefore = await local.query("SELECT count(*)::int AS n FROM etims_item");

        console.log(`\nProduction etims_configuration: ${prodConfigs.rowCount} row(s)`);
        for (const row of prodConfigs.rows) console.log(summarizeConfig(row));

        console.log(`\nLocal etims_configuration before copy: ${localBefore.rowCount} row(s)`);
        for (const row of localBefore.rows) console.log(summarizeConfig(row));

        console.log(`\nProduction etims_item: ${prodItems.rowCount} row(s)`);
        console.log(`Local etims_item before copy: ${localItemsBefore.rows[0]?.n ?? 0}`);

        if (prodConfigs.rowCount === 0) {
            throw new Error("Production has no etims_configuration rows — aborting.");
        }

        await local.query("BEGIN");
        try {
            await local.query("DELETE FROM etims_configuration");
            for (const row of prodConfigs.rows) {
                await local.query(
                    `INSERT INTO etims_configuration (
                        id, kra_pin, branch_id, branch_name, device_serial_number, cmc_key,
                        is_sandbox, is_initialized, last_sync_at, created_at, updated_at
                    ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)`,
                    [
                        row.id,
                        row.kra_pin,
                        row.branch_id,
                        row.branch_name,
                        row.device_serial_number,
                        row.cmc_key,
                        row.is_sandbox,
                        row.is_initialized,
                        row.last_sync_at,
                        row.created_at,
                        row.updated_at,
                    ],
                );
            }

            if (prodItems.rowCount > 0) {
                for (const row of prodItems.rows) {
                    await local.query(
                        `INSERT INTO etims_item (
                            id, local_item_id, item_cd, item_cls_cd, item_nm, tax_ty_cd,
                            pkg_unit_cd, origin_country_cd, packaging_unit, quantity_unit,
                            unit_price, created_at, updated_at
                        ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13)
                        ON CONFLICT (item_cd) DO UPDATE SET
                            local_item_id = EXCLUDED.local_item_id,
                            item_cls_cd = EXCLUDED.item_cls_cd,
                            item_nm = EXCLUDED.item_nm,
                            tax_ty_cd = EXCLUDED.tax_ty_cd,
                            pkg_unit_cd = EXCLUDED.pkg_unit_cd,
                            origin_country_cd = EXCLUDED.origin_country_cd,
                            packaging_unit = EXCLUDED.packaging_unit,
                            quantity_unit = EXCLUDED.quantity_unit,
                            unit_price = EXCLUDED.unit_price,
                            updated_at = EXCLUDED.updated_at`,
                        [
                            row.id,
                            row.local_item_id,
                            row.item_cd,
                            row.item_cls_cd,
                            row.item_nm,
                            row.tax_ty_cd,
                            row.pkg_unit_cd,
                            row.origin_country_cd,
                            row.packaging_unit,
                            row.quantity_unit,
                            row.unit_price,
                            row.created_at,
                            row.updated_at,
                        ],
                    );
                }
            }

            await local.query("COMMIT");
        } catch (err) {
            await local.query("ROLLBACK");
            throw err;
        }

        const localAfter = await local.query("SELECT * FROM etims_configuration ORDER BY created_at");
        const localItemsAfter = await local.query("SELECT count(*)::int AS n FROM etims_item");
        console.log(`\nLocal etims_configuration after copy: ${localAfter.rowCount} row(s)`);
        for (const row of localAfter.rows) console.log(summarizeConfig(row));
        console.log(`Local etims_item after copy: ${localItemsAfter.rows[0]?.n ?? 0}`);
        console.log("\nDone.");
    } finally {
        await prod.end();
        await local.end();
    }
}

main().catch((err) => {
    console.error(err);
    process.exit(1);
});
