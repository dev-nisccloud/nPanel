import { Context } from "hono";
import { db } from "@npanel/db";
import { ipRecords } from "@npanel/db/schema";

/**
 * Diagnostic endpoint to check outbound IP address
 * GET /my-ip
 */
export async function handleMyIp(c: Context) {
  try {
    const response = await fetch("https://api.ipify.org?format=json");
    if (!response.ok) {
      throw new Error(`Failed to fetch IP: ${response.statusText}`);
    }
    const data = await response.json();

    // Store the IP record in the database
    if (data.ip) {
      await db.insert(ipRecords).values({
        ipAddress: data.ip,
      });
    }

    return c.json(data);
  } catch (error: any) {
    console.error("[diagnostic][my-ip] error:", error);
    return c.json(
      {
        error: "Failed to fetch outbound IP address",
        message: error.message,
      },
      500
    );
  }
}
