import { request, Agent } from 'undici';
// Sentry removed; provide a no-op shim to avoid touching call sites
const Sentry = {
  addBreadcrumb: (..._args: any[]) => {},
  captureException: (..._args: any[]) => {},
};

const PLESK_REST_ENDPOINT =
  process.env.PLESK_REST_ENDPOINT ??
  'https://your-plesk-host:8443/api/modules/wp-toolkit';
const PLESK_SECRET_KEY = process.env.PLESK_SECRET_KEY;
const PLESK_XML_USERNAME = process.env.PLESK_XML_USERNAME ?? 'admin';
const PLESK_XML_PASSWORD = process.env.PLESK_XML_PASSWORD ?? 'your-password';

// Connection pool for better performance
const pleskRestAgent = new Agent({
  connections: 5, // Connection pool size
  pipelining: 1, // HTTP/1.1 pipelining
  keepAliveTimeout: 60000, // 1 minute
  keepAliveMaxTimeout: 60000,
});

interface PleskRestResult {
  data: any | null;
  isAuthError: boolean;
  isHostUnreachable: boolean;
  statusCode: number;
}

interface NetworkError extends Error {
  code?: string;
  errno?: number;
  syscall?: string;
  address?: string;
  port?: number;
}

// Helper function to determine if error is host unreachable
function isHostUnreachableError(error: Error): boolean {
  const message = error.message.toLowerCase();
  const name = error.name.toLowerCase();
  
  return (
    message.includes('econnrefused') ||
    message.includes('econnaborted') ||
    message.includes('enotfound') ||
    message.includes('enetunreach') ||
    message.includes('timeout') ||
    name === 'timeouterror' ||
    name === 'aborterror'
  );
}

// Helper function to determine if error is auth related
function isAuthError(error: Error, statusCode?: number): boolean {
  const message = error.message.toLowerCase();
  return (
    message.includes('401') ||
    message.includes('403') ||
    message.includes('unauthorized') ||
    message.includes('forbidden') ||
    statusCode === 401 ||
    statusCode === 403
  );
}

export async function sendPleskRestRequest(
  endpoint: string,
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' = 'GET',
  body?: any
): Promise<PleskRestResult> {
  console.log('Starting Plesk REST request...');
  console.log('PLESK_REST_ENDPOINT:', PLESK_REST_ENDPOINT);
  console.log('Endpoint:', endpoint);
  console.log('Method:', method);
  console.log('Has SECRET_KEY:', !!PLESK_SECRET_KEY);
  console.log('Has USERNAME:', !!PLESK_XML_USERNAME);
  console.log('Has PASSWORD:', !!PLESK_XML_PASSWORD);
  
  const fullUrl = `${PLESK_REST_ENDPOINT}${endpoint}`;

  if (
    !(
      PLESK_REST_ENDPOINT &&
      (PLESK_SECRET_KEY || (PLESK_XML_USERNAME && PLESK_XML_PASSWORD))
    )
  ) {
    throw new Error(
      'Missing required Plesk environment variables. Set either PLESK_SECRET_KEY or both PLESK_XML_USERNAME and PLESK_XML_PASSWORD.'
    );
  }

  // Add breadcrumb for request start
  Sentry.addBreadcrumb({
    message: 'Plesk REST request started',
    category: 'plesk-rest-api',
    level: 'info',
    data: {
      endpoint: fullUrl,
      method,
      bodyLength: body ? JSON.stringify(body).length : 0
    }
  });

  // Check host reachability with a quick HEAD request
  try {
    await request(fullUrl, {
      method: 'HEAD',
      dispatcher: pleskRestAgent,
      signal: AbortSignal.timeout(5000)
    });
    
    Sentry.addBreadcrumb({
      message: 'Host reachability check passed',
      category: 'plesk-rest-api',
      level: 'debug',
      data: {
        endpoint: fullUrl
      }
    });
  } catch (error) {
    const err = error as NetworkError;
    console.log('Host reachability check failed:', err.message);
    Sentry.addBreadcrumb({
      message: 'Host reachability check failed',
      category: 'plesk-rest-api',
      level: 'warning',
      data: {
        endpoint: fullUrl,
        error: err.message,
        code: err.code || 'unknown'
      }
    });
    // Don't return early - continue with the actual request as it might still work
  }

  try {
    console.log('Building request headers...');
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'User-Agent': 'nPanel-Server/1.0',
    };

    if (PLESK_SECRET_KEY) {
      console.log('Using SECRET_KEY authentication');
      headers['X-API-Key'] = PLESK_SECRET_KEY;
    } else {
      console.log('Using username/password authentication');
      const authHeader =
        'Basic ' +
        Buffer.from(`${PLESK_XML_USERNAME}:${PLESK_XML_PASSWORD}`).toString(
          'base64'
        );
      headers['Authorization'] = authHeader;
    }

    console.log('Making request to:', fullUrl);
    const startTime = Date.now();
    
    const requestOptions: any = {
      method,
      headers,
      dispatcher: pleskRestAgent,
      signal: AbortSignal.timeout(30_000), // 30 seconds timeout
    };

    // Add body for POST/PUT/DELETE requests
    if (body && (method === 'POST' || method === 'PUT' || method === 'DELETE')) {
      requestOptions.body = JSON.stringify(body);
    }

    const response = await request(fullUrl, requestOptions);

    const duration = Date.now() - startTime;
    const isAuthError = response.statusCode === 401 || response.statusCode === 403;

    if (!isAuthError) {
      Sentry.addBreadcrumb({
        message: 'Plesk REST request successful',
        category: 'plesk-rest-api',
        level: 'info',
        data: {
          status: response.statusCode,
          duration,
          responseLength: response.headers['content-length'] || 'unknown'
        }
      });
      Sentry.addBreadcrumb({
        message: `Plesk REST Request completed in ${duration}ms`,
        category: 'performance',
        level: 'info',
        data: { operation: 'Plesk REST Request', duration, success: true }
      });
    } else {
      Sentry.addBreadcrumb({
        message: 'Plesk REST request failed - Auth Error',
        category: 'plesk-rest-api',
        level: 'warning',
        data: {
          status: response.statusCode,
          duration
        }
      });
      Sentry.addBreadcrumb({
        message: `Plesk REST Request failed in ${duration}ms`,
        category: 'performance',
        level: 'warning',
        data: { operation: 'Plesk REST Request', duration, success: false }
      });
    }

    // Read response body
    const responseText = await response.body.text();
    let responseData = null;

    // Handle empty responses (common for DELETE operations)
    if (responseText.trim() === '') {
      responseData = null;
    } else {
      try {
        responseData = JSON.parse(responseText);
      } catch (parseError) {
        console.warn('Failed to parse JSON response:', parseError);
        responseData = responseText;
      }
    }

    return {
      data: responseData,
      isAuthError,
      isHostUnreachable: false,
      statusCode: response.statusCode,
    };
  } catch (error) {
    const err = error as NetworkError;
    console.error('Plesk REST request failed:', err);
    console.error('Error details:', {
      name: err.name,
      message: err.message,
      code: err.code,
      stack: err.stack
    });
    
    const isHostUnreachable = isHostUnreachableError(err);
    const isAuthErrorResult = isAuthError(err);

    if (isHostUnreachable) {
      Sentry.captureException(err, {
        tags: {
          component: 'plesk-rest-api',
          endpoint: fullUrl,
          method,
          statusCode: '0'
        },
        extra: {
          endpoint: fullUrl,
          method,
          statusCode: 0,
          serverTime: new Date().toISOString()
        }
      });
      Sentry.addBreadcrumb({
        message: 'Plesk host unreachable',
        category: 'plesk-rest-api',
        level: 'error',
        data: {
          endpoint: fullUrl,
          error: err.message,
          errorType: err.name,
          code: err.code || 'unknown'
        }
      });
    } else {
      Sentry.captureException(err, {
        tags: {
          component: 'plesk-rest-api',
          endpoint: fullUrl,
          method,
          statusCode: isAuthErrorResult ? '401' : '500'
        },
        extra: {
          endpoint: fullUrl,
          method,
          statusCode: isAuthErrorResult ? 401 : 500,
          serverTime: new Date().toISOString()
        }
      });
      Sentry.addBreadcrumb({
        message: 'Plesk REST request failed',
        category: 'plesk-rest-api',
        level: 'error',
        data: {
          endpoint: fullUrl,
          error: err.message,
          errorType: err.name,
          code: err.code || 'unknown',
          isAuthError: isAuthErrorResult
        }
      });
    }

    return {
      data: null,
      isAuthError: isAuthErrorResult,
      isHostUnreachable,
      statusCode: 0,
    };
  }
}
