import { Client } from '@upstash/qstash';

/**
 * Get QStash client instance
 * Uses environment variables:
 * - QSTASH_TOKEN: QStash token (required)
 * - QSTASH_CURRENT_SIGNING_KEY: Current signing key for verification (optional)
 * - QSTASH_VITE_SIGNING_KEY: Next signing key for key rotation (optional)
 */
export function getQStashClient(): Client {
	const token = process.env.QSTASH_TOKEN;
	if (!token) {
		throw new Error('QSTASH_TOKEN environment variable is required');
	}

	return new Client({
		token,
	});
}

/**
 * Get QStash signing keys for webhook verification
 */
export function getQStashSigningKeys(): {
	current: string | undefined;
	next: string | undefined;
} {
	return {
		current: process.env.QSTASH_CURRENT_SIGNING_KEY || process.env.QSTASH_VITE_SIGNING_KEY,
		next: process.env.QSTASH_VITE_SIGNING_KEY,
	};
}

