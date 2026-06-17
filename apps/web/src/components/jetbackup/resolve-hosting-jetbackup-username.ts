import { domainSecondLevel } from "./hosting-account-lookup";

type HostingProperty = { name?: string; value?: unknown };

/**
 * JetBackup accounts are keyed by Plesk system username (often the domain SLD),
 * not the random ftp_login Plesk exposes for FTP access.
 */
export function resolveHostingJetBackupUsername(hostingData?: {
  gen_info?: { name?: string };
  hosting?: { vrt_hst?: { property?: HostingProperty[] } };
}): string | undefined {
  const domain = hostingData?.gen_info?.name?.trim();
  if (domain) {
    const sld = domainSecondLevel(domain);
    if (sld) return sld;
  }

  const ftpLogin = hostingData?.hosting?.vrt_hst?.property?.find(
    (property) => property.name === "ftp_login",
  )?.value;

  return typeof ftpLogin === "string" && ftpLogin.trim() ? ftpLogin.trim() : undefined;
}
