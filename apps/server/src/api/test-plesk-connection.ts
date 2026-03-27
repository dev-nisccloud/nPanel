import { Context } from "hono";

/**
 * Basic Plesk connection test
 */
export async function handleTestPleskConnection(c: Context) {
  try {
    const PLESK_XML_ENDPOINT = process.env.PLESK_XML_ENDPOINT;
    const PLESK_SECRET_KEY = process.env.PLESK_SECRET_KEY;
    const PLESK_XML_USERNAME = process.env.PLESK_XML_USERNAME;
    const PLESK_XML_PASSWORD = process.env.PLESK_XML_PASSWORD;

    const envCheck = {
      PLESK_XML_ENDPOINT: !!PLESK_XML_ENDPOINT,
      PLESK_SECRET_KEY: !!PLESK_SECRET_KEY,
      PLESK_XML_USERNAME: !!PLESK_XML_USERNAME,
      PLESK_XML_PASSWORD: !!PLESK_XML_PASSWORD,
    };

    let connectivityTest = null;
    if (PLESK_XML_ENDPOINT) {
      try {
        const startTime = Date.now();
        const response = await fetch(PLESK_XML_ENDPOINT, {
          method: 'HEAD',
          signal: AbortSignal.timeout(10000),
        });
        const duration = Date.now() - startTime;
        
        connectivityTest = {
          success: true,
          status: response.status,
          duration: `${duration}ms`,
        };
      } catch (error: any) {
        connectivityTest = {
          success: false,
          error: error.message,
        };
      }
    }

    return c.json({
      message: "Plesk Connection Test",
      timestamp: new Date().toISOString(),
      environment: envCheck,
      connectivity: connectivityTest,
    });
  } catch (error: any) {
    return c.json({
      error: "Test failed",
      message: error.message,
    }, 500);
  }
}
