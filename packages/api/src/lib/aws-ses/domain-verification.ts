import {
  VerifyDomainIdentityCommand,
  VerifyDomainDkimCommand,
  GetIdentityVerificationAttributesCommand,
  DeleteIdentityCommand,
} from "@aws-sdk/client-ses";
import { getSESClient } from "./client";

export interface DomainVerificationResult {
  domainName: string;
  verificationToken: string;
  dkimTokens: string[];
  spfRecord: string;
  dmarcRecord: string;
}

export interface VerificationStatus {
  domainName: string;
  isVerified: boolean;
  verificationStatus: "Pending" | "Success" | "Failed" | "TemporaryFailure";
  dkimVerificationStatus: "Pending" | "Success" | "Failed" | "TemporaryFailure";
}

/**
 * Initiate domain verification with Amazon SES
 * Returns DNS records that need to be added to the domain
 */
export async function verifyDomain(domainName: string): Promise<DomainVerificationResult> {
  try {
    const sesClient = getSESClient();
    
    // Verify domain identity (SPF)
    const verifyCommand = new VerifyDomainIdentityCommand({
      Domain: domainName,
    });
    
    const verifyResponse = await sesClient.send(verifyCommand);
    
    if (!verifyResponse.VerificationToken) {
      throw new Error("Failed to get verification token from SES");
    }

    // Verify DKIM
    const dkimCommand = new VerifyDomainDkimCommand({
      Domain: domainName,
    });
    
    const dkimResponse = await sesClient.send(dkimCommand);
    
    if (!dkimResponse.DkimTokens || dkimResponse.DkimTokens.length !== 3) {
      throw new Error("Failed to get DKIM tokens from SES");
    }

    // Generate DNS records
    const spfRecord = `v=spf1 include:amazonses.com ~all`;
    const dmarcRecord = `v=DMARC1; p=quarantine; rua=mailto:dmarc@${domainName}`;
    
    // Generate DKIM records
    const dkimRecords = dkimResponse.DkimTokens.map(token => 
      `${token}._domainkey.${domainName} CNAME ${token}.dkim.amazonses.com`
    );

    return {
      domainName,
      verificationToken: verifyResponse.VerificationToken,
      dkimTokens: dkimResponse.DkimTokens,
      spfRecord,
      dmarcRecord,
    };
  } catch (error) {
    console.error("Error verifying domain:", error);
    throw new Error(`Failed to verify domain ${domainName}: ${error instanceof Error ? error.message : "Unknown error"}`);
  }
}

/**
 * Check the verification status of a domain
 */
export async function checkVerificationStatus(domainName: string): Promise<VerificationStatus> {
  try {
    const sesClient = getSESClient();
    
    const command = new GetIdentityVerificationAttributesCommand({
      Identities: [domainName],
    });
    
    const response = await sesClient.send(command);
    const attributes = response.VerificationAttributes?.[domainName];
    
    if (!attributes) {
      throw new Error(`Domain ${domainName} not found in SES`);
    }

    // Map AWS VerificationStatus to our expected types
    const mapStatus = (status?: string): "Pending" | "Success" | "Failed" | "TemporaryFailure" => {
      if (status === "Success") return "Success";
      if (status === "Failed") return "Failed";
      if (status === "TemporaryFailure") return "TemporaryFailure";
      return "Pending"; // Default for "NotStarted" or undefined
    };

    return {
      domainName,
      isVerified: attributes.VerificationStatus === "Success",
      verificationStatus: mapStatus(attributes.VerificationStatus),
      dkimVerificationStatus: mapStatus(attributes.VerificationStatus), // DKIM uses same verification status
    };
  } catch (error) {
    console.error("Error checking verification status:", error);
    throw new Error(`Failed to check verification status for ${domainName}: ${error instanceof Error ? error.message : "Unknown error"}`);
  }
}

/**
 * Get DNS records required for domain verification
 */
export async function getDomainDnsRecords(domainName: string): Promise<{
  spfRecord: string;
  dmarcRecord: string;
  dkimRecords: string[];
}> {
  try {
    const sesClient = getSESClient();
    
    // Get DKIM tokens
    const dkimCommand = new VerifyDomainDkimCommand({
      Domain: domainName,
    });
    
    const dkimResponse = await sesClient.send(dkimCommand);
    
    if (!dkimResponse.DkimTokens || dkimResponse.DkimTokens.length !== 3) {
      throw new Error("Failed to get DKIM tokens from SES");
    }

    // Generate DNS records
    const spfRecord = `v=spf1 include:amazonses.com ~all`;
    const dmarcRecord = `v=DMARC1; p=quarantine; rua=mailto:dmarc@${domainName}`;
    
    // Generate DKIM records
    const dkimRecords = dkimResponse.DkimTokens.map(token => 
      `${token}._domainkey.${domainName} CNAME ${token}.dkim.amazonses.com`
    );

    return {
      spfRecord,
      dmarcRecord,
      dkimRecords,
    };
  } catch (error) {
    console.error("Error getting DNS records:", error);
    throw new Error(`Failed to get DNS records for ${domainName}: ${error instanceof Error ? error.message : "Unknown error"}`);
  }
}

/**
 * Delete domain from SES
 */
export async function deleteDomain(domainName: string): Promise<void> {
  try {
    const sesClient = getSESClient();
    
    const command = new DeleteIdentityCommand({
      Identity: domainName,
    });
    
    await sesClient.send(command);
  } catch (error) {
    console.error("Error deleting domain:", error);
    throw new Error(`Failed to delete domain ${domainName}: ${error instanceof Error ? error.message : "Unknown error"}`);
  }
}
