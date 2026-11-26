import { Link } from "react-router-dom";
import { LegalPageShell, type TocItem } from "../_components/LegalPageShell.tsx";
import { relatedLegalDocuments } from "../_components/legal-documents.ts";
import { ACCEPTABLE_USE_RULES, ENFORCEMENT_ACTIONS, PROHIBITED_CONDUCT } from "../_components/acceptable-use-rules.ts";

const toc: TocItem[] = [
  { id: "scope", label: "1. Who this policy applies to" },
  { id: "not-allowed", label: "2. Content and activity not allowed" },
  { id: "conduct", label: "3. Prohibited conduct" },
  { id: "monitoring", label: "4. Monitoring" },
  { id: "enforcement", label: "5. Enforcement" },
  { id: "report", label: "6. Reporting abuse" },
  { id: "changes", label: "7. Changes" },
  { id: "contact", label: "8. Contact" },
];

export default function AcceptableUsePolicyPage() {
  return (
    <LegalPageShell
      title="Acceptable Use Policy"
      subtitle="What you can and cannot host, send or run on Nisc Cloud hosting, email, servers, domains and nPanel."
      effectiveDate="1 October 2026"
      lastUpdated="1 October 2026"
      version="1.0"
      toc={toc}
      related={relatedLegalDocuments("/acceptable-use")}
    >
      <p>
        This Acceptable Use Policy sets out the rules for using Nisc Cloud services. It contains the
        same rules as Sections 11 and 12 of our <Link to="/terms">Terms of Service</Link> and forms
        part of that agreement. If this page and the Terms of Service ever differ, the Terms of
        Service prevail.
      </p>

      {/* ─── 1. SCOPE ───────────────────────────────────────────────────────── */}
      <h2 id="scope">1. Who this policy applies to</h2>
      <p>
        This policy applies to every Client, every user of a Client's Account, and anyone using a
        website, mailbox, server or application hosted on Nisc Cloud services. Clients are
        responsible for making sure their own customers and users follow it.
      </p>

      {/* ─── 2. NOT ALLOWED ─────────────────────────────────────────────────── */}
      <h2 id="not-allowed">2. Content and activity not allowed</h2>
      <p>
        You may only use our Services for lawful purposes. You agree that you will not use the
        Platform or Services to:
      </p>
      <ul>
        {ACCEPTABLE_USE_RULES.map((rule) => (
          <li key={rule}>{rule}</li>
        ))}
      </ul>

      {/* ─── 3. CONDUCT ─────────────────────────────────────────────────────── */}
      <h2 id="conduct">3. Prohibited conduct</h2>
      <p>In addition, you must not:</p>
      <ul>
        {PROHIBITED_CONDUCT.map((item) => (
          <li key={item.term}>
            <strong>{item.term}</strong> {item.text}
          </li>
        ))}
      </ul>

      {/* ─── 4. MONITORING ──────────────────────────────────────────────────── */}
      <h2 id="monitoring">4. Monitoring</h2>
      <p>
        We reserve the right to monitor usage patterns to detect violations of this policy and to
        take immediate corrective action, including content removal, service suspension, or account
        termination, without prior notice where the violation is serious.
      </p>

      {/* ─── 5. ENFORCEMENT ─────────────────────────────────────────────────── */}
      <h2 id="enforcement">5. Enforcement</h2>
      <p>
        If we reasonably believe that an Account hosts or distributes content prohibited by this
        policy, we may, without prior notice:
      </p>
      <ul>
        {ENFORCEMENT_ACTIONS.map((action) => (
          <li key={action}>{action}</li>
        ))}
      </ul>
      <p>
        Fees paid for Services that are suspended or terminated under this policy are{" "}
        <strong>non-refundable</strong>, and any outstanding Fees remain payable. Suspension for a
        breach of this policy is excluded from the uptime commitment in our{" "}
        <Link to="/sla#exclusions">Service Level Agreement</Link>.
      </p>

      {/* ─── 6. REPORT ──────────────────────────────────────────────────────── */}
      <h2 id="report">6. Reporting abuse</h2>
      <p>
        To report spam, phishing, malware, a scam or other abuse involving a service hosted by Nisc
        Cloud, email <a href="mailto:abuse@nisccloud.com">abuse@nisccloud.com</a>. Include the
        website address, email headers or other details that help us find the content. Report child
        sexual abuse material to the relevant authorities as well as to us.
      </p>

      {/* ─── 7. CHANGES ─────────────────────────────────────────────────────── */}
      <h2 id="changes">7. Changes</h2>
      <p>
        We change this policy in the same way as the Terms of Service, as set out in{" "}
        <Link to="/terms#changes">Section 24 of the Terms of Service</Link>.
      </p>

      {/* ─── 8. CONTACT ─────────────────────────────────────────────────────── */}
      <h2 id="contact">8. Contact</h2>
      <ul>
        <li><strong>Email:</strong> <a href="mailto:compliance@nisccloud.com">compliance@nisccloud.com</a></li>
        <li><strong>Company:</strong> NISC CLOUD LIMITED, registration number PVT-ZQUX33PK</li>
        <li><strong>Address:</strong> Applewood, Office 805, Ngong Road, Nairobi, Kenya</li>
      </ul>
    </LegalPageShell>
  );
}
