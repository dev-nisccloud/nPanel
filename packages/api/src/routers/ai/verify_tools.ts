
import { z } from "zod";
import { getSystemNavigationTool } from "./tools";

async function main() {
    console.log("--- Verifying Tools ---");

    try {
        const navTool = getSystemNavigationTool;
        console.log("getSystemNavigationTool keys:", Object.keys(navTool));

        // The 'tool' helper from 'ai' returns an object. 
        // Depending on version it might have 'parameters' property directly or hidden.
        if ('parameters' in navTool) {
            const params = (navTool as any).parameters;
            console.log("navTool.parameters type:", typeof params);
            // It's a zod schema. code to check metadata?
            console.log("navTool.parameters safeParse empty:", params.safeParse({}));
        } else {
            console.log("navTool does NOT have 'parameters' property visible.");
        }

    } catch (e) {
        console.error("Error inspecting tools:", e);
    }
}

main();
