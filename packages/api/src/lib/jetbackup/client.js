import { request, Agent } from 'undici';
const jetbackupAgent = new Agent({
    connections: 5,
    pipelining: 1,
    keepAliveTimeout: 60000,
    keepAliveMaxTimeout: 60000,
});
const SESSION_TTL_MS = 25 * 60 * 1000;
let cachedSession = null;
let cachedJetBackupVersion = null;
function getPleskHost() {
    return process.env.VITE_PUBLIC_PLESK_HOST || 'orion.nisccloud.com';
}
function getPleskPort() {
    return process.env.PLESK_API_PORT || '8443';
}
function getPleskApiBase() {
    return `https://${getPleskHost()}:${getPleskPort()}/api/v2`;
}
function getPleskModulesBase() {
    return `https://${getPleskHost()}:${getPleskPort()}/modules/jetbackup5`;
}
function requireSecretKey() {
    const key = process.env.PLESK_SECRET_KEY;
    if (!key) {
        throw new Error('PLESK_SECRET_KEY environment variable is required');
    }
    return key;
}
async function createPleskSession() {
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
        throw new Error(`Failed to create Plesk session (${response.statusCode}): ${responseText.substring(0, 200)}`);
    }
    const { id } = JSON.parse(responseText);
    cachedSession = { id, expiresAt: Date.now() + SESSION_TTL_MS };
    return id;
}
async function getPleskSession(forceRefresh = false) {
    if (!forceRefresh && cachedSession && cachedSession.expiresAt > Date.now()) {
        return cachedSession.id;
    }
    cachedSession = null;
    return createPleskSession();
}
async function getJetBackupVersion() {
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
        const extension = (await response.body.json());
        if (extension.version) {
            cachedJetBackupVersion = extension.version;
            return extension.version;
        }
    }
    cachedJetBackupVersion = '5.3.19.1';
    return cachedJetBackupVersion;
}
async function getJetBackupApiUrl() {
    if (process.env.JETBACKUP_API_URL) {
        return process.env.JETBACKUP_API_URL;
    }
    const version = await getJetBackupVersion();
    return `${getPleskModulesBase()}/headerless.php?v=${version}&api=1`;
}
function parseJetBackupResponse(responseText, statusCode) {
    try {
        const decoded = JSON.parse(responseText);
        return {
            data: decoded.data,
            message: decoded.message,
            success: decoded.success === 1,
            statusCode,
            system: decoded.system,
        };
    }
    catch {
        return {
            data: null,
            message: `JSON Parse error: ${responseText.substring(0, 100)}...`,
            success: false,
            statusCode,
        };
    }
}
function shouldRefreshSession(statusCode, responseText) {
    return (statusCode === 303 ||
        statusCode === 401 ||
        (statusCode === 200 && responseText.trimStart().startsWith('<')));
}
async function executeJetBackupRequest(functionName, params, sessionId, apiUrl) {
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
        result: parseJetBackupResponse(responseText, response.statusCode),
        responseText,
    };
}
export async function sendJetBackupRequest(functionName, params = {}) {
    const apiUrl = await getJetBackupApiUrl();
    console.log(`[JetBackup] Requesting function: ${functionName}`);
    console.log(`[JetBackup] Target URL: ${apiUrl}`);
    try {
        let sessionId = await getPleskSession();
        let { result, responseText } = await executeJetBackupRequest(functionName, params, sessionId, apiUrl);
        if (shouldRefreshSession(result.statusCode, responseText)) {
            console.log('[JetBackup] Session expired or invalid, refreshing...');
            cachedSession = null;
            sessionId = await getPleskSession(true);
            ({ result, responseText } = await executeJetBackupRequest(functionName, params, sessionId, apiUrl));
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
    }
    catch (error) {
        console.error(`JetBackup API request failed (${functionName}):`, error);
        return {
            data: null,
            message: error.message || 'Unknown error occurred',
            success: false,
            statusCode: 0,
        };
    }
}
