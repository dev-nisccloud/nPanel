import { request, Agent } from 'undici';

// Connection pool for better performance
const jetbackupAgent = new Agent({
  connections: 5,
  pipelining: 1,
  keepAliveTimeout: 60000,
  keepAliveMaxTimeout: 60000,
});

export interface JetBackupResponse<T = any> {
  success: number;
  message: string;
  data: T;
  system: {
    version: string;
    tier: string;
    type: string;
    disableui: boolean;
    dr: boolean;
    agreement_panel: boolean;
    agreement: boolean;
    licenseIssue: boolean;
  };
}

export interface JetBackupResult<T = any> {
  data: T | null;
  message: string;
  success: boolean;
  statusCode: number;
}

export async function sendJetBackupRequest<T = any>(
  functionName: string,
  params: Record<string, any> = {}
): Promise<JetBackupResult<T>> {
  const PLESK_HOST = process.env.VITE_PUBLIC_PLESK_HOST || 'orion.nisccloud.com';
  const PLESK_SECRET_KEY = process.env.PLESK_SECRET_KEY;
  // Official Plesk REST API bridge for calling extension operations
  const JETBACKUP_API_URL = process.env.JETBACKUP_API_URL || `https://${PLESK_HOST}:8443/api/v2/extensions/jetbackup5/call`;

  console.log(`[JetBackup] Requesting function: ${functionName}`);
  console.log(`[JetBackup] Target URL: ${JETBACKUP_API_URL}`);

  if (!PLESK_SECRET_KEY) {
    throw new Error('PLESK_SECRET_KEY environment variable is required');
  }

  const body = {
    function: functionName,
    ...params,
  };

  try {
    const response = await request(JETBACKUP_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': PLESK_SECRET_KEY,
      },
      body: JSON.stringify(body),
      dispatcher: jetbackupAgent,
      signal: AbortSignal.timeout(60000), // 60 seconds timeout
      maxRedirections: 5,
    });

    const responseText = await response.body.text();
    
    if (response.statusCode >= 300 && response.statusCode < 400) {
      console.log(`[JetBackup] Redirected to: ${response.headers.location}`);
    }

    if (response.statusCode !== 200) {
      return {
        data: null,
        message: `HTTP Error ${response.statusCode}: ${responseText.substring(0, 500)}`,
        success: false,
        statusCode: response.statusCode,
      };
    }

    try {
      const decoded = JSON.parse(responseText) as JetBackupResponse<T>;
      return {
        data: decoded.data,
        message: decoded.message,
        success: decoded.success === 1,
        statusCode: response.statusCode,
      };
    } catch (parseError) {
      console.error('[JetBackup] Failed to parse JSON. Response was:', responseText.substring(0, 500));
      return {
        data: null,
        message: `JSON Parse error: ${responseText.substring(0, 100)}...`,
        success: false,
        statusCode: response.statusCode,
      };
    }
  } catch (error: any) {
    console.error(`JetBackup API request failed (${functionName}):`, error);
    return {
      data: null,
      message: error.message || 'Unknown error occurred',
      success: false,
      statusCode: 0,
    };
  }
}
