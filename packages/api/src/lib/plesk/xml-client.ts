import { request, Agent } from 'undici';
// Sentry removed; provide a no-op shim to avoid touching call sites
const Sentry = {
  addBreadcrumb: (..._args: any[]) => {},
  captureException: (..._args: any[]) => {},
};

const PLESK_XML_ENDPOINT =
  process.env.PLESK_XML_ENDPOINT ??
  'https://your-plesk-host:8443/enterprise/control/agent.php';
const PLESK_XML_USERNAME = process.env.PLESK_XML_USERNAME ?? 'admin';
const PLESK_XML_PASSWORD = process.env.PLESK_XML_PASSWORD ?? 'your-password';
const PLESK_SECRET_KEY = process.env.PLESK_SECRET_KEY; // Optional secret key authentication

// Connection pool for better performance
const pleskAgent = new Agent({
  connections: 5, // Connection pool size
  pipelining: 1, // HTTP/1.1 pipelining
  keepAliveTimeout: 60000, // 1 minute
  keepAliveMaxTimeout: 60000,
  // Note: TLS configuration for self-signed certificates
  // undici handles this differently - we'll rely on the request-level configuration
});

interface PleskXmlResult {
  xml: string | null;
  isAuthError: boolean;
  isHostUnreachable: boolean;
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

export async function sendPleskXmlRequest(
  xmlPayload: string
): Promise<PleskXmlResult> {
  console.log('Starting Plesk XML request...');
  console.log('PLESK_XML_ENDPOINT:', PLESK_XML_ENDPOINT);
  console.log('Has SECRET_KEY:', !!PLESK_SECRET_KEY);
  console.log('Has USERNAME:', !!PLESK_XML_USERNAME);
  console.log('Has PASSWORD:', !!PLESK_XML_PASSWORD);
  
  const trimmedPayload = xmlPayload.trim();
  if (!trimmedPayload.includes('<packet')) {
    throw new Error('Invalid XML payload: Must contain <packet> element');
  }

  if (
    !(
      PLESK_XML_ENDPOINT &&
      (PLESK_SECRET_KEY || (PLESK_XML_USERNAME && PLESK_XML_PASSWORD))
    )
  ) {
    throw new Error(
      'Missing required Plesk environment variables. Set either PLESK_SECRET_KEY or both PLESK_XML_USERNAME and PLESK_XML_PASSWORD.'
    );
  }

  // Add breadcrumb for request start
  Sentry.addBreadcrumb({
    message: 'Plesk XML request started',
    category: 'plesk-api',
    level: 'info',
    data: {
      endpoint: PLESK_XML_ENDPOINT,
      payloadLength: trimmedPayload.length
    }
  });

  // Optional host reachability check (fire-and-forget, non-blocking)
  // Legacy code does this but continues even if it fails - we'll do the same
  // Start it but don't await - proceed immediately with actual request
  request(PLESK_XML_ENDPOINT, {
    method: 'HEAD',
    dispatcher: pleskAgent,
    signal: AbortSignal.timeout(5000) // Match legacy: 5 seconds
  }).then(() => {
    console.log('Host reachability check passed');
  }).catch(() => {
    // Silently ignore - legacy code continues even on failure
    // The actual POST request will handle connection issues
  });

  try {
    console.log('Building request headers...');
    const headers: Record<string, string> = {
      'Content-Type': 'text/xml',
      'HTTP_PRETTY_PRINT': 'TRUE',
      'User-Agent': 'nPanel-Server/1.0',
    };

    if (PLESK_SECRET_KEY) {
      console.log('Using SECRET_KEY authentication');
      headers['KEY'] = PLESK_SECRET_KEY;
    } else {
      console.log('Using username/password authentication');
      const authHeader =
        'Basic ' +
        Buffer.from(`${PLESK_XML_USERNAME}:${PLESK_XML_PASSWORD}`).toString(
          'base64'
        );
      headers['Authorization'] = authHeader;
    }

    console.log('Making request to:', PLESK_XML_ENDPOINT);
    const startTime = Date.now();
    
    // Match legacy timeout: 30 seconds (legacy used 30_000ms)
    const response = await request(PLESK_XML_ENDPOINT, {
      method: 'POST',
      headers,
      body: xmlPayload,
      dispatcher: pleskAgent,
      signal: AbortSignal.timeout(30_000), // Match legacy: 30 seconds
      // Note: For self-signed certificates, you may need to set NODE_TLS_REJECT_UNAUTHORIZED=0
      // or handle this at the environment level
    });

    const duration = Date.now() - startTime;
    const isAuthError = response.statusCode === 401 || response.statusCode === 403;

    if (!isAuthError) {
      Sentry.addBreadcrumb({
        message: 'Plesk XML request successful',
        category: 'plesk-api',
        level: 'info',
        data: {
          status: response.statusCode,
          duration,
          responseLength: response.headers['content-length'] || 'unknown'
        }
      });
      Sentry.addBreadcrumb({
        message: `Plesk XML Request completed in ${duration}ms`,
        category: 'performance',
        level: 'info',
        data: { operation: 'Plesk XML Request', duration, success: true }
      });
    } else {
      Sentry.addBreadcrumb({
        message: 'Plesk XML request failed - Auth Error',
        category: 'plesk-api',
        level: 'warning',
        data: {
          status: response.statusCode,
          duration
        }
      });
      Sentry.addBreadcrumb({
        message: `Plesk XML Request failed in ${duration}ms`,
        category: 'performance',
        level: 'warning',
        data: { operation: 'Plesk XML Request', duration, success: false }
      });
    }

    // Read response body
    const xmlResponse = await response.body.text();

    return {
      xml: xmlResponse,
      isAuthError,
      isHostUnreachable: false,
    };
  } catch (error) {
    const err = error as NetworkError;
    console.error('Plesk XML request failed:', err);
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
          component: 'api-route',
          route: PLESK_XML_ENDPOINT,
          method: 'POST',
          statusCode: '0'
        },
        extra: {
          route: PLESK_XML_ENDPOINT,
          method: 'POST',
          statusCode: 0,
          serverTime: new Date().toISOString()
        }
      });
      Sentry.addBreadcrumb({
        message: 'Plesk host unreachable',
        category: 'plesk-api',
        level: 'error',
        data: {
          endpoint: PLESK_XML_ENDPOINT,
          error: err.message,
          errorType: err.name,
          code: err.code || 'unknown'
        }
      });
    } else {
      Sentry.captureException(err, {
        tags: {
          component: 'api-route',
          route: PLESK_XML_ENDPOINT,
          method: 'POST',
          statusCode: isAuthErrorResult ? '401' : '500'
        },
        extra: {
          route: PLESK_XML_ENDPOINT,
          method: 'POST',
          statusCode: isAuthErrorResult ? 401 : 500,
          serverTime: new Date().toISOString()
        }
      });
      Sentry.addBreadcrumb({
        message: 'Plesk XML request failed',
        category: 'plesk-api',
        level: 'error',
        data: {
          endpoint: PLESK_XML_ENDPOINT,
          error: err.message,
          errorType: err.name,
          code: err.code || 'unknown',
          isAuthError: isAuthErrorResult
        }
      });
    }

    return {
      xml: null,
      isAuthError: isAuthErrorResult,
      isHostUnreachable,
    };
  }
}
