# AI Function Catalog

> [!IMPORTANT]
> **This is human-readable documentation only.** The machine-readable catalog used by the AI system is in `ai_function_catalog.json`.
> When updating this file, also update the JSON catalog and run validation to ensure consistency.

**Purpose**: Comprehensive catalog of all tRPC API operations for AI function calling

Usage: AI should search this catalog before calling any function to verify it exists and get exact schemas

Navigation & Discovery
How to Use This Catalog
Search by keyword - Find functions by domain, feature, or action
Check input schema - Get exact parameter types and validation rules
Verify output format - Understand what data the function returns
Check access control - Know if function requires authentication or specific roles
Function Categories
Plesk Integration - Hosting, domains, WordPress, email, databases, FTP
OpenProvider - Domain registration, DNS, customer management
eTIMS - Kenya KRA tax integration
Advertising - Google Ads, Meta Ads, LinkedIn Ads
Marketing - Email campaigns, SEO, social media
Creative - Image generation, design assets
Business - Teams, clients, tickets, invoicing
Infrastructure - Hosting, domains, subscriptions
1. Plesk Integration
1.1 Subscriptions Management
plesk.subscriptions.list
Type: query
Access: public
Description: List all Plesk hosting subscriptions

Input: None required

Output:

typescript
Array<{
  id: number;
  name: string;
  guid: string;
  status: string;
  owner_id: number;
  owner_login: string;
  ip_address: string;
  created: string;
}>
plesk.subscriptions.getById
Type: query
Access: public
Description: Get detailed information about a specific Plesk subscription

Input:

typescript
{
  subscriptionId: number; // Required - Plesk subscription ID
}
Output:

typescript
{
  id: number;
  name: string;
  guid: string;
  status: string;
  owner_id: number;
  owner_login: string;
  ip_address: string;
  created: string;
  // ... additional subscription details
}
1.2 WordPress Management
plesk.wordpress.list
Type: query
Access: public
Description: List all WordPress installations in Plesk

Input:

typescript
{
  subscriptionId?: number; // Optional - filter by subscription
}
Output:

typescript
Array<{
  id: string;
  url: string;
  version: string;
  status: string;
  subscription_id: number;
}>
plesk.wpPlugins.list
Type: query
Access: public
Description: List WordPress plugins for a specific installation

Input:

typescript
{
  installationId: string; // Required - WordPress installation ID
}
Output:

typescript
Array<{
  name: string;
  version: string;
  status: 'active' | 'inactive';
  update_available: boolean;
  auto_update: boolean;
}>
plesk.wpThemesList.list
Type: query
Access: public
Description: List WordPress themes for a specific installation

Input:

typescript
{
  installationId: string; // Required
}
Output:

typescript
Array<{
  name: string;
  version: string;
  status: 'active' | 'inactive';
  update_available: boolean;
}>
1.3 Domain & DNS Management
plesk.domains.list
Type: query
Access: public
Description: List all domains in Plesk

Input: None required

Output:

typescript
Array<{
  id: number;
  name: string;
  guid: string;
  hosting_type: string;
  subscription_id: number;
}>
plesk.domainDns.list
Type: query
Access: public
Description: List DNS records for a domain

Input:

typescript
{
  domainId: number; // Required - Plesk domain ID
}
Output:

typescript
Array<{
  id: number;
  type: 'A' | 'AAAA' | 'CNAME' | 'MX' | 'TXT' | 'NS' | 'SRV';
  host: string;
  value: string;
  priority?: number;
  ttl: number;
}>
1.4 Email Management
plesk.emails.list
Type: query
Access: public
Description: List email accounts for a domain

Input:

typescript
{
  domainId: number; // Required
}
Output:

typescript
Array<{
  id: number;
  email: string;
  mailbox_size: number;
  quota: number;
}>
1.5 Database Management
plesk.databases.list
Type: query
Access: public
Description: List databases for a subscription

Input:

typescript
{
  subscriptionId: number; // Required
}
Output:

typescript
Array<{
  id: number;
  name: string;
  type: 'mysql' | 'postgresql';
  server: string;
}>
2. OpenProvider Integration
2.1 Domain Operations
openProvider.domains.checkAvailability
Type: query
Access: public
Description: Check domain availability and pricing

Input:

typescript
{
  name?: string; // Domain name without extension
  extension?: string; // TLD (e.g., 'com', 'net')
  domains?: Array<{
    name: string;
    extension: string;
  }>;
  extensions?: string[]; // Check multiple TLDs
  with_price?: boolean; // Include pricing info
  with_whois?: boolean; // Include WHOIS data
}
Output:

typescript
{
  results: Array<{
    domain: string;
    status: 'free' | 'active' | 'reserved';
    premium: boolean;
    price?: {
      product: { price: number; currency: string };
      reseller: { price: number; currency: string };
    };
  }>;
}
openProvider.domains.list
Type: query
Access: public
Description: List registered domains

Input:

typescript
{
  limit?: number; // Default: 100, Max: 1000
  offset?: number; // Default: 0
  status?: 'ACT' | 'REQ' | 'DEL' | 'FAIL';
  with_customer_info?: boolean;
}
Output:

typescript
{
  results: Array<{
    id: number;
    domain: { name: string; extension: string };
    status: string;
    expiry_date: string;
    auto_renew: boolean;
  }>;
  total: number;
}
2.2 DNS Management
openProvider.dns.listZones
Type: query
Access: public
Description: List DNS zones

Input:

typescript
{
  limit?: number;
  offset?: number;
}
Output:

typescript
{
  results: Array<{
    id: number;
    name: string;
    type: string;
    records_count: number;
  }>;
}
2.3 TLD Information
openProvider.tlds.list
Type: query
Access: public
Description: List available TLDs with pricing

Input:

typescript
{
  limit?: number;
  offset?: number;
}
Output:

typescript
{
  results: Array<{
    name: string;
    prices: {
      create: { price: number; currency: string };
      renew: { price: number; currency: string };
      transfer: { price: number; currency: string };
    };
  }>;
}
3. eTIMS Integration (Kenya KRA)
3.1 Initialization
etims.initialization.initialize
Type: mutation
Access: protected
Description: Initialize eTIMS device for a team

Input:

typescript
{
  teamId: string;
  tin: string; // KRA PIN
  bhfId: string; // Branch ID
  dvcSrlNo: string; // Device serial number
}
Output:

typescript
{
  success: boolean;
  cmcKey?: string; // Communication key
  data?: any;
}
3.2 Item Management
etims.items.saveItem
Type: mutation
Access: protected
Description: Register or update product/item in eTIMS

Input:

typescript
{
  teamId: string;
  item: {
    itemCd?: string; // Item code (auto-generated if new)
    itemClsCd: string; // Item classification code
    itemNm: string; // Item name
    taxTyCd: string; // Tax type code
    bcd?: string; // Barcode
    pkgUnitCd: string; // Packaging unit
    qtyUnitCd: string; // Quantity unit
    itemTyCd: string; // Item type code
    orgnNatCd: string; // Origin country code
    useYn: 'Y' | 'N'; // Use status
    regrNm: string; // Registrant name
    regrId: string; // Registrant ID
    modrNm: string; // Modifier name
    modrId: string; // Modifier ID
  };
}
Output:

typescript
{
  success: boolean;
  data: {
    resultCd: string;
    resultMsg: string;
    resultDt: string;
  };
}
etims.items.getItemInfo
Type: query
Access: protected
Description: Retrieve registered items from eTIMS

Input:

typescript
{
  teamId: string;
  lastReqDt: string; // Format: YYYYMMDDHHmmss
}
Output:

typescript
{
  success: boolean;
  data: {
    itemList: Array<{
      itemCd: string;
      itemNm: string;
      taxTyCd: string;
      // ... other item fields
    }>;
  };
}
3.3 Sales Management
etims.sales.saveSales
Type: mutation
Access: protected
Description: Submit sales transaction to eTIMS

Input:

typescript
{
  teamId: string;
  sale: {
    invcNo: string; // Invoice number
    orgInvcNo?: string; // Original invoice (for credit notes)
    salesTyCd: string; // Sales type code
    rcptTyCd: string; // Receipt type code
    pmtTyCd: string; // Payment type code
    salesSttsCd: string; // Sales status code
    cfmDt: string; // Confirmation date
    salesDt: string; // Sales date
    totItemCnt: number; // Total item count
    taxblAmtA: number; // Taxable amount A
    taxblAmtB: number; // Taxable amount B
    // ... other fields
    itemList: Array<{
      itemSeq: number;
      itemCd: string;
      itemNm: string;
      qty: number;
      prc: number;
      // ... other item fields
    }>;
  };
}
Output:

typescript
{
  success: boolean;
  data: {
    resultCd: string;
    intrlData: string; // Internal data
    rcptNo: number; // Receipt number
    totRcptNo: number; // Total receipt number
    rcptSign: string; // Receipt signature
    sdcDateTime: string; // SDC date time
    qrCode: string; // QR code for receipt
  };
}

4. Advertising Platforms
4.1 Google Ads
googleAds.campaigns.list
Type: query
Access: protected
Description: List Google Ads campaigns

Input:

typescript
{
  teamId: string;
  customerId?: string; // Google Ads customer ID
}
Output:

typescript
Array<{
  id: string;
  name: string;
  status: 'ENABLED' | 'PAUSED' | 'REMOVED';
  budget: number;
  currency: string;
}>
4.2 Meta Ads
metaAds.campaigns.list
Type: query
Access: protected
Description: List Meta/Facebook ad campaigns

Input:

typescript
{
  teamId: string;
  adAccountId?: string;
}
Output:

typescript
Array<{
  id: string;
  name: string;
  status: 'ACTIVE' | 'PAUSED' | 'DELETED';
  objective: string;
  daily_budget?: number;
  lifetime_budget?: number;
}>
4.3 LinkedIn Ads
linkedInAds.campaigns.list
Type: query
Access: protected
Description: List LinkedIn ad campaigns

Input:

typescript
{
  teamId: string;
  accountId?: string;
}
Output:

typescript
Array<{
  id: string;
  name: string;
  status: 'ACTIVE' | 'PAUSED' | 'ARCHIVED';
  type: string;
  dailyBudget?: number;
}>
5. Marketing Services
5.1 Email Marketing
emailMarketing.campaigns.list
Type: query
Access: protected
Description: List email marketing campaigns

Input:

typescript
{
  teamId?: string;
  status?: 'DRAFT' | 'SCHEDULED' | 'COMPLETED' | 'FAILED' | 'CANCELLED';
  search?: string;
  limit?: number; // Default: 50
  offset?: number; // Default: 0
}
Output:

typescript
{
  campaigns: Array<{
    id: string;
    name: string;
    subject: string;
    fromEmail: string;
    status: string;
    recipientCount: number;
    scheduledAt: Date | null;
    sentAt: Date | null;
  }>;
  total: number;
}
emailMarketing.campaigns.getById
Type: query
Access: protected
Description: Get campaign details with recipients

Input:

typescript
{
  id: string; // Campaign ID
}
Output:

typescript
{
  id: string;
  name: string;
  subject: string;
  htmlContent: string | null;
  status: string;
  recipients: Array<{
    id: string;
    toEmail: string;
    resendId: string | null;
  }>;
}
5.2 SEO Reports
seoReports.getReport
Type: query
Access: protected
Description: Get SEO analysis report for a domain

Input:

typescript
{
  teamId: string;
  domain: string;
}
Output:

typescript
{
  domain: string;
  metrics: {
    performance: number;
    seo: number;
    accessibility: number;
    bestPractices: number;
  };
  issues: Array<{
    type: string;
    severity: 'high' | 'medium' | 'low';
    description: string;
  }>;
}
5.3 PageSpeed Insights
pagespeedInsights.analyze
Type: query
Access: protected
Description: Analyze page speed and performance

Input:

typescript
{
  url: string;
  strategy?: 'mobile' | 'desktop'; // Default: 'mobile'
}
Output:

typescript
{
  score: number; // 0-100
  metrics: {
    firstContentfulPaint: number;
    speedIndex: number;
    largestContentfulPaint: number;
    timeToInteractive: number;
    totalBlockingTime: number;
    cumulativeLayoutShift: number;
  };
}
6. Creative Services
6.1 Image Generator
imageGenerator.generate
Type: mutation
Access: protected
Description: Generate AI image from text prompt

Input:

typescript
{
  prompt: string;
  negativePrompt?: string;
  width?: number; // Default: 1024
  height?: number; // Default: 1024
  steps?: number; // Default: 30
  guidanceScale?: number; // Default: 7.5
}
Output:

typescript
{
  success: boolean;
  imageUrl: string;
  seed: number;
}
6.2 Background Remover
backgroundRemover.remove
Type: mutation
Access: protected
Description: Remove background from image

Input:

typescript
{
  imageUrl: string;
}
Output:

typescript
{
  success: boolean;
  resultUrl: string;
}
6.3 Creative Assets
creativeAssets.upload
Type: mutation
Access: protected
Description: Upload creative asset file

Input:

typescript
{
  teamId: string;
  fileName: string;
  fileType: string;
  fileSize: number;
}
Output:

typescript
{
  id: string;
  uploadUrl: string; // Pre-signed URL for upload
  assetUrl: string; // Final asset URL
}
6.4 Creative Briefs
creativeBriefs.getAll
Type: query
Access: protected
Description: Get all creative briefs for current user

Input: None required

Output:

typescript
Array<{
  id: string;
  name: string;
  status: 'DRAFT' | 'REVIEWING' | 'APPROVED' | 'REJECTED';
  background: string;
  objectives: string;
  createdAt: Date;
}>
creativeBriefs.getById
Type: query
Access: protected
Description: Get creative brief by ID

Input:

typescript
{
  id: string;
}
Output:

typescript
{
  id: string;
  name: string;
  status: string;
  background: string;
  objectives: string;
  requirements: string;
  referenceImages: Array<{
    id: string;
    fileUrl: string;
    fileName: string;
  }>;
}
7. Business Management
7.1 Teams
teams.getUserTeams
Type: query
Access: protected
Description: Get all teams current user is member of

Input: None required

Output:

typescript
Array<{
  id: string;
  name: string;
  slug: string;
  description: string | null;
  logo: string | null;
  createdAt: Date;
}>
teams.getById
Type: query
Access: protected
Description: Get team details by ID

Input:

typescript
{
  teamId: string;
}
Output:

typescript
{
  id: string;
  name: string;
  slug: string;
  description: string | null;
  website: string | null;
  logo: string | null;
  timezone: string;
  currency: string;
  members: Array<{
    id: string;
    userId: string;
    role: 'OWNER' | 'ADMIN' | 'MEMBER';
    user: {
      name: string;
      email: string;
    };
  }>;
}
teams.getTeamMembers
Type: query
Access: protected
Description: Get all members of a team

Input:

typescript
{
  teamId: string;
}
Output:

typescript
Array<{
  id: string;
  userId: string;
  teamId: string;
  role: 'OWNER' | 'ADMIN' | 'MEMBER';
  joinedAt: Date;
  user: {
    id: string;
    name: string;
    email: string;
    image: string | null;
  };
}>
7.2 Clients
clients.getAll
Type: query
Access: protected
Description: Get all clients for a team

Input:

typescript
{
  teamId: string;
  search?: string;
  limit?: number;
  offset?: number;
}
Output:

typescript
{
  clients: Array<{
    id: string;
    name: string;
    email: string;
    phone: string | null;
    company: string | null;
    status: 'ACTIVE' | 'INACTIVE';
  }>;
  total: number;
}
7.3 Tickets
tickets.getAll
Type: query
Access: protected
Description: Get all tickets with filters

Input:

typescript
{
  status?: 'OPEN' | 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED' | 'CANCELLED';
  priority?: 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT';
  teamId?: string;
  limit?: number; // Default: 50
  offset?: number; // Default: 0
}
Output:

typescript
Array<{
  id: string;
  ticketNumber: string;
  subject: string;
  status: string;
  priority: string;
  createdAt: Date;
  createdBy: {
    name: string;
    email: string;
  };
}>
tickets.getById
Type: query
Access: protected
Description: Get ticket details with messages

Input:

typescript
{
  id: string;
}
Output:

typescript
{
  id: string;
  ticketNumber: string;
  subject: string;
  description: string;
  status: string;
  priority: string;
  messages: Array<{
    id: string;
    content: string;
    createdAt: Date;
    createdBy: {
      name: string;
      email: string;
    };
  }>;
}
8. Billing & Commerce
8.1 Orders
orders.getAll
Type: query
Access: protected (Agency only)
Description: Get all orders with filtering

Input:

typescript
{
  teamId?: string;
  status?: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED' | 'CANCELLED';
  type?: 'DOMAIN_REGISTRATION' | 'DOMAIN_RENEWAL' | 'HOSTING_SUBSCRIPTION' | 'HOSTING_RENEWAL';
  limit?: number; // Default: 50, Max: 100
  offset?: number; // Default: 0
}
Output:

typescript
{
  orders: Array<{
    id: string;
    orderNumber: string;
    type: string;
    status: string;
    total: string;
    currency: string;
    createdAt: Date;
  }>;
  total: number;
}
8.2 Invoicing
invoicing.getAll
Type: query
Access: protected
Description: Get all invoices

Input:

typescript
{
  teamId?: string;
  status?: 'DRAFT' | 'SENT' | 'PAID' | 'OVERDUE' | 'CANCELLED';
  limit?: number;
  offset?: number;
}
Output:

typescript
Array<{
  id: string;
  invoiceNumber: string;
  status: string;
  total: number;
  currency: string;
  dueDate: Date;
}>
8.3 Service Subscriptions
serviceSubscriptions.getByTeam
Type: query
Access: protected
Description: Get service subscriptions for a team

Input:

typescript
{
  teamId: string;
  planType?: 'HOSTING' | 'DOMAIN' | 'WORDPRESS' | 'EMAIL' | 'OTHER';
}
Output:

typescript
Array<{
  id: string;
  planType: string;
  status: 'ACTIVE' | 'PENDING' | 'SUSPENDED' | 'CANCELLED' | 'EXPIRED';
  billingCycle: 'MONTHLY' | 'YEARLY' | 'BIENNIALLY';
  nextRenewalDate: Date | null;
  autoRenew: boolean;
}>
9. Infrastructure
9.1 Hosting
hosting.getDetailWithSubscription
Type: query
Access: protected
Description: Get hosting subscription with Plesk data

Input:

typescript
{
  subscriptionId: string;
  teamId?: string;
}
Output:

typescript
{
  hosting: any; // Plesk subscription data
  subscription: {
    id: string;
    primaryDomain: string | null;
    billingCycle: string;
    expiryDate: Date | null;
    autoRenew: boolean;
    hostingType: string;
  };
  serviceSubscription: {
    status: string;
    nextRenewalDate: string | null;
  };
}
9.2 Domains
domains.getByTeam
Type: query
Access: protected
Description: Get all domains for a team

Input:

typescript
{
  teamId: string;
}
Output:

typescript
Array<{
  id: string;
  domainName: string;
  expirationDate: Date | null;
  registrationDate: Date;
}>
9.3 WordPress Subscriptions
wordpressSubscriptions.getByTeam
Type: query
Access: protected
Description: Get WordPress instances for a team

Input:

typescript
{
  teamId: string;
}
Output:

typescript
Array<{
  id: string;
  url: string;
  version: string;
  status: string;
}>
10. User & Profile
10.1 User Profile
userProfile.get
Type: query
Access: protected
Description: Get current user's profile

Input: None required

Output:

typescript
{
  id: string;
  name: string;
  email: string;
  emailVerified: boolean;
  image: string | null;
  role: string;
  notificationSoundEnabled: boolean;
  browserNotificationsEnabled: boolean;
}
Common Patterns
Input Patterns
{ id: string } - Single resource lookup
{ teamId: string } - Team-scoped queries
{} - User-scoped (uses auth context)
{ limit?: number, offset?: number } - Pagination
{ search?: string, status?: enum } - Filtering
Output Patterns
Single object or null
Array<T> for collections
{ items: Array<T>, total: number } - Paginated lists
Access Control
public - No authentication required
protected - Requires authentication
agency-only - Requires agency role
team-scoped - Verifies team membership