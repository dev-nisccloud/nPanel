import { hashPassword } from "better-auth/crypto";

/** Hash a password with the same scrypt format Better Auth stores on credential accounts. */
export async function hashCredentialPassword(password: string): Promise<string> {
	return hashPassword(password);
}
