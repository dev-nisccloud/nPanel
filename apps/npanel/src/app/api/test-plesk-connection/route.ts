import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    const PLESK_XML_ENDPOINT = process.env.PLESK_XML_ENDPOINT;
    const PLESK_SECRET_KEY = process.env.PLESK_SECRET_KEY;
    const PLESK_XML_USERNAME = process.env.PLESK_XML_USERNAME;
    const PLESK_XML_PASSWORD = process.env.PLESK_XML_PASSWORD;

    // Check environment variables
    const envCheck = {
      PLESK_XML_ENDPOINT: !!PLESK_XML_ENDPOINT,
      PLESK_SECRET_KEY: !!PLESK_SECRET_KEY,
      PLESK_XML_USERNAME: !!PLESK_XML_USERNAME,
      PLESK_XML_PASSWORD: !!PLESK_XML_PASSWORD,
    };

    // Test basic connectivity
    let connectivityTest = null;
    if (PLESK_XML_ENDPOINT) {
      try {
        const startTime = Date.now();
        const response = await fetch(PLESK_XML_ENDPOINT, {
          method: 'HEAD',
          signal: AbortSignal.timeout(10000), // 10 second timeout
        });
        const duration = Date.now() - startTime;
        
        connectivityTest = {
          success: true,
          status: response.status,
          duration: `${duration}ms`,
          headers: Object.fromEntries(response.headers.entries()),
        };
      } catch (error: any) {
        connectivityTest = {
          success: false,
          error: error.message,
          code: error.code,
          name: error.name,
        };
      }
    }

    return NextResponse.json({
      message: "Plesk Connection Test",
      timestamp: new Date().toISOString(),
      environment: envCheck,
      connectivity: connectivityTest,
      recommendations: [
        "Check if PLESK_XML_ENDPOINT is correct",
        "Verify PLESK_SECRET_KEY or username/password",
        "Ensure Plesk server is accessible from this environment",
        "Check firewall settings",
        "Verify SSL certificate if using HTTPS",
      ],
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        error: "Test failed",
        message: error.message,
        stack: error.stack,
      },
      { status: 500 }
    );
  }
}
