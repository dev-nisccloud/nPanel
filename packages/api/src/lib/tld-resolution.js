import { eq } from "@npanel/db";
import { db } from "@npanel/db";
import { tldSettings } from "@npanel/db/schema/nameservers";
/**
 * Resolves nameservers for any domain by strictly using the global default TLD setting.
 * Per requirements: we only use the one which has the state of default only.
 */
export async function resolveNameserversForDomain(_domain) {
    // Find strictly the default TLD setting
    const setting = await db.query.tldSettings.findFirst({
        where: eq(tldSettings.isDefault, true),
        with: {
            nameserverGroup: {
                with: {
                    nameservers: true,
                },
            },
        },
    });
    const nameservers = setting?.nameserverGroup?.nameservers;
    if (!nameservers || nameservers.length === 0) {
        throw new Error(`No active default TLD setting found with nameservers configured.`);
    }
    return nameservers.map((ns) => ({
        name: ns.name,
        ip: ns.ipv4 ?? undefined,
    }));
}
