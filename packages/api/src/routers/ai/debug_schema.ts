
import { z } from "zod";
import { getSystemNavigationTool } from "./tools";

async function main() {
    console.log("Inspecting getSystemNavigationTool parameters...");
    try {
        // Accessing the private/internal properties if possible, or just re-creating to see zod error
        const schema = z.object({
            role: z.enum(["AGENCY", "CUSTOMER"]).describe("The role of the user"),
        });

        console.log("Zod Schema:", JSON.stringify(schema, null, 2));

        // Simulating what ai SDK might do (internally checks zod-to-json-schema)
        const toolDef = getSystemNavigationTool;
        console.log("Tool Def keys:", Object.keys(toolDef));
        // properties might include 'parameters' or 'parametersSchema'

        console.log("Tool Parameters:", (toolDef as any).parameters);

    } catch (e) {
        console.error("Error:", e);
    }
}

main();
