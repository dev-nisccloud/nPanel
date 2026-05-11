import { request } from "undici";

const PLESK_HOST = "orion.nisccloud.com";
const PLESK_SECRET_KEY = "86b2abcd-50ef-78c4-3fc8-749037ec3fa5";

async function listExtensions() {
  const url = `https://${PLESK_HOST}:8443/api/v2/extensions`;
  
  console.log(`Listing Plesk Extensions: ${url}`);
  
  try {
    const res = await request(url, {
      method: "GET",
      headers: {
        "X-API-Key": PLESK_SECRET_KEY,
        "Accept": "application/json",
      },
    });

    console.log(`Result: ${res.statusCode}`);
    const data = await res.body.json() as any[];
    
    const jetbackup = data.find(ext => ext.id.includes("jetbackup"));
    console.log("JetBackup extension in list:", jetbackup);
    
    // Log first 5 extensions
    console.log("First 5 extensions:", data.slice(0, 5));

  } catch (e: any) {
    console.error("Failed:", e.message);
  }
}

listExtensions();
