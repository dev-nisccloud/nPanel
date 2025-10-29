import db from "@nPanel/db";
import { checkVerificationStatus } from "../../aws-ses/domain-verification";

export interface DomainVerificationJobPayload {
  domainId: string;
}

type EmailDomainVerificationStatus = "PENDING" | "VERIFYING" | "VERIFIED" | "FAILED" | "TEMPORARY_FAILURE";

/**
 * Process domain verification check job
 * Checks verification status with SES and updates database
 */
export async function processDomainVerificationJob(payload: DomainVerificationJobPayload): Promise<void> {
  const { domainId } = payload;

  try {
    // Fetch domain from database
    const domain = await db.emailDomain.findUnique({
      where: { id: domainId },
    });

    if (!domain) {
      throw new Error(`Domain ${domainId} not found`);
    }

    // Check verification status with SES
    const verificationStatus = await checkVerificationStatus(domain.domainName);

    // Map SES status to our enum
    let newStatus: EmailDomainVerificationStatus;
    switch (verificationStatus.verificationStatus) {
      case "Pending":
        newStatus = "PENDING";
        break;
      case "Success":
        newStatus = "VERIFIED";
        break;
      case "Failed":
        newStatus = "FAILED";
        break;
      case "TemporaryFailure":
        newStatus = "TEMPORARY_FAILURE";
        break;
      default:
        newStatus = "PENDING";
    }

    // Update domain in database
    const updatedDomain = await db.emailDomain.update({
      where: { id: domainId },
      data: {
        verificationStatus: newStatus,
        isVerified: verificationStatus.isVerified,
        verificationAttempts: {
          increment: 1,
        },
        lastVerificationAt: new Date(),
      },
    });

    // Log activity
    await db.emailDomainActivityLog.create({
      data: {
        id: crypto.randomUUID(),
        userId: domain.userId,
        emailDomainId: domainId,
        action: "VERIFICATION_CHECK",
        description: `Domain verification status checked: ${verificationStatus.verificationStatus}`,
        metadata: JSON.stringify({
          sesStatus: verificationStatus.verificationStatus,
          dkimStatus: verificationStatus.dkimVerificationStatus,
          isVerified: verificationStatus.isVerified,
        }),
        createdAt: new Date(),
      },
    });

    console.log(`Domain verification check completed for ${domain.domainName}: ${verificationStatus.verificationStatus}`);

    // If still pending and we haven't exceeded max attempts, schedule another check
    if (newStatus === "PENDING" && updatedDomain.verificationAttempts < 10) {
      // Schedule next check in 5 minutes
      const { queueDomainVerification } = await import("../email-queue");
      setTimeout(() => {
        queueDomainVerification(domainId).catch(error => {
          console.error(`Failed to queue next verification check for ${domainId}:`, error);
        });
      }, 5 * 60 * 1000); // 5 minutes
    }

  } catch (error) {
    console.error(`Error processing domain verification job for ${domainId}:`, error);
    
    // Fetch domain first to get userId
    const errorDomain = await db.emailDomain.findUnique({
      where: { id: domainId },
    });
    
    // Update domain with error status
    await db.emailDomain.update({
      where: { id: domainId },
      data: {
        verificationStatus: "TEMPORARY_FAILURE",
        verificationAttempts: {
          increment: 1,
        },
        lastVerificationAt: new Date(),
      },
    });

    // Log error activity
    if (errorDomain) {
      await db.emailDomainActivityLog.create({
        data: {
          id: crypto.randomUUID(),
          userId: errorDomain.userId,
          emailDomainId: domainId,
          action: "VERIFICATION_CHECK_FAILED",
          description: `Domain verification check failed: ${error instanceof Error ? error.message : "Unknown error"}`,
          metadata: JSON.stringify({
            error: error instanceof Error ? error.message : "Unknown error",
          }),
          createdAt: new Date(),
        },
      });
    }

    throw error;
  }
}
