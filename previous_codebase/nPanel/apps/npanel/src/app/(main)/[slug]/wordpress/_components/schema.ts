import { z } from "zod";

// Schema for the raw WordPress instances API response
export const wordpressInstancesResponseSchema = z.object({
  data: z.array(z.object({
        id: z.number().optional(),
        title: z.string().optional(),
        url: z.string().optional(),
        version: z.string().optional(),
        path: z.string().optional(),
        labels: z.array(z.string()).optional(),
        displayTitle: z.string().optional(),
        server: z.any().nullable().optional(),
        errorMessage: z.string().nullable().optional(),
        installationType: z.string().optional(),
        domain: z.object({
          name: z.string().optional(),
          url: z.string().optional(),
          sslRedirectEnabled: z.boolean().optional(),
          ssl: z.object({
            enabled: z.boolean().optional(),
            redirectToHttpsEnabled: z.boolean().optional(),
            urlProtocolHttps: z.boolean().optional(),
            certificate: z.object({
              installed: z.boolean().optional(),
              selfSigned: z.boolean().nullable().optional(),
              actual: z.boolean().nullable().optional(),
              suitableForDomain: z.boolean().nullable().optional(),
              issuerName: z.string().nullable().optional(),
            }).optional(),
            enableSslActionUrl: z.string().optional(),
            buyOrInstallSslActionUrl: z.string().optional(),
            enableRedirectToHttpsActionUrl: z.string().optional(),
          }).optional(),
          installationsLimit: z.number().nullable().optional(),
          installationsCount: z.number().optional(),
        }).optional(),
        screenshot: z.object({
          createdAt: z.string().nullable().optional(),
          url: z.string().nullable().optional(),
        }).optional(),
        owner: z.object({
          id: z.number().optional(),
          login: z.string().optional(),
          name: z.string().optional(),
          url: z.string().nullable().optional(),
        }).optional(),
        status: z.object({
          alive: z.boolean().optional(),
          infected: z.boolean().optional(),
          unsupported: z.boolean().optional(),
          multisite: z.boolean().optional(),
        }).optional(),
        features: z.object({
          wpCronTakeover: z.object({
            available: z.boolean().optional(),
            status: z.union([z.string(), z.boolean()]).nullable().optional(),
            taskReplacementStatus: z.union([z.string(), z.boolean()]).nullable().optional(),
          }).optional(),
          updates: z.object({
            applicable: z.boolean().optional(),
            autoUpdatesAvailable: z.boolean().optional(),
            availableVersion: z.string().nullable().optional(),
            amountOfPluginsWithUpdates: z.number().optional(),
            amountOfThemesWithUpdates: z.number().optional(),
            smart: z.object({
              available: z.boolean().optional(),
              applicable: z.boolean().optional(),
              promoAvailable: z.boolean().optional(),
              status: z.boolean().optional(),
              taskStatus: z.string().optional(),
              initiatedByAutoUpdater: z.boolean().optional(),
              createdAt: z.string().nullable().optional(),
            }).optional(),
            php: z.object({
              available: z.boolean().optional(),
              applicable: z.boolean().optional(),
              taskStatus: z.string().optional(),
              createdAt: z.string().nullable().optional(),
            }).optional(),
          }).optional(),
          restorePoint: z.object({
            available: z.boolean().optional(),
            restorePointTimestamp: z.union([z.string(), z.number()]).nullable().optional(),
            previousVersion: z.string().nullable().optional(),
            version: z.string().nullable().optional(),
            errorMessage: z.string().nullable().optional(),
            displayTimestamp: z.string().nullable().optional(),
            fullSnapshot: z.boolean().nullable().optional(),
            message: z.string().nullable().optional(),
            sourceUrl: z.string().nullable().optional(),
          }).optional(),
          maintenance: z.object({
            status: z.boolean().optional(),
            fullMode: z.boolean().optional(),
          }).optional(),
          hotlinkProtection: z.object({
            available: z.boolean().optional(),
            status: z.boolean().optional(),
          }).optional(),
          security: z.object({
            available: z.boolean().optional(),
            applicable: z.boolean().optional(),
            status: z.string().optional(),
          }).optional(),
          nginxCaching: z.object({
            available: z.boolean().optional(),
            status: z.boolean().optional(),
            webServerSettingsUrl: z.string().nullable().optional(),
          }).optional(),
          indexing: z.object({
            status: z.boolean().optional(),
          }).optional(),
          debug: z.object({
            status: z.boolean().optional(),
          }).optional(),
          passwordProtection: z.object({
            available: z.boolean().optional(),
            status: z.boolean().optional(),
          }).optional(),
          vulnerability: z.object({
            available: z.boolean().optional(),
            vulnerable: z.boolean().optional(),
            hasVulnerableDeactivatedPlugins: z.boolean().nullable().optional(),
            hasVulnerableDeactivatedThemes: z.boolean().nullable().optional(),
          }).optional(),
          multipleSitesManagement: z.object({
            applicable: z.boolean().optional(),
          }).optional(),
          clone: z.object({
            applicable: z.boolean().optional(),
            available: z.boolean().optional(),
          }).optional(),
          copyData: z.object({
            applicable: z.boolean().optional(),
            available: z.boolean().optional(),
          }).optional(),
          credentials: z.object({
            available: z.boolean().optional(),
          }).optional(),
          backups: z.object({
            panelBackupsAvailable: z.boolean().optional(),
            wptBackupsAvailable: z.boolean().optional(),
            backupManagerUrl: z.string().nullable().optional(),
          }).optional(),
          fileManager: z.object({
            available: z.boolean().optional(),
            url: z.string().nullable().optional(),
          }).optional(),
          actionLog: z.object({
            available: z.boolean().optional(),
          }).optional(),
          remoteManagement: z.object({
            available: z.boolean().optional(),
          }).optional(),
          synchronizeSiteUrl: z.object({
            available: z.boolean().optional(),
          }).optional(),
          malwareScan: z.object({
            available: z.boolean().optional(),
            url: z.string().nullable().optional(),
          }).optional(),
          php: z.object({
            handler: z.object({
              identifier: z.string().nullable().optional(),
              name: z.string().nullable().optional(),
              version: z.string().nullable().optional(),
            }).optional(),
            unsupported: z.boolean().optional(),
            eoled: z.boolean().optional(),
            settingsUrl: z.string().nullable().optional(),
          }).optional(),
          integrity: z.object({
            available: z.boolean().optional(),
          }).optional(),
          pluginsBlockList: z.object({
            amountOfBlockedPlugins: z.number().optional(),
          }).optional(),
          virtualPatches: z.object({
            status: z.boolean().nullable().optional(),
            available: z.boolean().optional(),
            restrictions: z.array(z.string()).optional(),
            subscription: z.any().nullable().optional(),
          }).optional(),
          vulnerabilityFiltering: z.object({
            status: z.boolean().optional(),
            available: z.boolean().optional(),
          }).optional(),
          wpCli: z.object({
            available: z.boolean().optional(),
          }).optional(),
        }).optional(),
      })).optional(),
  metadata: z.object({
    endpoint: z.string().optional(),
    timestamp: z.string().optional(),
    totalInstallations: z.number().optional(),
    apiVersion: z.string().optional(),
    note: z.string().optional(),
  }).optional(),
});

// Schema for individual WordPress installation (used in components)
export const wordpressInstallationSchema = z.object({
  id: z.number().optional(),
  title: z.string().optional(),
  url: z.string().optional(),
  version: z.string().optional(),
  path: z.string().optional(),
  displayTitle: z.string().optional(),
  installationType: z.string().optional(),
  errorMessage: z.string().nullable().optional(),
  domain: z.object({
    name: z.string().optional(),
    sslRedirectEnabled: z.boolean().optional(),
    ssl: z.object({
      enabled: z.boolean().optional(),
      redirectToHttpsEnabled: z.boolean().optional(),
      urlProtocolHttps: z.boolean().optional(),
      certificate: z.object({
        installed: z.boolean().optional(),
        selfSigned: z.boolean().optional(),
        actual: z.boolean().optional(),
        suitableForDomain: z.boolean().optional(),
        issuerName: z.string().optional(),
      }).optional(),
    }).optional(),
    installationsLimit: z.number().optional(),
    installationsCount: z.number().optional(),
  }).optional(),
  owner: z.object({
    id: z.number().optional(),
    login: z.string().optional(),
    name: z.string().optional(),
  }).optional(),
  status: z.object({
    alive: z.boolean().optional(),
    infected: z.boolean().optional(),
    unsupported: z.boolean().optional(),
    multisite: z.boolean().optional(),
  }).optional(),
  features: z.object({
    updates: z.object({
      applicable: z.boolean().optional(),
      autoUpdatesAvailable: z.boolean().optional(),
      amountOfPluginsWithUpdates: z.number().optional(),
      amountOfThemesWithUpdates: z.number().optional(),
      availableVersion: z.string().optional(),
    }).optional(),
    restorePoint: z.object({
      available: z.boolean().optional(),
      restorePointTimestamp: z.string().nullable().optional(),
      displayTimestamp: z.string().nullable().optional(),
    }).optional(),
    maintenance: z.object({
      status: z.boolean().optional(),
    }).optional(),
    security: z.object({
      status: z.string().optional(),
    }).optional(),
    php: z.object({
      handler: z.object({
        version: z.string().nullable().optional(),
        name: z.string().nullable().optional(),
        identifier: z.string().nullable().optional(),
      }).optional(),
      unsupported: z.boolean().optional(),
      eoled: z.boolean().optional(),
    }).optional(),
    vulnerability: z.object({
      vulnerable: z.boolean().optional(),
      hasVulnerableDeactivatedPlugins: z.boolean().nullable().optional(),
      hasVulnerableDeactivatedThemes: z.boolean().nullable().optional(),
    }).optional(),
    fileManager: z.object({
      available: z.boolean().optional(),
      url: z.string().nullable().optional(),
    }).optional(),
    backups: z.object({
      panelBackupsAvailable: z.boolean().optional(),
      wptBackupsAvailable: z.boolean().optional(),
      backupManagerUrl: z.string().nullable().optional(),
    }).optional(),
    wpCli: z.object({
      available: z.boolean().optional(),
    }).optional(),
    clone: z.object({
      available: z.boolean().optional(),
      applicable: z.boolean().optional(),
    }).optional(),
    remoteManagement: z.object({
      available: z.boolean().optional(),
    }).optional(),
    actionLog: z.object({
      available: z.boolean().optional(),
    }).optional(),
    hotlinkProtection: z.object({
      available: z.boolean().optional(),
      status: z.boolean().optional(),
    }).optional(),
    passwordProtection: z.object({
      available: z.boolean().optional(),
      status: z.boolean().optional(),
    }).optional(),
    nginxCaching: z.object({
      available: z.boolean().optional(),
      status: z.boolean().optional(),
      webServerSettingsUrl: z.string().nullable().optional(),
    }).optional(),
    indexing: z.object({
      status: z.boolean().optional(),
    }).optional(),
    debug: z.object({
      status: z.boolean().optional(),
    }).optional(),
    credentials: z.object({
      available: z.boolean().optional(),
    }).optional(),
  }).optional(),
});

export type WordPressInstancesResponse = z.infer<typeof wordpressInstancesResponseSchema>;
export type WordPressInstallation = z.infer<typeof wordpressInstallationSchema>;
