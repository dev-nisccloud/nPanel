import { Link } from "react-router-dom";
import { LegalPageShell, type TocItem } from "../_components/LegalPageShell.tsx";
import { LegalGlance, type GlanceFact } from "../_components/LegalGlance.tsx";
import { relatedLegalDocuments } from "../_components/legal-documents.ts";

export const SLA_VERSION = "1.0";
export const SLA_EFFECTIVE_DATE = "1 October 2026";

const toc: TocItem[] = [
  { id: "parties", label: "1. Parties and purpose" },
  { id: "services-covered", label: "2. Services covered" },
  { id: "availability", label: "3. Service availability" },
  { id: "measurement", label: "3.2 How uptime is measured", sub: true },
  { id: "maintenance", label: "3.3 Maintenance", sub: true },
  { id: "support", label: "4. Support and response times" },
  { id: "data", label: "5. Backup, security and data" },
  { id: "credits", label: "6. Service credits" },
  { id: "exclusions", label: "7. Exclusions" },
  { id: "client-responsibilities", label: "8. Client responsibilities" },
  { id: "escalation", label: "9. Reporting, escalation and review" },
  { id: "term", label: "10. Term, changes and disputes" },
  { id: "contact", label: "11. Acceptance and contact" },
];

const glance: GlanceFact[] = [
  { value: "99.9%", label: "Monthly uptime commitment", detail: "For each covered hosting, email, server and DNS service." },
  { value: "30 min", label: "Critical response, 24/7", detail: "Through a support ticket or Zepo AI, any time of day." },
  { value: "60 days", label: "Daily backups kept", detail: "Restore requests are handled as High (P2) priority." },
  { value: "5%", label: "Credit below 99.9%", detail: "Of the affected service's monthly fee, on your next invoice." },
];

const priorities = [
  { level: "Critical (P1)", definition: "Service down or data at risk", response: "30 minutes", resolution: "4 hours" },
  { level: "High (P2)", definition: "Major feature degraded, no workaround", response: "2 hours", resolution: "8 hours" },
  { level: "Medium (P3)", definition: "Minor impact, workaround exists", response: "8 business hours", resolution: "3 business days" },
  { level: "Low (P4)", definition: "Question or service request", response: "1 business day", resolution: "5 business days" },
];

export default function ServiceLevelAgreementPage() {
  return (
    <LegalPageShell
      title="Service Level Agreement"
      subtitle="The uptime, support response times, backups and service credits Nisc Cloud commits to for hosting, email, cloud servers, domains and migrations."
      effectiveDate={SLA_EFFECTIVE_DATE}
      lastUpdated={SLA_EFFECTIVE_DATE}
      version={SLA_VERSION}
      toc={toc}
      summary={<LegalGlance title="What this SLA commits us to" facts={glance} />}
      related={relatedLegalDocuments("/sla")}
    >
      {/* ─── 1. PARTIES ─────────────────────────────────────────────────────── */}
      <h2 id="parties">1. Parties and purpose</h2>
      <p>
        This Service Level Agreement (<strong>"SLA"</strong>) sets out the service levels that{" "}
        <strong>NISC CLOUD LIMITED</strong>, registration number <strong>PVT-ZQUX33PK</strong>, of
        Applewood, Office 805, Ngong Road, Nairobi, Kenya (<strong>"Nisc Cloud"</strong> or the{" "}
        <strong>"Provider"</strong>), commits to deliver to each customer (the{" "}
        <strong>"Client"</strong>) for the services listed in Section 2.
      </p>
      <p>
        This SLA applies from <strong>{SLA_EFFECTIVE_DATE}</strong> and forms part of our{" "}
        <Link to="/terms">Terms of Service</Link>. No signature is needed: the Client accepts this
        SLA by ordering or using the services. If this SLA and the Terms of Service conflict, the
        Terms of Service prevail.
      </p>

      {/* ─── 2. SERVICES COVERED ────────────────────────────────────────────── */}
      <h2 id="services-covered">2. Services covered</h2>
      <p>This SLA applies to the following services, as set out in the Client's order:</p>
      <ul>
        <li><strong>Website hosting</strong>, including web hosting, WordPress hosting and agency hosting plans;</li>
        <li><strong>Email hosting</strong>, including business email and enterprise hybrid email;</li>
        <li><strong>Cloud server hosting</strong>, including VPS and dedicated servers;</li>
        <li><strong>Domain hosting</strong>, including registration, DNS and renewals; and</li>
        <li>
          <strong>Migration</strong> of the Client's websites, mailboxes, servers and domains from
          another provider to Nisc Cloud.
        </li>
      </ul>
      <p>
        The uptime commitment applies to a migrated service once the migration is complete. We
        schedule migrations with the Client in advance, and the Client supplies access to existing
        accounts and domain authorisation codes.
      </p>
      <h3>2.1 Not covered</h3>
      <p>This SLA does not apply to:</p>
      <ul>
        <li>Marketing and branding services;</li>
        <li>Website and application design and development services;</li>
        <li>Security services, including SSL certificates, malware removal and website maintenance;</li>
        <li>AI services, consistent with Section 18.4 of the Terms of Service;</li>
        <li>Client-built applications, and third-party software the Provider does not manage; and</li>
        <li>Beta or trial services.</li>
      </ul>
      <p>
        Timelines for services that are not covered are set out in the applicable service agreement
        or statement of work.
      </p>

      {/* ─── 3. AVAILABILITY ────────────────────────────────────────────────── */}
      <h2 id="availability">3. Service availability</h2>
      <h3>3.1 Uptime commitment</h3>
      <p>
        Nisc Cloud commits to a monthly uptime of <strong>99.9%</strong> for each covered service.
        In a 30-day month, 99.9% uptime allows for about 43 minutes of downtime.
      </p>
      <h3 id="measurement">3.2 How uptime is measured</h3>
      <p>Monthly uptime is calculated for each affected service over a calendar month (East Africa Time):</p>
      <p>
        <strong>Monthly uptime (%) = (total minutes in the month − downtime minutes) ÷ total
        minutes in the month × 100</strong>
      </p>
      <p>
        <strong>"Downtime"</strong> means a period during which a covered service is unavailable
        to the Client, as recorded by our monitoring systems or confirmed by our investigation of a
        Client report. Events listed in Section 7 are not downtime.
      </p>
      <h3 id="maintenance">3.3 Maintenance</h3>
      <ul>
        <li>
          We give at least <strong>24 hours' advance notice</strong> of scheduled maintenance where
          reasonably practicable. Scheduled maintenance is excluded from uptime calculations.
        </li>
        <li>
          Emergency maintenance may be performed without prior notice when necessary to address
          security threats, critical vulnerabilities, infrastructure failures or service stability
          issues. Emergency maintenance is not automatically excluded: it is assessed under the
          exclusions in Section 7.
        </li>
        <li>
          We send maintenance notices and incident updates by email to the contact address on the
          Client's account and, where practicable, display them in nPanel.
        </li>
      </ul>

      {/* ─── 4. SUPPORT ─────────────────────────────────────────────────────── */}
      <h2 id="support">4. Support and response times</h2>
      <ul>
        <li>
          <strong>Critical (P1) issues:</strong> support is available <strong>24/7</strong> through a
          support ticket in nPanel or through Zepo AI.
        </li>
        <li>
          <strong>All other issues:</strong> support is available{" "}
          <strong>Monday to Friday, 08:00–17:00 East Africa Time</strong>, excluding public holidays
          in Kenya, through a support ticket in nPanel or by email to{" "}
          <a href="mailto:support@nisccloud.com">support@nisccloud.com</a>.
        </li>
      </ul>
      <p>
        Response time runs from when the Client reports the issue. "Business hours" and "business
        days" mean the support hours above.
      </p>
      <div className="not-prose my-6 overflow-x-auto rounded-2xl border border-border">
        <table className="w-full min-w-[560px] text-left text-sm">
          <caption className="sr-only">Support priorities, response times and target resolution times</caption>
          <thead className="bg-muted/60 text-foreground">
            <tr>
              <th scope="col" className="px-4 py-3 font-semibold">Priority</th>
              <th scope="col" className="px-4 py-3 font-semibold">Definition</th>
              <th scope="col" className="px-4 py-3 font-semibold">Response</th>
              <th scope="col" className="px-4 py-3 font-semibold">Target resolution</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border text-muted-foreground print:text-black">
            {priorities.map((row) => (
              <tr key={row.level}>
                <th scope="row" className="px-4 py-3 font-semibold text-foreground">{row.level}</th>
                <td className="px-4 py-3">{row.definition}</td>
                <td className="px-4 py-3">{row.response}</td>
                <td className="px-4 py-3">{row.resolution}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p>
        Resolution times are operational targets, not guaranteed restoration times. Actual recovery
        depends on incident severity, infrastructure availability and backup integrity. Any
        guaranteed recovery time objective (RTO) or recovery point objective (RPO) must be expressly
        agreed in the applicable corporate or enterprise service agreement.
      </p>

      {/* ─── 5. DATA ────────────────────────────────────────────────────────── */}
      <h2 id="data">5. Backup, security and data protection</h2>
      <ul>
        <li>
          <strong>Data centre locations:</strong> Client data is hosted in data centres in Africa
          (Kenya), America and Europe.
        </li>
        <li>
          <strong>Backups:</strong> daily backups, retained for <strong>60 days</strong>. Restore
          requests are actioned as a High (P2) issue.
        </li>
        <li>
          <strong>Administrative access:</strong> access to Nisc Cloud's infrastructure and
          administrative systems is restricted to authorised personnel based on their assigned roles
          and operational responsibilities. Administrative access is managed through individual
          accounts and role-based access controls, following the principle of least privilege.
          Administrative activities are logged and monitored where supported by the applicable
          infrastructure and systems.
        </li>
        <li>
          <strong>Data ownership:</strong> the Client owns its data. The Provider processes it only
          to deliver the services, as set out in our{" "}
          <Link to="/dpa">Data Processing Addendum</Link>.
        </li>
        <li>
          <strong>Security:</strong> the Provider maintains access controls, encryption of data in
          transit and at rest, and regular patching of the platform it manages.
        </li>
        <li>
          <strong>Incident notification:</strong> the Provider notifies the Client of a confirmed
          security breach affecting Client data within <strong>72 hours</strong> of discovery, in
          line with the Kenya Data Protection Act, 2019.
        </li>
        <li>
          <strong>Confidentiality:</strong> both parties keep the other's confidential information
          private, as set out in Section 17 of the Terms of Service.
        </li>
      </ul>

      {/* ─── 6. CREDITS ─────────────────────────────────────────────────────── */}
      <h2 id="credits">6. Service credits</h2>
      <p>
        If the monthly uptime of a covered service falls below 99.9%, the Client is entitled to a
        service credit against the next invoice for the affected service.
      </p>
      <div className="not-prose my-6 overflow-x-auto rounded-2xl border border-border">
        <table className="w-full min-w-[360px] text-left text-sm">
          <caption className="sr-only">Service credit schedule</caption>
          <thead className="bg-muted/60 text-foreground">
            <tr>
              <th scope="col" className="px-4 py-3 font-semibold">Monthly uptime</th>
              <th scope="col" className="px-4 py-3 font-semibold">Credit (% of monthly fee)</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border text-muted-foreground print:text-black">
            <tr>
              <th scope="row" className="px-4 py-3 font-semibold text-foreground">99.9% or higher</th>
              <td className="px-4 py-3">0%</td>
            </tr>
            <tr>
              <th scope="row" className="px-4 py-3 font-semibold text-foreground">Below 99.9%</th>
              <td className="px-4 py-3">5%</td>
            </tr>
          </tbody>
        </table>
      </div>
      <ul>
        <li>Service credits are calculated against the affected service's monthly subscription fee.</li>
        <li>For annual subscriptions, the monthly fee is the annual subscription fee divided by twelve.</li>
        <li>
          Approved credits are applied to the Client's next invoice or service renewal and are not
          paid as cash refunds, subject to applicable law.
        </li>
        <li>
          Total credits in any month will not exceed 100% of the affected service's monthly
          subscription fee, consistent with Section 18.1 of the Terms of Service.
        </li>
        <li>
          Claims must be submitted within <strong>30 days</strong> after the end of the affected
          month, by support ticket or to{" "}
          <a href="mailto:compliance@nisccloud.com">compliance@nisccloud.com</a>, stating the affected
          service and the dates and times of the downtime.
        </li>
        <li>
          Corporate and enterprise customers may have separately negotiated uptime commitments,
          service credit structures and recovery objectives.
        </li>
      </ul>

      {/* ─── 7. EXCLUSIONS ──────────────────────────────────────────────────── */}
      <h2 id="exclusions">7. Exclusions</h2>
      <p>The following do not count as downtime and do not earn credits:</p>
      <ul>
        <li>Scheduled maintenance carried out in line with Section 3.3;</li>
        <li>
          Force majeure events, such as natural disasters, power or internet outages outside the
          Provider's network, or government action;
        </li>
        <li>Issues caused by the Client, its users or its applications, including misconfiguration;</li>
        <li>Failures of third-party services the Provider does not control;</li>
        <li>Suspension of the service for non-payment or breach of the agreement; and</li>
        <li>Denial-of-service or other attacks the Provider has taken reasonable steps to prevent.</li>
      </ul>

      {/* ─── 8. CLIENT RESPONSIBILITIES ─────────────────────────────────────── */}
      <h2 id="client-responsibilities">8. Client responsibilities</h2>
      <p>The Client will:</p>
      <ul>
        <li>Keep account credentials secure and manage its own users and permissions;</li>
        <li>Report issues through the support channels in Section 4 with enough detail to reproduce them;</li>
        <li>Give the Provider timely access and information needed to resolve issues;</li>
        <li>
          Keep its own applications and data within our{" "}
          <Link to="/acceptable-use">Acceptable Use Policy</Link>; and
        </li>
        <li>Pay invoices on time.</li>
      </ul>

      {/* ─── 9. ESCALATION ──────────────────────────────────────────────────── */}
      <h2 id="escalation">9. Reporting, escalation and review</h2>
      <h3>9.1 Reporting</h3>
      <p>
        Customised uptime reports, incident analysis and recurring service performance reporting are
        available for enterprise customers where expressly included in their service agreements or
        on request, subject to applicable service terms.
      </p>
      <h3>9.2 Escalation</h3>
      <p>
        If an issue is not progressing as expected, reply to the support ticket or email{" "}
        <a href="mailto:support@nisccloud.com">support@nisccloud.com</a> and ask for it to be
        escalated. Escalation is then handled internally by the Provider, and the Client is kept
        informed through the same ticket.
      </p>
      <p>
        Complaints about how an issue was handled can be sent to{" "}
        <a href="mailto:compliance@nisccloud.com">compliance@nisccloud.com</a>.
      </p>
      <h3>9.3 Review</h3>
      <p>
        The Provider reviews this SLA regularly and may offer review meetings to clients on
        enterprise plans. Any changes follow Section 10.2.
      </p>

      {/* ─── 10. TERM ───────────────────────────────────────────────────────── */}
      <h2 id="term">10. Term, changes and disputes</h2>
      <h3>10.1 Term</h3>
      <p>This SLA applies for as long as the Client uses the covered services.</p>
      <h3>10.2 Changes</h3>
      <p>
        The Provider may amend this SLA in the same way as the Terms of Service, as set out in{" "}
        <Link to="/terms#changes">Section 24 of the Terms of Service</Link>, including at least 30
        days' email notice of material changes. Each version shows its effective date and version
        number, and previous versions are available on request. The Client may not amend this SLA.
      </p>
      <h3>10.3 Termination</h3>
      <p>
        The Client may terminate the affected service on 30 days' written notice if its monthly
        uptime falls below 99.0% in any two consecutive months, or in any three months within a
        12-month period. Other termination rights are set out in{" "}
        <Link to="/terms#cancellation">Section 9 of the Terms of Service</Link>.
      </p>
      <h3>10.4 Governing law and disputes</h3>
      <p>
        This SLA is governed by the laws of Kenya. Disputes are resolved under{" "}
        <Link to="/terms#disputes">Section 22 (Dispute Resolution)</Link> and{" "}
        <Link to="/terms#governing-law">Section 23 (Governing Law &amp; Jurisdiction)</Link> of the
        Terms of Service.
      </p>

      {/* ─── 11. CONTACT ────────────────────────────────────────────────────── */}
      <h2 id="contact">11. Acceptance and contact</h2>
      <p>
        By ordering or using Nisc Cloud services, the Client agrees to this SLA. No signature is
        required. Send questions about this SLA, or credit claims, to:
      </p>
      <ul>
        <li><strong>Email:</strong> <a href="mailto:compliance@nisccloud.com">compliance@nisccloud.com</a></li>
        <li><strong>Company:</strong> NISC CLOUD LIMITED, registration number PVT-ZQUX33PK</li>
        <li><strong>Address:</strong> Applewood, Office 805, Ngong Road, Nairobi, Kenya</li>
      </ul>
    </LegalPageShell>
  );
}
