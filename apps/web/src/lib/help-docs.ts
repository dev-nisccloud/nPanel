export interface HelpArticle {
  id: string;
  title: string;
  summary: string;
  content: string;
  tags?: string[];
}

export interface HelpCollection {
  id: string;
  title: string;
  description: string;
  icon: string;
  articles: HelpArticle[];
}

export const helpCollections: HelpCollection[] = [
  {
    id: "getting-started",
    title: "Getting Started",
    description: "Everything you need to know to get up and running with Nisc Cloud",
    icon: "🚀",
    articles: [
      {
        id: "gs-1",
        title: "Creating your first account",
        summary: "Learn how to sign up and configure your Nisc Cloud account.",
        content: "To get started with Nisc Cloud, visit app.nisccloud.com and click **Sign Up**. Enter your email address, choose a secure password, and verify your email. Once verified, you can log in and begin setting up your services.",
        tags: ["account", "signup"],
      },
      {
        id: "gs-2",
        title: "Dashboard overview",
        summary: "Understand the main sections of your control panel.",
        content: "The Nisc Cloud dashboard gives you a central view of all your services. From the sidebar you can access Hosting, Domains, Email, SSL, and Billing. The overview page shows active services, recent invoices, and support tickets.",
        tags: ["dashboard", "panel"],
      },
      {
        id: "gs-3",
        title: "Managing your team members",
        summary: "Add sub-users and manage permissions within your account.",
        content: "Navigate to **Settings → Team** to invite new users. You can assign roles such as Admin, Developer, or Viewer. Each role has different permissions to view or modify services.",
        tags: ["team", "permissions"],
      },
    ],
  },
  {
    id: "shared-hosting",
    title: "Shared Hosting",
    description: "Guides for managing your shared hosting plans and files",
    icon: "🌐",
    articles: [
      {
        id: "sh-1",
        title: "Uploading files via FTP",
        summary: "Connect to your hosting account using an FTP client.",
        content: "You can upload files to your shared hosting using any FTP client (e.g. FileZilla). Go to **Hosting → FTP Accounts** to find your hostname, username, and to set a password. Use port 21 for FTP or port 22 for SFTP.",
        tags: ["ftp", "files", "upload"],
      },
      {
        id: "sh-2",
        title: "Installing WordPress",
        summary: "One-click WordPress installation using the Softaculous installer.",
        content: "In your control panel, navigate to **Softaculous Apps Installer → WordPress**. Click Install, choose your domain and directory, set an admin username and password, then click **Install** to complete the process.",
        tags: ["wordpress", "cms"],
      },
      {
        id: "sh-3",
        title: "Managing databases (MySQL)",
        summary: "Create, access, and manage MySQL databases for your website.",
        content: "Go to **Databases → MySQL Databases** to create a new database and user. Assign the user to the database with all privileges. You can then connect via phpMyAdmin or using your app's database configuration settings.",
        tags: ["mysql", "database"],
      },
    ],
  },
  {
    id: "domains",
    title: "Domains & DNS",
    description: "Register, transfer, and manage your domain names and DNS records",
    icon: "🔗",
    articles: [
      {
        id: "dom-1",
        title: "Registering a new domain",
        summary: "Search and register a domain name through Nisc Cloud.",
        content: "Visit **Domains → Register a Domain**, search for your desired name, select from available TLDs (.com, .co.ke, .africa, etc.), add it to cart and complete checkout. Your domain will be active within minutes.",
        tags: ["register", "domain"],
      },
      {
        id: "dom-2",
        title: "Updating DNS records",
        summary: "Add or edit A, CNAME, MX, and TXT records for your domain.",
        content: "Go to **Domains → Manage → DNS Zone Editor**. You can add A records to point your domain to an IP, CNAME records for subdomains, MX records for email routing, and TXT records for verification or SPF/DKIM.",
        tags: ["dns", "records"],
      },
      {
        id: "dom-3",
        title: "Transferring a domain to Nisc Cloud",
        summary: "Move an existing domain from another registrar to us.",
        content: "Unlock your domain at your current registrar and request an EPP/Auth code. In your Nisc Cloud panel, go to **Domains → Transfer a Domain**, enter your domain name and the auth code, then complete the order.",
        tags: ["transfer", "epp"],
      },
    ],
  },
  {
    id: "email",
    title: "Business Email",
    description: "Set up and manage professional email addresses for your domain",
    icon: "📧",
    articles: [
      {
        id: "em-1",
        title: "Creating email accounts",
        summary: "Set up professional email addresses on your domain.",
        content: "Navigate to **Email → Email Accounts** in cPanel, click **Create**, enter the desired address (e.g. info@yourdomain.com), set a strong password, and choose a storage quota. The account is ready immediately.",
        tags: ["email", "create"],
      },
      {
        id: "em-2",
        title: "Configuring email on Outlook / Apple Mail",
        summary: "Connect your business email to a desktop or mobile email client.",
        content: "Use IMAP for synced access across devices. Incoming server: **mail.yourdomain.com** port 993 (SSL). Outgoing SMTP: **mail.yourdomain.com** port 465 (SSL). Your username is the full email address.",
        tags: ["outlook", "imap", "client"],
      },
    ],
  },
  {
    id: "ssl",
    title: "SSL Certificates",
    description: "Secure your websites with SSL/TLS certificates",
    icon: "🔒",
    articles: [
      {
        id: "ssl-1",
        title: "Installing a free Let's Encrypt SSL",
        summary: "Enable HTTPS on your website at no cost using AutoSSL.",
        content: "In cPanel, go to **Security → SSL/TLS Status** and click **Run AutoSSL**. It will automatically provision and install a Let's Encrypt certificate for all domains on your account. Certificates auto-renew every 90 days.",
        tags: ["ssl", "letsencrypt", "https"],
      },
      {
        id: "ssl-2",
        title: "Forcing HTTPS redirects",
        summary: "Redirect all HTTP traffic to HTTPS automatically.",
        content: "In cPanel, go to **Domains → Redirects** and set up a permanent (301) redirect from http://yourdomain.com to https://yourdomain.com. Alternatively, add a redirect rule in your .htaccess file.",
        tags: ["https", "redirect"],
      },
    ],
  },
  {
    id: "vps",
    title: "VPS Servers",
    description: "Configure and manage your virtual private servers",
    icon: "🖥️",
    articles: [
      {
        id: "vps-1",
        title: "Connecting to your VPS via SSH",
        summary: "Access your VPS server securely using SSH.",
        content: "Use an SSH client (Terminal on Mac/Linux, PuTTY or Windows Terminal on Windows). Connect with: `ssh root@your-server-ip`. Your IP address and initial credentials were sent to your email after provisioning.",
        tags: ["ssh", "connect"],
      },
      {
        id: "vps-2",
        title: "Rebooting or reinstalling your VPS",
        summary: "Restart or reset your VPS from the control panel.",
        content: "In the Nisc Cloud panel, go to **VPS → Manage → Actions**. You can soft reboot, hard reboot, or reinstall the OS. Note that reinstalling will wipe all data  back up first.",
        tags: ["reboot", "reinstall"],
      },
    ],
  },
  {
    id: "billing",
    title: "Billing & Payments",
    description: "Manage invoices, payment methods, and account balance",
    icon: "💳",
    articles: [
      {
        id: "bill-1",
        title: "Paying via M-Pesa",
        summary: "How to complete payments using M-Pesa on Nisc Cloud.",
        content: "At checkout or on the invoice page, select **M-Pesa** as your payment method. Enter your M-Pesa registered phone number and click **Pay**. You will receive an STK push prompt  enter your M-Pesa PIN to complete payment.",
        tags: ["mpesa", "payment"],
      },
      {
        id: "bill-2",
        title: "Viewing and downloading invoices",
        summary: "Access past invoices from your billing dashboard.",
        content: "Go to **Billing → Invoices** to see all past and pending invoices. Click on any invoice to view details or download a PDF copy. You can also filter by date range or payment status.",
        tags: ["invoice", "billing"],
      },
      {
        id: "bill-3",
        title: "Setting up auto-renewal",
        summary: "Automatically renew services before they expire.",
        content: "In **Billing → Auto-Renew Settings**, toggle on auto-renewal for each service you want to keep active. When enabled, we will charge your saved payment method 3 days before the service expiry date.",
        tags: ["auto-renew", "renewal"],
      },
    ],
  },
  {
    id: "security",
    title: "Security",
    description: "Protect your account and services with security best practices",
    icon: "🛡️",
    articles: [
      {
        id: "sec-1",
        title: "Enabling two-factor authentication (2FA)",
        summary: "Add an extra layer of security to your login.",
        content: "Go to **Settings → Security → Two-Factor Authentication** and click **Enable**. Scan the QR code with an authenticator app (Google Authenticator, Authy). Enter the 6-digit code to confirm and 2FA will be active.",
        tags: ["2fa", "security"],
      },
      {
        id: "sec-2",
        title: "Changing your account password",
        summary: "Update your password to keep your account secure.",
        content: "Navigate to **Settings → Security → Change Password**. Enter your current password, then your new password (minimum 8 characters, mix of letters, numbers, symbols). Click **Save**. All existing sessions will be logged out.",
        tags: ["password", "security"],
      },
    ],
  },
];
