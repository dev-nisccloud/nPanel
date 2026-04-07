import { Client } from '@upstash/qstash';
/**
 * Get QStash client instance
 * Uses environment variables:
 * - QSTASH_TOKEN: QStash token (required)
 * - QSTASH_CURRENT_SIGNING_KEY: Current signing key for verification (optional)
 * - QSTASH_VITE_SIGNING_KEY: Next signing key for key rotation (optional)
 */
export declare function getQStashClient(): Client;
/**
 * Get QStash signing keys for webhook verification
 */
export declare function getQStashSigningKeys(): {
    current: string | undefined;
    next: string | undefined;
};
