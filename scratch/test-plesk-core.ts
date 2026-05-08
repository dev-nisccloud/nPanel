import { request } from "undici";

const PLESK_HOST = "orion.nisccloud.com";
const PLESK_SECRET_KEY = "86b2abcd-50ef-78c4-3fc8-749037ec3fa5";

async function testPleskCore() {
  const url = `https://${PLESK_HOST}:8443/api/v2/server`;
  
  console.log(`Testing Plesk Core API: ${url}`);
  
  try {
    const res = await request(url, {
      method: "GET",
      headers: {
        "X-API-Key": PLESK_SECRET_KEY,
        "Accept": "application/json",
      },
    });

    console.log(`Result: ${res.statusCode}`);
    const text = await res.body.text();
    console.log("Response:", text.substring(0, 500));

  } catch (e: any) {
    console.error("Failed:", e.message);
  }
}

testPleskCore();
