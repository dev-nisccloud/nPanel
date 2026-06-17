import type { JetBackupAccountRow } from "./types";

export function normalizeHostname(value: string): string {
  return value.trim().toLowerCase().replace(/^www\./, "");
}

/** Second-level label, e.g. nisccloud.com → nisccloud */
export function domainSecondLevel(domain: string): string {
  const normalized = normalizeHostname(domain);
  const label = normalized.split(".")[0];
  return label ?? normalized;
}

export function buildJetBackupHostingSearchTerms(
  domainName: string,
  username?: string,
): string[] {
  const domain = normalizeHostname(domainName);
  const sld = domainSecondLevel(domain);
  const terms = new Set<string>();

  if (sld) terms.add(sld);
  if (domain) terms.add(domain);
  if (username?.trim()) terms.add(username.trim().toLowerCase());

  return [...terms];
}

export function findJetBackupAccountForHosting(
  accounts: JetBackupAccountRow[],
  domainName: string,
  username?: string,
): JetBackupAccountRow | undefined {
  const normalizedDomain = normalizeHostname(domainName);
  const sld = domainSecondLevel(normalizedDomain);
  const usernameHints = new Set(
    buildJetBackupHostingSearchTerms(domainName, username).filter((term) => term !== normalizedDomain),
  );

  const byDomain = accounts.find(
    (account) => account.domain && normalizeHostname(String(account.domain)) === normalizedDomain,
  );
  if (byDomain) return byDomain;

  for (const hint of usernameHints) {
    const byUsername = accounts.find(
      (account) => account.username?.toLowerCase() === hint,
    );
    if (byUsername) return byUsername;
  }

  const byNickname = accounts.find(
    (account) =>
      account.nickname && normalizeHostname(String(account.nickname)) === normalizedDomain,
  );
  if (byNickname) return byNickname;

  if (sld) {
    const bySldUsername = accounts.find(
      (account) => account.username?.toLowerCase() === sld,
    );
    if (bySldUsername) return bySldUsername;
  }

  return undefined;
}
