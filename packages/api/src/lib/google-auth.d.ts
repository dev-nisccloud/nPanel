import { google } from 'googleapis';
/**
 * Get the Google Search Console and GA4 auth client
 * Supports both a single JSON/Base64 string or individual environment variables
 */
export declare function getGoogleAuthClient(): InstanceType<typeof google.auth.GoogleAuth> | null;
