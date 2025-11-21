import { useEffect } from "react";
import { z } from "zod";
import { toast } from "sonner";
import { trpc } from "@/utils/trpc";
import { wordpressInstancesResponseSchema, wordpressInstallationSchema } from "./schema";

/**
 * Transform WordPress instances API response to component format
 */
function transformWordPressInstancesToComponent(
  wpResponse: z.infer<typeof wordpressInstancesResponseSchema>
): z.infer<typeof wordpressInstallationSchema>[] {
  // Access the correct data structure: data (direct array)
  const installations = wpResponse.data;

  // Handle missing or invalid data
  if (!installations || !Array.isArray(installations)) {
    return [];
  }

  return installations.map((installation) => ({
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
  }));
}

/**
 * Custom hook to fetch WordPress instances
 */
export function useWordPressInstances() {
  const query = trpc.plesk.wordpress.getAll.useQuery(
    {},
    {
      staleTime: 10 * 60 * 1000, // 10 minutes
      gcTime: 30 * 60 * 1000, // 30 minutes
      refetchOnWindowFocus: false,
      refetchOnMount: false,
      retry: (failureCount, error: any) => {
        // Don't retry on authentication or service unavailable errors
        if (error?.data?.code === 'UNAUTHORIZED' || error?.data?.code === 'SERVICE_UNAVAILABLE') {
          return false;
        }
        // Don't retry on rate limit errors
        if (error?.data?.code === 'TOO_MANY_REQUESTS') {
          return false;
        }
        // Retry up to 2 times for other errors (reduced from 3)
        return failureCount < 2;
      },
      retryDelay: (attemptIndex) => Math.min(5000 * (attemptIndex + 1), 60000), // Slower retries: 5s, 10s, max 60s
    }
  );

  let data: z.infer<typeof wordpressInstallationSchema>[] = [];
  let transformationError: Error | null = null;

  if (query.data) {
    try {
      // Validate the raw data against our schema
      const validatedData = wordpressInstancesResponseSchema.parse(query.data);
      data = transformWordPressInstancesToComponent(validatedData);
    } catch (error) {
      console.error("WordPress instances data transformation error:", error);
      transformationError = error instanceof Error ? error : new Error("Unknown transformation error");

      if (error instanceof z.ZodError) {
        console.error("Zod validation errors:", error.issues);
        toast.error("WordPress instances data validation failed. Some fields may be missing or invalid.");
      } else {
        toast.error("Failed to process WordPress instances data. Please try again.");
      }
    }
  }

  // Handle API errors with user-friendly messages
  useEffect(() => {
    if (query.error) {
      const error = query.error as any;
      const errorCode = error?.data?.code;

      switch (errorCode) {
        case 'UNAUTHORIZED':
          toast.error("Authentication failed. Please check your credentials.");
          break;
        case 'SERVICE_UNAVAILABLE':
          toast.error("Plesk service is currently unavailable. Please try again later.");
          break;
        case 'TOO_MANY_REQUESTS':
          toast.error("Rate limit exceeded. Please wait a few minutes before trying again.", {
            duration: 10000, // Show for 10 seconds
          });
          break;
        case 'INTERNAL_SERVER_ERROR':
          toast.error("Failed to fetch WordPress instances. Please try again.");
          break;
        default:
          toast.error("An unexpected error occurred while fetching WordPress instances.");
      }
    }
  }, [query.error]);

  return {
    data,
    isLoading: query.isLoading,
    isError: query.isError || !!transformationError,
    error: query.error || transformationError,
    refetch: query.refetch,
    rawData: query.data,
  };
}
