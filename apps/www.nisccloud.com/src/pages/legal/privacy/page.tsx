import { LegalPageShell, type TocItem } from "../_components/LegalPageShell.tsx";
import { Link } from "react-router-dom";

const toc: TocItem[] = [
  { id: "controller", label: "1. Data Controller Identity" },
  { id: "scope", label: "2. Scope & Application" },
  { id: "data-collected", label: "3. Data We Collect" },
  { id: "how-collected", label: "4. How We Collect Your Data" },
  { id: "legal-bases", label: "5. Legal Bases for Processing" },
  { id: "purposes", label: "6. How We Use Your Data" },
  { id: "sharing", label: "7. Data Sharing & Disclosure" },
  { id: "international", label: "8. International Data Transfers" },
  { id: "retention", label: "9. Data Retention" },
  { id: "rights", label: "10. Your Rights (KDPA 2019)" },
  { id: "security", label: "11. Security Measures" },
  { id: "children", label: "12. Children's Privacy" },
  { id: "third-party-links", label: "13. Third-Party Links" },
  { id: "automated", label: "14. Automated Decision-Making" },
  { id: "cookies-ref", label: "15. Cookies & Tracking" },
  { id: "changes", label: "16. Changes to This Policy" },
  { id: "contact", label: "17. Contact & DPO" },
];

export default function PrivacyPolicyPage() {
  return (
    <LegalPageShell
      title="Privacy Policy"
      subtitle="This Privacy Policy explains how Nisc Cloud Limited collects, uses, stores, and protects your personal data in accordance with the Kenya Data Protection Act, 2019 (No. 24 of 2019) and our registration obligations as a Data Controller with the Office of the Data Protection Commissioner (ODPC)."
      effectiveDate="1 September 2025"
      lastUpdated="1 July 2026"
      toc={toc}
    >
      <p>
        Your privacy matters to us. Nisc Cloud Limited (<strong>"Nisc Cloud"</strong>,{" "}
        <strong>"we"</strong>, <strong>"us"</strong>, or <strong>"our"</strong>) is committed to
        being transparent about how we collect and use your personal data. Please read this policy
        carefully. By using our Platform or Services, you acknowledge you have read and understood
        this Privacy Policy.
      </p>

      {/* ─── 1. CONTROLLER ──────────────────────────────────────────────────── */}
      <h2 id="controller">1. Data Controller Identity</h2>
      <p>
        The Data Controller responsible for your personal data is:
      </p>
      <ul>
        <li><strong>Company:</strong> Nisc Cloud Limited</li>
        <li><strong>Country of Incorporation:</strong> Kenya</li>
        <li><strong>Registered Address:</strong> Nairobi, Kenya</li>
        <li><strong>General Email:</strong> <a href="mailto:support@nisccloud.com">support@nisccloud.com</a></li>
        <li><strong>Privacy / DPO Email:</strong> <a href="mailto:privacy@nisccloud.com">privacy@nisccloud.com</a></li>
        <li>
          <strong>ODPC Registration:</strong> Nisc Cloud Limited is registered with the Office of
          the Data Protection Commissioner (ODPC) as a <strong>Data Controller</strong> under
          Registration No. <strong>160-3417-5D07</strong>, Serial No. <strong>14768</strong>,
          valid from 16 September 2025 to 16 September 2027, pursuant to Section 18 of the Kenya
          Data Protection Act, 2019.
        </li>
      </ul>
      <p>
        Where we process personal data on behalf of our business Clients (e.g., hosting Client
        databases or processing their customers' data), we act as a <strong>Data Processor</strong>{" "}
        under the instruction of that Client (who is the Data Controller for such data). In such
        cases, our obligations are governed by a separate Data Processing Agreement (DPA) with
        the relevant Client.
      </p>

      {/* ─── 2. SCOPE ───────────────────────────────────────────────────────── */}
      <h2 id="scope">2. Scope & Application</h2>
      <p>
        This Privacy Policy applies to:
      </p>
      <ul>
        <li>All visitors to <strong>nisccloud.com</strong> and its subdomains;</li>
        <li>All registered users of <strong>nPanel</strong> (npanel.nisccloud.com);</li>
        <li>All purchasers of Services through our storefront or cart;</li>
        <li>All individuals who contact us via email, telephone, or our contact form; and</li>
        <li>All individuals whose personal data we process in connection with providing our Services.</li>
      </ul>
      <p>
        This policy does not apply to data processed by Third-Party Services you connect to our
        Platform (e.g., Google Ads, Meta, Safaricom M-Pesa), which are governed by those providers'
        own privacy policies.
      </p>

      {/* ─── 3. DATA COLLECTED ──────────────────────────────────────────────── */}
      <h2 id="data-collected">3. Data We Collect</h2>
      <p>
        We collect and process the following categories of personal data:
      </p>

      <h3>3.1 Identity & Account Data</h3>
      <ul>
        <li>First name, last name, and preferred name;</li>
        <li>Email address;</li>
        <li>Phone number (including M-Pesa-linked numbers);</li>
        <li>Company name and job title (for business accounts);</li>
        <li>Account username and encrypted password hash;</li>
        <li>Country and city of residence or operation.</li>
      </ul>

      <h3>3.2 Billing & Financial Data</h3>
      <ul>
        <li>Billing address;</li>
        <li>Payment method type (M-Pesa, Visa, Mastercard) and masked payment identifiers (last 4 digits only  full card numbers are never stored on our servers);</li>
        <li>Transaction history, invoice records, and payment receipts;</li>
        <li>Tax identification numbers (where applicable by law);</li>
        <li>M-Pesa phone numbers and Checkout Request IDs for M-Pesa transactions.</li>
      </ul>

      <h3>3.3 Service & Usage Data</h3>
      <ul>
        <li>Domain names, hosting configurations, and server settings you manage through nPanel;</li>
        <li>Email account names, aliases, and settings (not email content, which is private);</li>
        <li>SSL certificate details;</li>
        <li>Marketing campaign data (ad account IDs, campaign names, budgets, performance metrics);</li>
        <li>Files and content you upload to hosted services;</li>
        <li>nPanel feature usage, page views, and interaction logs.</li>
      </ul>

      <h3>3.4 Technical & Device Data</h3>
      <ul>
        <li>IP address and approximate geolocation (country/city level);</li>
        <li>Browser type, version, and language;</li>
        <li>Operating system and device type;</li>
        <li>Referring URLs and pages visited on our website;</li>
        <li>Session duration, clickstream data, and feature usage patterns;</li>
        <li>Server access logs and error logs.</li>
      </ul>

      <h3>3.5 Communication Data</h3>
      <ul>
        <li>Email correspondence, support tickets, and live chat transcripts;</li>
        <li>Feedback, survey responses, and testimonials;</li>
        <li>Content of calls where recorded with your consent.</li>
      </ul>

      <h3>3.6 Marketing Data</h3>
      <ul>
        <li>Marketing and communication preferences;</li>
        <li>Email open rates and click-through rates (for emails we send you);</li>
        <li>Responses to promotional campaigns and events.</li>
      </ul>

      <h3>3.7 Special Categories of Data</h3>
      <p>
        We do not intentionally collect or process <strong>special categories of personal data</strong>{" "}
        (e.g., health data, biometric data, racial or ethnic origin, religious beliefs, sexual
        orientation, criminal records) through our standard Services. If the nature of a specific
        service engagement requires such data, we will seek your explicit consent and establish
        appropriate safeguards.
      </p>

      {/* ─── 4. HOW COLLECTED ───────────────────────────────────────────────── */}
      <h2 id="how-collected">4. How We Collect Your Data</h2>
      <p>We collect your data through the following means:</p>

      <h3>4.1 Directly from You</h3>
      <ul>
        <li>When you create an Account on nPanel;</li>
        <li>When you purchase or subscribe to a Service;</li>
        <li>When you fill in contact, support, or enquiry forms;</li>
        <li>When you communicate with us by email, phone, or chat;</li>
        <li>When you provide feedback, reviews, or participate in surveys.</li>
      </ul>

      <h3>4.2 Automatically through Technology</h3>
      <ul>
        <li>Via cookies and similar tracking technologies when you use our website or nPanel (see our <Link to="/cookies">Cookie Policy</Link>);</li>
        <li>Through server logs that automatically record technical information about connections to our Platform;</li>
        <li>Through analytics tools (e.g., Google Analytics) that measure usage patterns.</li>
      </ul>

      <h3>4.3 From Third Parties</h3>
      <ul>
        <li>From payment processors (M-Pesa, card processors) who confirm transaction status;</li>
        <li>From domain registries and WHOIS databases in connection with domain services;</li>
        <li>From advertising platforms (Google, Meta, LinkedIn) when you grant us access to manage campaigns;</li>
        <li>From identity verification providers where required for compliance.</li>
      </ul>

      {/* ─── 5. LEGAL BASES ─────────────────────────────────────────────────── */}
      <h2 id="legal-bases">5. Legal Bases for Processing</h2>
      <p>
        Under the Kenya Data Protection Act, 2019 (Section 30), we process your personal data only
        where we have a lawful basis. The bases we rely on are:
      </p>
      <ul>
        <li>
          <strong>Contract Performance (s.30(b)):</strong> Processing is necessary to provide the
          Services you have requested or purchased (e.g., account creation, service provisioning,
          billing, support).
        </li>
        <li>
          <strong>Legal Obligation (s.30(c)):</strong> Processing is required to comply with
          applicable law, including Kenyan tax laws, ODPC obligations, anti-money laundering
          regulations, and court orders.
        </li>
        <li>
          <strong>Legitimate Interests (s.30(e)):</strong> Processing is necessary for our
          legitimate business interests, including security monitoring, fraud prevention, product
          improvement, and internal analytics, where these interests are not overridden by your
          data protection rights. We conduct a Legitimate Interests Assessment for each such use.
        </li>
        <li>
          <strong>Consent (s.30(a)):</strong> Where you have freely given, specific, and informed
          consent  particularly for direct marketing emails, non-essential cookies, and analytics
          tracking. You may withdraw consent at any time (see Section 10 below).
        </li>
        <li>
          <strong>Vital Interests (s.30(d)):</strong> In exceptional circumstances where processing
          is necessary to protect your vital interests or those of another natural person (e.g.,
          during a security incident).
        </li>
      </ul>

      {/* ─── 6. PURPOSES ────────────────────────────────────────────────────── */}
      <h2 id="purposes">6. How We Use Your Data</h2>
      <p>We use your personal data for the following specific purposes:</p>

      <h3>6.1 Account Management & Service Delivery</h3>
      <ul>
        <li>Creating and managing your nPanel Account;</li>
        <li>Provisioning and maintaining your subscribed Services (hosting, domains, email, SSL);</li>
        <li>Sending service-critical notifications (renewal reminders, downtime alerts, security notices).</li>
      </ul>

      <h3>6.2 Billing & Payments</h3>
      <ul>
        <li>Processing payments via M-Pesa and card payment gateways;</li>
        <li>Generating and issuing invoices and receipts;</li>
        <li>Managing subscription renewals, failed payments, and debt recovery;</li>
        <li>Maintaining financial records as required by Kenyan law.</li>
      </ul>

      <h3>6.3 Customer Support</h3>
      <ul>
        <li>Responding to your support requests, bug reports, and complaints;</li>
        <li>Providing technical assistance and troubleshooting;</li>
        <li>Escalating issues to third-party providers where necessary (e.g., data centre operators).</li>
      </ul>

      <h3>6.4 Security & Fraud Prevention</h3>
      <ul>
        <li>Detecting, investigating, and preventing unauthorised access, fraud, spam, and abuse;</li>
        <li>Enforcing our Terms of Service and Acceptable Use Policy;</li>
        <li>Maintaining audit logs for security and compliance purposes.</li>
      </ul>

      <h3>6.5 Product Improvement & Analytics</h3>
      <ul>
        <li>Analysing usage patterns to improve the Platform's features and user experience;</li>
        <li>Conducting internal research and development;</li>
        <li>Generating aggregated, anonymised statistics that do not identify individuals.</li>
      </ul>

      <h3>6.6 Marketing & Communications (Consent-Based)</h3>
      <ul>
        <li>Sending newsletters, product updates, promotional offers, and event invitations where you have opted in;</li>
        <li>Personalising marketing communications based on your service usage;</li>
        <li>Retargeting via advertising platforms (Meta, Google) using anonymised identifiers where permitted.</li>
      </ul>
      <p>
        You may opt out of marketing communications at any time by clicking "Unsubscribe" in any
        email, updating your preferences in nPanel, or contacting{" "}
        <a href="mailto:privacy@nisccloud.com">privacy@nisccloud.com</a>.
      </p>

      <h3>6.7 Legal & Regulatory Compliance</h3>
      <ul>
        <li>Complying with ODPC reporting obligations;</li>
        <li>Responding to lawful requests from government or regulatory authorities;</li>
        <li>Establishing, exercising, or defending legal claims.</li>
      </ul>

      {/* ─── 7. SHARING ─────────────────────────────────────────────────────── */}
      <h2 id="sharing">7. Data Sharing & Disclosure</h2>
      <p>
        <strong>We do not sell, rent, or trade your personal data to third parties for their own
        marketing purposes.</strong> We share your data only in the following limited circumstances:
      </p>

      <h3>7.1 Service Providers (Data Processors)</h3>
      <p>
        We share data with trusted third-party service providers who process it on our behalf,
        bound by strict data processing agreements:
      </p>
      <ul>
        <li><strong>Payment Processors:</strong> Safaricom M-Pesa, card payment gateways (PCI-DSS compliant);</li>
        <li><strong>Cloud Infrastructure:</strong> Data centre and server infrastructure providers hosting our Platform;</li>
        <li><strong>Analytics:</strong> Google Analytics (anonymised usage data);</li>
        <li><strong>Email Delivery:</strong> Transactional email providers for service notifications;</li>
        <li><strong>Customer Support:</strong> Helpdesk software providers;</li>
        <li><strong>Domain & SSL Registries:</strong> ICANN-accredited registries and certificate authorities.</li>
      </ul>

      <h3>7.2 Business Clients</h3>
      <p>
        Where you are a Client who uses our Services to process your own customers' data (e.g.,
        hosting a website or email system), you are solely responsible for that data. We process
        it only on your instructions as your Data Processor.
      </p>

      <h3>7.3 Advertising Platforms (with Your Authorisation)</h3>
      <p>
        If you engage our paid advertising management services, we may share necessary campaign data
        (ad creative, targeting parameters) with Google, Meta, TikTok, or LinkedIn on your behalf.
        This is done under your direction and with your authorisation.
      </p>

      <h3>7.4 Legal & Regulatory Disclosure</h3>
      <p>
        We may disclose your data to law enforcement agencies, regulatory bodies (including the
        ODPC), or courts when required by applicable law, judicial order, or to protect the rights,
        safety, or property of Nisc Cloud, its users, or the public. We will, where legally
        permissible, notify you of such requests.
      </p>

      <h3>7.5 Business Transfers</h3>
      <p>
        In the event of a merger, acquisition, restructuring, or sale of all or substantially all
        of our assets, your personal data may be transferred to the successor entity. We will
        notify you via email and a prominent notice on the Platform at least{" "}
        <strong>30 days</strong> before your data is transferred and becomes subject to a different
        privacy policy.
      </p>

      <h3>7.6 With Your Consent</h3>
      <p>
        We may share your data with any other party if you have given us explicit consent to do so.
      </p>

      {/* ─── 8. INTERNATIONAL TRANSFERS ─────────────────────────────────────── */}
      <h2 id="international">8. International Data Transfers</h2>
      <p>
        Some of our service providers and infrastructure partners are located outside Kenya.
        Where we transfer your personal data to countries that may not offer an equivalent level
        of data protection to Kenya, we implement the following safeguards:
      </p>
      <ul>
        <li><strong>Standard Contractual Clauses:</strong> Data processing agreements incorporating appropriate contractual protections;</li>
        <li><strong>Adequacy Decisions:</strong> Transfers to countries or entities recognised as providing adequate protection;</li>
        <li><strong>Necessary for Contract Performance:</strong> Where the transfer is necessary to perform our contract with you (e.g., connecting to a global domain registry).</li>
      </ul>
      <p>
        You may request details of the specific safeguards in place for any international transfer
        by contacting <a href="mailto:privacy@nisccloud.com">privacy@nisccloud.com</a>.
      </p>

      {/* ─── 9. RETENTION ───────────────────────────────────────────────────── */}
      <h2 id="retention">9. Data Retention</h2>
      <p>
        We retain your personal data only for as long as necessary for the purposes for which it
        was collected, subject to legal requirements. Our specific retention periods are:
      </p>
      <ul>
        <li>
          <strong>Active Account Data:</strong> Retained for the duration of your active Subscription
          and for <strong>30 days</strong> after Account closure to allow data export and dispute
          resolution.
        </li>
        <li>
          <strong>Financial Records & Invoices:</strong> Retained for <strong>7 years</strong>{" "}
          after the transaction date as required by Kenyan tax and accounting law.
        </li>
        <li>
          <strong>Security & Audit Logs:</strong> Retained for <strong>12 months</strong> for
          security investigation and compliance purposes.
        </li>
        <li>
          <strong>Support Correspondence:</strong> Retained for <strong>3 years</strong> after
          ticket closure for quality assurance and dispute resolution.
        </li>
        <li>
          <strong>Marketing Opt-Out Records:</strong> Retained indefinitely to honour your
          opt-out preferences.
        </li>
        <li>
          <strong>Backup Data:</strong> Operational backups are retained for up to{" "}
          <strong>90 days</strong>, after which they are securely deleted. Backup data is not
          restored to serve individual deletion requests but will expire naturally.
        </li>
        <li>
          <strong>Legal Hold:</strong> Where data is subject to a legal hold, dispute, or
          regulatory investigation, it will be retained for the duration of that hold regardless
          of the above schedules.
        </li>
      </ul>
      <p>
        When data is no longer required, we securely delete or anonymise it using
        industry-standard methods.
      </p>

      {/* ─── 10. YOUR RIGHTS ────────────────────────────────────────────────── */}
      <h2 id="rights">10. Your Rights under the Kenya Data Protection Act, 2019</h2>
      <p>
        Under the Kenya Data Protection Act, 2019, you have the following rights with respect to
        your personal data:
      </p>
      <ul>
        <li>
          <strong>Right to be Informed (s.26(a)):</strong> The right to know what data we hold
          about you, how we use it, and with whom we share it  which is the purpose of this
          Privacy Policy.
        </li>
        <li>
          <strong>Right of Access (s.26(b)):</strong> The right to request a copy of the personal
          data we hold about you, free of charge in most cases.
        </li>
        <li>
          <strong>Right to Rectification (s.26(c)):</strong> The right to request correction of
          inaccurate or incomplete personal data we hold about you.
        </li>
        <li>
          <strong>Right to Erasure (s.26(d)):</strong> The right to request deletion of your
          personal data where: (i) it is no longer necessary for the purpose for which it was
          collected; (ii) you withdraw consent; (iii) you successfully object to processing; or
          (iv) the data was processed unlawfully. This right is subject to legal retention
          obligations.
        </li>
        <li>
          <strong>Right to Restriction of Processing (s.26(e)):</strong> The right to ask us to
          limit processing of your data in certain circumstances (e.g., while you contest its
          accuracy).
        </li>
        <li>
          <strong>Right to Data Portability (s.26(f)):</strong> The right to receive your data in
          a structured, commonly used, machine-readable format and to transmit it to another
          controller, where technically feasible.
        </li>
        <li>
          <strong>Right to Object (s.26(g)):</strong> The right to object to processing based on
          legitimate interests or for direct marketing purposes. Where you object to direct
          marketing, we will cease processing immediately.
        </li>
        <li>
          <strong>Rights regarding Automated Decision-Making (s.26(h)):</strong> The right not to
          be subject to a decision based solely on automated processing that significantly affects
          you, including the right to request human review.
        </li>
        <li>
          <strong>Right to Withdraw Consent:</strong> Where processing is based on consent, the
          right to withdraw that consent at any time without affecting the lawfulness of processing
          prior to withdrawal.
        </li>
      </ul>

      <h3>10.1 How to Exercise Your Rights</h3>
      <p>
        To exercise any of your rights, submit a request to{" "}
        <a href="mailto:privacy@nisccloud.com">privacy@nisccloud.com</a> clearly stating the right
        you wish to exercise and your Account details. We will:
      </p>
      <ul>
        <li>Acknowledge your request within <strong>3 Working Days</strong>;</li>
        <li>Verify your identity before processing the request;</li>
        <li>Respond fully within <strong>30 days</strong> (or inform you of any lawful extension).</li>
      </ul>
      <p>
        We will not charge a fee for responding to rights requests unless your request is
        manifestly unfounded, repetitive, or excessive, in which case we may charge a reasonable
        administrative fee or refuse to act on the request.
      </p>

      <h3>10.2 Right to Lodge a Complaint</h3>
      <p>
        If you are not satisfied with how we handle your personal data or your rights request, you
        have the right to lodge a complaint with the{" "}
        <strong>Office of the Data Protection Commissioner (ODPC)</strong>:
      </p>
      <ul>
        <li><strong>Website:</strong> <a href="https://www.odpc.go.ke" target="_blank" rel="noopener noreferrer">www.odpc.go.ke</a></li>
        <li><strong>Email:</strong> <a href="mailto:info@odpc.go.ke">info@odpc.go.ke</a></li>
      </ul>
      <p>
        We encourage you to contact us first, as we prefer the opportunity to address your
        concerns directly.
      </p>

      {/* ─── 11. SECURITY ───────────────────────────────────────────────────── */}
      <h2 id="security">11. Security Measures</h2>
      <p>
        We implement appropriate technical and organisational measures to protect your personal data
        against unauthorised access, accidental loss, disclosure, alteration, or destruction.
        These measures include:
      </p>

      <h3>11.1 Technical Safeguards</h3>
      <ul>
        <li><strong>Encryption in Transit:</strong> All data transmitted between your browser and our Platform is encrypted using TLS 1.2 or higher (HTTPS);</li>
        <li><strong>Encryption at Rest:</strong> Sensitive data fields and backups are encrypted at rest using AES-256;</li>
        <li><strong>Access Controls:</strong> Role-based access control (RBAC) ensures staff access only the data necessary for their role;</li>
        <li><strong>Two-Factor Authentication:</strong> Required for all Nisc Cloud staff accessing production systems;</li>
        <li><strong>Firewalls & Intrusion Detection:</strong> Network-level security measures monitor for and block malicious traffic;</li>
        <li><strong>Vulnerability Management:</strong> Regular security testing, patching, and dependency updates.</li>
      </ul>

      <h3>11.2 Organisational Safeguards</h3>
      <ul>
        <li>Data protection training for all staff with access to personal data;</li>
        <li>Confidentiality obligations in all employment and contractor agreements;</li>
        <li>An internal data protection policy and incident response plan;</li>
        <li>Regular reviews of data processing activities and third-party processor agreements.</li>
      </ul>

      <h3>11.3 Data Breach Notification</h3>
      <p>
        In the event of a personal data breach that poses a risk to your rights and freedoms, we
        will:
      </p>
      <ul>
        <li>Notify the <strong>ODPC</strong> within <strong>72 hours</strong> of becoming aware of the breach, as required by the Kenya Data Protection Act, 2019;</li>
        <li>Notify affected individuals <strong>without undue delay</strong> where the breach is likely to result in a high risk to their rights.</li>
      </ul>
      <p>
        Please note that no security measure is 100% impenetrable. We cannot guarantee the
        absolute security of your data, and by using our Services you accept this inherent risk.
      </p>

      {/* ─── 12. CHILDREN ───────────────────────────────────────────────────── */}
      <h2 id="children">12. Children's Privacy</h2>
      <p>
        Our Platform and Services are intended for use by adults aged <strong>18 or over</strong>.
        We do not knowingly collect personal data from children under 18. If we become aware that
        we have collected personal data from a person under 18 without appropriate parental or
        guardian consent, we will take immediate steps to delete such data.
      </p>
      <p>
        If you are a parent or guardian and believe your child has provided us with personal data,
        please contact us at{" "}
        <a href="mailto:privacy@nisccloud.com">privacy@nisccloud.com</a>.
      </p>

      {/* ─── 13. THIRD-PARTY LINKS ──────────────────────────────────────────── */}
      <h2 id="third-party-links">13. Third-Party Links & Services</h2>
      <p>
        Our website and nPanel may contain links to third-party websites, platforms, or services
        that we do not operate or control. This Privacy Policy does not apply to those third-party
        services, and we are not responsible for their data practices. We encourage you to review
        the privacy policies of any third-party service you access.
      </p>
      <p>
        When you connect third-party services to nPanel (e.g., Google Ads, Meta Business Manager,
        LinkedIn Campaign Manager), the data you share with those platforms is governed by their
        respective privacy policies. Our access to your data on those platforms is limited to what
        is necessary to provide the services you have requested.
      </p>

      {/* ─── 14. AUTOMATED DECISIONS ────────────────────────────────────────── */}
      <h2 id="automated">14. Automated Decision-Making & Profiling</h2>
      <p>
        We may use automated systems to make decisions that affect your Account or Service access,
        including:
      </p>
      <ul>
        <li><strong>Fraud Detection:</strong> Automated analysis of transaction patterns, IP addresses, and account behaviour to detect and prevent fraudulent activity;</li>
        <li><strong>Account Risk Scoring:</strong> Automated assessment of account risk based on usage patterns and payment history;</li>
        <li><strong>Spam & Abuse Detection:</strong> Automated content and traffic analysis to enforce our Acceptable Use Policy.</li>
      </ul>
      <p>
        Where an automated decision has a significant legal or similarly significant effect on you
        (such as Account suspension), you have the right to:
      </p>
      <ul>
        <li>Request human review of the automated decision;</li>
        <li>Express your point of view;</li>
        <li>Contest the decision.</li>
      </ul>
      <p>
        To exercise this right, contact <a href="mailto:privacy@nisccloud.com">privacy@nisccloud.com</a>{" "}
        with the subject line "Automated Decision Review".
      </p>

      {/* ─── 15. COOKIES ────────────────────────────────────────────────────── */}
      <h2 id="cookies-ref">15. Cookies & Tracking Technologies</h2>
      <p>
        We use cookies and similar tracking technologies on our website and in nPanel. The types
        of cookies we use, their purpose, and how you can control them are described in detail in
        our <Link to="/cookies">Cookie Policy</Link>.
      </p>
      <p>
        In summary, we use:
      </p>
      <ul>
        <li><strong>Strictly Necessary Cookies:</strong> Essential for authentication, security, and basic Platform functionality;</li>
        <li><strong>Functional Cookies:</strong> To remember your preferences (e.g., language, theme);</li>
        <li><strong>Analytics Cookies:</strong> To measure how users interact with our Platform (requires consent);</li>
        <li><strong>Marketing Cookies:</strong> For advertising retargeting and conversion tracking (requires consent).</li>
      </ul>

      {/* ─── 16. CHANGES ────────────────────────────────────────────────────── */}
      <h2 id="changes">16. Changes to This Privacy Policy</h2>
      <p>
        We may update this Privacy Policy from time to time to reflect changes in our data
        processing activities, legal requirements, or business operations. We will notify you of
        material changes by:
      </p>
      <ul>
        <li>Sending an email to your registered Account address at least <strong>30 days</strong> before the change takes effect;</li>
        <li>Displaying a prominent banner or notification on the Platform; and</li>
        <li>Updating the "Last Updated" date at the top of this policy.</li>
      </ul>
      <p>
        Your continued use of the Platform after the effective date of any revised Privacy Policy
        constitutes acceptance of the updated policy. If you disagree with the changes, you must
        stop using our Services and close your Account before the effective date.
      </p>
      <p>
        Previous versions of this Privacy Policy are archived and available upon written request
        to <a href="mailto:privacy@nisccloud.com">privacy@nisccloud.com</a>.
      </p>

      {/* ─── 17. CONTACT & DPO ──────────────────────────────────────────────── */}
      <h2 id="contact">17. Contact Us & Data Protection Officer</h2>
      <p>
        For all privacy-related enquiries, rights requests, or concerns, please contact our Data
        Protection team:
      </p>
      <ul>
        <li><strong>Privacy / DPO Email:</strong> <a href="mailto:privacy@nisccloud.com">privacy@nisccloud.com</a></li>
        <li><strong>General Email:</strong> <a href="mailto:support@nisccloud.com">support@nisccloud.com</a></li>
        <li><strong>Company:</strong> Nisc Cloud Limited, Nairobi, Kenya</li>
        <li><strong>ODPC Registration No.:</strong> 160-3417-5D07</li>
      </ul>
      <p>
        We aim to respond to all privacy enquiries within <strong>5 Working Days</strong> and to
        resolve data rights requests within <strong>30 days</strong>.
      </p>
      <p>
        If you are not satisfied with our response, you have the right to lodge a complaint with
        the Office of the Data Protection Commissioner (ODPC) at{" "}
        <a href="https://www.odpc.go.ke" target="_blank" rel="noopener noreferrer">www.odpc.go.ke</a>.
      </p>
    </LegalPageShell>
  );
}
