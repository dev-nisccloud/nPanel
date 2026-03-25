import { google } from 'googleapis';

/**
 * Get the Google Search Console and GA4 auth client
 * Supports both a single JSON/Base64 string or individual environment variables
 */
export function getGoogleAuthClient(): InstanceType<typeof google.auth.GoogleAuth> | null {
    let credentials;

    // Option 1: Try the monolithic JSON string (or Base64)
    const serviceAccountValue = process.env.GOOGLE_SERVICE_ACCOUNT_JSON;

    if (serviceAccountValue) {
        try {
            let jsonString = serviceAccountValue.trim();

            // Detection for Base64
            if (!jsonString.startsWith('{')) {
                jsonString = Buffer.from(jsonString, 'base64').toString('utf8');
            }

            credentials = JSON.parse(jsonString);
        } catch (error) {
            console.error('Failed to parse GOOGLE_SERVICE_ACCOUNT_JSON:', error);
        }
    }

    // Option 2: Try individual environment variables if monolithic fails or is missing
    if (!credentials) {
        // Option 3: Try individual environment variables
        const type = process.env.GOOGLE_SA_TYPE || 'service_account';
        const project_id = process.env.GOOGLE_SA_PROJECT_ID;
        const private_key_id = process.env.GOOGLE_SA_PRIVATE_KEY_ID;
        const private_key = process.env.GOOGLE_SA_PRIVATE_KEY;
        const client_email = process.env.GOOGLE_SA_CLIENT_EMAIL;
        const client_id = process.env.GOOGLE_SA_CLIENT_ID;
        const auth_uri = process.env.GOOGLE_SA_AUTH_URI || 'https://accounts.google.com/o/oauth2/auth';
        const token_uri = process.env.GOOGLE_SA_TOKEN_URI || 'https://oauth2.googleapis.com/token';
        const auth_provider_x509_cert_url = process.env.GOOGLE_SA_AUTH_PROVIDER_CERT_URL || 'https://www.googleapis.com/oauth2/v1/certs';
        const client_x509_cert_url = process.env.GOOGLE_SA_CLIENT_CERT_URL;
        const universe_domain = process.env.GOOGLE_SA_UNIVERSE_DOMAIN || 'googleapis.com';

        if (project_id && private_key && client_email) {
            // Very robust key cleaning:
            // 1. Remove any surrounding quotes that might have been accidentally included
            // 2. Replace any literal \n with real newlines
            // 3. Ensure no trailing/leading whitespace except newlines
            let fixedKey = private_key.trim();
            if (fixedKey.startsWith('"') && fixedKey.endsWith('"')) fixedKey = fixedKey.substring(1, fixedKey.length - 1);
            if (fixedKey.startsWith("'") && fixedKey.endsWith("'")) fixedKey = fixedKey.substring(1, fixedKey.length - 1);

            fixedKey = fixedKey.replace(/\\n/g, '\n');

            if (process.env.NODE_ENV === 'development') {
                console.log('--- Google Auth Diagnostic ---');
                console.log('Client Email:', client_email);
                console.log('Key Length Fixed:', fixedKey.length);
                console.log('Header Check:', fixedKey.startsWith('-----BEGIN PRIVATE KEY-----'));
                console.log('Footer Check:', fixedKey.endsWith('-----END PRIVATE KEY-----'));
                console.log('Newline count:', (fixedKey.match(/\n/g) || []).length);
                console.log('------------------------------');
            }

            credentials = {
                type,
                project_id,
                private_key_id,
                private_key: fixedKey,
                client_email,
                client_id,
                auth_uri,
                token_uri,
                auth_provider_x509_cert_url,
                client_x509_cert_url,
                universe_domain,
            };
        }
    }

    // Option 4: Check for a local file path as a last resort (Helpful for local dev)
    if (!credentials && process.env.GOOGLE_SA_KEY_FILE_PATH) {
        const auth = new google.auth.GoogleAuth({
            keyFile: process.env.GOOGLE_SA_KEY_FILE_PATH,
            scopes: [
                'https://www.googleapis.com/auth/webmasters.readonly',
                'https://www.googleapis.com/auth/analytics.readonly'
            ],
        });
        return auth;
    }

    if (!credentials) {
        const isDev = process.env.NODE_ENV === 'development';
        if (isDev) {
            console.warn('Google Service Account credentials are not fully configured in environment variables.');
        }
        return null;
    }

    try {
        const auth = new google.auth.GoogleAuth({
            credentials,
            scopes: [
                'https://www.googleapis.com/auth/webmasters.readonly',
                'https://www.googleapis.com/auth/analytics.readonly'
            ],
        });

        return auth;
    } catch (error) {
        console.error('Failed to initialize Google Auth client:', error);
        return null;
    }
}
