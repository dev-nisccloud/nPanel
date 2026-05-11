import { sendPleskXmlRequest } from "../packages/api/src/lib/plesk/xml-client";

// Manually setting env for debugging
process.env.PLESK_XML_ENDPOINT = "https://orion.nisccloud.com:8443/enterprise/control/agent.php";
process.env.PLESK_SECRET_KEY = "86b2abcd-50ef-78c4-3fc8-749037ec3fa5";

async function debugJetBackup() {
  console.log("Checking installed extensions via XML API...");

  const payload = `
<packet>
    <extension>
        <get>
            <filter>
                <id>jetbackup5</id>
            </filter>
        </get>
    </extension>
</packet>
  `;

  try {
    const response = await sendPleskXmlRequest(payload);
    if (response.xml) {
      console.log("XML Response (jetbackup5):");
      console.log(response.xml);
    } else {
      console.log("No XML response received for jetbackup5.");
    }

    console.log("\nChecking ALL extensions...");
    const allPayload = `
<packet>
    <extension>
        <get/>
    </extension>
</packet>
    `;
    const allResponse = await sendPleskXmlRequest(allPayload);
    if (allResponse.xml) {
      console.log("Full Extension List:");
      // I won't log the whole thing if it's huge, but I'll search for jetbackup
      if (allResponse.xml.includes("jetbackup")) {
        console.log("Found 'jetbackup' in the list!");
        // Log a snippet around the match
        const index = allResponse.xml.indexOf("jetbackup");
        console.log(allResponse.xml.substring(index - 100, index + 500));
      } else {
        console.log("'jetbackup' NOT found in the list.");
      }
    }

  } catch (error) {
    console.error("Debug failed:", error);
  }
}

debugJetBackup();
