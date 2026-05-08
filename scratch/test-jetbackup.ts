import { sendJetBackupRequest } from "../packages/api/src/lib/jetbackup/client";
import "dotenv/config";

async function test() {
  console.log("Testing JetBackup API Connection...");
  
  try {
    const info = await sendJetBackupRequest("getInfo");
    console.log("System Info result:", info.success ? "SUCCESS" : "FAILED");
    if (info.success) {
      console.log("Data:", JSON.stringify(info.data, null, 2));
    } else {
      console.log("Message:", info.message);
    }

    const dashboard = await sendJetBackupRequest("getDashboardDetails");
    console.log("\nDashboard Details result:", dashboard.success ? "SUCCESS" : "FAILED");
    if (dashboard.success) {
      console.log("Data:", JSON.stringify(dashboard.data, null, 2));
    } else {
      console.log("Message:", dashboard.message);
    }

    const accounts = await sendJetBackupRequest("listAccounts", { limit: 5 });
    console.log("\nList Accounts (limit 5) result:", accounts.success ? "SUCCESS" : "FAILED");
    if (accounts.success) {
      console.log("Total accounts:", accounts.data.total);
      console.log("Items sample:", JSON.stringify(accounts.data.items, null, 2));
    } else {
      console.log("Message:", accounts.message);
    }

  } catch (error) {
    console.error("Test failed with error:", error);
  }
}

test();
