import ServicePageShell from "@/pages/_components/ServicePageShell.tsx";
import { Mail, Shield, Users, Globe, Inbox, Clock, Lock, BarChart2 } from "lucide-react";
import type { ShowcaseBlock } from "@/pages/_components/ServiceShowcaseSection.tsx";

// ─── Hero Illustration ────────────────────────────────────────────────────────

function EmailIllustration() {
  return (
    <div className="space-y-3 select-none">
      {/* Email client mockup */}
      <div className="bg-white dark:bg-card rounded-2xl border border-border/40 shadow-lg overflow-hidden">
        <div className="bg-primary px-5 py-2.5 text-white text-sm font-bold flex items-center justify-between">
          <span className="flex items-center gap-2">
            <Mail size={14} />
            Business Email Inbox
          </span>
          <span className="text-white/70 text-[10px]">info@yourbusiness.co.ke</span>
        </div>
        <div className="p-4 space-y-2">
          {[
            { from: "james@client.co.ke", subj: "Re: Project Proposal - KES 250K", time: "9:42", unread: true },
            { from: "support@bank.co.ke", subj: "Your invoice is ready", time: "8:15", unread: false },
            { from: "orders@supplier.co.ke", subj: "Order #4521 dispatched", time: "Yest", unread: false },
          ].map(({ from, subj, time, unread }) => (
            <div key={from} className={`flex items-start gap-2.5 text-xs p-2 rounded-xl ${unread ? "bg-primary/5 border border-primary/20" : ""}`}>
              <div className="w-7 h-7 rounded-full bg-primary/20 text-primary flex items-center justify-center font-bold shrink-0 text-[10px]">
                {from[0].toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex justify-between">
                  <span className={`truncate ${unread ? "font-bold" : "font-medium"}`}>{from}</span>
                  <span className="text-muted-foreground shrink-0 ml-1">{time}</span>
                </div>
                <div className={`truncate ${unread ? "text-foreground font-semibold" : "text-muted-foreground"}`}>{subj}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Auth status panel */}
      <div className="bg-card rounded-2xl border border-border/40 shadow-md p-4">
        <div className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-3">Email Authentication</div>
        <div className="space-y-2">
          {[
            { check: "DKIM Signature", status: "Passing ✓", color: "text-green-500" },
            { check: "SPF Record", status: "Passing ✓", color: "text-green-500" },
            { check: "DMARC Policy", status: "Enforced ✓", color: "text-green-500" },
            { check: "Spam Score", status: "0.2 / 10 ✓", color: "text-green-500" },
          ].map(({ check, status, color }) => (
            <div key={check} className="flex justify-between text-xs py-1 border-b border-border/20 last:border-0">
              <span className="text-muted-foreground">{check}</span>
              <span className={`font-bold ${color}`}>{status}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-2">
        <div className="bg-primary/5 border border-primary/20 rounded-xl p-2.5 text-center">
          <div className="text-lg font-extrabold text-primary">99.9%</div>
          <div className="text-[9px] text-muted-foreground">Delivery Rate</div>
        </div>
        <div className="bg-primary/5 border border-primary/20 rounded-xl p-2.5 text-center">
          <div className="text-lg font-extrabold text-primary">99%+</div>
          <div className="text-[9px] text-muted-foreground">Spam Caught</div>
        </div>
      </div>
    </div>
  );
}

// ─── Showcase blocks ──────────────────────────────────────────────────────────

const showcaseBlocks: ShowcaseBlock[] = [
  {
    tag: "Professional Email",
    headline: "Look credible in every inbox, everywhere",
    body: "Emails from info@yourbusiness.co.ke are taken 5x more seriously than Gmail or Yahoo addresses. Your branded email signals professionalism before the recipient even reads your message.",
    bullets: [
      "Setup complete in under 30 minutes",
      "Works with Outlook, Gmail app, Apple Mail, and all mobile clients",
      "Shared calendars and group inboxes for your whole team",
    ],
    mockupRight: true,
    mockup: (
      <div className="space-y-3">
        <div className="bg-white dark:bg-card rounded-2xl border border-border/40 shadow-md overflow-hidden">
          <div className="bg-primary px-5 py-2.5 text-white text-sm font-bold">Business Email Inbox</div>
          <div className="p-4 space-y-2.5">
            {[
              { from: "james@client.co.ke", subj: "Re: Project Proposal", time: "9:42", unread: true },
              { from: "support@bank.co.ke", subj: "Your invoice is ready", time: "8:15", unread: false },
              { from: "newsletter@industry.com", subj: "Weekly digest", time: "Yest", unread: false },
            ].map(({ from, subj, time, unread }) => (
              <div key={from} className={`flex items-start gap-2.5 text-xs p-2 rounded-xl ${unread ? "bg-primary/5 border border-primary/20" : ""}`}>
                <div className="w-7 h-7 rounded-full bg-primary/20 text-primary flex items-center justify-center font-bold shrink-0 text-[10px]">
                  {from[0].toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between">
                    <span className={`truncate ${unread ? "font-bold" : "font-medium"}`}>{from}</span>
                    <span className="text-muted-foreground shrink-0 ml-1">{time}</span>
                  </div>
                  <div className={`truncate ${unread ? "text-foreground font-semibold" : "text-muted-foreground"}`}>{subj}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    ),
  },
  {
    tag: "Deliverability",
    headline: "Your emails land in inboxes, not spam",
    body: "We configure DKIM, SPF, and DMARC for every account. These technical standards tell Gmail, Outlook, and other providers that your emails are legitimate - dramatically improving inbox delivery rates.",
    bullets: [
      "99%+ email delivery rate across all major providers",
      "DKIM, SPF, and DMARC configured on setup day",
      "SpamExperts AI-powered inbound filtering with 99% spam caught",
    ],
    mockupRight: false,
    mockup: (
      <div className="space-y-3">
        <div className="bg-white dark:bg-card rounded-2xl p-4 border border-border/40 shadow-md">
          <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-3">Email Authentication Status</div>
          <div className="space-y-2.5">
            {[
              { check: "DKIM Signature", status: "Passing ✓", color: "text-green-500" },
              { check: "SPF Record", status: "Passing ✓", color: "text-green-500" },
              { check: "DMARC Policy", status: "Enforced ✓", color: "text-green-500" },
              { check: "Spam Score", status: "0.2 / 10 ✓", color: "text-green-500" },
            ].map(({ check, status, color }) => (
              <div key={check} className="flex justify-between text-xs">
                <span className="text-muted-foreground">{check}</span>
                <span className={`font-bold ${color}`}>{status}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div className="bg-white dark:bg-card rounded-xl border border-border/40 shadow p-3 text-center">
            <div className="text-xl font-extrabold text-primary">99.9%</div>
            <div className="text-[10px] text-muted-foreground">Delivery rate</div>
          </div>
          <div className="bg-white dark:bg-card rounded-xl border border-border/40 shadow p-3 text-center">
            <div className="text-xl font-extrabold text-primary">99%</div>
            <div className="text-[10px] text-muted-foreground">Spam caught</div>
          </div>
        </div>
      </div>
    ),
  },
];

export default function EmailHostingPage() {
  return (
    <ServicePageShell
      badge="Business Email Hosting"
      headline={<>Professional Email That <span className="text-primary">Builds Trust</span> with Every Message</>}
      subtext="Send email from your own domain - you@yourbusiness.co.ke. Enterprise spam filtering, generous mailbox storage, and 99.9% delivery reliability for Kenyan businesses."
      serviceType="hosting"
      heroIllustration={<EmailIllustration />}
      heroTrustBadge={{ line1: "DKIM, SPF and DMARC configured", line2: "Setup in under 30 minutes" }}
      trustStats={[
        { value: "2,000+", label: "Business Mailboxes Active" },
        { value: "99.9%", label: "Email Delivery Rate" },
        { value: "99%+", label: "Spam Catch Rate" },
        { value: "24/7", label: "Email Support" },
      ]}
      features={[
        {
          icon: <Mail size={20} />,
          title: "Your Own Domain Email",
          desc: "Create professional email addresses like info@yourcompany.co.ke, sales@yourcompany.co.ke, and support@yourcompany.co.ke. Look credible to every client and partner.",
        },
        {
          icon: <Shield size={20} />,
          title: "Enterprise Spam and Virus Filtering",
          desc: "SpamExperts-powered multi-layer filtering catches 99%+ of spam and scans every inbound email for viruses and malware before they reach your inbox.",
        },
        {
          icon: <Users size={20} />,
          title: "Shared Calendars and Contacts",
          desc: "Collaborate with your team using shared calendars, group contacts, and distribution lists. Schedule meetings, share availability, and stay coordinated across your company.",
        },
        {
          icon: <Globe size={20} />,
          title: "Webmail Access from Anywhere",
          desc: "Access your email from any browser via our modern Roundcube and Horde webmail clients. Work from Nairobi, Mombasa, or wherever your business takes you.",
        },
        {
          icon: <Inbox size={20} />,
          title: "IMAP/POP3/SMTP Support",
          desc: "Connect Outlook, Gmail app, Apple Mail, or any email client using standard IMAP/SMTP settings. Full mobile sync keeps your phone, tablet, and desktop in perfect harmony.",
        },
        {
          icon: <Clock size={20} />,
          title: "Email Archiving and Backup",
          desc: "Every email is archived and retained. Quickly search and restore deleted emails. Business and Pro plans include extended archiving for compliance and audit requirements.",
        },
        {
          icon: <Lock size={20} />,
          title: "DKIM, SPF and DMARC Configured",
          desc: "We configure DKIM signatures, SPF records, and DMARC policies for you. Your emails land in inboxes - not spam folders - at major providers like Gmail and Outlook.",
        },
        {
          icon: <BarChart2 size={20} />,
          title: "Email Delivery Reports",
          desc: "Track sent, delivered, bounced, and spam-flagged emails. Identify delivery issues before they impact your business communications and customer relationships.",
        },
      ]}
      plans={[
        {
          id: "email-starter",
          name: "Email Starter",
          price: 250,
          period: "mo",
          features: [
            "5 Mailboxes",
            "5 GB Storage per Mailbox",
            "Webmail Access",
            "IMAP/POP3/SMTP",
            "Spam and Virus Filtering",
            "DKIM/SPF Setup",
            "Mobile Sync",
            "Email Support",
          ],
        },
        {
          id: "email-business-popular",
          name: "Email Business",
          price: 500,
          period: "mo",
          features: [
            "25 Mailboxes",
            "15 GB Storage per Mailbox",
            "Webmail Access",
            "IMAP/POP3/SMTP",
            "Enterprise Spam Filtering",
            "DKIM/SPF/DMARC Setup",
            "Mobile Sync",
            "Shared Calendars",
            "Shared Contacts and Groups",
            "Distribution Lists",
            "30-Day Email Archiving",
            "Priority Support",
          ],
        },
        {
          id: "email-pro",
          name: "Email Pro",
          price: 1200,
          period: "mo",
          features: [
            "Unlimited Mailboxes",
            "50 GB Storage per Mailbox",
            "Webmail Access",
            "IMAP/POP3/SMTP",
            "Enterprise Spam Filtering",
            "DKIM/SPF/DMARC Setup",
            "Mobile Sync",
            "Shared Calendars",
            "Shared Contacts and Groups",
            "Distribution Lists",
            "1-Year Email Archiving",
            "Email Delivery Reporting",
            "Email Encryption (S/MIME)",
            "Dedicated Account Manager",
          ],
        },
      ]}
      addons={[
        { id: "email-addon-archiving", label: "Extended Archiving (3 years)", price: 300, period: "mo" },
        { id: "email-addon-encryption", label: "S/MIME Email Encryption", price: 200, period: "mo" },
      ]}
      process={[
        { num: "01", title: "Choose Your Plan", desc: "Pick a plan based on how many team members need email. All plans include spam filtering, webmail, and IMAP sync. Scale mailboxes as your team grows." },
        { num: "02", title: "Connect Your Domain", desc: "Point your domain's MX records to our mail servers. We provide step-by-step instructions and complete the setup for you if preferred." },
        { num: "03", title: "Create Your Mailboxes", desc: "From your control panel, create mailboxes for every team member in seconds. Set aliases, forwarding rules, and group inboxes as needed." },
        { num: "04", title: "Configure Your Devices", desc: "Connect Outlook, Apple Mail, or any mobile email app using our simple setup guides. We will help your team configure devices remotely if needed." },
      ]}
      whyPoints={[
        { title: "Builds Immediate Credibility", desc: "Emails from you@yourbusiness.co.ke are taken 5x more seriously than Gmail or Yahoo addresses. Land bigger clients by looking established from day one." },
        { title: "Deliverability-First Infrastructure", desc: "Our mail servers maintain pristine IP reputation. DKIM, SPF, and DMARC are configured for you, ensuring your emails reach inboxes - not junk folders." },
        { title: "99% Spam Catch Rate", desc: "SpamExperts AI-powered filtering catches 99%+ of inbound spam and malware. Your team spends less time cleaning their inbox and more time doing real work." },
        { title: "Works with Any Device or App", desc: "Standard IMAP/SMTP means your email works perfectly with Outlook, Gmail app, Apple Mail, Thunderbird, Android, or iOS - no proprietary clients required." },
        { title: "Scales as Your Team Grows", desc: "Add new mailboxes in seconds from your dashboard. No support tickets, no waiting. Grow from 5 to 500 employees without migrating email providers." },
        { title: "Kenyan Support Who Understand Business Email", desc: "Our team has configured email for hundreds of Kenyan businesses. Whether it's M-Pesa notification forwarding or complex routing rules, we have seen it before." },
      ]}
      faqs={[
        { q: "Can I migrate from Gmail Workspace or Microsoft 365?", a: "Yes. We migrate your existing emails, contacts, and calendars from Gmail Workspace, Microsoft 365, or any IMAP provider. Migration is free and completed without data loss." },
        { q: "Can I use this with Outlook on Windows?", a: "Yes. We provide easy Outlook setup guides for all versions of Outlook (2016, 2019, 2021, 365). Your email, calendar, and contacts all sync seamlessly." },
        { q: "How is my email secured?", a: "All email is encrypted in transit using TLS. We configure DKIM, SPF, and DMARC to prevent spoofing. Two-factor authentication is available for all webmail accounts." },
        { q: "Can I create email aliases (e.g. info@ going to multiple mailboxes)?", a: "Yes. Unlimited email aliases and forwarding rules are included on all plans. Set info@yourbusiness.co.ke to deliver to your entire sales team simultaneously." },
        { q: "What happens to my emails if I cancel?", a: "We provide a 30-day offboarding window where you can export all your email data in standard MBOX format. We never delete your data without giving you time to retrieve it." },
        { q: "Do you support bulk or transactional email sending?", a: "Our business email plans are designed for team communication. For bulk marketing emails or transactional sending (invoices, receipts), we recommend our separate email marketing service." },
      ]}
      pricingNote="Prices in KES per month. Annual billing saves 20%. Additional mailboxes can be added a la carte."
      ctaHeadline="Stop Sending Business Emails from Gmail. Look Professional."
      ctaSubtext="2,000+ Kenyan professionals already use Nisc Cloud Business Email. Set up your branded email in under 30 minutes today."
      showcaseBlocks={showcaseBlocks}
    />
  );
}
