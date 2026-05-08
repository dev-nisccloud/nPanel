import { request } from "undici";

const PLESK_HOST = "orion.nisccloud.com";
const PLESK_SECRET_KEY = "86b2abcd-50ef-78c4-3fc8-749037ec3fa5";

async function testBridge() {
  // Pattern used by wp-toolkit in the codebase
  const url = `https://${PLESK_HOST}:8443/api/modules/wp-toolkit`;
  
  console.log(`Testing Plesk API Bridge: ${url}`);
  
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

    if (res.statusCode === 200) {
      console.log("SUCCESS! The bridge is active.");
    }

    // Try with POST and function param
    console.log("\nTesting with POST /api/modules/jetbackup5");
    const resPost = await request(url, {
      method: "POST",
      headers: {
        "X-API-Key": PLESK_SECRET_KEY,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ function: "getInfo" }),
    });
    console.log(`POST Result: ${resPost.statusCode}`);
    const postText = await resPost.body.text();
    console.log("POST Response:", postText.substring(0, 500));

  } catch (e: any) {
    console.error("Failed:", e.message);
  }
}

testBridge();
