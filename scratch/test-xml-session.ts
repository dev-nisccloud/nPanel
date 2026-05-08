import { request } from "undici";

const PLESK_HOST = "orion.nisccloud.com";
const PLESK_SECRET_KEY = "86b2abcd-50ef-78c4-3fc8-749037ec3fa5";

async function testXmlSession() {
  console.log("1. Requesting Session ID via XML-RPC...");
  
  const xml = `
<packet>
  <server>
    <get>
      <session_id/>
    </get>
  </server>
</packet>
`;

  try {
    const res = await request(`https://${PLESK_HOST}:8443/enterprise/control/agent.php`, {
      method: "POST",
      headers: {
        "Content-Type": "text/xml",
        "KEY": PLESK_SECRET_KEY,
      },
      body: xml,
    });

    const body = await res.body.text();
    console.log("XML Response:", body);

    const match = body.match(/<session_id>([^<]+)<\/session_id>/);
    if (!match) {
      console.error("Failed to find session_id in response.");
      return;
    }

    const sid = match[1];
    console.log("SUCCESS! Session ID:", sid);

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
    const jetBody = await jetRes.body.text();
    console.log("Response:", jetBody.substring(0, 500));

    if (jetRes.statusCode === 200 && jetBody.includes("success")) {
      console.log("\nFINAL SUCCESS!!! We have the connection.");
    }

  } catch (e: any) {
    console.error("Error:", e.message);
  }
}

testXmlSession();
