function shellQuote(value: string): string {
	return `'${value.replace(/'/g, `'\\''`)}'`;
}

/** Shell commands to append selected public keys to root authorized_keys (run in Terminal tab). */
export function buildAuthorizedKeysInstallScript(publicKeys: string[]): string {
	const unique = [...new Set(publicKeys.map((k) => k.trim()).filter(Boolean))];
	if (!unique.length) return "";

	const lines = [
		"mkdir -p ~/.ssh && chmod 700 ~/.ssh",
		"touch ~/.ssh/authorized_keys && chmod 600 ~/.ssh/authorized_keys",
		...unique.map(
			(key) =>
				`grep -qxF ${shellQuote(key)} ~/.ssh/authorized_keys || echo ${shellQuote(key)} >> ~/.ssh/authorized_keys`,
		),
	];
	return lines.join("\n");
}
