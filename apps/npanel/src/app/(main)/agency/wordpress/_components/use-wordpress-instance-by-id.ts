import { useEffect } from "react";
import { z } from "zod";
import { trpc } from "@/utils/trpc";
import { wordpressInstancesResponseSchema, wordpressInstallationSchema } from "./schema";
import { toast } from "sonner";

/**
 * Transform WordPress instances API response to single installation format
 */
function transformWordPressInstanceToDetail(
  wpResponse: z.infer<typeof wordpressInstancesResponseSchema>,
  installationId: number
): z.infer<typeof wordpressInstallationSchema> | null {
  // Access the correct data structure: data (direct array)
  const installations = wpResponse.data;

  // Handle missing or invalid data
  if (!installations || !Array.isArray(installations)) {
    return null;
  }

  const installation = installations.find(item => item.id === installationId);
  
  if (!installation) {
    return null;
  }

  return {
    id: installation.id,
    title: installation.title,
    url: installation.url,
    version: installation.version,
    path: installation.path,
    displayTitle: installation.displayTitle,
    installationType: installation.installationType,
    errorMessage: installation.errorMessage,
    domain: installation.domain ? {
      name: installation.domain.name,
      sslRedirectEnabled: installation.domain.sslRedirectEnabled,
      ssl: installation.domain.ssl ? {
        enabled: installation.domain.ssl.enabled,
        redirectToHttpsEnabled: installation.domain.ssl.redirectToHttpsEnabled,
        urlProtocolHttps: installation.domain.ssl.urlProtocolHttps,
        certificate: installation.domain.ssl.certificate ? {
          installed: installation.domain.ssl.certificate.installed,
          selfSigned: installation.domain.ssl.certificate.selfSigned ?? false,
          actual: installation.domain.ssl.certificate.actual ?? false,
          suitableForDomain: installation.domain.ssl.certificate.suitableForDomain ?? false,
          issuerName: installation.domain.ssl.certificate.issuerName ?? "Unknown",
        } : undefined,
      } : undefined,
      installationsLimit: installation.domain.installationsLimit ?? 0,
      installationsCount: installation.domain.installationsCount,
    } : undefined,
    owner: installation.owner ? {
      id: installation.owner.id,
      login: installation.owner.login,
      name: installation.owner.name,
    } : undefined,
    status: installation.status ? {
      alive: installation.status.alive,
      infected: installation.status.infected,
      unsupported: installation.status.unsupported,
      multisite: installation.status.multisite,
    } : undefined,
    features: installation.features ? {
      updates: installation.features.updates ? {
        applicable: installation.features.updates.applicable,
        autoUpdatesAvailable: installation.features.updates.autoUpdatesAvailable,
        amountOfPluginsWithUpdates: installation.features.updates.amountOfPluginsWithUpdates,
        amountOfThemesWithUpdates: installation.features.updates.amountOfThemesWithUpdates,
        availableVersion: installation.features.updates.availableVersion ?? undefined,
      } : undefined,
      restorePoint: installation.features.restorePoint ? {
        available: installation.features.restorePoint.available,
        restorePointTimestamp: typeof installation.features.restorePoint.restorePointTimestamp === 'number' 
          ? String(installation.features.restorePoint.restorePointTimestamp) 
          : installation.features.restorePoint.restorePointTimestamp ?? undefined,
        displayTimestamp: installation.features.restorePoint.displayTimestamp ?? undefined,
      } : undefined,
      maintenance: installation.features.maintenance ? {
        status: installation.features.maintenance.status,
      } : undefined,
      security: installation.features.security ? {
        status: installation.features.security.status,
      } : undefined,
      php: installation.features.php ? {
        handler: installation.features.php.handler ? {
          version: installation.features.php.handler.version,
          name: installation.features.php.handler.name,
          identifier: installation.features.php.handler.identifier,
        } : undefined,
        unsupported: installation.features.php.unsupported,
        eoled: installation.features.php.eoled,
      } : undefined,
      vulnerability: installation.features.vulnerability ? {
        vulnerable: installation.features.vulnerability.vulnerable,
        hasVulnerableDeactivatedPlugins: installation.features.vulnerability.hasVulnerableDeactivatedPlugins,
        hasVulnerableDeactivatedThemes: installation.features.vulnerability.hasVulnerableDeactivatedThemes,
      } : undefined,
      fileManager: installation.features.fileManager ? {
        available: installation.features.fileManager.available,
        url: installation.features.fileManager.url,
      } : undefined,
      backups: installation.features.backups ? {
        panelBackupsAvailable: installation.features.backups.panelBackupsAvailable,
        wptBackupsAvailable: installation.features.backups.wptBackupsAvailable,
        backupManagerUrl: installation.features.backups.backupManagerUrl,
      } : undefined,
      wpCli: installation.features.wpCli ? {
        available: installation.features.wpCli.available,
      } : undefined,
      clone: installation.features.clone ? {
        available: installation.features.clone.available,
        applicable: installation.features.clone.applicable,
      } : undefined,
      remoteManagement: installation.features.remoteManagement ? {
        available: installation.features.remoteManagement.available,
      } : undefined,
      actionLog: installation.features.actionLog ? {
        available: installation.features.actionLog.available,
      } : undefined,
      hotlinkProtection: installation.features.hotlinkProtection ? {
        available: installation.features.hotlinkProtection.available,
        status: installation.features.hotlinkProtection.status,
      } : undefined,
      passwordProtection: installation.features.passwordProtection ? {
        available: installation.features.passwordProtection.available,
        status: installation.features.passwordProtection.status,
      } : undefined,
      nginxCaching: installation.features.nginxCaching ? {
        available: installation.features.nginxCaching.available,
        status: installation.features.nginxCaching.status,
        webServerSettingsUrl: installation.features.nginxCaching.webServerSettingsUrl,
      } : undefined,
      indexing: installation.features.indexing ? {
        status: installation.features.indexing.status,
      } : undefined,
      debug: installation.features.debug ? {
        status: installation.features.debug.status,
      } : undefined,
      credentials: installation.features.credentials ? {
        available: installation.features.credentials.available,
      } : undefined,
    } : undefined,
  };
}

/**
 * Custom hook for fetching a single WordPress installation by ID
 */
export function useWordPressInstanceById(installationId: string) {
  const installationIdNumber = parseInt(installationId, 10);
  
  const {
    data: wpData,
    isLoading,
    isError,
    error,
    refetch,
    isRefetching,
  } = trpc.plesk.wordpress.getAll.useQuery(
    {},
    {
      enabled: !isNaN(installationIdNumber) && installationIdNumber > 0,
      staleTime: 10 * 60 * 1000, // 10 minutes - increased to reduce request frequency
      gcTime: 30 * 60 * 1000, // 30 minutes - increased cache time
      retry: (failureCount, error: any) => {
        // Don't retry on authentication errors
        if (error?.data?.code === "UNAUTHORIZED") return false;
        // Don't retry on service unavailable errors
        if (error?.data?.code === "SERVICE_UNAVAILABLE") return false;
        // Don't retry on rate limit errors - retrying makes it worse
        if (error?.data?.code === "TOO_MANY_REQUESTS") return false;
        // Retry up to 2 times for other errors (reduced from 3)
        return failureCount < 2;
      },
      retryDelay: (attemptIndex) => Math.min(5000 * (attemptIndex + 1), 60000), // Slower retries: 5s, 10s, max 60s
      refetchOnWindowFocus: false,
      refetchOnReconnect: true,
    }
  );

  // Handle API errors
  useEffect(() => {
    if (error) {
      console.error("WordPress installation fetch error:", error);
      
      // Show user-friendly error messages
      if (error?.data?.code === "UNAUTHORIZED") {
        toast.error("Authentication failed. Please check your Plesk credentials.");
      } else if (error?.data?.code === "SERVICE_UNAVAILABLE") {
        toast.error("Plesk server is currently unavailable. Please try again later.");
      } else if (error?.data?.code === "TOO_MANY_REQUESTS") {
        toast.error("Rate limit exceeded. Please wait a few minutes before trying again.", {
          duration: 10000, // Show for 10 seconds
        });
      } else if (error?.data?.code === "INTERNAL_SERVER_ERROR") {
        toast.error("Server error occurred while fetching WordPress installation details.");
      } else {
        toast.error("Failed to fetch WordPress installation details. Please try again.");
      }
    }
  }, [error]);

  // Transform the data
  let transformedData: z.infer<typeof wordpressInstallationSchema> | null = null;
  let transformationError: Error | null = null;

  if (wpData) {
    try {
      // Validate the response against our schema
      const validatedData = wordpressInstancesResponseSchema.parse(wpData);
      transformedData = transformWordPressInstanceToDetail(validatedData, installationIdNumber);
    } catch (error) {
      console.error("Data transformation error:", error);
      console.error("Raw API response:", wpData);
      transformationError = error as Error;
      
      // Provide more specific error messages based on the error type
      if (error instanceof z.ZodError) {
        console.error("Zod validation errors:", error.issues);
        toast.error(`Data validation failed: ${error.issues.length} field(s) have invalid data.`);
      } else {
        toast.error("Failed to process WordPress installation data. Please refresh the page.");
      }
    }
  }

  return {
    data: transformedData,
    isLoading: isLoading || isRefetching,
    isError: isError || !!transformationError,
    error: error || transformationError,
    refetch,
    rawData: wpData,
  };
}
