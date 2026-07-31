# nPanel API  Public vs Protected Procedure Map

Generated from `packages/api` source. Counts are unique procedure **names** bound to `publicProcedure` / `protectedProcedure` / `etimsProcedure`.

## What it takes to call a procedure successfully

### Layer checklist (every request)

1. **Reach the API**  From Landing Page or nPanel Dashboard via same-origin `/api/trpc/<router>.<procedure>` (or Bearer `npanel_sk_*` API key).
2. **Rate limit**  Redis-backed; anonymous / API-key / user buckets (`packages/api/src/trpc.ts`). Fail-open if Redis is down.
3. **API key scope (if using a key)**  Key must include `*` or the exact procedure path; revoked/expired/inactive keys fail.
4. **Procedure type**
   - **publicProcedure**  no login required (still rate-limited; API key scopes still apply if a key is sent).
   - **protectedProcedure**  requires Better Auth session cookie with `user.id`, plus:
     - not `MFA_SETUP_REQUIRED`
     - if MFA required → must be MFA-verified
     - if IP anomaly → must complete `REAUTH_REQUIRED`
5. **Router-level business rules**  many protected routers also require team membership, agency RBAC menu access, or vendor OAuth tokens (checked inside the procedure).

### Auth identity options

| Identity | How | Can call |
|----------|-----|----------|
| Anonymous browser | no cookie | public procedures only |
| Logged-in user | Better Auth session cookie (`credentials: include`) | public + protected (after MFA/reauth gates) |
| API key | `Authorization: Bearer npanel_sk_...` | Impersonates the key owner as a session; key permissions must include `*` or the exact path. Then protected procedures work without a browser cookie. |

### Special cases

- **storefront.***  designed for Landing Page checkout; public, but individual procedures may require cart handoff tokens / payment state.
- **etims.***  uses `etimsProcedure` which is `publicProcedure` only when `ETIMS_CERTIFICATION_PUBLIC=1` (temporary KRA cert mode); otherwise protected.
- **healthCheck** / **privateData** on appRouter root  public health ping vs protected smoke test.

---

## Summary by access class

| Class | Routers | Meaning |
|-------|---------|----------|
| PUBLIC_ONLY | 3 | Every listed procedure is public |
| MIXED | 8 | Some public + some protected |
| PROTECTED_ONLY | 57 | Login (session) required for all |
| ETIMS_TOGGLE | 1 | public only if ETIMS_CERTIFICATION_PUBLIC=1 |

**Totals:** 40 public procedure names, 1051 protected, 31 etims-gated.

## Public & mixed routers (full public procedure lists)

### `domainTransfer`  MIXED (Domains)

**Public:**
- `trpc.domainTransfer.checkTransfer`

**Protected (5):** `createCheckoutRequest`, `deleteTransferRequest`, `getCheckoutResumeContext`, `initiateTransfer`, `listTransferRequests`

**To succeed:** public procedures: no login. Protected procedures: valid session (+ MFA/reauth if flagged) and any team/RBAC checks inside the handler.

### `etims`  ETIMS_TOGGLE (Tax & Reports)

**eTIMS-gated (public only when ETIMS_CERTIFICATION_PUBLIC=1):**
- `trpc.etims.auth.getConfiguration`
- `trpc.etims.branch.getBranchList`
- `trpc.etims.branch.saveBranchInsurance`
- `trpc.etims.branch.saveBranchUser`
- `trpc.etims.branch.saveCustomer`
- `trpc.etims.data.getCodeList`
- `trpc.etims.data.getCustomerList`
- `trpc.etims.data.getItemClassList`
- `trpc.etims.data.getItemClassMeta`
- `trpc.etims.data.getItemClassification`
- `trpc.etims.data.getNoticeList`
- `trpc.etims.data.getNotices`
- `trpc.etims.data.getTaxPayerInfo`
- `trpc.etims.data.listItemClassifications`
- `trpc.etims.data.lookupCustomer`
- `trpc.etims.data.syncItemClassifications`
- `trpc.etims.imports.confirmImportedItem`
- `trpc.etims.imports.getImportedItems`
- `trpc.etims.initialization.initializeDevice`
- `trpc.etims.items.getItemList`
- `trpc.etims.items.saveItem`
- `trpc.etims.items.saveItemComposition`
- `trpc.etims.purchases.getPurchaseTransactions`
- `trpc.etims.purchases.sendPurchaseTransaction`
- `trpc.etims.sales.getInvoiceDetails`
- `trpc.etims.sales.getSalesTransactions`
- `trpc.etims.sales.sendCreditNote`
- `trpc.etims.sales.sendSalesTransaction`
- `trpc.etims.stock.getStockMovements`
- `trpc.etims.stock.saveStockMaster`
- `trpc.etims.stock.sendStockIO`

**To succeed:** normally protected; set ETIMS_CERTIFICATION_PUBLIC=1 only for KRA certification testing.

### `hivelocity`  MIXED (Hosting)

**Public:**
- `trpc.hivelocity.publicGetDedicatedServerPlans`
- `trpc.hivelocity.publicGetFacilities`
- `trpc.hivelocity.publicGetProductOperatingSystems`
- `trpc.hivelocity.publicGetProductOptions`
- `trpc.hivelocity.publicGetVdsPlans`
- `trpc.hivelocity.publicGetVpsPlans`

**Protected (61):** `createSshKey`, `createVpsSnapshot`, `createVpsSnapshotSchedule`, `createVpsVolume`, `deleteSshKey`, `deleteVpsSnapshot`, `deleteVpsSnapshotSchedule`, `deleteVpsVolume`, `devicePowerAction`, `getComputeDeviceById`, `getComputeDevices`, `getCustomerSuspendedVpsContext`, `getDedicatedServerPlans`, `getDeviceDetails`, `getDeviceInitialCreds`, `getDeviceInitialPassword`, `getDeviceIps`, `getDevicePorts`, `getDevicePowerStatus`, `getDeviceReloadInfo`, `getDeviceServices`, `getDevices`, `getFacilities`, `getIpmiWhitelistSupported`, `getMyAllResources`, `getMyDevices`, `getMyVpsInstances`, `getOrderById`, `getProduct`, `getProductOperatingSystems`, `getProductOptions`, `getProducts`, `getTeamMyResources`, `getVdsPlans`, `getVpsDetails`, `getVpsEvents`, `getVpsMetrics`, `getVpsPlans`, `getVpsSnapshotSchedules`, `getVpsSnapshots`, `getVpsUpgrades`, `getVpsVolumeAvailableSizes`, `getVpsVolumes`, `getWsTicket`, `healthCheck`, `listSshKeys`, `listVpsIsos`, `provisionBareMetalDevice`, `provisionComputeDevice`, `reactivateVpsInstance`, `reloadDevice`, `resizeVpsVolume`, `restoreVpsSnapshot`, `suspendVpsInstance`, `updateDevice`, `updateVpsSshKeys`, `vpsAttachIso`, `vpsDetachIso`, `vpsGetConsoleUrl`, `vpsRequestResetPasswordToken`, `vpsResetRootPassword`

**To succeed:** public procedures: no login. Protected procedures: valid session (+ MFA/reauth if flagged) and any team/RBAC checks inside the handler.

### `hivelocityPricingSettings`  MIXED (Hosting)

**Public:**
- `trpc.hivelocityPricingSettings.get`

**Protected (3):** `delete`, `getActivityLogs`, `upsert`

**To succeed:** public procedures: no login. Protected procedures: valid session (+ MFA/reauth if flagged) and any team/RBAC checks inside the handler.

### `kenic`  MIXED (Domains)

**Public:**
- `trpc.kenic.domainCheck.check`

**Protected (15):** `configStatus.get`, `configStatus.inspectTls`, `contactCreate.create`, `domainCreate.create`, `domainList.getAuthCode`, `domainList.info`, `domainList.list`, `domainList.regenerateAuthCode`, `domainList.setTransferLock`, `domainList.updateAuthCode`, `domainList.updateNameservers`, `domainTransfer.request`, `greeting.getGreeting`, `login.login`, `tlds.list`

**To succeed:** public procedures: no login. Protected procedures: valid session (+ MFA/reauth if flagged) and any team/RBAC checks inside the handler.

### `openProvider`  MIXED (Domains)

**Public:**
- `trpc.openProvider.customers.completeContactEmailVerification`
- `trpc.openProvider.domains.checkAvailability`
- `trpc.openProvider.domains.completeTransferFoaConfirmation`
- `trpc.openProvider.healthCheck`

**Protected (39):** `auth.getStatus`, `auth.login`, `auth.validateToken`, `customers.checkEmailVerificationStatus`, `customers.create`, `customers.getAll`, `customers.getByHandle`, `customers.search`, `customers.searchByCompany`, `customers.searchByEmail`, `customers.startEmailVerification`, `customers.update`, `dns.addRecords`, `dns.createZone`, `dns.deleteZone`, `dns.getAllZones`, `dns.getZone`, `dns.removeRecords`, `dns.searchZones`, `dns.updateRecords`, `dns.updateZone`, `domains.delete`, `domains.getAdditionalData`, `domains.getAuthCode`, `domains.getCustomerAdditionalData`, `domains.getPricing`, `domains.list`, `domains.register`, `domains.renew`, `domains.resetAuthCode`, `domains.restore`, `domains.search`, `domains.transfer`, `domains.update`, `tlds.getPopularTlds`, `tlds.getTldByExtension`, `tlds.getTlds`, `tlds.getTldsPost`, `tlds.searchTlds`

**To succeed:** public procedures: no login. Protected procedures: valid session (+ MFA/reauth if flagged) and any team/RBAC checks inside the handler.

### `plesk`  MIXED (Hosting)

**Public:**
- `trpc.plesk.healthCheck.testAll`
- `trpc.plesk.healthCheck.testRestConnection`
- `trpc.plesk.healthCheck.testXmlConnection`

**Protected (120):** `customers.getAll`, `customers.getById`, `customersCreate.create`, `databases.getBySiteId`, `databasesAssign.assign`, `databasesCreate.create`, `databasesDelete.delete`, `databasesSetUser.update`, `dnsCreate.create`, `dnsDelete.delete`, `dnsUpdate.update`, `domainDns.getBySiteId`, `domains.getAll`, `domains.getById`, `emails.getBySiteId`, `emailsCreate.create`, `emailsDelete.delete`, `emailsUpdate.update`, `ftp.cd`, `ftp.createDirectory`, `ftp.deleteDirectory`, `ftp.deleteFile`, `ftp.download`, `ftp.downloadFile`, `ftp.downloadFolder`, `ftp.extractZip`, `ftp.getFeatures`, `ftp.getFileInfo`, `ftp.list`, `ftp.pwd`, `ftp.readFile`, `ftp.rename`, `ftp.testConnection`, `ftp.upload`, `ftp.uploadFile`, `servicePlans.getAll`, `servicePlans.getById`, `subdomains.getByParentDomain`, `subdomainsCreate.create`, `subdomainsDelete.delete`, `subscriptions.getAll`, `subscriptions.getById`, `subscriptions.getByTeamFilterIds`, `subscriptionsCreate.create`, `subscriptionsDelete.delete`, `subscriptionsSuspend.suspend`, `subscriptionsSuspend.unsuspend`, `subscriptionsUpdate.update`, `wordpress.getAll`, `wordpress.getById`, `wpBackgroundTasks.cancelByUrl`, `wpBackgroundTasks.getByUrl`, `wpCredentials.get`, `wpCredentials.getAccount`, `wpCredentials.updateAccount`, `wpFeatures.acceptSmartPhpUpdate`, `wpFeatures.applySmartUpdate`, `wpFeatures.applyVirtualPatches`, `wpFeatures.createBackup`, `wpFeatures.deleteBackup`, `wpFeatures.discardSmartPhpUpdate`, `wpFeatures.discardSmartUpdate`, `wpFeatures.getBackups`, `wpFeatures.getBackupsList`, `wpFeatures.getBackupsMeta`, `wpFeatures.getDebugSettings`, `wpFeatures.getHotlinkProtectionSettings`, `wpFeatures.getIntegrityInfo`, `wpFeatures.getLicenseInfo`, `wpFeatures.getMaintenanceSettings`, `wpFeatures.getMaintenanceTemplateUrl`, `wpFeatures.getPasswordProtection`, `wpFeatures.getSecurityMeasures`, `wpFeatures.getSecurityPolicies`, `wpFeatures.getSecurityStatus`, `wpFeatures.getSmartPhpUpdateResult`, `wpFeatures.getSmartPhpUpdateStub`, `wpFeatures.getSmartUpdateResult`, `wpFeatures.getUpdatesChecker`, `wpFeatures.getVulnerabilities`, `wpFeatures.getWpCronTakeoverMeta`, `wpFeatures.refreshLicenseInfo`, `wpFeatures.resetHotlinkProtectionSettings`, `wpFeatures.resolveSecurityMeasure`, `wpFeatures.restoreBackup`, `wpFeatures.restoreMaintenanceTemplate`, `wpFeatures.revertSecurityMeasure`, `wpFeatures.runSmartPhpUpdate`, `wpFeatures.startSecurityCheck`, `wpFeatures.startUpdatesCheck`, `wpFeatures.startVulnerabilityCheck`, `wpFeatures.toggleIndexing`, `wpFeatures.toggleMaintenanceMode`, `wpFeatures.toggleNginxCaching`, `wpFeatures.toggleSmartUpdate`, `wpFeatures.updateDebugSettings`, `wpFeatures.updateDebugStatus`, `wpFeatures.updateHotlinkProtectionSettings`, `wpFeatures.updateHotlinkProtectionStatus`, `wpFeatures.updateMaintenanceSettings`, `wpFeatures.updatePasswordProtection`, `wpFeatures.updateSecurityPolicies`, `wpFeatures.updateVulnerabilityFiltering`, `wpFeatures.updateWpCronTakeover`, `wpInstall.install`, `wpPluginsAutoupdate.update`, `wpPluginsDelete.delete`, `wpPluginsInstall.install`, `wpPluginsList.getByInstallationId`, `wpPluginsList.getCatalog`, `wpPluginsStatus.setStatus`, `wpThemesAutoupdate.update`, `wpThemesDelete.delete`, `wpThemesInstall.install`, `wpThemesList.catalog`, `wpThemesList.installed`, `wpThemesStatus.setStatus`, `wpUpdatesInfo.get`, `wpUpdatesSettings.get`, `wpUpdatesSettings.update`

**To succeed:** public procedures: no login. Protected procedures: valid session (+ MFA/reauth if flagged) and any team/RBAC checks inside the handler.

### `products`  MIXED (Billing)

**Public:**
- `trpc.products.getAll`
- `trpc.products.getCreativesDesignPlansForPricing`
- `trpc.products.getDigitalMarketingPlansForUpsell`
- `trpc.products.getEmailHostingPlansForPricing`
- `trpc.products.getHostingPlansForPricing`
- `trpc.products.getMediaBuyingPlansForPricing`
- `trpc.products.getNiscEmailMarketingPlansForPricing`
- `trpc.products.getPlansForPricingBySlug`
- `trpc.products.getSeoPlansForPricing`
- `trpc.products.getWordPressPlansForPricing`

**Protected (17):** `create`, `createPlan`, `createPlanUsage`, `delete`, `deletePlan`, `deletePlanUsage`, `getAddOnsForProduct`, `getById`, `getDefaultPlanIdForProduct`, `getHostingProductsForUpsell`, `getPlanById`, `getPlanUsageById`, `listPlanUsages`, `unregisterFromKra`, `update`, `updatePlan`, `updatePlanUsage`

**To succeed:** public procedures: no login. Protected procedures: valid session (+ MFA/reauth if flagged) and any team/RBAC checks inside the handler.

### `publicPricing`  PUBLIC_ONLY (Billing)

**Public:**
- `trpc.publicPricing.convertPricesPublic`
- `trpc.publicPricing.getDefaultMarginConfig`
- `trpc.publicPricing.getExchangeRatesPublic`

**To succeed:** no login; stay under rate limits; Landing Page may still send cart/payment tokens where required.

### `storefront`  PUBLIC_ONLY (Public Storefront)

**Public:**
- `trpc.storefront.auth.checkEmail`
- `trpc.storefront.auth.register`
- `trpc.storefront.cart.createHandoff`
- `trpc.storefront.cart.quote`
- `trpc.storefront.orders.createFromPayment`
- `trpc.storefront.payment.initiateStkPush`
- `trpc.storefront.payment.pollPaymentStatus`
- `trpc.storefront.payment.queryStkPush`

**To succeed:** no login; stay under rate limits; Landing Page may still send cart/payment tokens where required.

### `teams`  MIXED (Teams & Access)

**Public:**
- `trpc.teams.getInviteByCode`

**Protected (19):** `acceptInvite`, `addMember`, `checkSlugAvailable`, `create`, `delete`, `deleteInvite`, `getAll`, `getById`, `getHostingSubscriptions`, `getInvites`, `getInvitesAsMember`, `getMembers`, `getMembersAsMember`, `getTeamIdBySlug`, `getUserTeams`, `inviteMember`, `removeMember`, `update`, `updateLastAccessedTeam`

**To succeed:** public procedures: no login. Protected procedures: valid session (+ MFA/reauth if flagged) and any team/RBAC checks inside the handler.

### `whois`  PUBLIC_ONLY (Domains)

**Public:**
- `trpc.whois.bulkLookup`
- `trpc.whois.lookup`

**To succeed:** no login; stay under rate limits; Landing Page may still send cart/payment tokens where required.

## Protected-only routers (all procedures require login)

| Domain | Router | Protected procedures |
|--------|--------|----------------------|
| Ads & Social | `googleAds` | 18 |
| Ads & Social | `instagramAds` | 14 |
| Ads & Social | `linkedInAds` | 28 |
| Ads & Social | `metaAds` | 19 |
| Ads & Social | `socialMediaMarketing` | 45 |
| Billing | `clientSubscriptions` | 40 |
| Billing | `currency` | 7 |
| Billing | `invoicing` | 21 |
| Billing | `niscServiceOrders` | 6 |
| Billing | `orders` | 9 |
| Billing | `paymentGateway` | 3 |
| Billing | `paymentTransactions` | 3 |
| Billing | `quotations` | 8 |
| Billing | `serviceSubscriptions` | 3 |
| Billing | `subscriptionUsage` | 6 |
| Billing | `teamBilling` | 5 |
| Creatives & AI | `ai` | 6 |
| Creatives & AI | `backgroundRemover` | 5 |
| Creatives & AI | `creativeAssets` | 22 |
| Creatives & AI | `creativeBriefs` | 7 |
| Creatives & AI | `imageGenerator` | 6 |
| Creatives & AI | `imageGenStudio` | 20 |
| Creatives & AI | `stabilityAi` | 2 |
| Creatives & AI | `zeepoAgent` | 22 |
| Creatives & AI | `zeepoCanvas` | 10 |
| Domains | `aiDomainSearch` | 1 |
| Domains | `domains` | 8 |
| Domains | `nameserverGroups` | 7 |
| Domains | `tldSettings` | 9 |
| Email | `emailBuilder` | 8 |
| Email | `emailBuilderLibrary` | 3 |
| Email | `emailMarketing` | 31 |
| Email | `niscEmailBuilder` | 25 |
| Email | `niscEmailMarketing` | 40 |
| Hosting | `hosting` | 6 |
| Hosting | `hostingPlans` | 5 |
| Hosting | `niscBackup` | 129 |
| Hosting | `wordpressSubscriptions` | 5 |
| Other | `agency-rbac` | 0 |
| Other | `nisc-service-orders-schemas` | 0 |
| Support & Utils | `cronWorkflowRun` | 7 |
| Support & Utils | `ipRecords` | 1 |
| Support & Utils | `notifications` | 9 |
| Support & Utils | `objectStorage` | 4 |
| Support & Utils | `pagespeedInsights` | 1 |
| Support & Utils | `seoReports` | 7 |
| Support & Utils | `tickets` | 11 |
| Support & Utils | `webDesignQuotes` | 2 |
| Tax & Reports | `digitax` | 25 |
| Tax & Reports | `niscReports` | 31 |
| Tax & Reports | `reports` | 7 |
| Teams & Access | `agencyRbac` | 11 |
| Teams & Access | `apiKeys` | 5 |
| Teams & Access | `clients` | 18 |
| Teams & Access | `manageUsers` | 9 |
| Teams & Access | `user` | 4 |
| Teams & Access | `userProfile` | 8 |

### Full protected procedure names by router

<details>
<summary><code>googleAds</code>  18 procedures (Ads & Social)</summary>

- `trpc.googleAds.accounts.getAccountDetails`
- `trpc.googleAds.accounts.listAccessibleAccounts`
- `trpc.googleAds.adGroups.listAdGroups`
- `trpc.googleAds.ads.listAds`
- `trpc.googleAds.ads.listAdsBulk`
- `trpc.googleAds.auth.generateAuthUrl`
- `trpc.googleAds.auth.generateToken`
- `trpc.googleAds.auth.getStoredCredentials`
- `trpc.googleAds.auth.revokeToken`
- `trpc.googleAds.campaigns.getBulkAdGroupTargeting`
- `trpc.googleAds.campaigns.getCampaignDetails`
- `trpc.googleAds.campaigns.getCampaignTargeting`
- `trpc.googleAds.campaigns.listCampaigns`
- `trpc.googleAds.insights.getBreakdowns`
- `trpc.googleAds.insights.getDailyPerformance`
- `trpc.googleAds.insights.getKeywordsPerformance`
- `trpc.googleAds.insights.getNetworkBreakdown`
- `trpc.googleAds.insights.getTimeOfDayBreakdown`

</details>

<details>
<summary><code>instagramAds</code>  14 procedures (Ads & Social)</summary>

- `trpc.instagramAds.accounts.getAccountDetails`
- `trpc.instagramAds.accounts.getConnectedInstagramAccounts`
- `trpc.instagramAds.accounts.listAdAccounts`
- `trpc.instagramAds.adSets.getAdSetDetails`
- `trpc.instagramAds.adSets.getBulkTargetingSentenceLines`
- `trpc.instagramAds.adSets.getTargetingSentenceLines`
- `trpc.instagramAds.adSets.listAdSets`
- `trpc.instagramAds.ads.getAdDetails`
- `trpc.instagramAds.ads.listAds`
- `trpc.instagramAds.ads.listCampaignAds`
- `trpc.instagramAds.campaigns.getCampaignDetails`
- `trpc.instagramAds.campaigns.listCampaigns`
- `trpc.instagramAds.insights.getBreakdowns`
- `trpc.instagramAds.insights.getDailyPerformance`

</details>

<details>
<summary><code>linkedInAds</code>  28 procedures (Ads & Social)</summary>

- `trpc.linkedInAds.accounts.getAccountDetails`
- `trpc.linkedInAds.accounts.listAdAccounts`
- `trpc.linkedInAds.auth.generateAuthUrl`
- `trpc.linkedInAds.auth.getStoredCredentials`
- `trpc.linkedInAds.campaignGroups.getCampaignGroupDetails`
- `trpc.linkedInAds.campaignGroups.listCampaignGroups`
- `trpc.linkedInAds.campaigns.getCampaignDetails`
- `trpc.linkedInAds.campaigns.listCampaigns`
- `trpc.linkedInAds.campaigns.resolveTargetingCriteria`
- `trpc.linkedInAds.campaigns.resolveTargetingCriteriaBulk`
- `trpc.linkedInAds.creatives.getCreativeDetails`
- `trpc.linkedInAds.creatives.getCreativeInsights`
- `trpc.linkedInAds.creatives.getCreativePreview`
- `trpc.linkedInAds.creatives.listAccountCreatives`
- `trpc.linkedInAds.creatives.listCreatives`
- `trpc.linkedInAds.insights.getBreakdown`
- `trpc.linkedInAds.insights.getDailyPerformance`
- `trpc.linkedInAds.standardizedData.getDegrees`
- `trpc.linkedInAds.standardizedData.getDegreesByIds`
- `trpc.linkedInAds.standardizedData.getFieldsOfStudy`
- `trpc.linkedInAds.standardizedData.getFieldsOfStudyByIds`
- `trpc.linkedInAds.standardizedData.getFunctions`
- `trpc.linkedInAds.standardizedData.getIndustries`
- `trpc.linkedInAds.standardizedData.getSeniorities`
- `trpc.linkedInAds.standardizedData.getSkills`
- `trpc.linkedInAds.standardizedData.getSkillsByIds`
- `trpc.linkedInAds.standardizedData.getTitles`
- `trpc.linkedInAds.standardizedData.getTitlesByIds`

</details>

<details>
<summary><code>metaAds</code>  19 procedures (Ads & Social)</summary>

- `trpc.metaAds.accounts.getAccountDetails`
- `trpc.metaAds.accounts.getConnectedInstagramAccounts`
- `trpc.metaAds.accounts.listAdAccounts`
- `trpc.metaAds.adSets.getAdSetDetails`
- `trpc.metaAds.adSets.getBulkTargetingSentenceLines`
- `trpc.metaAds.adSets.getTargetingSentenceLines`
- `trpc.metaAds.adSets.listAdSets`
- `trpc.metaAds.ads.getAdDetails`
- `trpc.metaAds.ads.listAds`
- `trpc.metaAds.ads.listCampaignAds`
- `trpc.metaAds.auth.getStoredCredentials`
- `trpc.metaAds.campaigns.getCampaignDetails`
- `trpc.metaAds.campaigns.listCampaigns`
- `trpc.metaAds.insights.getAnalysisStatus`
- `trpc.metaAds.insights.getBreakdowns`
- `trpc.metaAds.insights.getDailyPerformance`
- `trpc.metaAds.insights.getLatestAnalysis`
- `trpc.metaAds.insights.listAnalyses`
- `trpc.metaAds.insights.triggerAiAnalysis`

</details>

<details>
<summary><code>socialMediaMarketing</code>  45 procedures (Ads & Social)</summary>

- `trpc.socialMediaMarketing.instagram.auth.disconnect`
- `trpc.socialMediaMarketing.instagram.auth.generateAuthUrl`
- `trpc.socialMediaMarketing.instagram.auth.generateToken`
- `trpc.socialMediaMarketing.instagram.auth.getProfile`
- `trpc.socialMediaMarketing.instagram.auth.getStoredCredentials`
- `trpc.socialMediaMarketing.instagram.auth.refreshToken`
- `trpc.socialMediaMarketing.linkedin.auth.generateAuthUrl`
- `trpc.socialMediaMarketing.linkedin.auth.generateToken`
- `trpc.socialMediaMarketing.linkedin.auth.getStoredCredentials`
- `trpc.socialMediaMarketing.linkedin.auth.refreshToken`
- `trpc.socialMediaMarketing.linkedin.contentCalendar.create`
- `trpc.socialMediaMarketing.linkedin.contentCalendar.delete`
- `trpc.socialMediaMarketing.linkedin.contentCalendar.deleteMediaItem`
- `trpc.socialMediaMarketing.linkedin.contentCalendar.getActivityLogs`
- `trpc.socialMediaMarketing.linkedin.contentCalendar.getAll`
- `trpc.socialMediaMarketing.linkedin.contentCalendar.getById`
- `trpc.socialMediaMarketing.linkedin.contentCalendar.update`
- `trpc.socialMediaMarketing.linkedin.contentCalendar.updateMediaItem`
- `trpc.socialMediaMarketing.linkedin.pageContent.getContent`
- `trpc.socialMediaMarketing.linkedin.pageContent.publishPost`
- `trpc.socialMediaMarketing.linkedin.pagesList.getOrganization`
- `trpc.socialMediaMarketing.linkedin.pagesList.getOrganizations`
- `trpc.socialMediaMarketing.linkedin.pagesList.getPageTokenId`
- `trpc.socialMediaMarketing.meta.auth.generateAuthUrl`
- `trpc.socialMediaMarketing.meta.auth.generateToken`
- `trpc.socialMediaMarketing.meta.auth.getPageToken`
- `trpc.socialMediaMarketing.meta.auth.getStoredCredentials`
- `trpc.socialMediaMarketing.meta.contentCalendar.create`
- `trpc.socialMediaMarketing.meta.contentCalendar.delete`
- `trpc.socialMediaMarketing.meta.contentCalendar.deleteMediaItem`
- `trpc.socialMediaMarketing.meta.contentCalendar.getActivityLogs`
- `trpc.socialMediaMarketing.meta.contentCalendar.getAll`
- `trpc.socialMediaMarketing.meta.contentCalendar.getById`
- `trpc.socialMediaMarketing.meta.contentCalendar.update`
- `trpc.socialMediaMarketing.meta.contentCalendar.updateMediaItem`
- `trpc.socialMediaMarketing.meta.pageContent.getContent`
- `trpc.socialMediaMarketing.meta.pageContent.getEvents`
- `trpc.socialMediaMarketing.meta.pageContent.getPhotos`
- `trpc.socialMediaMarketing.meta.pageContent.getPosts`
- `trpc.socialMediaMarketing.meta.pageContent.getVideos`
- `trpc.socialMediaMarketing.meta.pageContent.publishPost`
- `trpc.socialMediaMarketing.meta.pagesList.getPage`
- `trpc.socialMediaMarketing.meta.pagesList.getPageInsights`
- `trpc.socialMediaMarketing.meta.pagesList.getPageTokenId`
- `trpc.socialMediaMarketing.meta.pagesList.getPages`

</details>

<details>
<summary><code>clientSubscriptions</code>  40 procedures (Billing)</summary>

- `trpc.clientSubscriptions.cancel`
- `trpc.clientSubscriptions.create`
- `trpc.clientSubscriptions.createMediaBuyingSubscription`
- `trpc.clientSubscriptions.createSeoSubscription`
- `trpc.clientSubscriptions.delete`
- `trpc.clientSubscriptions.getAll`
- `trpc.clientSubscriptions.getById`
- `trpc.clientSubscriptions.getByOpenProviderId`
- `trpc.clientSubscriptions.getCommissionEntries`
- `trpc.clientSubscriptions.getDomainSubscriptions`
- `trpc.clientSubscriptions.getDomainsProductId`
- `trpc.clientSubscriptions.getHasLinkedSubscriptionByHivelocityDeviceId`
- `trpc.clientSubscriptions.getHasLinkedSubscriptionByPleskId`
- `trpc.clientSubscriptions.getHivelocityDeviceIdsWithLinkedSubscription`
- `trpc.clientSubscriptions.getLinkedMediaBuyingSubscriptionByAdAccount`
- `trpc.clientSubscriptions.getLinkedSeoSubscriptionByResource`
- `trpc.clientSubscriptions.getMediaBuyingProductForSubscription`
- `trpc.clientSubscriptions.getOpenProviderIdsWithSubscriptions`
- `trpc.clientSubscriptions.getPleskSubscriptionIdsWithLinkedSubscription`
- `trpc.clientSubscriptions.getSeoProductForSubscription`
- `trpc.clientSubscriptions.getTeamHostingSummary`
- `trpc.clientSubscriptions.getTeamLiveDomainsSummary`
- `trpc.clientSubscriptions.getTeamSubscriptionSummary`
- `trpc.clientSubscriptions.getTransferProductId`
- `trpc.clientSubscriptions.listForAgency`
- `trpc.clientSubscriptions.listForTeam`
- `trpc.clientSubscriptions.listForTeamCreativesDesign`
- `trpc.clientSubscriptions.listForTeamDomains`
- `trpc.clientSubscriptions.listForTeamEmailHosting`
- `trpc.clientSubscriptions.listForTeamHosting`
- `trpc.clientSubscriptions.listForTeamNiscEmailMarketing`
- `trpc.clientSubscriptions.listForTeamSeoReports`
- `trpc.clientSubscriptions.listForTeamWordPress`
- `trpc.clientSubscriptions.listLinkedAdAccountsForTeam`
- `trpc.clientSubscriptions.listLinkedAdAccountsForTeamDetailed`
- `trpc.clientSubscriptions.recordCommission`
- `trpc.clientSubscriptions.renew`
- `trpc.clientSubscriptions.sendRenewalEmail`
- `trpc.clientSubscriptions.update`
- `trpc.clientSubscriptions.updateCommissionEntry`

</details>

<details>
<summary><code>currency</code>  7 procedures (Billing)</summary>

- `trpc.currency.convertPrices`
- `trpc.currency.getApiConfigStatus`
- `trpc.currency.getApiUsageStatus`
- `trpc.currency.getCacheStatus`
- `trpc.currency.getExchangeRates`
- `trpc.currency.getSupportedCurrencies`
- `trpc.currency.refreshExchangeRates`

</details>

<details>
<summary><code>invoicing</code>  21 procedures (Billing)</summary>

- `trpc.invoicing.bulkDeleteInvoices`
- `trpc.invoicing.create`
- `trpc.invoicing.deleteCreditNote`
- `trpc.invoicing.deleteInvoice`
- `trpc.invoicing.deleteTransaction`
- `trpc.invoicing.getById`
- `trpc.invoicing.getCreditNoteById`
- `trpc.invoicing.getNextInvoiceNumber`
- `trpc.invoicing.issueCreditNote`
- `trpc.invoicing.list`
- `trpc.invoicing.listCreditNotes`
- `trpc.invoicing.listTransactions`
- `trpc.invoicing.recordTransaction`
- `trpc.invoicing.resendEmailReminder`
- `trpc.invoicing.retryCreditNoteKraSync`
- `trpc.invoicing.retryKraSync`
- `trpc.invoicing.submitInvoice`
- `trpc.invoicing.update`
- `trpc.invoicing.updatePayment`
- `trpc.invoicing.updateStatus`
- `trpc.invoicing.upsertCreditNote`

</details>

<details>
<summary><code>niscServiceOrders</code>  6 procedures (Billing)</summary>

- `trpc.niscServiceOrders.create`
- `trpc.niscServiceOrders.createFromPayment`
- `trpc.niscServiceOrders.getAll`
- `trpc.niscServiceOrders.getById`
- `trpc.niscServiceOrders.getSummary`
- `trpc.niscServiceOrders.retry`

</details>

<details>
<summary><code>orders</code>  9 procedures (Billing)</summary>

- `trpc.orders.checkTeamBillingSettings`
- `trpc.orders.createHostingOrder`
- `trpc.orders.createServiceOrder`
- `trpc.orders.delete`
- `trpc.orders.getAll`
- `trpc.orders.getById`
- `trpc.orders.getSummary`
- `trpc.orders.getSummaryByTeam`
- `trpc.orders.getTeamDomains`

</details>

<details>
<summary><code>paymentGateway</code>  3 procedures (Billing)</summary>

- `trpc.paymentGateway.mpesa.getPaymentStatusByCheckoutId`
- `trpc.paymentGateway.mpesa.initiateStkPush`
- `trpc.paymentGateway.mpesa.queryStkPush`

</details>

<details>
<summary><code>paymentTransactions</code>  3 procedures (Billing)</summary>

- `trpc.paymentTransactions.getById`
- `trpc.paymentTransactions.list`
- `trpc.paymentTransactions.recordManual`

</details>

<details>
<summary><code>quotations</code>  8 procedures (Billing)</summary>

- `trpc.quotations.create`
- `trpc.quotations.deleteQuotation`
- `trpc.quotations.getById`
- `trpc.quotations.getNextQuotationNumber`
- `trpc.quotations.list`
- `trpc.quotations.sendQuotationEmail`
- `trpc.quotations.update`
- `trpc.quotations.updateStatus`

</details>

<details>
<summary><code>serviceSubscriptions</code>  3 procedures (Billing)</summary>

- `trpc.serviceSubscriptions.getAll`
- `trpc.serviceSubscriptions.getByHostingSubscriptionId`
- `trpc.serviceSubscriptions.linkToSubscription`

</details>

<details>
<summary><code>subscriptionUsage</code>  6 procedures (Billing)</summary>

- `trpc.subscriptionUsage.addCredits`
- `trpc.subscriptionUsage.getOrCreateUsage`
- `trpc.subscriptionUsage.getUsageById`
- `trpc.subscriptionUsage.listActivityLogs`
- `trpc.subscriptionUsage.listForSubscription`
- `trpc.subscriptionUsage.setCredits`

</details>

<details>
<summary><code>teamBilling</code>  5 procedures (Billing)</summary>

- `trpc.teamBilling.delete`
- `trpc.teamBilling.getActivityLog`
- `trpc.teamBilling.getByTeam`
- `trpc.teamBilling.listTeams`
- `trpc.teamBilling.upsert`

</details>

<details>
<summary><code>ai</code>  6 procedures (Creatives & AI)</summary>

- `trpc.ai.chat.delete`
- `trpc.ai.chat.escalate`
- `trpc.ai.chat.sendMessage`
- `trpc.ai.chat.start`
- `trpc.ai.history.getById`
- `trpc.ai.history.getHistory`

</details>

<details>
<summary><code>backgroundRemover</code>  5 procedures (Creatives & AI)</summary>

- `trpc.backgroundRemover.deleteGeneration`
- `trpc.backgroundRemover.getGenerations`
- `trpc.backgroundRemover.removeBackground`
- `trpc.backgroundRemover.startBackgroundRemoval`
- `trpc.backgroundRemover.updateGenerationAfterUpload`

</details>

<details>
<summary><code>creativeAssets</code>  22 procedures (Creatives & AI)</summary>

- `trpc.creativeAssets.addComment`
- `trpc.creativeAssets.approveVersionInternally`
- `trpc.creativeAssets.approveVersionPublicly`
- `trpc.creativeAssets.archive`
- `trpc.creativeAssets.create`
- `trpc.creativeAssets.deleteComment`
- `trpc.creativeAssets.getAll`
- `trpc.creativeAssets.getById`
- `trpc.creativeAssets.getByTeam`
- `trpc.creativeAssets.getComments`
- `trpc.creativeAssets.grantPermissions`
- `trpc.creativeAssets.listAiImageAnalyses`
- `trpc.creativeAssets.makeVersionPrivate`
- `trpc.creativeAssets.makeVersionPublic`
- `trpc.creativeAssets.rejectVersionInternally`
- `trpc.creativeAssets.rejectVersionPublicly`
- `trpc.creativeAssets.runAiImageAnalysis`
- `trpc.creativeAssets.unarchive`
- `trpc.creativeAssets.update`
- `trpc.creativeAssets.updateComment`
- `trpc.creativeAssets.updateVersionStatus`
- `trpc.creativeAssets.uploadVersion`

</details>

<details>
<summary><code>creativeBriefs</code>  7 procedures (Creatives & AI)</summary>

- `trpc.creativeBriefs.create`
- `trpc.creativeBriefs.delete`
- `trpc.creativeBriefs.getAll`
- `trpc.creativeBriefs.getById`
- `trpc.creativeBriefs.listUsersForApprover`
- `trpc.creativeBriefs.update`
- `trpc.creativeBriefs.updateStatus`

</details>

<details>
<summary><code>imageGenerator</code>  6 procedures (Creatives & AI)</summary>

- `trpc.imageGenerator.deleteGeneration`
- `trpc.imageGenerator.generateImage`
- `trpc.imageGenerator.getGenerationById`
- `trpc.imageGenerator.getGenerations`
- `trpc.imageGenerator.startGeneration`
- `trpc.imageGenerator.updateVariationAfterUpload`

</details>

<details>
<summary><code>imageGenStudio</code>  20 procedures (Creatives & AI)</summary>

- `trpc.imageGenStudio.ai.generateImage`
- `trpc.imageGenStudio.ai.removeBg`
- `trpc.imageGenStudio.ai.updateGenerationAfterUpload`
- `trpc.imageGenStudio.aiGenerations.delete`
- `trpc.imageGenStudio.aiGenerations.list`
- `trpc.imageGenStudio.images.list`
- `trpc.imageGenStudio.projects.create`
- `trpc.imageGenStudio.projects.delete`
- `trpc.imageGenStudio.projects.duplicate`
- `trpc.imageGenStudio.projects.get`
- `trpc.imageGenStudio.projects.list`
- `trpc.imageGenStudio.projects.update`
- `trpc.imageGenStudio.templates.create`
- `trpc.imageGenStudio.templates.delete`
- `trpc.imageGenStudio.templates.get`
- `trpc.imageGenStudio.templates.list`
- `trpc.imageGenStudio.templates.update`
- `trpc.imageGenStudio.uploads.create`
- `trpc.imageGenStudio.uploads.delete`
- `trpc.imageGenStudio.uploads.list`

</details>

<details>
<summary><code>stabilityAi</code>  2 procedures (Creatives & AI)</summary>

- `trpc.stabilityAi.generate`
- `trpc.stabilityAi.removeBackground`

</details>

<details>
<summary><code>zeepoAgent</code>  22 procedures (Creatives & AI)</summary>

- `trpc.zeepoAgent.billing.getTokenBalance`
- `trpc.zeepoAgent.billing.listPurchasePlans`
- `trpc.zeepoAgent.billing.listTokenActivity`
- `trpc.zeepoAgent.chat.editImage`
- `trpc.zeepoAgent.chat.generateTitle`
- `trpc.zeepoAgent.chat.sendMessage`
- `trpc.zeepoAgent.generate.getGeneration`
- `trpc.zeepoAgent.generate.listBySession`
- `trpc.zeepoAgent.imageEdits.editText`
- `trpc.zeepoAgent.imageEdits.eraseObject`
- `trpc.zeepoAgent.imageEdits.generateVariations`
- `trpc.zeepoAgent.imageEdits.listEditHistory`
- `trpc.zeepoAgent.imageEdits.saveEditedImage`
- `trpc.zeepoAgent.imageEdits.styleTransfer`
- `trpc.zeepoAgent.imageEdits.swapBackground`
- `trpc.zeepoAgent.imageEdits.upscaleImage`
- `trpc.zeepoAgent.sessions.create`
- `trpc.zeepoAgent.sessions.delete`
- `trpc.zeepoAgent.sessions.get`
- `trpc.zeepoAgent.sessions.list`
- `trpc.zeepoAgent.sessions.updateTitle`
- `trpc.zeepoAgent.skills.list`

</details>

<details>
<summary><code>zeepoCanvas</code>  10 procedures (Creatives & AI)</summary>

- `trpc.zeepoCanvas.generate.getGeneration`
- `trpc.zeepoCanvas.generate.getGenerationsByNode`
- `trpc.zeepoCanvas.generate.start`
- `trpc.zeepoCanvas.models.getModels`
- `trpc.zeepoCanvas.projects.create`
- `trpc.zeepoCanvas.projects.delete`
- `trpc.zeepoCanvas.projects.duplicate`
- `trpc.zeepoCanvas.projects.get`
- `trpc.zeepoCanvas.projects.list`
- `trpc.zeepoCanvas.projects.update`

</details>

<details>
<summary><code>aiDomainSearch</code>  1 procedures (Domains)</summary>

- `trpc.aiDomainSearch.generateNameIdeas`

</details>

<details>
<summary><code>domains</code>  8 procedures (Domains)</summary>

- `trpc.domains.getByDomainName`
- `trpc.domains.getById`
- `trpc.domains.getByTeam`
- `trpc.domains.getByUser`
- `trpc.domains.linkToTeam`
- `trpc.domains.unlinkFromTeam`
- `trpc.domains.updateNotes`
- `trpc.domains.updateTeam`

</details>

<details>
<summary><code>nameserverGroups</code>  7 procedures (Domains)</summary>

- `trpc.nameserverGroups.create`
- `trpc.nameserverGroups.delete`
- `trpc.nameserverGroups.get`
- `trpc.nameserverGroups.getActivityLogs`
- `trpc.nameserverGroups.list`
- `trpc.nameserverGroups.setDefault`
- `trpc.nameserverGroups.update`

</details>

<details>
<summary><code>tldSettings</code>  9 procedures (Domains)</summary>

- `trpc.tldSettings.bulkDelete`
- `trpc.tldSettings.create`
- `trpc.tldSettings.delete`
- `trpc.tldSettings.get`
- `trpc.tldSettings.getActivityLogs`
- `trpc.tldSettings.getDefault`
- `trpc.tldSettings.list`
- `trpc.tldSettings.setDefault`
- `trpc.tldSettings.update`

</details>

<details>
<summary><code>emailBuilder</code>  8 procedures (Email)</summary>

- `trpc.emailBuilder.create`
- `trpc.emailBuilder.delete`
- `trpc.emailBuilder.duplicate`
- `trpc.emailBuilder.generateWithAi`
- `trpc.emailBuilder.get`
- `trpc.emailBuilder.getAiStatus`
- `trpc.emailBuilder.list`
- `trpc.emailBuilder.update`

</details>

<details>
<summary><code>emailBuilderLibrary</code>  3 procedures (Email)</summary>

- `trpc.emailBuilderLibrary.createFromUpload`
- `trpc.emailBuilderLibrary.delete`
- `trpc.emailBuilderLibrary.list`

</details>

<details>
<summary><code>emailMarketing</code>  31 procedures (Email)</summary>

- `trpc.emailMarketing.audiences.addContact`
- `trpc.emailMarketing.audiences.addContactsBulk`
- `trpc.emailMarketing.audiences.create`
- `trpc.emailMarketing.audiences.delete`
- `trpc.emailMarketing.audiences.deleteAllContacts`
- `trpc.emailMarketing.audiences.deleteContact`
- `trpc.emailMarketing.audiences.getById`
- `trpc.emailMarketing.audiences.list`
- `trpc.emailMarketing.audiences.listContacts`
- `trpc.emailMarketing.audiences.update`
- `trpc.emailMarketing.audiences.updateContact`
- `trpc.emailMarketing.campaigns.addRecipients`
- `trpc.emailMarketing.campaigns.cancel`
- `trpc.emailMarketing.campaigns.create`
- `trpc.emailMarketing.campaigns.delete`
- `trpc.emailMarketing.campaigns.getById`
- `trpc.emailMarketing.campaigns.list`
- `trpc.emailMarketing.campaigns.listRecipients`
- `trpc.emailMarketing.campaigns.send`
- `trpc.emailMarketing.campaigns.update`
- `trpc.emailMarketing.domains.create`
- `trpc.emailMarketing.domains.delete`
- `trpc.emailMarketing.domains.getById`
- `trpc.emailMarketing.domains.list`
- `trpc.emailMarketing.domains.update`
- `trpc.emailMarketing.domains.verify`
- `trpc.emailMarketing.emailEvents.getById`
- `trpc.emailMarketing.emailEvents.getCampaignSummary`
- `trpc.emailMarketing.emailEvents.getGlobalEvents`
- `trpc.emailMarketing.emailEvents.getTopClickedLinks`
- `trpc.emailMarketing.emailEvents.list`

</details>

<details>
<summary><code>niscEmailBuilder</code>  25 procedures (Email)</summary>

- `trpc.niscEmailBuilder.brand.previewFromWebsite`
- `trpc.niscEmailBuilder.brandKit.create`
- `trpc.niscEmailBuilder.brandKit.list`
- `trpc.niscEmailBuilder.chat.approveBuild`
- `trpc.niscEmailBuilder.chat.generateVariation`
- `trpc.niscEmailBuilder.chat.getRevisionUndoState`
- `trpc.niscEmailBuilder.chat.jobStatus`
- `trpc.niscEmailBuilder.chat.redoAiRevision`
- `trpc.niscEmailBuilder.chat.retryHtmlBuild`
- `trpc.niscEmailBuilder.chat.selectVariation`
- `trpc.niscEmailBuilder.chat.sendMessage`
- `trpc.niscEmailBuilder.chat.startBuild`
- `trpc.niscEmailBuilder.chat.undoAiRevision`
- `trpc.niscEmailBuilder.design.create`
- `trpc.niscEmailBuilder.design.delete`
- `trpc.niscEmailBuilder.design.duplicate`
- `trpc.niscEmailBuilder.design.exportHtml`
- `trpc.niscEmailBuilder.design.get`
- `trpc.niscEmailBuilder.design.list`
- `trpc.niscEmailBuilder.design.restoreVersion`
- `trpc.niscEmailBuilder.design.saveHtml`
- `trpc.niscEmailBuilder.design.updateMeta`
- `trpc.niscEmailBuilder.mediaLibrary.createFromUpload`
- `trpc.niscEmailBuilder.mediaLibrary.delete`
- `trpc.niscEmailBuilder.mediaLibrary.list`

</details>

<details>
<summary><code>niscEmailMarketing</code>  40 procedures (Email)</summary>

- `trpc.niscEmailMarketing.audiences.addContactsBulk`
- `trpc.niscEmailMarketing.audiences.create`
- `trpc.niscEmailMarketing.audiences.delete`
- `trpc.niscEmailMarketing.audiences.deleteAllContacts`
- `trpc.niscEmailMarketing.audiences.deleteContact`
- `trpc.niscEmailMarketing.audiences.getById`
- `trpc.niscEmailMarketing.audiences.list`
- `trpc.niscEmailMarketing.audiences.listContacts`
- `trpc.niscEmailMarketing.campaigns.cancel`
- `trpc.niscEmailMarketing.campaigns.create`
- `trpc.niscEmailMarketing.campaigns.delete`
- `trpc.niscEmailMarketing.campaigns.getById`
- `trpc.niscEmailMarketing.campaigns.list`
- `trpc.niscEmailMarketing.campaigns.send`
- `trpc.niscEmailMarketing.domains.add`
- `trpc.niscEmailMarketing.domains.create`
- `trpc.niscEmailMarketing.domains.delete`
- `trpc.niscEmailMarketing.domains.getById`
- `trpc.niscEmailMarketing.domains.list`
- `trpc.niscEmailMarketing.domains.listAllVerified`
- `trpc.niscEmailMarketing.domains.listLegacy`
- `trpc.niscEmailMarketing.domains.remove`
- `trpc.niscEmailMarketing.domains.sendTestEmail`
- `trpc.niscEmailMarketing.domains.verify`
- `trpc.niscEmailMarketing.domains.verifyCheck`
- `trpc.niscEmailMarketing.emailEvents.getBounceBreakdown`
- `trpc.niscEmailMarketing.emailEvents.getById`
- `trpc.niscEmailMarketing.emailEvents.getCampaignReport`
- `trpc.niscEmailMarketing.emailEvents.getCampaignSummary`
- `trpc.niscEmailMarketing.emailEvents.getGlobalEvents`
- `trpc.niscEmailMarketing.emailEvents.getTopClickedLinks`
- `trpc.niscEmailMarketing.emailEvents.list`
- `trpc.niscEmailMarketing.quota.status`
- `trpc.niscEmailMarketing.sesIdentities.list`
- `trpc.niscEmailMarketing.sesUsage.connectToNPanel`
- `trpc.niscEmailMarketing.sesUsage.disconnectFromNPanel`
- `trpc.niscEmailMarketing.sesUsage.listDomainsLive`
- `trpc.niscEmailMarketing.sesUsage.quotaLive`
- `trpc.niscEmailMarketing.sesUsage.verifyDomainLive`
- `trpc.niscEmailMarketing.transactional.send`

</details>

<details>
<summary><code>hosting</code>  6 procedures (Hosting)</summary>

- `trpc.hosting.getByPleskFilterId`
- `trpc.hosting.getDetailWithSubscription`
- `trpc.hosting.getHostingByDomainName`
- `trpc.hosting.linkToTeam`
- `trpc.hosting.unlinkFromTeam`
- `trpc.hosting.updateSubscription`

</details>

<details>
<summary><code>hostingPlans</code>  5 procedures (Hosting)</summary>

- `trpc.hostingPlans.create`
- `trpc.hostingPlans.delete`
- `trpc.hostingPlans.getAll`
- `trpc.hostingPlans.getById`
- `trpc.hostingPlans.update`

</details>

<details>
<summary><code>niscBackup</code>  129 procedures (Hosting)</summary>

- `trpc.niscBackup.accountFilters.delete`
- `trpc.niscBackup.accountFilters.get`
- `trpc.niscBackup.accountFilters.getGroup`
- `trpc.niscBackup.accountFilters.list`
- `trpc.niscBackup.accountFilters.listGroups`
- `trpc.niscBackup.accountFilters.manage`
- `trpc.niscBackup.accounts.createOnDemand`
- `trpc.niscBackup.accounts.deleteSnapshots`
- `trpc.niscBackup.accounts.get`
- `trpc.niscBackup.accounts.getExcludeList`
- `trpc.niscBackup.accounts.list`
- `trpc.niscBackup.accounts.listAssignable`
- `trpc.niscBackup.accounts.listPackages`
- `trpc.niscBackup.accounts.listTags`
- `trpc.niscBackup.accounts.manage`
- `trpc.niscBackup.accounts.manageExcludeList`
- `trpc.niscBackup.accounts.manageTag`
- `trpc.niscBackup.accounts.reassign`
- `trpc.niscBackup.accounts.reassignMulti`
- `trpc.niscBackup.alerts.clear`
- `trpc.niscBackup.alerts.get`
- `trpc.niscBackup.alerts.list`
- `trpc.niscBackup.backups.addQueueItems`
- `trpc.niscBackup.backups.getItem`
- `trpc.niscBackup.backups.getItems`
- `trpc.niscBackup.backups.list`
- `trpc.niscBackup.backups.listAccountsByFilters`
- `trpc.niscBackup.backups.listForAccount`
- `trpc.niscBackup.backups.listForType`
- `trpc.niscBackup.backups.listForTypeName`
- `trpc.niscBackup.backups.listLatestForAccounts`
- `trpc.niscBackup.backups.manageLock`
- `trpc.niscBackup.dashboard.getDetails`
- `trpc.niscBackup.dashboard.getInfo`
- `trpc.niscBackup.dashboard.getStatistics`
- `trpc.niscBackup.dashboard.listShowcase`
- `trpc.niscBackup.dashboard.testConnection`
- `trpc.niscBackup.destinations.delete`
- `trpc.niscBackup.destinations.get`
- `trpc.niscBackup.destinations.list`
- `trpc.niscBackup.destinations.listTypes`
- `trpc.niscBackup.destinations.manage`
- `trpc.niscBackup.destinations.reindex`
- `trpc.niscBackup.destinations.runIntegrityCheck`
- `trpc.niscBackup.destinations.validate`
- `trpc.niscBackup.downloads.get`
- `trpc.niscBackup.downloads.list`
- `trpc.niscBackup.downloads.manageNotes`
- `trpc.niscBackup.downloads.queueSnapshot`
- `trpc.niscBackup.filePermissions.delete`
- `trpc.niscBackup.filePermissions.get`
- `trpc.niscBackup.filePermissions.list`
- `trpc.niscBackup.jobs.deleteBackup`
- `trpc.niscBackup.jobs.deleteClone`
- `trpc.niscBackup.jobs.duplicateBackup`
- `trpc.niscBackup.jobs.duplicateClone`
- `trpc.niscBackup.jobs.getBackup`
- `trpc.niscBackup.jobs.getClone`
- `trpc.niscBackup.jobs.listBackup`
- `trpc.niscBackup.jobs.listClone`
- `trpc.niscBackup.jobs.manageBackup`
- `trpc.niscBackup.jobs.manageClone`
- `trpc.niscBackup.jobs.runBackupManually`
- `trpc.niscBackup.jobs.runCloneManually`
- `trpc.niscBackup.logs.delete`
- `trpc.niscBackup.logs.get`
- `trpc.niscBackup.logs.getItem`
- `trpc.niscBackup.logs.list`
- `trpc.niscBackup.logs.listItems`
- `trpc.niscBackup.permissions.list`
- `trpc.niscBackup.plugins.deleteRepository`
- `trpc.niscBackup.plugins.get`
- `trpc.niscBackup.plugins.install`
- `trpc.niscBackup.plugins.list`
- `trpc.niscBackup.plugins.listFiles`
- `trpc.niscBackup.plugins.listPackages`
- `trpc.niscBackup.plugins.listRepositories`
- `trpc.niscBackup.plugins.manage`
- `trpc.niscBackup.plugins.manageRepository`
- `trpc.niscBackup.plugins.manageSecurity`
- `trpc.niscBackup.plugins.uninstall`
- `trpc.niscBackup.plugins.update`
- `trpc.niscBackup.queues.addItems`
- `trpc.niscBackup.queues.addMultiAccountItems`
- `trpc.niscBackup.queues.clear`
- `trpc.niscBackup.queues.deletePriority`
- `trpc.niscBackup.queues.getGroup`
- `trpc.niscBackup.queues.getItem`
- `trpc.niscBackup.queues.getPriority`
- `trpc.niscBackup.queues.listGroups`
- `trpc.niscBackup.queues.listItems`
- `trpc.niscBackup.queues.listPriorities`
- `trpc.niscBackup.queues.managePriority`
- `trpc.niscBackup.queues.queueSnapshot`
- `trpc.niscBackup.queues.rerunFailed`
- `trpc.niscBackup.queues.stopAll`
- `trpc.niscBackup.queues.stopGroup`
- `trpc.niscBackup.restoreConditions.delete`
- `trpc.niscBackup.restoreConditions.get`
- `trpc.niscBackup.restoreConditions.list`
- `trpc.niscBackup.restoreConditions.manage`
- `trpc.niscBackup.schedules.delete`
- `trpc.niscBackup.schedules.get`
- `trpc.niscBackup.schedules.list`
- `trpc.niscBackup.schedules.manage`
- `trpc.niscBackup.settings.deleteEnabledNotificationIntegration`
- `trpc.niscBackup.settings.getBinary`
- `trpc.niscBackup.settings.getEnabledNotificationIntegration`
- `trpc.niscBackup.settings.getPanel`
- `trpc.niscBackup.settings.getPrivacy`
- `trpc.niscBackup.settings.getResource`
- `trpc.niscBackup.settings.getRestore`
- `trpc.niscBackup.settings.getSecurity`
- `trpc.niscBackup.settings.getSnapshots`
- `trpc.niscBackup.settings.listEnabledNotificationIntegrations`
- `trpc.niscBackup.settings.listNotificationIntegrationTypes`
- `trpc.niscBackup.settings.manageBinary`
- `trpc.niscBackup.settings.managePanel`
- `trpc.niscBackup.settings.managePrivacy`
- `trpc.niscBackup.settings.manageResource`
- `trpc.niscBackup.settings.manageRestore`
- `trpc.niscBackup.settings.manageSecurity`
- `trpc.niscBackup.settings.manageSnapshots`
- `trpc.niscBackup.system.approveAgreement`
- `trpc.niscBackup.system.approveShowcase`
- `trpc.niscBackup.system.exitDisasterRecovery`
- `trpc.niscBackup.system.factoryReset`
- `trpc.niscBackup.system.getMasterEncryptionKey`
- `trpc.niscBackup.system.listShowcase`

</details>

<details>
<summary><code>wordpressSubscriptions</code>  5 procedures (Hosting)</summary>

- `trpc.wordpressSubscriptions.getByInstallationId`
- `trpc.wordpressSubscriptions.getDetailWithSubscription`
- `trpc.wordpressSubscriptions.linkToTeam`
- `trpc.wordpressSubscriptions.unlinkFromTeam`
- `trpc.wordpressSubscriptions.updateSubscription`

</details>

<details>
<summary><code>agency-rbac</code>  0 procedures (Other)</summary>


</details>

<details>
<summary><code>nisc-service-orders-schemas</code>  0 procedures (Other)</summary>


</details>

<details>
<summary><code>cronWorkflowRun</code>  7 procedures (Support & Utils)</summary>

- `trpc.cronWorkflowRun.create`
- `trpc.cronWorkflowRun.getById`
- `trpc.cronWorkflowRun.linkInvoice`
- `trpc.cronWorkflowRun.list`
- `trpc.cronWorkflowRun.patch`
- `trpc.cronWorkflowRun.recordEdgeSnapshot`
- `trpc.cronWorkflowRun.saveGraph`

</details>

<details>
<summary><code>ipRecords</code>  1 procedures (Support & Utils)</summary>

- `trpc.ipRecords.list`

</details>

<details>
<summary><code>notifications</code>  9 procedures (Support & Utils)</summary>

- `trpc.notifications.create`
- `trpc.notifications.delete`
- `trpc.notifications.getAll`
- `trpc.notifications.getById`
- `trpc.notifications.getUnseenCount`
- `trpc.notifications.markAllAsSeen`
- `trpc.notifications.markAsSeen`
- `trpc.notifications.markAsUnseen`
- `trpc.notifications.update`

</details>

<details>
<summary><code>objectStorage</code>  4 procedures (Support & Utils)</summary>

- `trpc.objectStorage.createUploadUrl`
- `trpc.objectStorage.deleteObject`
- `trpc.objectStorage.getConfig`
- `trpc.objectStorage.listTestObjects`

</details>

<details>
<summary><code>pagespeedInsights</code>  1 procedures (Support & Utils)</summary>

- `trpc.pagespeedInsights.getPageSpeed`

</details>

<details>
<summary><code>seoReports</code>  7 procedures (Support & Utils)</summary>

- `trpc.seoReports.create`
- `trpc.seoReports.getAutomatedReport`
- `trpc.seoReports.getById`
- `trpc.seoReports.getGa4Report`
- `trpc.seoReports.list`
- `trpc.seoReports.listGa4Properties`
- `trpc.seoReports.listManageableSites`

</details>

<details>
<summary><code>tickets</code>  11 procedures (Support & Utils)</summary>

- `trpc.tickets.archive`
- `trpc.tickets.assign`
- `trpc.tickets.create`
- `trpc.tickets.createMessage`
- `trpc.tickets.getById`
- `trpc.tickets.getList`
- `trpc.tickets.getMessages`
- `trpc.tickets.markAllTicketMessagesAsRead`
- `trpc.tickets.markMessageRead`
- `trpc.tickets.update`
- `trpc.tickets.updateStatus`

</details>

<details>
<summary><code>webDesignQuotes</code>  2 procedures (Support & Utils)</summary>

- `trpc.webDesignQuotes.create`
- `trpc.webDesignQuotes.list`

</details>

<details>
<summary><code>digitax</code>  25 procedures (Tax & Reports)</summary>

- `trpc.digitax.branches.getBranches`
- `trpc.digitax.branches.getETimsInfo`
- `trpc.digitax.customers.create`
- `trpc.digitax.customers.delete`
- `trpc.digitax.customers.getAll`
- `trpc.digitax.customers.getById`
- `trpc.digitax.customers.update`
- `trpc.digitax.items.create`
- `trpc.digitax.items.delete`
- `trpc.digitax.items.getAll`
- `trpc.digitax.items.getById`
- `trpc.digitax.items.update`
- `trpc.digitax.notices.getAll`
- `trpc.digitax.purchases.getAll`
- `trpc.digitax.purchases.getById`
- `trpc.digitax.purchases.linkItems`
- `trpc.digitax.sales.add`
- `trpc.digitax.sales.addExpressCreditNote`
- `trpc.digitax.sales.addWithItems`
- `trpc.digitax.sales.getAll`
- `trpc.digitax.sales.getById`
- `trpc.digitax.sales.getOfflineUrl`
- `trpc.digitax.sales.getSummary`
- `trpc.digitax.verifications.getAll`
- `trpc.digitax.verifications.verify`

</details>

<details>
<summary><code>niscReports</code>  31 procedures (Tax & Reports)</summary>

- `trpc.niscReports.clients.cohortRetention`
- `trpc.niscReports.clients.newVsReturning`
- `trpc.niscReports.clients.summary`
- `trpc.niscReports.invoices.creditNotes`
- `trpc.niscReports.invoices.cycleTime`
- `trpc.niscReports.invoices.kraCompliance`
- `trpc.niscReports.invoices.list`
- `trpc.niscReports.invoices.statusSummary`
- `trpc.niscReports.payments.failedPending`
- `trpc.niscReports.payments.gatewayPerf`
- `trpc.niscReports.payments.methodBreakdown`
- `trpc.niscReports.payments.refunds`
- `trpc.niscReports.profitability.commission`
- `trpc.niscReports.profitability.grossMargin`
- `trpc.niscReports.quotations.conversionFunnel`
- `trpc.niscReports.quotations.list`
- `trpc.niscReports.quotations.pipeline`
- `trpc.niscReports.revenue.aging`
- `trpc.niscReports.revenue.byCategory`
- `trpc.niscReports.revenue.byClient`
- `trpc.niscReports.revenue.outstandingList`
- `trpc.niscReports.revenue.overview`
- `trpc.niscReports.revenue.trend`
- `trpc.niscReports.subscriptions.churn`
- `trpc.niscReports.subscriptions.list`
- `trpc.niscReports.subscriptions.mrrDashboard`
- `trpc.niscReports.subscriptions.mrrMovement`
- `trpc.niscReports.subscriptions.renewalForecast`
- `trpc.niscReports.subscriptions.statusSummary`
- `trpc.niscReports.subscriptions.upgrades`
- `trpc.niscReports.tax.summary`

</details>

<details>
<summary><code>reports</code>  7 procedures (Tax & Reports)</summary>

- `trpc.reports.creative.getProductionStats`
- `trpc.reports.creative.sync`
- `trpc.reports.sales.getRevenueByCompany`
- `trpc.reports.sales.getRevenueByService`
- `trpc.reports.sales.getRevenueTrends`
- `trpc.reports.sales.getSalesReportOverview`
- `trpc.reports.sales.sync`

</details>

<details>
<summary><code>agencyRbac</code>  11 procedures (Teams & Access)</summary>

- `trpc.agencyRbac.myMenuAccess`
- `trpc.agencyRbac.permissionCatalog`
- `trpc.agencyRbac.permissionUpsert`
- `trpc.agencyRbac.permissionsList`
- `trpc.agencyRbac.roleById`
- `trpc.agencyRbac.roleCreate`
- `trpc.agencyRbac.roleDelete`
- `trpc.agencyRbac.rolePermissionsSet`
- `trpc.agencyRbac.roleUpdate`
- `trpc.agencyRbac.rolesList`
- `trpc.agencyRbac.userAgencyRoleAssign`

</details>

<details>
<summary><code>apiKeys</code>  5 procedures (Teams & Access)</summary>

- `trpc.apiKeys.create`
- `trpc.apiKeys.delete`
- `trpc.apiKeys.getAvailableProcedures`
- `trpc.apiKeys.list`
- `trpc.apiKeys.revoke`

</details>

<details>
<summary><code>clients</code>  18 procedures (Teams & Access)</summary>

- `trpc.clients.changeStatus`
- `trpc.clients.checkEmailVerification`
- `trpc.clients.create`
- `trpc.clients.createIntegration`
- `trpc.clients.getAll`
- `trpc.clients.getIntegrations`
- `trpc.clients.getInvoiceBillingSummary`
- `trpc.clients.getInvoices`
- `trpc.clients.getProfile`
- `trpc.clients.getQuotations`
- `trpc.clients.getSessions`
- `trpc.clients.getSubscriptions`
- `trpc.clients.getTeams`
- `trpc.clients.getTransactions`
- `trpc.clients.requestPasswordReset`
- `trpc.clients.sendEmailVerification`
- `trpc.clients.update`
- `trpc.clients.updateProfile`

</details>

<details>
<summary><code>manageUsers</code>  9 procedures (Teams & Access)</summary>

- `trpc.manageUsers.changeStatus`
- `trpc.manageUsers.create`
- `trpc.manageUsers.getAll`
- `trpc.manageUsers.getById`
- `trpc.manageUsers.getProfile`
- `trpc.manageUsers.getSessions`
- `trpc.manageUsers.requestPasswordReset`
- `trpc.manageUsers.update`
- `trpc.manageUsers.updateProfile`

</details>

<details>
<summary><code>user</code>  4 procedures (Teams & Access)</summary>

- `trpc.user.getEmailPreferences`
- `trpc.user.getNotificationPreferences`
- `trpc.user.updateEmailPreferences`
- `trpc.user.updateNotificationPreferences`

</details>

<details>
<summary><code>userProfile</code>  8 procedures (Teams & Access)</summary>

- `trpc.userProfile.getSessions`
- `trpc.userProfile.getUserById`
- `trpc.userProfile.getUserInfo`
- `trpc.userProfile.getUsersByIds`
- `trpc.userProfile.listCustomersForRegistrant`
- `trpc.userProfile.revokeAllSessions`
- `trpc.userProfile.revokeSession`
- `trpc.userProfile.updateProfile`

</details>

## Domain index

### Ads & Social

| Router | Access | Public | Protected | eTIMS |
|--------|--------|--------|-----------|-------|
| `googleAds` | PROTECTED_ONLY | 0 | 18 | 0 |
| `instagramAds` | PROTECTED_ONLY | 0 | 14 | 0 |
| `linkedInAds` | PROTECTED_ONLY | 0 | 28 | 0 |
| `metaAds` | PROTECTED_ONLY | 0 | 19 | 0 |
| `socialMediaMarketing` | PROTECTED_ONLY | 0 | 45 | 0 |

### Billing

| Router | Access | Public | Protected | eTIMS |
|--------|--------|--------|-----------|-------|
| `clientSubscriptions` | PROTECTED_ONLY | 0 | 40 | 0 |
| `currency` | PROTECTED_ONLY | 0 | 7 | 0 |
| `invoicing` | PROTECTED_ONLY | 0 | 21 | 0 |
| `niscServiceOrders` | PROTECTED_ONLY | 0 | 6 | 0 |
| `orders` | PROTECTED_ONLY | 0 | 9 | 0 |
| `paymentGateway` | PROTECTED_ONLY | 0 | 3 | 0 |
| `paymentTransactions` | PROTECTED_ONLY | 0 | 3 | 0 |
| `products` | MIXED | 10 | 17 | 0 |
| `publicPricing` | PUBLIC_ONLY | 3 | 0 | 0 |
| `quotations` | PROTECTED_ONLY | 0 | 8 | 0 |
| `serviceSubscriptions` | PROTECTED_ONLY | 0 | 3 | 0 |
| `subscriptionUsage` | PROTECTED_ONLY | 0 | 6 | 0 |
| `teamBilling` | PROTECTED_ONLY | 0 | 5 | 0 |

### Creatives & AI

| Router | Access | Public | Protected | eTIMS |
|--------|--------|--------|-----------|-------|
| `ai` | PROTECTED_ONLY | 0 | 6 | 0 |
| `backgroundRemover` | PROTECTED_ONLY | 0 | 5 | 0 |
| `creativeAssets` | PROTECTED_ONLY | 0 | 22 | 0 |
| `creativeBriefs` | PROTECTED_ONLY | 0 | 7 | 0 |
| `imageGenerator` | PROTECTED_ONLY | 0 | 6 | 0 |
| `imageGenStudio` | PROTECTED_ONLY | 0 | 20 | 0 |
| `stabilityAi` | PROTECTED_ONLY | 0 | 2 | 0 |
| `zeepoAgent` | PROTECTED_ONLY | 0 | 22 | 0 |
| `zeepoCanvas` | PROTECTED_ONLY | 0 | 10 | 0 |

### Domains

| Router | Access | Public | Protected | eTIMS |
|--------|--------|--------|-----------|-------|
| `aiDomainSearch` | PROTECTED_ONLY | 0 | 1 | 0 |
| `domains` | PROTECTED_ONLY | 0 | 8 | 0 |
| `domainTransfer` | MIXED | 1 | 5 | 0 |
| `kenic` | MIXED | 1 | 15 | 0 |
| `nameserverGroups` | PROTECTED_ONLY | 0 | 7 | 0 |
| `openProvider` | MIXED | 4 | 39 | 0 |
| `tldSettings` | PROTECTED_ONLY | 0 | 9 | 0 |
| `whois` | PUBLIC_ONLY | 2 | 0 | 0 |

### Email

| Router | Access | Public | Protected | eTIMS |
|--------|--------|--------|-----------|-------|
| `emailBuilder` | PROTECTED_ONLY | 0 | 8 | 0 |
| `emailBuilderLibrary` | PROTECTED_ONLY | 0 | 3 | 0 |
| `emailMarketing` | PROTECTED_ONLY | 0 | 31 | 0 |
| `niscEmailBuilder` | PROTECTED_ONLY | 0 | 25 | 0 |
| `niscEmailMarketing` | PROTECTED_ONLY | 0 | 40 | 0 |

### Hosting

| Router | Access | Public | Protected | eTIMS |
|--------|--------|--------|-----------|-------|
| `hivelocity` | MIXED | 6 | 61 | 0 |
| `hivelocityPricingSettings` | MIXED | 1 | 3 | 0 |
| `hosting` | PROTECTED_ONLY | 0 | 6 | 0 |
| `hostingPlans` | PROTECTED_ONLY | 0 | 5 | 0 |
| `niscBackup` | PROTECTED_ONLY | 0 | 129 | 0 |
| `plesk` | MIXED | 3 | 120 | 0 |
| `wordpressSubscriptions` | PROTECTED_ONLY | 0 | 5 | 0 |

### Other

| Router | Access | Public | Protected | eTIMS |
|--------|--------|--------|-----------|-------|
| `agency-rbac` | PROTECTED_ONLY | 0 | 0 | 0 |
| `nisc-service-orders-schemas` | PROTECTED_ONLY | 0 | 0 | 0 |

### Public Storefront

| Router | Access | Public | Protected | eTIMS |
|--------|--------|--------|-----------|-------|
| `storefront` | PUBLIC_ONLY | 8 | 0 | 0 |

### Support & Utils

| Router | Access | Public | Protected | eTIMS |
|--------|--------|--------|-----------|-------|
| `cronWorkflowRun` | PROTECTED_ONLY | 0 | 7 | 0 |
| `ipRecords` | PROTECTED_ONLY | 0 | 1 | 0 |
| `notifications` | PROTECTED_ONLY | 0 | 9 | 0 |
| `objectStorage` | PROTECTED_ONLY | 0 | 4 | 0 |
| `pagespeedInsights` | PROTECTED_ONLY | 0 | 1 | 0 |
| `seoReports` | PROTECTED_ONLY | 0 | 7 | 0 |
| `tickets` | PROTECTED_ONLY | 0 | 11 | 0 |
| `webDesignQuotes` | PROTECTED_ONLY | 0 | 2 | 0 |

### Tax & Reports

| Router | Access | Public | Protected | eTIMS |
|--------|--------|--------|-----------|-------|
| `digitax` | PROTECTED_ONLY | 0 | 25 | 0 |
| `etims` | ETIMS_TOGGLE | 0 | 0 | 31 |
| `niscReports` | PROTECTED_ONLY | 0 | 31 | 0 |
| `reports` | PROTECTED_ONLY | 0 | 7 | 0 |

### Teams & Access

| Router | Access | Public | Protected | eTIMS |
|--------|--------|--------|-----------|-------|
| `agencyRbac` | PROTECTED_ONLY | 0 | 11 | 0 |
| `apiKeys` | PROTECTED_ONLY | 0 | 5 | 0 |
| `clients` | PROTECTED_ONLY | 0 | 18 | 0 |
| `manageUsers` | PROTECTED_ONLY | 0 | 9 | 0 |
| `teams` | MIXED | 1 | 19 | 0 |
| `user` | PROTECTED_ONLY | 0 | 4 | 0 |
| `userProfile` | PROTECTED_ONLY | 0 | 8 | 0 |

