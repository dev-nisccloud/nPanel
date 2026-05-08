import { request } from "undici";

const PLESK_HOST = "orion.nisccloud.com";
const PLESK_SECRET_KEY = "86b2abcd-50ef-78c4-3fc8-749037ec3fa5";

async function findApi() {
  const paths = [
    "/modules/jetbackup5/api.php",
    "/api/modules/jetbackup5/api.php",
    "/modules/jetbackup/api.php",
    "/api/modules/jetbackup/api.php",
    "/modules/jetbackup5/api",
    "/api/modules/jetbackup5/api",
    "/api/v2/extensions/jetbackup5/api",
  ];

  const ports = ["8443", "3035", ""];

  for (const port of ports) {
    for (const path of paths) {
      const url = port ? `https://${PLESK_HOST}:${port}${path}` : `https://${PLESK_HOST}${path}`;
      if (port === "3035") {
        // JetBackup standalone often uses these paths
        const standalonePaths = ["/api/v1/", "/api/", "/api.php"];
        for (const sPath of standalonePaths) {
          const sUrl = `https://${PLESK_HOST}:${port}${sPath}`;
          await tryUrl(sUrl, sPath + " (port 3035)");
        }
      }
      await tryUrl(url, path + (port ? ` (port ${port})` : " (no port)"));
    }
  }
}

async function tryUrl(url: string, label: string) {
  console.log(`Trying: ${url}`);
  try {
    const res = await request(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "secret_key": PLESK_SECRET_KEY,
        "Authorization": `Basic ${Buffer.from(`admin:${PLESK_SECRET_KEY}`).toString('base64')}`,
      },
      body: JSON.stringify({ function: "getInfo" }),
    });

    console.log(`Result: ${res.statusCode}`);
    if (res.statusCode === 200) {
      const text = await res.body.text();
      console.log(`SUCCESS! Path: ${label}`);
      console.log("Response snippet:", text.substring(0, 200));
      process.exit(0);
    }
    await res.body.text();
  } catch (e: any) {
    console.log(`Failed: ${e.message}`);
  }
}

findApi();
