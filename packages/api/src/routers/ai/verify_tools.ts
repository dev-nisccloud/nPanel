import { getSystemNavigationTool } from "./tools";
import { generateToolsFromCatalog } from "./dynamic-tools";
import { loadFunctionCatalog } from "./catalog-parser";

async function verifyTool(name: string, toolObj: any) {
    console.log(`\n--- Verifying Tool: ${name} ---`);
    console.log("Parameters:", JSON.stringify(toolObj.parameters, null, 2));
}

async function main() {
    await verifyTool("getSystemNavigation", getSystemNavigationTool());

    const catalog = loadFunctionCatalog();
    const dynamicTools = generateToolsFromCatalog(catalog.functions, {});

    if (dynamicTools.emailMarketingCampaignsList) {
        await verifyTool("emailMarketingCampaignsList", dynamicTools.emailMarketingCampaignsList);
    } else {
        console.log("emailMarketingCampaignsList not found in dynamic tools");
    }
}

main().catch(console.error);
