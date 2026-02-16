
import { getSystemNavigationTool } from "./tools";

async function verifyTool(name: string, toolObj: any) {
    console.log(`\n--- Verifying Tool: ${name} ---`);
    console.log("Is plain object:", !toolObj.parameters._def);
    console.log("Parameters:", JSON.stringify(toolObj.parameters, null, 2));
}

async function main() {
    await verifyTool("getSystemNavigation", getSystemNavigationTool());
}

main().catch(console.error);
