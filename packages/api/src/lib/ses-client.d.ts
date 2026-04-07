import { SES, type SendRawEmailCommandInput, type SendRawEmailCommandOutput } from "@aws-sdk/client-ses";
export declare function getSesClient(): SES;
/**
 * Configuration set applied to outbound SES API calls when not overridden.
 * Reads `AWS_SES_CONFIGURATION_SET` or `SES_CONFIGURATION_SET`. Event destinations (SNS → webhook)
 * are attached to this set in the SES console, not via topic ARN in env.
 */
export declare function getSesConfigurationSetName(): string | undefined;
/**
 * Wraps `sendRawEmail`: merges {@link getSesConfigurationSetName} when `ConfigurationSetName` is omitted.
 * Prefer this over `ses.sendRawEmail` everywhere in `@npanel/api` so tracing/SNS notifications stay consistent.
 */
export declare function sendSesRawEmail(client: SES, input: SendRawEmailCommandInput): Promise<SendRawEmailCommandOutput>;
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
export declare function buildEasyDkimDnsRecords(domain: string, dkimTokens: readonly string[]): DnsRecord[];
export declare function buildCustomMailFromDnsRecords(params: {
    mailFromDomain: string;
    awsRegion: string;
}): DnsRecord[];
