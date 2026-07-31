import { request, Agent } from 'undici';
const niscBackupAgent = new Agent({
    connections: 5,
    pipelining: 1,
    keepAliveTimeout: 60000,
    keepAliveMaxTimeout: 60000,
});
const SESSION_TTL_MS = 25 * 60 * 1000;
let cachedSession = null;
let cachedNiscBackupVersion = null;
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
        dispatcher: niscBackupAgent,
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
async function getNiscBackupVersion() {
    if (cachedNiscBackupVersion) {
        return cachedNiscBackupVersion;
    }
    if (process.env.NISC_BACKUP_VERSION) {
        cachedNiscBackupVersion = process.env.NISC_BACKUP_VERSION;
        return cachedNiscBackupVersion;
    }
    const response = await request(`${getPleskApiBase()}/extensions/jetbackup5`, {
        method: 'GET',
        headers: { 'X-API-Key': requireSecretKey() },
        dispatcher: niscBackupAgent,
        signal: AbortSignal.timeout(30000),
    });
    if (response.statusCode === 200) {
        const extension = (await response.body.json());
        if (extension.version) {
            cachedNiscBackupVersion = extension.version;
            return extension.version;
        }
    }
    cachedNiscBackupVersion = '5.3.19.1';
    return cachedNiscBackupVersion;
}
async function getNiscBackupApiUrl() {
    if (process.env.NISC_BACKUP_API_URL) {
        return process.env.NISC_BACKUP_API_URL;
    }
    const version = await getNiscBackupVersion();
    return `${getPleskModulesBase()}/headerless.php?v=${version}&api=1`;
}
function parseNiscBackupResponse(responseText, statusCode) {
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
async function executeNiscBackupRequest(functionName, params, sessionId, apiUrl) {
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
        dispatcher: niscBackupAgent,
        signal: AbortSignal.timeout(60000),
        maxRedirections: 0,
    });
    const responseText = await response.body.text();
    return {
        result: parseNiscBackupResponse(responseText, response.statusCode),
        responseText,
    };
}
export async function sendNiscBackupRequest(functionName, params = {}) {
    const apiUrl = await getNiscBackupApiUrl();
    console.log(`[NiscBackup] Requesting function: ${functionName}`);
    console.log(`[NiscBackup] Target URL: ${apiUrl}`);
    try {
        let sessionId = await getPleskSession();
        let { result, responseText } = await executeNiscBackupRequest(functionName, params, sessionId, apiUrl);
        if (shouldRefreshSession(result.statusCode, responseText)) {
            console.log('[NiscBackup] Session expired or invalid, refreshing...');
            cachedSession = null;
            sessionId = await getPleskSession(true);
            ({ result, responseText } = await executeNiscBackupRequest(functionName, params, sessionId, apiUrl));
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
        console.error(`NiscBackup API request failed (${functionName}):`, error);
        return {
            data: null,
            message: error.message || 'Unknown error occurred',
            success: false,
            statusCode: 0,
        };
    }
}
function parseContentDispositionFilename(header) {
    if (!header)
        return undefined;
    const utf8Match = header.match(/filename\*=UTF-8''([^;\n]+)/i);
    if (utf8Match?.[1]) {
        try {
            return decodeURIComponent(utf8Match[1]);
        }
        catch {
            return utf8Match[1];
        }
    }
    const plainMatch = header.match(/filename="?([^";\n]+)"?/i);
    return plainMatch?.[1];
}
/** Stream a completed NiscBackup download archive (headerless.php?download=1). */
export async function fetchNiscBackupDownloadArchive(downloadId) {
    try {
        const version = await getNiscBackupVersion();
        const url = `${getPleskModulesBase()}/headerless.php?v=${version}&download=1&download_id=${encodeURIComponent(downloadId)}`;
        const attempt = async (sessionId) => {
            return request(url, {
                method: 'GET',
                headers: { Cookie: `PLESKSESSID=${sessionId}` },
                dispatcher: niscBackupAgent,
                signal: AbortSignal.timeout(600000),
                maxRedirections: 0,
            });
        };
        let sessionId = await getPleskSession();
        let response = await attempt(sessionId);
        const contentType = String(response.headers['content-type'] ?? '');
        if (response.statusCode === 200 && contentType.includes('text/html')) {
            cachedSession = null;
            sessionId = await getPleskSession(true);
            response = await attempt(sessionId);
        }
        const finalContentType = String(response.headers['content-type'] ?? '');
        if (response.statusCode !== 200) {
            const text = await response.body.text();
            return {
                success: false,
                statusCode: response.statusCode,
                body: null,
                message: text.substring(0, 200) || `HTTP ${response.statusCode}`,
            };
        }
        if (finalContentType.includes('text/html')) {
            return {
                success: false,
                statusCode: response.statusCode,
                body: null,
                message: 'Download is not ready yet or the download ID is invalid.',
            };
        }
        const contentDisposition = String(response.headers['content-disposition'] ?? '');
        const contentLengthHeader = response.headers['content-length'];
        const contentLength = contentLengthHeader != null ? Number(contentLengthHeader) : undefined;
        return {
            success: true,
            statusCode: response.statusCode,
            body: response.body,
            filename: parseContentDispositionFilename(contentDisposition),
            contentType: finalContentType || 'application/gzip',
            contentLength: Number.isFinite(contentLength) ? contentLength : undefined,
        };
    }
    catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown error occurred';
        console.error(`NiscBackup download fetch failed (${downloadId}):`, error);
        return {
            success: false,
            statusCode: 0,
            body: null,
            message,
        };
    }
}
