import { SES, type SendRawEmailCommandInput, type SendRawEmailCommandOutput } from "@aws-sdk/client-ses";

interface EnvConfig {
  AWS_SES_REGION: string;
  AWS_SES_ACCESS_KEY_ID: string;
  AWS_SES_SECRET_ACCESS_KEY: string;
}

let sesClient: SES | null = null;

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

function loadEnvConfig(): EnvConfig {
  return {
    AWS_SES_REGION: requireEnv("AWS_SES_REGION"),
    AWS_SES_ACCESS_KEY_ID: requireEnv("AWS_SES_ACCESS_KEY_ID"),
    AWS_SES_SECRET_ACCESS_KEY: requireEnv("AWS_SES_SECRET_ACCESS_KEY"),
  };
}

export function getSesClient(): SES {
  if (sesClient) return sesClient;
  const cfg = loadEnvConfig();
  sesClient = new SES({
    apiVersion: "2010-12-01",
    region: cfg.AWS_SES_REGION,
    credentials: {
      accessKeyId: cfg.AWS_SES_ACCESS_KEY_ID,
      secretAccessKey: cfg.AWS_SES_SECRET_ACCESS_KEY,
    },
  });
  return sesClient;
}

/**
 * Configuration set applied to outbound SES API calls when not overridden.
 * Reads `AWS_SES_CONFIGURATION_SET` or `SES_CONFIGURATION_SET`. Event destinations (SNS → webhook)
 * are attached to this set in the SES console, not via topic ARN in env.
 */
export function getSesConfigurationSetName(): string | undefined {
  const a = process.env.AWS_SES_CONFIGURATION_SET?.trim();
  const b = process.env.SES_CONFIGURATION_SET?.trim();
  return a || b || undefined;
}

/**
 * Wraps `sendRawEmail`: merges {@link getSesConfigurationSetName} when `ConfigurationSetName` is omitted.
 * Prefer this over `ses.sendRawEmail` everywhere in `@npanel/api` so tracing/SNS notifications stay consistent.
 */
export async function sendSesRawEmail(
  client: SES,
  input: SendRawEmailCommandInput,
): Promise<SendRawEmailCommandOutput> {
  const { ConfigurationSetName: configurationSetNameInput, ...rest } = input;
  const explicit = configurationSetNameInput?.trim();
  const fromEnv = getSesConfigurationSetName();
  const configurationSetName = explicit || fromEnv;
  return client.sendRawEmail({
    ...rest,
    ...(configurationSetName ? { ConfigurationSetName: configurationSetName } : {}),
  });
}

export type DnsRecord = {
  type: "CNAME" | "MX" | "TXT";
  name: string;
  value: string;
  ttl?: number;
};

/**
 * Easy DKIM (SES VerifyDomainDkim) produces DKIM tokens that map to CNAME:
 *  Name:  <token>._domainkey.<domain>
 *  Value: <token>.dkim.amazonses.com
 */
export function buildEasyDkimDnsRecords(domain: string, dkimTokens: readonly string[]): DnsRecord[] {
  return dkimTokens.map((token) => ({
    type: "CNAME",
    name: `${token}._domainkey.${domain}`,
    value: `${token}.dkim.amazonses.com`,
  }));
}

export function buildCustomMailFromDnsRecords(params: {
  mailFromDomain: string;
  awsRegion: string;
}): DnsRecord[] {
  const { mailFromDomain, awsRegion } = params;
  // SES docs: MX record points to feedback-smtp.<region>.amazonses.com
  // Priority is 10 by convention.
  return [
    {
      type: "MX",
      name: mailFromDomain,
      value: `10 feedback-smtp.${awsRegion}.amazonses.com`,
    },
    {
      type: "TXT",
      name: mailFromDomain,
      value: `v=spf1 include:amazonses.com ~all`,
    },
  ];
}

