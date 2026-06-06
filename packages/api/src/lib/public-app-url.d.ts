/**
 * Public web app origin for links in emails and callbacks.
 * Uses VITE_PUBLIC_APP_URL (same as Vite client); on the server you can also set FRONTEND_URL as fallback.
 */
export declare function getNormalizedPublicAppUrl(): string;
/**
 * Append a path to the normalized public app URL. `path` must start with `/`.
 * Avoids double slashes when joining (e.g. base `https://x.com/` + path `/a` → `https://x.com/a`).
 */
export declare function joinPublicAppPath(path: string): string;
/**
 * Branded OpenProvider gTLD contact verification landing page.
 * Configure in OpenProvider RCP as:
 * `{origin}/verify-contact?email=%%email%%&authCode=%%authCode%%`
 */
export declare function getContactVerificationConfirmUrl(): string;
/**
 * Branded OpenProvider FOA (transfer confirmation) landing page.
 * Configure in OpenProvider RCP under Account > Settings > FOA branding as:
 * `{origin}/confirm-transfer?domainId=%%domainId%%&authCode=%%authCode%%&domain=%%domain%%`
 */
export declare function getTransferFoaConfirmUrl(): string;
