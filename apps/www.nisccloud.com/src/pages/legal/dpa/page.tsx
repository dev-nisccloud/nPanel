import { Link } from "react-router-dom";
import { LegalPageShell, type TocItem } from "../_components/LegalPageShell.tsx";
import { LegalGlance, type GlanceFact } from "../_components/LegalGlance.tsx";
import { relatedLegalDocuments } from "../_components/legal-documents.ts";

const toc: TocItem[] = [
  { id: "scope", label: "1. Scope and roles" },
  { id: "definitions", label: "2. Definitions" },
  { id: "details", label: "3. Details of processing" },
  { id: "our-obligations", label: "4. Our obligations" },
  { id: "your-obligations", label: "5. Your obligations" },
  { id: "sub-processors", label: "6. Sub-processors" },
  { id: "transfers", label: "7. International transfers" },
  { id: "breach", label: "8. Personal data breaches" },
  { id: "deletion", label: "9. Return and deletion" },
  { id: "compliance", label: "10. Demonstrating compliance" },
  { id: "general", label: "11. Liability and precedence" },
  { id: "contact", label: "12. Contact" },
];

const glance: GlanceFact[] = [
  { value: "You", label: "Own and control your data", detail: "You are the data controller. We process it only to deliver your services." },
  { value: "72 h", label: "Breach notification", detail: "We tell you about a confirmed breach affecting your data within 72 hours." },
  { value: "3", label: "Hosting regions", detail: "Data centres in Africa (Kenya), America and Europe." },
  { value: "30 days", label: "To export after closure", detail: "Then we delete your data, and backups expire on their normal cycle." },
];

export default function DataProcessingAddendumPage() {
  return (
    <LegalPageShell
      title="Data Processing Addendum"
      subtitle="How Nisc Cloud processes personal data on your behalf when you use our hosting, email, servers and other services, under the Kenya Data Protection Act, 2019."
      effectiveDate="13 November 2026"
      lastUpdated="13 November 2026"
      version="1.0"
      toc={toc}
      summary={<LegalGlance title="How we handle your customers' data" facts={glance} />}
      related={relatedLegalDocuments("/dpa")}
    >
      <p>
        This Data Processing Addendum (<strong>"Addendum"</strong>) forms part of the{" "}
        <Link to="/terms">Terms of Service</Link> between NISC CLOUD LIMITED, registration number
        PVT-ZQUX33PK (<strong>"Nisc Cloud"</strong>, <strong>"we"</strong>, <strong>"us"</strong>),
        and the Client (<strong>"you"</strong>). It applies automatically when you use our Services;
        no signature is needed. A signed copy is available on request from{" "}
        <a href="mailto:privacy@nisccloud.com">privacy@nisccloud.com</a>.
      </p>

      {/* ─── 1. SCOPE ───────────────────────────────────────────────────────── */}
      <h2 id="scope">1. Scope and roles</h2>
      <p>
        This Addendum applies where you use our Services to store or process the personal data of
        your own customers, employees or other end users (<strong>"Client Personal Data"</strong>).
        For Client Personal Data, you are the <strong>data controller</strong> and Nisc Cloud is
        the <strong>data processor</strong>, as those terms are used in the Kenya Data Protection
        Act, 2019 (<strong>"the Act"</strong>).
      </p>
      <p>
        Personal data we collect about you as our customer, such as your account and billing
        details, is covered by our <Link to="/privacy">Privacy Policy</Link>, where Nisc Cloud is
        the data controller.
      </p>

      {/* ─── 2. DEFINITIONS ─────────────────────────────────────────────────── */}
      <h2 id="definitions">2. Definitions</h2>
      <p>
        <strong>"Personal data"</strong>, <strong>"processing"</strong>,{" "}
        <strong>"data subject"</strong>, <strong>"data controller"</strong>,{" "}
        <strong>"data processor"</strong> and <strong>"personal data breach"</strong> have the
        meanings given in the Act. <strong>"Sub-processor"</strong> means a third party we engage
        to process Client Personal Data. Other capitalised terms have the meanings given in the
        Terms of Service.
      </p>

      {/* ─── 3. DETAILS ─────────────────────────────────────────────────────── */}
      <h2 id="details">3. Details of processing</h2>
      <ul>
        <li>
          <strong>Subject matter:</strong> hosting, storing, transmitting, backing up and migrating
          Client Personal Data as part of the Services you order, including website hosting, email
          hosting, cloud servers, domains and related support.
        </li>
        <li>
          <strong>Duration:</strong> for as long as we provide the Services, plus the export and
          deletion periods in Section 9.
        </li>
        <li>
          <strong>Purpose:</strong> only to provide, secure, support and maintain the Services.
        </li>
        <li>
          <strong>Types of personal data:</strong> whatever you or your users upload, send or store
          using the Services, for example names, contact details, email content, website form
          submissions and order records.
        </li>
        <li>
          <strong>Data subjects:</strong> your customers, website visitors, employees, mailbox users
          and other people whose data you process using the Services.
        </li>
      </ul>

      {/* ─── 4. OUR OBLIGATIONS ─────────────────────────────────────────────── */}
      <h2 id="our-obligations">4. Our obligations</h2>
      <p>When we process Client Personal Data, we will:</p>
      <ul>
        <li>
          Process it only on your documented instructions. Your instructions are this Addendum, the
          Terms of Service, your order and the way you configure and use the Services. We will tell
          you if we believe an instruction breaks the Act, unless the law prevents us from doing so;
        </li>
        <li>Not sell Client Personal Data or use it for our own marketing;</li>
        <li>Make sure staff who can access Client Personal Data are bound by confidentiality obligations;</li>
        <li>
          Apply the technical and organisational security measures described in Section 11 of our{" "}
          <Link to="/privacy#security">Privacy Policy</Link> and Section 5 of our{" "}
          <Link to="/sla#data">Service Level Agreement</Link>, including encryption in transit and at
          rest, role-based access controls and regular patching;
        </li>
        <li>
          Taking into account the nature of the processing, help you respond to requests from data
          subjects exercising their rights under the Act, where you cannot do so yourself using the
          Services; and
        </li>
        <li>
          Provide reasonable information to help you carry out data protection impact assessments
          and consult the Office of the Data Protection Commissioner where required.
        </li>
      </ul>

      {/* ─── 5. YOUR OBLIGATIONS ────────────────────────────────────────────── */}
      <h2 id="your-obligations">5. Your obligations</h2>
      <p>You are responsible for:</p>
      <ul>
        <li>Having a lawful basis under the Act for the Client Personal Data you process using the Services;</li>
        <li>Giving data subjects any notices the law requires and obtaining any consents you need;</li>
        <li>Making sure your instructions to us comply with the Act;</li>
        <li>Keeping your account credentials secure and managing your own users and permissions; and</li>
        <li>
          Using the Services in line with our <Link to="/acceptable-use">Acceptable Use Policy</Link>.
        </li>
      </ul>

      {/* ─── 6. SUB-PROCESSORS ──────────────────────────────────────────────── */}
      <h2 id="sub-processors">6. Sub-processors</h2>
      <p>
        You authorise us to engage sub-processors to help deliver the Services, including data
        centre and server infrastructure providers, email delivery providers and helpdesk software
        providers. We will:
      </p>
      <ul>
        <li>Bind each sub-processor to written data protection obligations no less protective than this Addendum;</li>
        <li>Remain responsible to you for our sub-processors' performance of those obligations; and</li>
        <li>
          Provide our current list of sub-processors on request from{" "}
          <a href="mailto:privacy@nisccloud.com">privacy@nisccloud.com</a>.
        </li>
      </ul>

      {/* ─── 7. TRANSFERS ───────────────────────────────────────────────────── */}
      <h2 id="transfers">7. International transfers</h2>
      <p>
        Client Personal Data is hosted in data centres in Africa (Kenya), America and Europe. Where
        Client Personal Data is transferred outside Kenya, we apply the safeguards described in
        Section 8 of our <Link to="/privacy#international">Privacy Policy</Link>, in line with the
        Act. You can request details of the safeguards for a specific transfer from{" "}
        <a href="mailto:privacy@nisccloud.com">privacy@nisccloud.com</a>.
      </p>

      {/* ─── 8. BREACH ──────────────────────────────────────────────────────── */}
      <h2 id="breach">8. Personal data breaches</h2>
      <p>
        We will notify you of a confirmed personal data breach affecting Client Personal Data within{" "}
        <strong>72 hours</strong> of discovering it. Our notice will describe, as far as the
        information is available, what happened, the data and data subjects likely affected, the
        likely consequences and the steps we are taking. We will give you reasonable help to meet
        your own notification obligations to the Office of the Data Protection Commissioner and to
        data subjects.
      </p>

      {/* ─── 9. DELETION ────────────────────────────────────────────────────── */}
      <h2 id="deletion">9. Return and deletion</h2>
      <p>
        When your Services end, you have <strong>30 days</strong> to export your data, as set out in{" "}
        <Link to="/terms#cancellation">Section 9.3 of the Terms of Service</Link>. After that period
        we delete Client Personal Data from our live systems. Copies in backups expire at the end of
        the backup retention period in our <Link to="/sla#data">Service Level Agreement</Link>. We
        may keep data for longer only where the law requires it.
      </p>

      {/* ─── 10. COMPLIANCE ─────────────────────────────────────────────────── */}
      <h2 id="compliance">10. Demonstrating compliance</h2>
      <p>
        On written request, we will provide the information reasonably necessary to show that we
        meet our obligations under this Addendum. Any audit or inspection beyond this must be agreed
        in writing in advance, including its scope, timing and costs.
      </p>

      {/* ─── 11. GENERAL ────────────────────────────────────────────────────── */}
      <h2 id="general">11. Liability and precedence</h2>
      <p>
        Each party's liability under this Addendum is subject to the limitations in{" "}
        <Link to="/terms#liability">Section 19 of the Terms of Service</Link>. If this Addendum and
        the Terms of Service conflict on the processing of Client Personal Data, this Addendum
        prevails. This Addendum changes in the same way as the Terms of Service, as set out in{" "}
        <Link to="/terms#changes">Section 24</Link>, and disputes are resolved under Sections 22
        and 23 of the Terms of Service.
      </p>

      {/* ─── 12. CONTACT ────────────────────────────────────────────────────── */}
      <h2 id="contact">12. Contact</h2>
      <ul>
        <li><strong>Privacy and data protection:</strong> <a href="mailto:privacy@nisccloud.com">privacy@nisccloud.com</a></li>
        <li><strong>Company:</strong> NISC CLOUD LIMITED, registration number PVT-ZQUX33PK</li>
        <li><strong>Address:</strong> Applewood, Office 805, Ngong Road, Nairobi, Kenya</li>
        <li><strong>ODPC Registration No.:</strong> 160-3417-5D07</li>
      </ul>
    </LegalPageShell>
  );
}
