/**
 * SSL ports this mail service publishes for client setup.
 * Account identity and hostnames are derived per mailbox; these ports are not.
 */
export const MAIL_CLIENT_PORTS = {
  pop3: 995,
  imap: 993,
  smtp: 465,
} as const;

export const MAIL_CLIENT_SECURITY = "SSL/TLS";

const OUTGOING_PROTOCOLS = ["SMTP"] as const;
const INCOMING_PROTOCOLS = ["POP3", "IMAP"] as const;

export type MailClientSettings = {
  username: string;
  incomingServer: string;
  outgoingServer: string;
  webmailUrl: string;
  outgoingProtocols: readonly string[];
  incomingProtocols: readonly string[];
  ports: typeof MAIL_CLIENT_PORTS;
  security: typeof MAIL_CLIENT_SECURITY;
};

/** Host only: strip scheme, path, and port so webmail and servers stay on the domain. */
export function normalizeMailDomain(domainName: string | undefined | null): string {
  if (!domainName) return "";
  return domainName
    .trim()
    .replace(/^https?:\/\//i, "")
    .split("/")[0]
    ?.split(":")[0]
    ?.replace(/\.$/, "")
    .toLowerCase() ?? "";
}

export function buildWebmailUrl(domainName: string | undefined | null): string | null {
  const domain = normalizeMailDomain(domainName);
  if (!domain) return null;
  return `https://webmail.${domain}`;
}

export function buildMailClientSettings(input: {
  localPart: string | undefined | null;
  domainName: string | undefined | null;
}): MailClientSettings | null {
  const domain = normalizeMailDomain(input.domainName);
  const rawLocal = (input.localPart ?? "").trim();
  if (!domain || !rawLocal) return null;

  const suffix = `@${domain}`;
  const localPart = rawLocal.toLowerCase().endsWith(suffix)
    ? rawLocal.slice(0, -suffix.length)
    : rawLocal;
  if (!localPart) return null;

  return {
    username: `${localPart}@${domain}`,
    incomingServer: domain,
    outgoingServer: domain,
    webmailUrl: `https://webmail.${domain}`,
    outgoingProtocols: OUTGOING_PROTOCOLS,
    incomingProtocols: INCOMING_PROTOCOLS,
    ports: MAIL_CLIENT_PORTS,
    security: MAIL_CLIENT_SECURITY,
  };
}
