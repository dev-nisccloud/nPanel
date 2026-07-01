import { LegalPageShell, type TocItem } from "../_components/LegalPageShell.tsx";
import { Link } from "react-router-dom";

const toc: TocItem[] = [
  { id: "definitions", label: "1. Definitions" },
  { id: "acceptance", label: "2. Acceptance of Terms" },
  { id: "eligibility", label: "3. Eligibility" },
  { id: "account", label: "4. Account Registration & Security" },
  { id: "services", label: "5. Description of Services" },
  { id: "billing", label: "6. Subscription Plans & Billing" },
  { id: "payment", label: "7. Payment Terms" },
  { id: "free-trials", label: "8. Free Trials & Promotions" },
  { id: "cancellation", label: "9. Cancellation & Termination" },
  { id: "refunds", label: "10. Refund Policy" },
  { id: "acceptable-use", label: "11. Acceptable Use Policy" },
  { id: "prohibited", label: "12. Prohibited Conduct" },
  { id: "ip", label: "13. Intellectual Property" },
  { id: "user-content", label: "14. User Content" },
  { id: "third-party", label: "15. Third-Party Services" },
  { id: "data-protection", label: "16. Data Protection" },
  { id: "confidentiality", label: "17. Confidentiality" },
  { id: "sla", label: "18. Service Availability" },
  { id: "liability", label: "19. Limitation of Liability" },
  { id: "indemnification", label: "20. Indemnification" },
  { id: "warranties", label: "21. Warranties & Disclaimers" },
  { id: "disputes", label: "22. Dispute Resolution" },
  { id: "governing-law", label: "23. Governing Law" },
  { id: "changes", label: "24. Changes to These Terms" },
  { id: "general", label: "25. General Provisions" },
  { id: "contact", label: "26. Contact Us" },
];

export default function TermsOfServicePage() {
  return (
    <LegalPageShell
      title="Terms of Service"
      subtitle="These Terms of Service govern your access to and use of all products, services, and platforms operated by Nisc Cloud Limited. Please read them carefully before using our services."
      effectiveDate="1 September 2025"
      lastUpdated="1 July 2026"
      toc={toc}
    >
      <p>
        Welcome to Nisc Cloud Limited (<strong>"Nisc Cloud"</strong>, <strong>"we"</strong>,{" "}
        <strong>"us"</strong>, or <strong>"our"</strong>). These Terms of Service (
        <strong>"Terms"</strong>) constitute a legally binding agreement between you and Nisc Cloud
        Limited, a company incorporated under the laws of Kenya, governing your access to and use of
        our website at <strong>nisccloud.com</strong>, our client management platform at{" "}
        <strong>npanel.nisccloud.com</strong> (<strong>"nPanel"</strong>), and all related services
        (collectively, the <strong>"Platform"</strong>).
      </p>

      {/* ─── 1. DEFINITIONS ─────────────────────────────────────────────────── */}
      <h2 id="definitions">1. Definitions</h2>
      <p>For the purposes of these Terms, the following definitions apply:</p>
      <ul>
        <li>
          <strong>"Agreement"</strong> means these Terms of Service together with our{" "}
          <Link to="/privacy">Privacy Policy</Link>, <Link to="/cookies">Cookie Policy</Link>, and
          any order forms, service schedules, or statements of work entered into between you and
          Nisc Cloud.
        </li>
        <li>
          <strong>"Account"</strong> means the registered profile you create to access the Platform
          and manage your Services.
        </li>
        <li>
          <strong>"Client" / "Customer" / "you" / "your"</strong> means any individual,
          business, or legal entity that registers for, accesses, or uses the Platform or any
          Service.
        </li>
        <li>
          <strong>"Content"</strong> means any text, images, data, files, emails, code,
          configurations, or other material uploaded, stored, processed, or transmitted through
          the Platform.
        </li>
        <li>
          <strong>"Fees"</strong> means all charges, subscription fees, one-time payments, and
          applicable taxes payable for the Services.
        </li>
        <li>
          <strong>"nPanel"</strong> means our proprietary SaaS client dashboard accessible at
          npanel.nisccloud.com, through which Clients manage their Services.
        </li>
        <li>
          <strong>"Services"</strong> means all products and services offered by Nisc Cloud,
          including but not limited to cloud hosting, domain registration, business email hosting,
          SSL certificates, website design, brand identity services, digital marketing services, AI
          automation services (Zeepo AI), and any other services listed on our Platform.
        </li>
        <li>
          <strong>"Subscription"</strong> means a recurring plan that grants access to specified
          Services for a defined billing cycle (monthly or annual).
        </li>
        <li>
          <strong>"Unauthorised Use"</strong> means any use of the Platform or Services that
          violates these Terms, applicable law, or the rights of any third party.
        </li>
        <li>
          <strong>"Working Day"</strong> means any day other than Saturday, Sunday, or a public
          holiday in Kenya.
        </li>
      </ul>

      {/* ─── 2. ACCEPTANCE ──────────────────────────────────────────────────── */}
      <h2 id="acceptance">2. Acceptance of Terms</h2>
      <p>
        By accessing or using the Platform in any manner — including browsing our website,
        creating an Account, purchasing a Service, or continuing to use any Service after an
        update to these Terms — you confirm that you have read, understood, and agree to be bound
        by this Agreement in its entirety.
      </p>
      <p>
        If you are using the Platform on behalf of a company, organisation, or other legal entity,
        you represent and warrant that you have the authority to bind that entity to this Agreement,
        in which case references to <em>"you"</em> shall mean that entity and you personally.
      </p>
      <p>
        <strong>If you do not agree to these Terms, you must immediately cease all use of the
        Platform and Services.</strong>
      </p>

      {/* ─── 3. ELIGIBILITY ─────────────────────────────────────────────────── */}
      <h2 id="eligibility">3. Eligibility</h2>
      <p>To access and use the Platform and Services, you must:</p>
      <ul>
        <li>Be at least <strong>18 years of age</strong>, or the age of majority in your jurisdiction, whichever is higher;</li>
        <li>Have full legal capacity to enter into a binding contract under Kenyan law or the laws of your jurisdiction;</li>
        <li>Not be a person or entity barred from receiving services under the laws of Kenya or any applicable jurisdiction; and</li>
        <li>Provide accurate, complete, and current information during registration and at all times thereafter.</li>
      </ul>
      <p>
        We reserve the right to verify your eligibility and to refuse, suspend, or terminate access
        to any person or entity we reasonably believe does not meet these requirements, without
        prior notice.
      </p>

      {/* ─── 4. ACCOUNT ─────────────────────────────────────────────────────── */}
      <h2 id="account">4. Account Registration & Security</h2>
      <h3>4.1 Account Creation</h3>
      <p>
        To access most Services, you must create an Account. You agree to provide truthful,
        accurate, and complete information when registering and to keep this information up to date.
        Providing false or misleading information is a material breach of these Terms and may result
        in immediate termination of your Account.
      </p>
      <h3>4.2 Account Security</h3>
      <p>
        You are solely responsible for maintaining the confidentiality of your Account credentials
        (username, password, and any two-factor authentication codes). You must:
      </p>
      <ul>
        <li>Choose a strong, unique password and update it regularly;</li>
        <li>Enable two-factor authentication where available;</li>
        <li>Not share your credentials with any third party;</li>
        <li>Notify us immediately at <a href="mailto:support@nisccloud.com">support@nisccloud.com</a> upon discovering any unauthorised access or suspected breach of your Account.</li>
      </ul>
      <p>
        You are fully liable for all activity occurring under your Account, whether or not
        authorised by you, until you notify us of a breach and we have taken reasonable steps to
        address it.
      </p>
      <h3>4.3 One Account Per Entity</h3>
      <p>
        Each individual or legal entity may maintain only one primary Account unless otherwise
        permitted in writing by Nisc Cloud. We reserve the right to merge duplicate Accounts or
        terminate all but one Account.
      </p>
      <h3>4.4 Account Transfers</h3>
      <p>
        You may not transfer, sell, or assign your Account to any third party without our prior
        written consent. Any unauthorised transfer is void and may result in immediate Account
        termination.
      </p>

      {/* ─── 5. SERVICES ────────────────────────────────────────────────────── */}
      <h2 id="services">5. Description of Services</h2>
      <p>Nisc Cloud offers the following categories of Services through the Platform:</p>

      <h3>5.1 Cloud Hosting Services</h3>
      <ul>
        <li><strong>Shared Web Hosting:</strong> Managed shared-server hosting optimised for speed and reliability.</li>
        <li><strong>WordPress Hosting:</strong> Specialist hosting environment optimised for WordPress websites.</li>
        <li><strong>VPS Hosting:</strong> Virtual Private Server instances with dedicated resources and root access.</li>
        <li><strong>VDS Hosting:</strong> Virtual Dedicated Server resources for higher-traffic workloads.</li>
        <li><strong>Dedicated Server Hosting:</strong> Fully dedicated physical server infrastructure.</li>
        <li><strong>Business Email Hosting:</strong> Professional email hosting with custom domain addresses.</li>
        <li><strong>SSL Certificates:</strong> Domain validation, organisation validation, and extended validation certificates.</li>
      </ul>

      <h3>5.2 Domain Services</h3>
      <ul>
        <li><strong>Domain Registration:</strong> Registration of domain names across a wide range of TLDs including .co.ke, .com, .org, and 500+ extensions.</li>
        <li><strong>Domain Management:</strong> DNS management, domain transfer, WHOIS privacy protection, and auto-renewal services.</li>
      </ul>

      <h3>5.3 Marketing & Branding Services</h3>
      <ul>
        <li><strong>Brand Identity & Design:</strong> Logo design, brand guidelines, visual identity systems, and brand strategy.</li>
        <li><strong>Website Design & Development:</strong> Custom website design, landing pages, and e-commerce solutions.</li>
        <li><strong>SEO / AEO / GEO:</strong> Search engine optimisation, answer engine optimisation, and geo-targeted ranking services.</li>
        <li><strong>Paid Advertising:</strong> Campaign management on Google Ads, Meta Ads, TikTok Ads, and LinkedIn Ads.</li>
        <li><strong>Social Media Marketing:</strong> Content creation, scheduling, community management, and influencer campaigns.</li>
        <li><strong>Email Marketing:</strong> Sequence design, newsletter management, and marketing automation.</li>
        <li><strong>Influencer Marketing:</strong> Micro and macro influencer campaign coordination and reporting.</li>
      </ul>

      <h3>5.4 AI & Automation Services</h3>
      <ul>
        <li><strong>Zeepo AI Agent:</strong> AI-powered automation for business workflows, customer engagement, and lead management.</li>
        <li><strong>AI Image Generation:</strong> AI-assisted creative asset generation for marketing and branding.</li>
        <li><strong>Background Remover:</strong> Automated image background removal tool.</li>
      </ul>

      <h3>5.5 nPanel Dashboard</h3>
      <p>
        nPanel is our proprietary client management dashboard through which Clients manage their
        hosted services, billing, team members, domains, email accounts, and marketing campaigns.
        Access to nPanel is provided as part of active Service Subscriptions and is subject to
        these Terms.
      </p>

      <h3>5.6 Service Modifications</h3>
      <p>
        We reserve the right to add, modify, suspend, or discontinue any Service at any time, with
        reasonable notice where possible. We will not be liable to you or any third party for any
        modification, suspension, or discontinuance of Services, except that if we discontinue a
        paid Service you have subscribed to, we will provide a pro-rated refund for the unused
        portion of your prepaid subscription period.
      </p>

      {/* ─── 6. BILLING ─────────────────────────────────────────────────────── */}
      <h2 id="billing">6. Subscription Plans & Billing</h2>
      <h3>6.1 Plans & Pricing</h3>
      <p>
        Our Services are offered on a subscription basis (monthly or annual billing cycles) or as
        one-time purchases, depending on the Service. Current pricing is published on our website
        and in nPanel. All prices are stated in <strong>Kenyan Shillings (KES)</strong> unless
        otherwise indicated. We may also offer USD-denominated pricing for certain international
        Services.
      </p>
      <h3>6.2 Price Changes</h3>
      <p>
        We may adjust pricing at any time. For existing Subscriptions, we will provide at least{" "}
        <strong>30 days' written notice</strong> before any price increase takes effect. If you do
        not wish to continue at the new price, you may cancel your Subscription before the new
        pricing becomes effective. Continued use after the effective date constitutes acceptance of
        the new pricing.
      </p>
      <h3>6.3 Taxes</h3>
      <p>
        All prices are exclusive of applicable taxes unless stated otherwise. Where required by
        Kenyan law or the laws of your jurisdiction, Value Added Tax (VAT) or other applicable
        taxes will be added to your invoice. You are responsible for any applicable taxes in your
        jurisdiction.
      </p>
      <h3>6.4 Auto-Renewal</h3>
      <p>
        All Subscriptions renew automatically at the end of each billing cycle unless cancelled by
        you in advance through nPanel. You authorise us to charge your designated payment method
        for each renewal cycle. It is your responsibility to cancel before renewal if you do not
        wish to continue.
      </p>
      <h3>6.5 Invoice & Records</h3>
      <p>
        We issue electronic invoices for all transactions, accessible through your nPanel Account.
        You agree that electronic invoices satisfy any legal requirement for written invoices.
      </p>

      {/* ─── 7. PAYMENT ─────────────────────────────────────────────────────── */}
      <h2 id="payment">7. Payment Terms</h2>
      <h3>7.1 Accepted Payment Methods</h3>
      <p>We accept payment via the following methods:</p>
      <ul>
        <li><strong>M-Pesa:</strong> Safaricom M-Pesa Paybill and STK Push (Kenya);</li>
        <li><strong>Debit & Credit Cards:</strong> Visa and Mastercard (processed through PCI-DSS compliant payment processors);</li>
        <li><strong>Bank Transfer:</strong> Direct bank transfer for invoices exceeding KES 10,000 (on request).</li>
      </ul>
      <h3>7.2 Payment Processing</h3>
      <p>
        Payments are processed by third-party payment processors. We do not store full card numbers
        or M-Pesa PINs on our servers. By submitting payment information, you represent that you
        are authorised to use the payment method provided and that the information is accurate.
      </p>
      <h3>7.3 Failed Payments</h3>
      <p>
        If a payment fails, we will notify you and attempt to collect payment again. If payment
        remains outstanding after <strong>7 days</strong> of the due date, we reserve the right to
        suspend your Services. If payment is not received within <strong>30 days</strong>, we may
        terminate your Account and delete associated data in accordance with our data retention
        policy. We are not responsible for loss of data or business resulting from suspension or
        termination due to non-payment.
      </p>
      <h3>7.4 Disputes on Charges</h3>
      <p>
        If you believe a charge is incorrect, you must notify us in writing at{" "}
        <a href="mailto:support@nisccloud.com">support@nisccloud.com</a> within{" "}
        <strong>30 days</strong> of the charge date. We will investigate and, where the charge was
        erroneous, issue a credit or refund at our discretion.
      </p>

      {/* ─── 8. FREE TRIALS ─────────────────────────────────────────────────── */}
      <h2 id="free-trials">8. Free Trials & Promotional Offers</h2>
      <p>
        From time to time, we may offer free trials, promotional discounts, or introductory pricing.
        The specific terms of any such offer will be communicated at the time of the offer. Unless
        otherwise stated:
      </p>
      <ul>
        <li>Free trials are available to new Clients only and may not be combined with other promotions;</li>
        <li>At the end of a free trial, your Subscription will automatically convert to a paid plan unless cancelled before the trial expires;</li>
        <li>We reserve the right to withdraw or modify promotional offers at any time without notice;</li>
        <li>Promotional pricing applies only to the initial subscription period and reverts to standard pricing upon renewal.</li>
      </ul>

      {/* ─── 9. CANCELLATION ────────────────────────────────────────────────── */}
      <h2 id="cancellation">9. Cancellation & Termination</h2>
      <h3>9.1 Cancellation by You</h3>
      <p>
        You may cancel any Subscription at any time through nPanel or by contacting our support
        team. Cancellation takes effect at the end of the then-current billing cycle, and you will
        continue to have access to the Services until that date. We do not offer pro-rated refunds
        for cancellations mid-cycle unless expressly stated in our Refund Policy.
      </p>
      <h3>9.2 Termination by Us for Cause</h3>
      <p>
        We may suspend or terminate your Account and access to all Services immediately and without
        prior notice if:
      </p>
      <ul>
        <li>You materially breach any provision of these Terms and fail to remedy the breach within 7 days of written notice;</li>
        <li>You use the Services for illegal, fraudulent, or abusive purposes;</li>
        <li>You fail to pay any amounts due within 30 days of the due date;</li>
        <li>You provide false or misleading information during registration or thereafter;</li>
        <li>Continuation of your Account would expose Nisc Cloud or other users to legal, regulatory, or reputational risk; or</li>
        <li>We are required to do so by applicable law or a competent authority.</li>
      </ul>
      <h3>9.3 Effect of Termination</h3>
      <p>Upon termination or expiry of your Account for any reason:</p>
      <ul>
        <li>Your access to the Platform and all Services will cease;</li>
        <li>You will have <strong>30 days</strong> to export your data from nPanel after which we may delete it in accordance with our data retention policy;</li>
        <li>All outstanding Fees remain due and payable immediately;</li>
        <li>Provisions of these Terms that by their nature should survive termination (including Sections 13, 16, 19, 20, 22, and 23) shall continue to apply.</li>
      </ul>
      <h3>9.4 Domain & Hosting Continuity</h3>
      <p>
        Upon termination, domain names registered through Nisc Cloud will be eligible for transfer
        to another registrar at your request during the 30-day data retrieval window. Nisc Cloud is
        not responsible for any loss of domain names that are not transferred within this period.
      </p>

      {/* ─── 10. REFUNDS ────────────────────────────────────────────────────── */}
      <h2 id="refunds">10. Refund Policy</h2>
      <h3>10.1 Cloud Hosting Services</h3>
      <p>
        We offer a <strong>7-day money-back guarantee</strong> on new shared hosting, WordPress
        hosting, and business email hosting plans. If you are not satisfied, contact us within 7
        days of the initial purchase and we will issue a full refund. This guarantee applies to
        first-time purchases only and does not apply to renewals.
      </p>
      <h3>10.2 VPS, VDS & Dedicated Servers</h3>
      <p>
        Due to the immediate provisioning of dedicated infrastructure resources, VPS, VDS, and
        dedicated server plans are <strong>non-refundable</strong> once provisioned. If a server
        fails to provision correctly through our error, we will offer a full refund or re-provision.
      </p>
      <h3>10.3 Domain Registrations</h3>
      <p>
        Domain registrations are <strong>non-refundable</strong> once processed, as we incur costs
        from the domain registry upon registration. In exceptional circumstances (e.g., duplicate
        registration caused by a system error on our part), we may issue a refund at our
        discretion.
      </p>
      <h3>10.4 SSL Certificates</h3>
      <p>
        SSL certificates may be refunded within <strong>30 days</strong> of purchase if not yet
        issued or installed. Once a certificate has been issued, it is non-refundable.
      </p>
      <h3>10.5 Marketing & Design Services</h3>
      <p>
        Marketing, design, and creative services are governed by individual service agreements or
        statements of work. Refund terms are set out in those agreements. In the absence of a
        specific agreement, deposits and upfront payments are non-refundable once work has
        commenced.
      </p>
      <h3>10.6 AI & Automation Services</h3>
      <p>
        AI service credits and automation service packages are non-refundable once consumed. Unused
        credits at the time of account termination will not be refunded.
      </p>
      <h3>10.7 Process</h3>
      <p>
        Refund requests must be submitted in writing to{" "}
        <a href="mailto:support@nisccloud.com">support@nisccloud.com</a>. Approved refunds are
        processed within <strong>7–14 Working Days</strong> via the original payment method.
        M-Pesa refunds are subject to Safaricom's processing timelines.
      </p>

      {/* ─── 11. ACCEPTABLE USE ─────────────────────────────────────────────── */}
      <h2 id="acceptable-use">11. Acceptable Use Policy</h2>
      <p>
        You may only use our Services for lawful purposes and in accordance with these Terms. You
        agree that you will not use the Platform or Services to:
      </p>
      <ul>
        <li>Host, transmit, or distribute any content that is illegal under Kenyan law or the laws of your jurisdiction;</li>
        <li>Send unsolicited bulk email (spam), phishing emails, or any other unsolicited commercial communications;</li>
        <li>Host, distribute, or link to malware, viruses, ransomware, spyware, or any other malicious code;</li>
        <li>Conduct or facilitate distributed denial-of-service (DDoS) attacks or any other form of cyberattack;</li>
        <li>Mine cryptocurrencies or engage in any activity that places excessive, unreasonable strain on shared infrastructure without prior written approval;</li>
        <li>Store or process content that infringes the intellectual property rights of any person;</li>
        <li>Host content that constitutes child sexual abuse material (CSAM) — this is a zero-tolerance policy and will result in immediate termination and reporting to relevant authorities;</li>
        <li>Engage in any form of online fraud, identity theft, or financial crime;</li>
        <li>Circumvent or attempt to circumvent any security measure, firewall, or access control;</li>
        <li>Reverse engineer, decompile, or disassemble any part of the Platform; or</li>
        <li>Use the Platform to compete directly with Nisc Cloud by reselling our infrastructure as your own unlicensed product.</li>
      </ul>
      <p>
        We reserve the right to monitor usage patterns to detect violations of this policy and to
        take immediate corrective action, including content removal, service suspension, or account
        termination, without prior notice where the violation is serious.
      </p>

      {/* ─── 12. PROHIBITED ─────────────────────────────────────────────────── */}
      <h2 id="prohibited">12. Prohibited Conduct</h2>
      <p>In addition to the Acceptable Use Policy above, you must not:</p>
      <ul>
        <li><strong>Impersonate</strong> Nisc Cloud, our employees, partners, or any other person or entity;</li>
        <li><strong>Scrape</strong> or systematically extract data from the Platform without our prior written consent;</li>
        <li><strong>Create multiple Accounts</strong> to circumvent service limits, suspensions, or bans;</li>
        <li><strong>Interfere</strong> with the proper functioning of the Platform or any other user's use of the Services;</li>
        <li><strong>Resell</strong> or sublicense Services without an express written reseller agreement with Nisc Cloud;</li>
        <li><strong>Use automated tools</strong> (bots, crawlers, scrapers) to access the Platform in a manner that exceeds normal human interaction rates without prior written consent;</li>
        <li><strong>Violate</strong> any applicable law, including the Kenya Information and Communications Act, the Computer Misuse and Cybercrimes Act 2018, the Data Protection Act 2019, or any applicable anti-money laundering regulation.</li>
      </ul>

      {/* ─── 13. INTELLECTUAL PROPERTY ──────────────────────────────────────── */}
      <h2 id="ip">13. Intellectual Property Rights</h2>
      <h3>13.1 Our IP</h3>
      <p>
        The Platform, nPanel, all associated software, trademarks, logos, service marks, trade
        names, design elements, algorithms, and content created by Nisc Cloud (<strong>"Nisc Cloud
        IP"</strong>) are the exclusive property of Nisc Cloud Limited or its licensors and are
        protected by copyright, trademark, and other intellectual property laws in Kenya and
        internationally. Nothing in these Terms grants you any ownership right in Nisc Cloud IP.
      </p>
      <h3>13.2 Licence to Use</h3>
      <p>
        Subject to your compliance with these Terms, Nisc Cloud grants you a limited, non-exclusive,
        non-transferable, revocable licence to access and use the Platform solely for your internal
        business purposes in connection with the Services you have subscribed to.
      </p>
      <h3>13.3 No Reverse Engineering</h3>
      <p>
        You must not decompile, disassemble, reverse engineer, or otherwise attempt to derive the
        source code, underlying ideas, algorithms, structure, or organisation of any software
        forming part of the Platform.
      </p>
      <h3>13.4 Feedback Licence</h3>
      <p>
        If you provide feedback, suggestions, or ideas regarding the Platform or Services
        (<strong>"Feedback"</strong>), you grant Nisc Cloud a perpetual, irrevocable, worldwide,
        royalty-free, fully sublicensable licence to use, reproduce, modify, adapt, publish,
        translate, and distribute such Feedback for any purpose without compensation to you.
      </p>
      <h3>13.5 Deliverables from Marketing/Design Services</h3>
      <p>
        Where Nisc Cloud creates deliverables specifically for you (e.g., logo design, website,
        ad creative) under a paid service agreement, ownership of such deliverables shall transfer
        to you upon receipt of full payment. Nisc Cloud retains the right to display such
        deliverables in its portfolio unless you request otherwise in writing.
      </p>

      {/* ─── 14. USER CONTENT ───────────────────────────────────────────────── */}
      <h2 id="user-content">14. User Content</h2>
      <h3>14.1 Ownership</h3>
      <p>
        You retain ownership of all Content you upload, store, or transmit through the Platform
        (<strong>"User Content"</strong>). Nisc Cloud claims no ownership over your User Content.
      </p>
      <h3>14.2 Licence Grant</h3>
      <p>
        By uploading or storing User Content on the Platform, you grant Nisc Cloud a limited,
        non-exclusive, worldwide, royalty-free licence to host, store, process, reproduce, and
        display your User Content solely to the extent necessary to provide the Services to you.
        This licence terminates when you delete the content or close your Account.
      </p>
      <h3>14.3 Content Standards</h3>
      <p>
        You represent and warrant that your User Content: (a) does not infringe any third-party
        intellectual property right; (b) does not contain unlawful, defamatory, obscene, or
        otherwise objectionable material; (c) does not violate any applicable law; and (d) is
        accurate and not misleading.
      </p>
      <h3>14.4 Takedown</h3>
      <p>
        We reserve the right to remove or disable access to any User Content that we reasonably
        believe violates these Terms, applicable law, or third-party rights, with or without
        notice. If you believe your Content has been removed in error, contact us at{" "}
        <a href="mailto:support@nisccloud.com">support@nisccloud.com</a>.
      </p>

      {/* ─── 15. THIRD-PARTY SERVICES ───────────────────────────────────────── */}
      <h2 id="third-party">15. Third-Party Services & Integrations</h2>
      <p>
        Our Platform may integrate with or enable access to third-party services, including Google
        Ads, Meta Ads, LinkedIn Ads, Safaricom M-Pesa, domain registries, and other technology
        providers (<strong>"Third-Party Services"</strong>). Your use of Third-Party Services is
        governed by the respective terms and privacy policies of those providers.
      </p>
      <p>
        Nisc Cloud does not endorse, control, or assume any responsibility for Third-Party
        Services. We are not liable for any loss, damage, or harm resulting from your use of, or
        inability to use, any Third-Party Service, including payment processing failures, ad
        platform changes, or domain registry outages.
      </p>
      <p>
        When you connect Third-Party Services to nPanel (e.g., your Google Ads account), you
        authorise Nisc Cloud to access and use data from those services solely to provide the
        Services you have requested.
      </p>

      {/* ─── 16. DATA PROTECTION ────────────────────────────────────────────── */}
      <h2 id="data-protection">16. Data Protection & Privacy</h2>
      <p>
        Nisc Cloud is committed to protecting your personal data in accordance with the{" "}
        <strong>Kenya Data Protection Act, 2019</strong> and our registered obligations as a Data
        Controller (ODPC Registration No. <strong>160-3417-5D07</strong>). Our full data protection
        practices are set out in our <Link to="/privacy">Privacy Policy</Link>, which forms part of
        this Agreement.
      </p>
      <p>
        Where you use our Services to store or process the personal data of your own customers or
        end users, you act as the Data Controller for such data and Nisc Cloud acts as a Data
        Processor. You are responsible for ensuring your use of the Services complies with
        applicable data protection laws in respect of data you control. You may request a Data
        Processing Agreement (DPA) from us at{" "}
        <a href="mailto:privacy@nisccloud.com">privacy@nisccloud.com</a>.
      </p>

      {/* ─── 17. CONFIDENTIALITY ────────────────────────────────────────────── */}
      <h2 id="confidentiality">17. Confidentiality</h2>
      <p>
        Each party agrees to keep confidential all non-public, proprietary, or commercially
        sensitive information disclosed by the other party in connection with the Services
        (<strong>"Confidential Information"</strong>), and not to disclose it to any third party
        without prior written consent, except:
      </p>
      <ul>
        <li>Where disclosure is required by law or a competent regulatory authority;</li>
        <li>To professional advisers (lawyers, accountants) bound by duties of confidentiality; or</li>
        <li>Where the information is or becomes publicly available without breach of this clause.</li>
      </ul>
      <p>
        This confidentiality obligation survives termination of this Agreement for a period of{" "}
        <strong>3 years</strong>.
      </p>

      {/* ─── 18. SLA ────────────────────────────────────────────────────────── */}
      <h2 id="sla">18. Service Availability & SLA</h2>
      <h3>18.1 Hosting Uptime Commitment</h3>
      <p>
        For shared hosting, WordPress hosting, and business email hosting plans, we target a monthly
        uptime of <strong>99.9%</strong>, excluding scheduled maintenance windows and force majeure
        events. In the event of downtime attributable to us that falls below this commitment in a
        given calendar month, you may request a service credit equal to a proportionate amount of
        your monthly fee, up to a maximum of one month's subscription fee.
      </p>
      <h3>18.2 Scheduled Maintenance</h3>
      <p>
        We will endeavour to provide at least <strong>24 hours' advance notice</strong> of
        scheduled maintenance that may affect service availability. Emergency maintenance may be
        performed without notice where necessary to protect the security or stability of the
        Platform.
      </p>
      <h3>18.3 Force Majeure</h3>
      <p>
        Nisc Cloud shall not be liable for any failure or delay in performance of Services to the
        extent caused by circumstances beyond our reasonable control, including but not limited to
        acts of God, natural disasters, internet infrastructure failures, power outages, government
        orders, pandemics, or acts of terrorism.
      </p>
      <h3>18.4 Marketing & Creative Services</h3>
      <p>
        No uptime or availability SLA applies to marketing, design, or AI services. Timelines for
        deliverables are governed by individual service agreements.
      </p>

      {/* ─── 19. LIMITATION OF LIABILITY ────────────────────────────────────── */}
      <h2 id="liability">19. Limitation of Liability</h2>
      <h3>19.1 Exclusion of Consequential Loss</h3>
      <p>
        To the fullest extent permitted by applicable law, Nisc Cloud shall not be liable to you
        for any indirect, incidental, special, consequential, or punitive damages, or for any loss
        of profits, revenue, data, business, goodwill, or anticipated savings, arising out of or
        in connection with your use of the Platform or Services, regardless of whether we were
        advised of the possibility of such damages.
      </p>
      <h3>19.2 Aggregate Cap</h3>
      <p>
        Our total aggregate liability to you for all claims arising out of or in connection with
        this Agreement shall not exceed the greater of:
      </p>
      <ul>
        <li>The total Fees paid by you to Nisc Cloud in the <strong>12 months immediately preceding</strong> the event giving rise to the claim; or</li>
        <li><strong>KES 5,000</strong>.</li>
      </ul>
      <h3>19.3 Exceptions</h3>
      <p>
        Nothing in this Agreement limits or excludes our liability for: (a) death or personal injury
        caused by our negligence; (b) fraud or fraudulent misrepresentation; or (c) any other
        liability that cannot be excluded or limited by applicable Kenyan law.
      </p>
      <h3>19.4 Third-Party Services</h3>
      <p>
        We are not liable for any failure, error, or loss arising from your use of Third-Party
        Services integrated with our Platform, including payment processing errors, advertising
        platform changes, or domain registry failures.
      </p>

      {/* ─── 20. INDEMNIFICATION ────────────────────────────────────────────── */}
      <h2 id="indemnification">20. Indemnification</h2>
      <p>
        You agree to defend, indemnify, and hold harmless Nisc Cloud Limited, its directors,
        officers, employees, agents, and licensors from and against any claims, actions, proceedings,
        damages, losses, liabilities, costs, and expenses (including reasonable legal fees) arising
        from or in connection with:
      </p>
      <ul>
        <li>Your use of the Platform or Services in violation of these Terms or applicable law;</li>
        <li>Your User Content, including any claim that it infringes a third-party right;</li>
        <li>Your misrepresentation regarding your eligibility or authority to enter into this Agreement; or</li>
        <li>Your violation of any third-party right, including intellectual property, privacy, or publicity rights.</li>
      </ul>
      <p>
        We reserve the right to assume exclusive control of any matter subject to indemnification
        by you, in which case you agree to cooperate fully with us.
      </p>

      {/* ─── 21. WARRANTIES ─────────────────────────────────────────────────── */}
      <h2 id="warranties">21. Warranties & Disclaimers</h2>
      <h3>21.1 Our Warranties</h3>
      <p>
        We warrant that: (a) we have full right and authority to enter into this Agreement; (b) we
        will provide the Services with reasonable skill and care; and (c) the Platform will
        substantially perform in accordance with its documentation during your Subscription.
      </p>
      <h3>21.2 Disclaimer for Marketing Services</h3>
      <p>
        <strong>We make no warranty or guarantee of any specific marketing outcome</strong>,
        including but not limited to search engine rankings, advertising ROI, lead volume,
        conversion rates, social media growth, or revenue generated. Marketing results are inherently
        variable and depend on factors outside our control.
      </p>
      <h3>21.3 "As Available" Disclaimer</h3>
      <p>
        Except as expressly stated herein, the Platform and Services are provided{" "}
        <strong>"as is" and "as available"</strong> without any warranty of any kind, express or
        implied, including warranties of merchantability, fitness for a particular purpose, or
        non-infringement.
      </p>

      {/* ─── 22. DISPUTES ───────────────────────────────────────────────────── */}
      <h2 id="disputes">22. Dispute Resolution</h2>
      <h3>22.1 Informal Resolution</h3>
      <p>
        Before initiating any formal dispute proceeding, you must contact us at{" "}
        <a href="mailto:support@nisccloud.com">support@nisccloud.com</a> and allow us{" "}
        <strong>30 days</strong> to attempt to resolve the dispute informally. This is a condition
        precedent to any formal proceedings.
      </p>
      <h3>22.2 Mediation</h3>
      <p>
        If informal resolution fails, the parties agree to attempt mediation administered by the
        Nairobi Centre for International Arbitration (NCIA) or such other accredited mediation body
        as the parties may agree in writing, before resorting to litigation or arbitration.
      </p>
      <h3>22.3 Arbitration</h3>
      <p>
        Any dispute, controversy, or claim arising out of or relating to this Agreement, or the
        breach, termination, or invalidity thereof, that cannot be resolved by mediation shall be
        finally settled by binding arbitration under the{" "}
        <strong>Kenya Arbitration Act (Cap. 49)</strong>, by a sole arbitrator agreed upon by the
        parties, or in the absence of agreement, appointed by the Chairman of the Chartered
        Institute of Arbitrators (Kenya Branch). The seat of arbitration shall be{" "}
        <strong>Nairobi, Kenya</strong>, and the language shall be <strong>English</strong>.
      </p>
      <h3>22.4 Exceptions</h3>
      <p>
        Notwithstanding the above, either party may seek emergency injunctive or other equitable
        relief from a competent court in Nairobi to protect intellectual property rights or prevent
        irreparable harm pending arbitration.
      </p>
      <h3>22.5 Class Action Waiver</h3>
      <p>
        To the maximum extent permitted by law, you waive any right to participate in any class
        action, class arbitration, or representative proceeding against Nisc Cloud.
      </p>

      {/* ─── 23. GOVERNING LAW ──────────────────────────────────────────────── */}
      <h2 id="governing-law">23. Governing Law & Jurisdiction</h2>
      <p>
        This Agreement is governed by and construed in accordance with the <strong>laws of the
        Republic of Kenya</strong>, without regard to its conflict of law provisions. Subject to
        the dispute resolution clause above, you submit to the exclusive jurisdiction of the courts
        located in <strong>Nairobi, Kenya</strong> for the resolution of any disputes not subject
        to arbitration.
      </p>

      {/* ─── 24. CHANGES ────────────────────────────────────────────────────── */}
      <h2 id="changes">24. Changes to These Terms</h2>
      <p>
        We reserve the right to modify these Terms at any time. We will notify you of material
        changes by:
      </p>
      <ul>
        <li>Sending an email to the address associated with your Account at least <strong>30 days</strong> before the effective date of the change;</li>
        <li>Displaying a prominent notice on the Platform or within nPanel; and/or</li>
        <li>Updating the "Last Updated" date at the top of these Terms.</li>
      </ul>
      <p>
        Your continued use of the Platform or any Service after the effective date of the revised
        Terms constitutes your acceptance of those changes. If you do not agree to the revised
        Terms, you must cancel your Subscription and cease use of the Platform before the
        effective date.
      </p>
      <p>
        Previous versions of these Terms are archived and available upon written request to{" "}
        <a href="mailto:support@nisccloud.com">support@nisccloud.com</a>.
      </p>

      {/* ─── 25. GENERAL ────────────────────────────────────────────────────── */}
      <h2 id="general">25. General Provisions</h2>
      <h3>25.1 Entire Agreement</h3>
      <p>
        This Agreement, together with any applicable service-specific terms, order forms, and our
        Privacy Policy and Cookie Policy, constitutes the entire agreement between you and Nisc
        Cloud with respect to its subject matter and supersedes all prior oral or written
        understandings, representations, or agreements.
      </p>
      <h3>25.2 Severability</h3>
      <p>
        If any provision of these Terms is found to be invalid, illegal, or unenforceable, that
        provision shall be modified to the minimum extent necessary to make it enforceable, and the
        remainder of these Terms shall continue in full force and effect.
      </p>
      <h3>25.3 No Waiver</h3>
      <p>
        Our failure to enforce any right or provision of these Terms shall not constitute a waiver
        of that right or provision. Any waiver must be in writing and signed by an authorised
        representative of Nisc Cloud.
      </p>
      <h3>25.4 Assignment</h3>
      <p>
        You may not assign or transfer your rights or obligations under this Agreement without our
        prior written consent. We may assign this Agreement (in whole or in part) to an affiliate
        or in connection with a merger, acquisition, or sale of substantially all of our assets,
        with 30 days' written notice to you.
      </p>
      <h3>25.5 Notices</h3>
      <p>
        Notices from Nisc Cloud to you will be sent to the email address associated with your
        Account. Notices from you to Nisc Cloud must be sent to{" "}
        <a href="mailto:support@nisccloud.com">support@nisccloud.com</a>. Notices are effective upon
        confirmed receipt.
      </p>
      <h3>25.6 Language</h3>
      <p>
        These Terms are drafted in English. In the event of any conflict between the English
        version and any translation, the English version shall prevail.
      </p>
      <h3>25.7 Headings</h3>
      <p>
        Section headings are for convenience only and shall not affect the interpretation of these
        Terms.
      </p>

      {/* ─── 26. CONTACT ────────────────────────────────────────────────────── */}
      <h2 id="contact">26. Contact Us</h2>
      <p>
        If you have any questions, concerns, or complaints regarding these Terms of Service, please
        contact us:
      </p>
      <ul>
        <li><strong>Email:</strong> <a href="mailto:support@nisccloud.com">support@nisccloud.com</a></li>
        <li><strong>Legal & Privacy enquiries:</strong> <a href="mailto:privacy@nisccloud.com">privacy@nisccloud.com</a></li>
        <li><strong>Address:</strong> Nisc Cloud Limited, Nairobi, Kenya</li>
        <li><strong>ODPC Registration:</strong> No. 160-3417-5D07</li>
      </ul>
      <p>
        We aim to respond to all enquiries within <strong>5 Working Days</strong>.
      </p>
    </LegalPageShell>
  );
}
