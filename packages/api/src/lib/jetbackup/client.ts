import { request, Agent } from 'undici';

const jetbackupAgent = new Agent({
  connections: 5,
  pipelining: 1,
  keepAliveTimeout: 60000,
  keepAliveMaxTimeout: 60000,
});

const SESSION_TTL_MS = 25 * 60 * 1000;

interface CachedSession {
  id: string;
  expiresAt: number;
}

let cachedSession: CachedSession | null = null;
let cachedJetBackupVersion: string | null = null;

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
  system?: JetBackupResponse['system'];
}

function getPleskHost(): string {
  return process.env.VITE_PUBLIC_PLESK_HOST || 'orion.nisccloud.com';
}

function getPleskPort(): string {
  return process.env.PLESK_API_PORT || '8443';
}

function getPleskApiBase(): string {
  return `https://${getPleskHost()}:${getPleskPort()}/api/v2`;
}

function getPleskModulesBase(): string {
  return `https://${getPleskHost()}:${getPleskPort()}/modules/jetbackup5`;
}

function requireSecretKey(): string {
  const key = process.env.PLESK_SECRET_KEY;
  if (!key) {
    throw new Error('PLESK_SECRET_KEY environment variable is required');
  }
  return key;
}

async function createPleskSession(): Promise<string> {
  const secretKey = requireSecretKey();
  const login = process.env.PLESK_XML_USERNAME || 'admin';

  const response = await request(`${getPleskApiBase()}/server/session`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-API-Key': secretKey,
    },
    body: JSON.stringify({ login }),
    dispatcher: jetbackupAgent,
    signal: AbortSignal.timeout(30000),
  });

  const responseText = await response.body.text();
  if (response.statusCode !== 201) {
    throw new Error(
      `Failed to create Plesk session (${response.statusCode}): ${responseText.substring(0, 200)}`
    );
  }

  const { id } = JSON.parse(responseText) as { id: string };
  cachedSession = { id, expiresAt: Date.now() + SESSION_TTL_MS };
  return id;
}

async function getPleskSession(forceRefresh = false): Promise<string> {
  if (!forceRefresh && cachedSession && cachedSession.expiresAt > Date.now()) {
    return cachedSession.id;
  }
  cachedSession = null;
  return createPleskSession();
}

async function getJetBackupVersion(): Promise<string> {
  if (cachedJetBackupVersion) {
    return cachedJetBackupVersion;
  }

  if (process.env.JETBACKUP_VERSION) {
    cachedJetBackupVersion = process.env.JETBACKUP_VERSION;
    return cachedJetBackupVersion;
  }

  const response = await request(`${getPleskApiBase()}/extensions/jetbackup5`, {
    method: 'GET',
    headers: { 'X-API-Key': requireSecretKey() },
    dispatcher: jetbackupAgent,
    signal: AbortSignal.timeout(30000),
  });

  if (response.statusCode === 200) {
    const extension = (await response.body.json()) as { version?: string };
    if (extension.version) {
      cachedJetBackupVersion = extension.version;
      return extension.version;
    }
  }

  cachedJetBackupVersion = '5.3.19.1';
  return cachedJetBackupVersion;
}

async function getJetBackupApiUrl(): Promise<string> {
  if (process.env.JETBACKUP_API_URL) {
    return process.env.JETBACKUP_API_URL;
  }

  const version = await getJetBackupVersion();
  return `${getPleskModulesBase()}/headerless.php?v=${version}&api=1`;
}

function parseJetBackupResponse<T>(
  responseText: string,
  statusCode: number
): JetBackupResult<T> {
  try {
    const decoded = JSON.parse(responseText) as JetBackupResponse<T>;
    return {
      data: decoded.data,
      message: decoded.message,
      success: decoded.success === 1,
      statusCode,
      system: decoded.system,
    };
  } catch {
    return {
      data: null,
      message: `JSON Parse error: ${responseText.substring(0, 100)}...`,
      success: false,
      statusCode,
    };
  }
}

function shouldRefreshSession(statusCode: number, responseText: string): boolean {
  return (
    statusCode === 303 ||
    statusCode === 401 ||
    (statusCode === 200 && responseText.trimStart().startsWith('<'))
  );
}

async function executeJetBackupRequest<T>(
  functionName: string,
  params: Record<string, any>,
  sessionId: string,
  apiUrl: string
): Promise<{ result: JetBackupResult<T>; responseText: string }> {
  const body = {
    function: functionName,
    ...params,
  };

  const response = await request(apiUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Cookie: `PLESKSESSID=${sessionId}`,
    },
    body: JSON.stringify(body),
    dispatcher: jetbackupAgent,
    signal: AbortSignal.timeout(60000),
    maxRedirections: 0,
  });

  const responseText = await response.body.text();
  return {
    result: parseJetBackupResponse<T>(responseText, response.statusCode),
    responseText,
  };
}

export async function sendJetBackupRequest<T = any>(
  functionName: string,
  params: Record<string, any> = {}
): Promise<JetBackupResult<T>> {
  const apiUrl = await getJetBackupApiUrl();

  console.log(`[JetBackup] Requesting function: ${functionName}`);
  console.log(`[JetBackup] Target URL: ${apiUrl}`);

  try {
    let sessionId = await getPleskSession();
    let { result, responseText } = await executeJetBackupRequest<T>(
      functionName,
      params,
      sessionId,
      apiUrl
    );

    if (shouldRefreshSession(result.statusCode, responseText)) {
      console.log('[JetBackup] Session expired or invalid, refreshing...');
      cachedSession = null;
      sessionId = await getPleskSession(true);
      ({ result, responseText } = await executeJetBackupRequest<T>(
        functionName,
        params,
        sessionId,
        apiUrl
      ));
    }

    if (result.statusCode !== 200) {
      return {
        data: null,
        message: `HTTP Error ${result.statusCode}: ${responseText.substring(0, 500)}`,
        success: false,
        statusCode: result.statusCode,
      };
    }

    if (!result.success && result.message) {
      return result;
    }

    return result;
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
