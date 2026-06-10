import { useState } from "react";
import { motion } from "motion/react";
import { Search, ChevronRight, BookOpen, Server, Mail, Globe, Shield, Zap, HelpCircle, ExternalLink, ChevronDown } from "lucide-react";
import { Input } from "@/components/ui/input.tsx";
import { Badge } from "@/components/ui/badge.tsx";
import { cn } from "@/lib/utils.ts";
import Navbar from "@/pages/_components/Navbar.tsx";
import Footer from "@/pages/_components/Footer.tsx";

// ─── Types ────────────────────────────────────────────────────────────────────

type Article = {
  title: string;
  summary: string;
  content: string;
  tags: string[];
};

type Category = {
  id: string;
  label: string;
  icon: React.ReactNode;
  color: string;
  articles: Article[];
};

// ─── Data ─────────────────────────────────────────────────────────────────────

const categories: Category[] = [
  {
    id: "hosting",
    label: "Shared Hosting",
    icon: <Server size={18} />,
    color: "oklch(0.60 0.22 235)",
    articles: [
      {
        title: "How to create a new email account in cPanel",
        summary: "Step-by-step guide to creating business email addresses in your hosting control panel.",
        content: `Log into your cPanel dashboard at yourdomain.co.ke/cpanel. Navigate to the Email section and click Email Accounts. Click Create. Enter the email address (e.g. info), select your domain, set a strong password, and choose a storage quota. Click Create Account. Your new email is ready within seconds and can be accessed via webmail or configured in Outlook, Gmail app, or any IMAP client.`,
        tags: ["email", "cpanel", "setup"],
      },
      {
        title: "How to point your domain to Nisc Cloud hosting",
        summary: "Update your domain's nameservers to connect it to your hosting account.",
        content: `Log into the registrar where you purchased your domain. Find DNS or Nameserver settings. Replace existing nameservers with: ns1.nisccloud.co.ke and ns2.nisccloud.co.ke. Save the changes. DNS propagation takes 24 to 48 hours globally, though most visitors see the change within 2 to 4 hours. You can test propagation at dnschecker.org.`,
        tags: ["domain", "dns", "nameservers"],
      },
      {
        title: "How to install WordPress on your hosting account",
        summary: "One-click WordPress installation using Softaculous in cPanel.",
        content: `In your cPanel dashboard, scroll to the Software section and click Softaculous Apps Installer. Click WordPress. Click Install Now. Fill in your domain, site name, admin username, and password. Select your preferred language and click Install. WordPress will be live on your domain within 2 to 3 minutes. Your admin panel is accessible at yourdomain.co.ke/wp-admin.`,
        tags: ["wordpress", "install", "cpanel"],
      },
      {
        title: "How to upload files via File Manager",
        summary: "Upload HTML files, images, and assets directly through cPanel File Manager.",
        content: `In cPanel, open File Manager. Navigate to the public_html folder - this is your website's root directory. Click Upload in the top menu. Drag and drop your files or click Select File to browse. Files upload immediately. For websites, ensure your main file is named index.html or index.php. For WordPress sites, use File Manager only for uploads and themes - avoid editing core files.`,
        tags: ["file manager", "upload", "cpanel"],
      },
    ],
  },
  {
    id: "domains",
    label: "Domains",
    icon: <Globe size={18} />,
    color: "oklch(0.55 0.18 195)",
    articles: [
      {
        title: "How to register a .co.ke domain name",
        summary: "Register a Kenyan domain name for your business in minutes.",
        content: `Visit nisccloud.co.ke and use the domain search bar to check availability for your preferred .co.ke name. Add it to your cart. Complete the checkout and provide your contact details (WHOIS information). Your domain is registered within minutes and you will receive a confirmation email. You can then point it to any hosting account or set up DNS records from your domain dashboard.`,
        tags: ["domain", "registration", ".co.ke"],
      },
      {
        title: "How to set up DNS records for your domain",
        summary: "A and CNAME records explained - point your domain to any service.",
        content: `Log into your Nisc Cloud dashboard and select your domain. Go to DNS Management. To point your domain to a hosting server, add an A Record with the name @ and the value set to your server's IP address. To point www to your main domain, add a CNAME Record with name www pointing to yourdomain.co.ke. For email, you will need MX records - your hosting provider supplies these. Changes take up to 24 hours to propagate.`,
        tags: ["dns", "a record", "cname", "mx"],
      },
      {
        title: "How to enable Auto-Renewal for your domain",
        summary: "Never let your domain expire accidentally - enable auto-renewal today.",
        content: `In your Nisc Cloud account, navigate to My Domains. Click on the domain you want to protect. Click Domain Settings. Toggle Auto-Renewal to ON. Ensure your payment method is up to date under Billing. We will automatically renew your domain 30 days before expiry and send you a notification email. You will also receive reminders at 60, 30, and 7 days before expiry even with auto-renewal enabled.`,
        tags: ["auto-renewal", "domain", "expiry"],
      },
    ],
  },
  {
    id: "email",
    label: "Business Email",
    icon: <Mail size={18} />,
    color: "oklch(0.58 0.22 300)",
    articles: [
      {
        title: "How to set up your business email in Outlook",
        summary: "Configure your Nisc Cloud email in Microsoft Outlook using IMAP.",
        content: `Open Outlook and go to File > Add Account. Enter your full email address (e.g. info@yourbusiness.co.ke) and click Connect. Select IMAP. Enter incoming server: mail.nisccloud.co.ke, Port: 993, SSL/TLS. Enter outgoing server: mail.nisccloud.co.ke, Port: 587, STARTTLS. Enter your email password. Click Connect. Your emails will sync within a few minutes. Contact support if you need your exact server details.`,
        tags: ["outlook", "imap", "setup", "email"],
      },
      {
        title: "How to set up email on your iPhone or Android",
        summary: "Add your business email to your mobile phone in under 5 minutes.",
        content: `On iPhone: Go to Settings > Mail > Accounts > Add Account > Other. Tap Add Mail Account. Enter your name, email address, password, and a description. Select IMAP. For incoming server: mail.nisccloud.co.ke (port 993, SSL). For outgoing server: mail.nisccloud.co.ke (port 587, SSL). Tap Save. On Android: Open Gmail > Settings > Add account > Other. Follow the same IMAP settings above. Your emails will appear in your phone's mail app within minutes.`,
        tags: ["mobile", "iphone", "android", "email setup"],
      },
      {
        title: "Why are my emails going to spam?",
        summary: "Troubleshoot email deliverability issues and fix common spam problems.",
        content: `The most common reasons emails go to spam: (1) Missing DKIM, SPF, or DMARC records - contact support and we will configure these for you free of charge. (2) Sending bulk or promotional emails from your business email account - use a dedicated email marketing service instead. (3) Your email content contains spam trigger words like "FREE!!!" or "CLICK HERE NOW". (4) Your recipient's mailbox is full. (5) Low sender reputation - avoid sending to invalid email addresses. Contact our support team and we will audit your email authentication settings at no cost.`,
        tags: ["spam", "deliverability", "dkim", "spf"],
      },
    ],
  },
  {
    id: "ssl",
    label: "SSL Certificates",
    icon: <Shield size={18} />,
    color: "oklch(0.52 0.18 145)",
    articles: [
      {
        title: "How to install an SSL certificate on cPanel",
        summary: "Step-by-step SSL installation for your cPanel hosting account.",
        content: `Free Let's Encrypt SSL: In cPanel, go to Security > SSL/TLS Status. Click Run AutoSSL. This installs a free SSL certificate on all your domains automatically. Paid SSL certificates: Once you receive your certificate files from us, go to cPanel > Security > SSL/TLS > Manage SSL Sites. Select your domain, paste in your Certificate (CRT), Private Key, and CA Bundle. Click Install Certificate. Your site will now load on HTTPS. Contact our team if you need us to handle the full installation - it is included free with every certificate purchase.`,
        tags: ["ssl", "installation", "cpanel", "https"],
      },
      {
        title: "What is the difference between HTTP and HTTPS?",
        summary: "Why your website needs HTTPS and what happens without it.",
        content: `HTTP (HyperText Transfer Protocol) is the standard for transferring data between browsers and websites. HTTPS is the secure version - it encrypts all data using SSL/TLS so third parties cannot intercept or read it. Without HTTPS: Google Chrome shows a "Not Secure" warning in your address bar, Google ranks your site lower in search results, customers see a warning page before entering your site, and M-Pesa payment integrations will not work. With HTTPS: customers see the padlock icon, your Google ranking improves, data is encrypted end-to-end, and you are PCI-DSS compliant for payment processing.`,
        tags: ["http", "https", "security", "google"],
      },
    ],
  },
  {
    id: "vps",
    label: "VPS Servers",
    icon: <Zap size={18} />,
    color: "oklch(0.58 0.20 265)",
    articles: [
      {
        title: "How to connect to your VPS via SSH",
        summary: "Access your VPS server using SSH from Windows, Mac, or Linux.",
        content: `You will receive your VPS IP address, username (root), and initial password by email after provisioning. On Mac or Linux: Open Terminal and type: ssh root@YOUR_IP_ADDRESS. Enter your password when prompted. On Windows: Download PuTTY (putty.org). Enter your IP address in the Host Name field. Port 22, Connection type SSH. Click Open. Enter root as username and your password. For security, we strongly recommend adding an SSH key pair and disabling password authentication after your first login.`,
        tags: ["ssh", "vps", "access", "terminal"],
      },
      {
        title: "How to install LAMP stack on Ubuntu VPS",
        summary: "Install Apache, MySQL, and PHP on your Ubuntu VPS in under 10 minutes.",
        content: `After connecting via SSH, run these commands in order: sudo apt update && sudo apt upgrade -y (update packages). sudo apt install apache2 -y (install Apache web server). sudo apt install mysql-server -y (install MySQL). sudo mysql_secure_installation (secure your MySQL installation). sudo apt install php libapache2-mod-php php-mysql -y (install PHP). sudo systemctl restart apache2 (restart Apache). Your LAMP stack is now running. Test it by visiting your server IP in a browser - you should see the Apache default page. Upload your website files to /var/www/html/.`,
        tags: ["lamp", "apache", "mysql", "php", "ubuntu"],
      },
    ],
  },
  {
    id: "billing",
    label: "Billing and Payments",
    icon: <BookOpen size={18} />,
    color: "oklch(0.60 0.22 30)",
    articles: [
      {
        title: "How to pay for your hosting with M-Pesa",
        summary: "Complete your payment using M-Pesa Paybill or STK push.",
        content: `We accept M-Pesa payments via two methods. STK Push (recommended): During checkout, select M-Pesa, enter your phone number, and click Pay. You will receive a payment prompt on your phone. Enter your M-Pesa PIN to complete payment. Paybill: Go to M-Pesa > Lipa na M-Pesa > Pay Bill. Business Number: [our Paybill number]. Account Number: Your invoice number or order number. Amount: As shown on your invoice. Enter your PIN and send. Payments are confirmed within 1 to 5 minutes. You will receive an email and SMS confirmation.`,
        tags: ["m-pesa", "payment", "billing"],
      },
      {
        title: "How to download your invoice",
        summary: "Access and download your invoices from your client dashboard.",
        content: `Log into your Nisc Cloud client dashboard. Click Billing in the left menu. Select Invoices. Find the invoice you need and click View or Download PDF. All invoices are available immediately after payment. For corporate clients requiring official tax invoices with our KRA PIN, click Request Tax Invoice on any invoice and it will be generated and emailed to you within 1 business day. For bulk invoice requests or statements, contact billing@nisccloud.co.ke.`,
        tags: ["invoice", "billing", "download"],
      },
    ],
  },
];

// ─── ArticleExpander ──────────────────────────────────────────────────────────

function ArticleCard({ article, accentColor }: { article: Article; accentColor: string }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="rounded-2xl border border-border bg-card overflow-hidden hover:border-primary/30 transition-colors">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-start justify-between px-5 py-4 text-left gap-3 cursor-pointer"
      >
        <div className="flex-1 min-w-0">
          <div className="font-semibold text-sm text-foreground mb-0.5">{article.title}</div>
          <div className="text-xs text-muted-foreground leading-relaxed">{article.summary}</div>
        </div>
        <ChevronDown
          size={16}
          className={cn("shrink-0 text-muted-foreground mt-0.5 transition-transform duration-200", open && "rotate-180")}
        />
      </button>
      {open && (
        <div className="px-5 pb-5 border-t border-border/50">
          <div className="pt-4 text-sm text-muted-foreground leading-relaxed whitespace-pre-line">
            {article.content}
          </div>
          <div className="flex flex-wrap gap-1.5 mt-4">
            {article.tags.map((tag) => (
              <span
                key={tag}
                className="text-[10px] font-medium px-2 py-0.5 rounded-full"
                style={{ background: `${accentColor}15`, color: accentColor }}
              >
                {tag}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function HelpCentrePage() {
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState<string | null>(null);

  const filtered = categories
    .map((cat) => ({
      ...cat,
      articles: cat.articles.filter((a) =>
        !search ||
        a.title.toLowerCase().includes(search.toLowerCase()) ||
        a.summary.toLowerCase().includes(search.toLowerCase()) ||
        a.tags.some((t) => t.toLowerCase().includes(search.toLowerCase()))
      ),
    }))
    .filter((cat) => {
      if (activeCategory && cat.id !== activeCategory) return false;
      if (search) return cat.articles.length > 0;
      return true;
    });

  const totalArticles = categories.reduce((sum, c) => sum + c.articles.length, 0);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navbar />

      {/* Hero */}
      <section className="pt-28 pb-16 px-4 relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none" style={{ background: "radial-gradient(ellipse 80% 60% at 50% 0%, oklch(0.92 0.06 235 / 0.20) 0%, transparent 70%)" }} />
        <div className="max-w-3xl mx-auto text-center relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <span className="inline-block bg-primary/10 text-primary text-xs font-bold uppercase tracking-widest px-4 py-1.5 rounded-full mb-5">
              Help Centre
            </span>
            <h1 className="text-4xl md:text-5xl font-extrabold mb-4 text-balance">
              How can we help you?
            </h1>
            <p className="text-lg text-muted-foreground mb-8 max-w-xl mx-auto">
              Guides, tutorials, and answers for every Nisc Cloud service. {totalArticles} articles across {categories.length} categories.
            </p>

            {/* Search */}
            <div className="relative max-w-xl mx-auto">
              <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search articles... e.g. 'install WordPress' or 'M-Pesa'"
                className="pl-12 h-13 text-base rounded-2xl border-border/60 focus:border-primary/50 bg-card shadow-sm"
              />
            </div>
          </motion.div>
        </div>
      </section>

      {/* Category filter tabs */}
      <section className="border-y border-border/50 bg-muted/20 sticky top-16 z-20">
        <div className="max-w-7xl mx-auto px-4 md:px-8">
          <div className="flex gap-1 overflow-x-auto py-3 scrollbar-hide">
            <button
              onClick={() => setActiveCategory(null)}
              className={cn(
                "shrink-0 px-4 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer",
                !activeCategory ? "bg-primary text-primary-foreground shadow" : "text-muted-foreground hover:text-foreground hover:bg-muted"
              )}
            >
              All Topics
            </button>
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(activeCategory === cat.id ? null : cat.id)}
                className={cn(
                  "shrink-0 flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer",
                  activeCategory === cat.id ? "bg-primary text-primary-foreground shadow" : "text-muted-foreground hover:text-foreground hover:bg-muted"
                )}
              >
                {cat.icon}
                {cat.label}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Articles */}
      <section className="max-w-7xl mx-auto px-4 md:px-8 py-12">
        {filtered.length === 0 ? (
          <div className="text-center py-20">
            <HelpCircle size={40} className="mx-auto text-muted-foreground/50 mb-4" />
            <h3 className="font-semibold text-lg mb-2">No articles found</h3>
            <p className="text-muted-foreground text-sm">Try a different search term or browse all categories.</p>
          </div>
        ) : (
          <div className="space-y-12">
            {filtered.map((cat, ci) => (
              <motion.div
                key={cat.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: ci * 0.06 }}
              >
                {/* Category header */}
                <div className="flex items-center gap-3 mb-5">
                  <div
                    className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
                    style={{ background: `${cat.color}18`, color: cat.color }}
                  >
                    {cat.icon}
                  </div>
                  <div>
                    <h2 className="font-bold text-lg">{cat.label}</h2>
                    <p className="text-xs text-muted-foreground">{cat.articles.length} {cat.articles.length === 1 ? "article" : "articles"}</p>
                  </div>
                  <Badge variant="secondary" className="ml-auto text-xs">{cat.articles.length}</Badge>
                </div>

                {/* Articles grid */}
                <div className="grid md:grid-cols-2 gap-3">
                  {cat.articles.map((article) => (
                    <ArticleCard key={article.title} article={article} accentColor={cat.color} />
                  ))}
                </div>
              </motion.div>
            ))}
          </div>
        )}

        {/* Support CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mt-16 rounded-3xl border border-border p-8 text-center relative overflow-hidden"
          style={{ background: "linear-gradient(135deg, oklch(0.60 0.22 235 / 0.08) 0%, oklch(0.55 0.18 195 / 0.05) 100%)" }}
        >
          <HelpCircle size={32} className="mx-auto text-primary mb-3" />
          <h3 className="text-xl font-bold mb-2">Can't find what you're looking for?</h3>
          <p className="text-muted-foreground text-sm mb-6 max-w-md mx-auto">
            Our Nairobi-based support team is available 24/7 via WhatsApp, live chat, and email. Average response time: under 5 minutes.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <a
              href="https://wa.me/254700000000?text=Hi%20Nisc%20Cloud%2C%20I%20need%20help%20with..."
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 bg-[#25D366] text-white font-semibold px-6 py-2.5 rounded-2xl text-sm hover:opacity-90 transition-opacity cursor-pointer"
            >
              <ChevronRight size={15} />
              Chat on WhatsApp
            </a>
            <a
              href="/contact"
              className="inline-flex items-center gap-2 bg-primary text-primary-foreground font-semibold px-6 py-2.5 rounded-2xl text-sm hover:opacity-90 transition-opacity cursor-pointer"
            >
              <ExternalLink size={15} />
              Open a Support Ticket
            </a>
          </div>
        </motion.div>
      </section>

      <Footer />
    </div>
  );
}
