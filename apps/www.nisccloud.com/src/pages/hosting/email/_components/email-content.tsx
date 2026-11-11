import {
  ComparisonTable,
  ContentBand,
  Glossary,
  PlanFitGrid,
  Prose,
  RelatedLinks,
  StepList,
  type PlanFit,
} from "@/pages/_components/ContentBlocks.tsx";
import { MailRecordsArt } from "./MailRecordsArt.tsx";

const PLAN_FIT: PlanFit[] = [
  {
    name: "Essentials",
    level: 1,
    bestFor: "Sole traders and small teams",
    chooseIf: "You need a few branded addresses such as info@ and your own name, with room to add colleagues.",
  },
  {
    name: "Business",
    level: 2,
    bestFor: "Growing teams",
    chooseIf: "Your team is adding people and shares a lot of attachments, so you want more mailboxes and storage.",
    recommended: true,
  },
  {
    name: "Scale",
    level: 3,
    bestFor: "Larger teams and departments",
    chooseIf: "Several departments need their own addresses and long mail history.",
  },
  {
    name: "Corporate",
    level: 4,
    bestFor: "More than 100 mailboxes",
    chooseIf: "You need custom storage or mailbox counts, or a planned move from your current provider.",
  },
];

/** Shown straight after the plan cards, while visitors are deciding. */
export function EmailPlanFit() {
  return (
    <ContentBand
      id="which-plan"
      label="Choosing a plan"
      title="Which business email plan fits your team?"
      answer="Choose by the number of mailboxes and the storage your team needs. Essentials suits sole traders and small teams, Business suits growing teams, Scale suits larger teams and departments, and Corporate is quoted for more than 100 mailboxes."
    >
      <PlanFitGrid
        plans={PLAN_FIT}
        contactHref="/contact?serviceName=Business%20Email"
        note={
          <>
            <span className="font-semibold">Every plan</span> includes email on your own domain, the AI writing
            assistant, spam, virus and phishing filtering, DKIM, SPF and DMARC set up for you, aliases and forwarding,
            daily backups and free migration. Plans differ by mailbox count and storage.
          </>
        }
      />
    </ContentBand>
  );
}

/** Shown after the showcase, for visitors weighing Nisc Mail against the big suites. */
export function EmailComparison() {
  return (
    <ContentBand
      id="compare-email"
      tone="muted"
      label="Compare"
      title="Nisc Mail, Microsoft 365 or Google Workspace?"
      answer="Choose Nisc Mail when your team mainly needs professional email at a lower cost. Choose Microsoft 365 or Google Workspace when people also need office apps, shared drives and video calls. Mixed teams can combine them on one domain with Hybrid Email."
    >
      <ComparisonTable
        caption="Comparison of Nisc Mail business email, Microsoft 365 and Google Workspace"
        highlight={0}
        links
        columns={[
          { title: "Nisc Mail", href: "#plans" },
          { title: "Microsoft 365", href: "/hosting/microsoft-365" },
          { title: "Google Workspace", href: "/hosting/google-workspace" },
        ]}
        rows={[
          {
            label: "Best for",
            cells: [
              "Teams that mainly need professional email on their domain",
              "Teams that work in Outlook, Word, Excel and Teams",
              "Teams that work in Gmail, Docs, Drive and Meet",
            ],
          },
          {
            label: "Included",
            cells: [
              "Email, AI writing help, filtering and daily backups",
              "Email plus Microsoft office apps and OneDrive, depending on licence",
              "Email plus Google apps and Drive storage, depending on edition",
            ],
          },
          {
            label: "Works with",
            cells: [
              "The Nisc Mail client, Outlook, Thunderbird and phone mail apps over IMAP",
              "Outlook and Microsoft apps",
              "Gmail and Google apps",
            ],
          },
          {
            label: "Cost focus",
            cells: [
              "Built to keep the cost per mailbox low",
              "Licence per user, priced by Microsoft plan",
              "Licence per user, priced by Google edition",
            ],
          },
        ]}
      />
      <RelatedLinks
        className="mt-6"
        links={[
          { label: "Mix both with Hybrid Email", href: "/hosting/hybrid-email" },
          { label: "Compare all cloud products", href: "/hosting" },
        ]}
      />
    </ContentBand>
  );
}

/** Shown after the buying steps: what setup involves, with the records explained. */
export function EmailSetup() {
  return (
    <ContentBand
      id="set-up-business-email"
      label="Setting up"
      title="How to set up business email on your domain"
      answer="Choose a plan, point your domain's mail records to Nisc Mail, create your mailboxes and sign in on your devices. We set up the DKIM, SPF and DMARC records for you."
    >
      <div className="mt-10 grid gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] lg:items-start lg:gap-16">
        <div>
          <StepList
            steps={[
              "Choose a plan with enough mailboxes for your team.",
              "Point your domain's MX record to Nisc Mail. We send the exact values, or set them up for you.",
              "We add the SPF, DKIM and DMARC records that prove your mail really comes from you.",
              "Create mailboxes, aliases such as info@ and sales@, and any forwarding you need.",
              "Sign in with the Nisc Mail client, or add the account to Outlook or your phone's mail app.",
            ]}
          />
          <p className="mt-6 max-w-[65ch] text-[15px] leading-relaxed text-muted-foreground">
            Moving from another provider? Migration is free. Tell us where your mail is now and how many mailboxes you have, and we agree
            what moves across and when your domain switches over.
          </p>
          <RelatedLinks className="mt-5" links={[{ label: "Register or transfer a domain", href: "/hosting/domains" }]} />
        </div>
        <MailRecordsArt />
      </div>
    </ContentBand>
  );
}

/** Reference content near the end of the page, for visitors researching before they buy. */
export function EmailExplained() {
  return (
    <ContentBand
      id="business-email-explained"
      tone="muted"
      label="Business email explained"
      title="What is business email hosting?"
      answer="Business email hosting gives your team email addresses on your own domain, such as you@yourbusiness.co.ke, run on a provider's mail servers with spam filtering, security records and backups, instead of a free Gmail or Yahoo address."
    >
      <div className="mt-10 grid gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] lg:gap-16">
        <div className="space-y-10">
          <Prose
            paragraphs={[
              "Customers judge a business by its email address. A quote from sales@yourbusiness.co.ke looks established; the same quote from a free address can look like a side project, and is easier for scammers to imitate.",
              "Business email also keeps company mail under company control. When someone leaves, their mailbox stays with the business, and you can forward or reassign it instead of losing customer conversations.",
            ]}
          />
          <div>
            <h3 className="type-h3">Do I need a website to have business email?</h3>
            <p className="mt-3 max-w-[70ch] border-l-4 border-primary pl-4 text-base font-medium leading-relaxed text-foreground md:text-[17px]">
              No. You only need a domain name. Your website can stay where it is, or you can add one later.
            </p>
            <Prose
              className="mt-4"
              paragraphs={[
                "If you want a website and email together, Web Hosting includes email hosting in one package. Choose Business Email when you only need mailboxes, or want email separate from your website.",
              ]}
            />
            <RelatedLinks className="mt-5" links={[{ label: "Web Hosting with email included", href: "/hosting/web-hosting" }]} />
          </div>
        </div>
        <div>
          <h3 className="type-h3 mb-4">Business email terms explained</h3>
          <Glossary
            items={[
              { term: "MX record", desc: "The domain setting that tells the internet which servers receive your email." },
              { term: "SPF", desc: "A list of servers allowed to send email for your domain." },
              { term: "DKIM", desc: "A digital signature on every message, proving it was not changed on the way." },
              { term: "DMARC", desc: "Tells receiving inboxes what to do with mail that fails SPF or DKIM checks." },
              { term: "IMAP", desc: "Keeps your folders in step on every device, so a message read on your phone shows as read on your laptop." },
              { term: "Alias", desc: "An extra address, such as info@, that delivers into an existing mailbox." },
              { term: "Forwarding", desc: "Automatically sends a copy of incoming mail to another address." },
              { term: "Phishing", desc: "Fake email that tries to trick people into sharing passwords or paying money." },
            ]}
          />
        </div>
      </div>
    </ContentBand>
  );
}
