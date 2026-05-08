import { request } from "undici";

const PLESK_HOST = "orion.nisccloud.com";
const PLESK_SECRET_KEY = "86b2abcd-50ef-78c4-3fc8-749037ec3fa5";

async function testSessionBridge() {
  console.log("1. Creating a Plesk Session...");
  
  try {
    // Create a session via REST API
    const sessionRes = await request(`https://${PLESK_HOST}:8443/api/v2/auth/sessions`, {
      method: "POST",
      headers: {
        "X-API-Key": PLESK_SECRET_KEY,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        description: "nPanel JetBackup Session"
      }),
    });

    if (sessionRes.statusCode !== 201) {
      console.error("Failed to create session:", await sessionRes.body.text());
      return;
    }

    const sessionData = await sessionRes.body.json() as { sid: string };
    const sid = sessionData.sid;
    console.log("Session Created! SID:", sid);

    console.log("\n2. Calling JetBackup via session-authorized bridge...");
    
    const jetRes = await request(`https://${PLESK_HOST}:8443/modules/jetbackup5/headerless.php`, {
      method: "POST",
      headers: {
        "Cookie": `PLESKSESSID=${sid}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        function: "getInfo"
      }),
    });

    console.log(`Result Status: ${jetRes.statusCode}`);
    const body = await jetRes.body.text();
    console.log("Response:", body.substring(0, 500));

    if (jetRes.statusCode === 200 && body.includes("success")) {
      console.log("\nSUCCESS!!! We found the way in.");
    } else {
      console.log("\nFailed. Response might be HTML or redirect.");
    }

  } catch (e: any) {
    console.error("Error:", e.message);
  }
}

testSessionBridge();
