import { LegalPageShell, type TocItem } from "../_components/LegalPageShell.tsx";
import { Link } from "react-router-dom";

const toc: TocItem[] = [
  { id: "what-are-cookies", label: "1. What Are Cookies" },
  { id: "why-we-use", label: "2. Why We Use Cookies" },
  { id: "types", label: "3. Types of Cookies We Use" },
  { id: "cookie-list", label: "4. Cookie List" },
  { id: "third-party-cookies", label: "5. Third-Party Cookies" },
  { id: "consent", label: "6. Your Consent" },
  { id: "managing", label: "7. Managing & Opting Out" },
  { id: "do-not-track", label: "8. Do Not Track" },
  { id: "changes", label: "9. Changes to This Policy" },
  { id: "contact", label: "10. Contact Us" },
];

export default function CookiePolicyPage() {
  return (
    <LegalPageShell
      title="Cookie Policy"
      subtitle="This Cookie Policy explains what cookies are, how Nisc Cloud Limited uses them on our website and nPanel platform, and the choices you have regarding their use."
      effectiveDate="1 September 2025"
      lastUpdated="1 July 2026"
      toc={toc}
    >
      <p>
        When you visit <strong>nisccloud.com</strong> or use <strong>nPanel</strong>{" "}
        (npanel.nisccloud.com), we and our third-party partners may place small data files called{" "}
        <em>cookies</em> on your browser or device. This policy explains what these cookies are,
        why we use them, and how you can control them. This Cookie Policy should be read alongside
        our <Link to="/privacy">Privacy Policy</Link> and{" "}
        <Link to="/terms">Terms of Service</Link>.
      </p>

      {/* ─── 1. WHAT ARE COOKIES ────────────────────────────────────────────── */}
      <h2 id="what-are-cookies">1. What Are Cookies?</h2>
      <p>
        A <strong>cookie</strong> is a small text file that a website stores on your computer,
        tablet, or mobile device when you visit it. Cookies are widely used to make websites work,
        improve efficiency, and provide information to website owners. Cookies can be:
      </p>
      <ul>
        <li>
          <strong>Session cookies:</strong> Temporary files that exist only while your browser is
          open and are automatically deleted when you close it.
        </li>
        <li>
          <strong>Persistent cookies:</strong> Files that remain on your device for a set period
          (or until you manually delete them) and are re-activated each time you visit the
          site that created them.
        </li>
        <li>
          <strong>First-party cookies:</strong> Set directly by Nisc Cloud on our own domains.
        </li>
        <li>
          <strong>Third-party cookies:</strong> Set by external services we integrate (e.g.,
          Google Analytics, Meta Pixel) on our behalf or on their own behalf.
        </li>
      </ul>
      <p>
        Similar technologies  including <strong>pixel tags</strong>, <strong>web beacons</strong>,{" "}
        <strong>local storage</strong>, and <strong>fingerprinting</strong>  may also be used for
        comparable purposes. Where this policy refers to "cookies", it encompasses all such
        technologies unless stated otherwise.
      </p>

      {/* ─── 2. WHY WE USE COOKIES ──────────────────────────────────────────── */}
      <h2 id="why-we-use">2. Why We Use Cookies</h2>
      <p>We use cookies and similar technologies to:</p>
      <ul>
        <li>Keep you signed in to nPanel securely across sessions;</li>
        <li>Remember your preferences and settings;</li>
        <li>Protect against cross-site request forgery (CSRF) and other security threats;</li>
        <li>Understand how visitors use our website so we can improve the experience;</li>
        <li>Measure the effectiveness of our marketing and advertising campaigns;</li>
        <li>Deliver relevant advertising to you on third-party platforms (with your consent); and</li>
        <li>Ensure compliance with our cart and checkout flow.</li>
      </ul>

      {/* ─── 3. TYPES ───────────────────────────────────────────────────────── */}
      <h2 id="types">3. Types of Cookies We Use</h2>
      <p>
        We classify our cookies into four categories, consistent with the Kenya Data Protection Act,
        2019 and international best practice:
      </p>

      <h3>3.1 Strictly Necessary Cookies</h3>
      <p>
        These cookies are <strong>essential</strong> for the Platform to function. They enable core
        features such as authentication, security, and shopping cart management. The Platform
        cannot function properly without them, and they <strong>cannot be disabled</strong> via
        our cookie controls. They do not require your consent under the Kenya Data Protection Act,
        2019 as they are necessary for the performance of a contract.
      </p>
      <p>Examples of what they do:</p>
      <ul>
        <li>Maintain your nPanel login session;</li>
        <li>Prevent cross-site request forgery (CSRF);</li>
        <li>Store your shopping cart contents temporarily;</li>
        <li>Balance load across our servers;</li>
        <li>Record your cookie consent preferences.</li>
      </ul>

      <h3>3.2 Functional Cookies</h3>
      <p>
        Functional cookies enable the Platform to remember choices you make and provide enhanced,
        personalised features. They may be set by us or by third-party providers whose services we
        have added to our pages. These cookies are used <strong>with your consent</strong>, and
        disabling them may affect some features of the Platform.
      </p>
      <p>Examples of what they do:</p>
      <ul>
        <li>Remember your preferred language or region;</li>
        <li>Remember your dark/light mode preference;</li>
        <li>Pre-fill your name or company in contact forms (where you have previously provided it);</li>
        <li>Maintain your session preferences across nPanel tabs.</li>
      </ul>

      <h3>3.3 Analytics Cookies</h3>
      <p>
        Analytics cookies help us understand how visitors interact with our website and nPanel.
        All information collected is <strong>aggregated and anonymised</strong> wherever possible.
        We use this data to improve our Platform's usability, performance, and content. These
        cookies require your <strong>consent</strong> before being placed.
      </p>
      <p>Examples of what they do:</p>
      <ul>
        <li>Count the number of visitors to each page;</li>
        <li>Identify which pages are most and least popular;</li>
        <li>Track user journeys through our website (e.g., from landing page to checkout);</li>
        <li>Measure page load times and technical performance;</li>
        <li>Detect errors and broken links.</li>
      </ul>

      <h3>3.4 Marketing & Advertising Cookies</h3>
      <p>
        Marketing cookies track your browsing activity across websites and are used to display
        advertisements that are relevant and engaging to you on third-party platforms (e.g., Google,
        Meta, LinkedIn). They also allow us to measure the effectiveness of our advertising
        campaigns. These cookies require your <strong>explicit consent</strong> and may be set by
        our advertising partners as well as by us.
      </p>
      <p>Examples of what they do:</p>
      <ul>
        <li>Record that you visited our pricing page so we can show you relevant ads on Meta or Google;</li>
        <li>Measure whether you clicked on an advertisement before visiting our site;</li>
        <li>Prevent the same advertisement from appearing to you too many times;</li>
        <li>Build a profile of your interests for advertising personalisation.</li>
      </ul>

      {/* ─── 4. COOKIE LIST ─────────────────────────────────────────────────── */}
      <h2 id="cookie-list">4. Cookie List</h2>
      <p>
        The following table describes the specific cookies currently in use on our Platform. This
        list is reviewed and updated when our cookie usage changes.
      </p>

      <div className="overflow-x-auto my-6">
        <table>
          <thead>
            <tr>
              <th>Cookie Name</th>
              <th>Provider</th>
              <th>Category</th>
              <th>Purpose</th>
              <th>Duration</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td><code>session_id</code></td>
              <td>Nisc Cloud</td>
              <td>Strictly Necessary</td>
              <td>Maintains your authenticated nPanel session</td>
              <td>Session</td>
            </tr>
            <tr>
              <td><code>csrf_token</code></td>
              <td>Nisc Cloud</td>
              <td>Strictly Necessary</td>
              <td>Prevents cross-site request forgery attacks</td>
              <td>Session</td>
            </tr>
            <tr>
              <td><code>cookie_consent</code></td>
              <td>Nisc Cloud</td>
              <td>Strictly Necessary</td>
              <td>Stores your cookie consent preferences</td>
              <td>12 months</td>
            </tr>
            <tr>
              <td><code>cart_handoff</code></td>
              <td>Nisc Cloud</td>
              <td>Strictly Necessary</td>
              <td>Maintains your shopping cart state during checkout</td>
              <td>Session</td>
            </tr>
            <tr>
              <td><code>theme_pref</code></td>
              <td>Nisc Cloud</td>
              <td>Functional</td>
              <td>Remembers your light/dark mode preference</td>
              <td>12 months</td>
            </tr>
            <tr>
              <td><code>lang_pref</code></td>
              <td>Nisc Cloud</td>
              <td>Functional</td>
              <td>Remembers your language preference</td>
              <td>12 months</td>
            </tr>
            <tr>
              <td><code>_ga</code></td>
              <td>Google Analytics</td>
              <td>Analytics</td>
              <td>Distinguishes unique visitors for audience measurement</td>
              <td>2 years</td>
            </tr>
            <tr>
              <td><code>_ga_*</code></td>
              <td>Google Analytics</td>
              <td>Analytics</td>
              <td>Persists session state for Google Analytics 4</td>
              <td>2 years</td>
            </tr>
            <tr>
              <td><code>_gid</code></td>
              <td>Google Analytics</td>
              <td>Analytics</td>
              <td>Stores and updates a unique value for each page visited</td>
              <td>24 hours</td>
            </tr>
            <tr>
              <td><code>_fbp</code></td>
              <td>Meta (Facebook)</td>
              <td>Marketing</td>
              <td>Identifies browsers for delivery of advertising on Meta platforms</td>
              <td>3 months</td>
            </tr>
            <tr>
              <td><code>_fbc</code></td>
              <td>Meta (Facebook)</td>
              <td>Marketing</td>
              <td>Stores the click identifier from a Facebook ad click</td>
              <td>2 years</td>
            </tr>
            <tr>
              <td><code>_gcl_au</code></td>
              <td>Google Ads</td>
              <td>Marketing</td>
              <td>Stores and tracks conversions from Google Ads</td>
              <td>3 months</td>
            </tr>
            <tr>
              <td><code>li_fat_id</code></td>
              <td>LinkedIn</td>
              <td>Marketing</td>
              <td>Enables LinkedIn campaign conversion tracking and retargeting</td>
              <td>30 days</td>
            </tr>
            <tr>
              <td><code>_hjSessionUser_*</code></td>
              <td>Hotjar</td>
              <td>Analytics</td>
              <td>Identifies a unique user to support session recording and heatmaps</td>
              <td>12 months</td>
            </tr>
          </tbody>
        </table>
      </div>
      <p>
        <em>
          This list may be updated as we add or remove third-party tools. The last review of this
          list was conducted on <strong>1 July 2026</strong>.
        </em>
      </p>

      {/* ─── 5. THIRD-PARTY COOKIES ─────────────────────────────────────────── */}
      <h2 id="third-party-cookies">5. Third-Party Cookies</h2>
      <p>
        We use services from the following third parties that may set cookies on your device when
        you visit our Platform. These third parties have their own privacy and cookie policies,
        which we encourage you to review:
      </p>

      <h3>5.1 Google Analytics & Google Ads</h3>
      <p>
        We use Google Analytics (GA4) to measure website and nPanel usage. Google Ads cookies are
        used to measure advertising campaign performance. Google may use the data collected to
        contextualise and personalise the ads of its own advertising network.
      </p>
      <ul>
        <li>Google Privacy Policy: <a href="https://policies.google.com/privacy" target="_blank" rel="noopener noreferrer">policies.google.com/privacy</a></li>
        <li>Google Analytics Opt-Out: <a href="https://tools.google.com/dlpage/gaoptout" target="_blank" rel="noopener noreferrer">tools.google.com/dlpage/gaoptout</a></li>
      </ul>

      <h3>5.2 Meta (Facebook) Pixel</h3>
      <p>
        We use the Meta Pixel to measure the effectiveness of our Facebook and Instagram
        advertising campaigns and to build Custom Audiences for advertising on Meta platforms.
      </p>
      <ul>
        <li>Meta Privacy Policy: <a href="https://www.facebook.com/policy.php" target="_blank" rel="noopener noreferrer">facebook.com/policy.php</a></li>
        <li>Meta Ad Preferences: <a href="https://www.facebook.com/ads/preferences" target="_blank" rel="noopener noreferrer">facebook.com/ads/preferences</a></li>
      </ul>

      <h3>5.3 LinkedIn Insight Tag</h3>
      <p>
        The LinkedIn Insight Tag enables in-depth campaign reporting and helps us learn about
        website visitors who interact with our LinkedIn ads.
      </p>
      <ul>
        <li>LinkedIn Privacy Policy: <a href="https://www.linkedin.com/legal/privacy-policy" target="_blank" rel="noopener noreferrer">linkedin.com/legal/privacy-policy</a></li>
        <li>LinkedIn Opt-Out: <a href="https://www.linkedin.com/psettings/guest-controls" target="_blank" rel="noopener noreferrer">linkedin.com/psettings/guest-controls</a></li>
      </ul>

      <h3>5.4 Hotjar</h3>
      <p>
        We may use Hotjar to better understand user behaviour through heatmaps, session
        recordings, and feedback polls. Hotjar is configured to respect user privacy and does
        not record sensitive form fields (e.g., passwords or payment details).
      </p>
      <ul>
        <li>Hotjar Privacy Policy: <a href="https://www.hotjar.com/legal/policies/privacy/" target="_blank" rel="noopener noreferrer">hotjar.com/legal/policies/privacy</a></li>
        <li>Hotjar Opt-Out: <a href="https://www.hotjar.com/legal/compliance/opt-out" target="_blank" rel="noopener noreferrer">hotjar.com/legal/compliance/opt-out</a></li>
      </ul>

      <h3>5.5 Safaricom M-Pesa (Payment Flow)</h3>
      <p>
        When you make a payment via M-Pesa, the payment flow may involve Safaricom cookies or
        session tokens for secure transaction processing. These are strictly necessary for the
        payment process and governed by Safaricom's privacy policy.
      </p>
      <ul>
        <li>Safaricom Privacy Policy: <a href="https://www.safaricom.co.ke/privacy-policy" target="_blank" rel="noopener noreferrer">safaricom.co.ke/privacy-policy</a></li>
      </ul>

      {/* ─── 6. CONSENT ─────────────────────────────────────────────────────── */}
      <h2 id="consent">6. Your Consent</h2>
      <p>
        When you first visit our website, you will be presented with a{" "}
        <strong>Cookie Consent Banner</strong> that allows you to:
      </p>
      <ul>
        <li><strong>Accept All:</strong> Accept all cookie categories, including analytics and marketing;</li>
        <li><strong>Reject Non-Essential:</strong> Accept only Strictly Necessary cookies and decline analytics and marketing cookies; or</li>
        <li><strong>Manage Preferences:</strong> Customise your cookie choices by category.</li>
      </ul>
      <p>
        Strictly Necessary cookies are placed without your consent as they are required for the
        Platform to function. Your consent is required for all other cookie categories.
      </p>
      <p>
        Your consent preferences are recorded in the <code>cookie_consent</code> cookie and
        respected for <strong>12 months</strong>. You can update your preferences at any time
        using the "Cookie Settings" link in the footer of our website.
      </p>
      <p>
        Under the Kenya Data Protection Act, 2019, consent must be freely given, specific,
        informed, and unambiguous. We honour these requirements  you will not be penalised for
        declining non-essential cookies, and our core Services function with Strictly Necessary
        cookies only.
      </p>

      {/* ─── 7. MANAGING ────────────────────────────────────────────────────── */}
      <h2 id="managing">7. Managing & Opting Out of Cookies</h2>
      <p>
        You have several options for controlling or limiting how cookies are used:
      </p>

      <h3>7.1 Our Cookie Preference Centre</h3>
      <p>
        Click <strong>"Cookie Settings"</strong> in the footer of our website at any time to
        update your cookie preferences. Changes take effect immediately and your new preferences
        are saved for 12 months.
      </p>

      <h3>7.2 Browser Settings</h3>
      <p>
        Most modern web browsers allow you to control cookies through their settings. You can
        configure your browser to block all cookies, block third-party cookies, delete cookies
        when you close the browser, or alert you when a cookie is being set. Please refer to your
        browser's help documentation:
      </p>
      <ul>
        <li><strong>Google Chrome:</strong> Settings → Privacy and security → Cookies</li>
        <li><strong>Mozilla Firefox:</strong> Settings → Privacy & Security → Cookies and Site Data</li>
        <li><strong>Safari (macOS/iOS):</strong> Preferences → Privacy → Manage Website Data</li>
        <li><strong>Microsoft Edge:</strong> Settings → Cookies and site permissions</li>
      </ul>
      <p>
        <strong>Please note:</strong> Blocking all cookies may impair the functionality of our
        Platform, including your ability to log in to nPanel or complete a purchase.
      </p>

      <h3>7.3 Analytics Opt-Out Tools</h3>
      <ul>
        <li>
          <strong>Google Analytics:</strong> Install the{" "}
          <a href="https://tools.google.com/dlpage/gaoptout" target="_blank" rel="noopener noreferrer">
            Google Analytics Opt-out Browser Add-on
          </a>
          .
        </li>
        <li>
          <strong>Meta:</strong> Adjust your ad preferences at{" "}
          <a href="https://www.facebook.com/ads/preferences" target="_blank" rel="noopener noreferrer">
            facebook.com/ads/preferences
          </a>
          .
        </li>
        <li>
          <strong>LinkedIn:</strong> Opt out at{" "}
          <a href="https://www.linkedin.com/psettings/guest-controls" target="_blank" rel="noopener noreferrer">
            linkedin.com/psettings/guest-controls
          </a>
          .
        </li>
        <li>
          <strong>Hotjar:</strong> Opt out at{" "}
          <a href="https://www.hotjar.com/legal/compliance/opt-out" target="_blank" rel="noopener noreferrer">
            hotjar.com/legal/compliance/opt-out
          </a>
          .
        </li>
      </ul>

      <h3>7.4 Industry Opt-Out Programmes</h3>
      <p>
        You can opt out of interest-based advertising from participating networks through:
      </p>
      <ul>
        <li>
          <a href="https://optout.aboutads.info/" target="_blank" rel="noopener noreferrer">
            Digital Advertising Alliance (DAA)  optout.aboutads.info
          </a>
        </li>
        <li>
          <a href="https://youronlinechoices.eu/" target="_blank" rel="noopener noreferrer">
            European Interactive Digital Advertising Alliance  youronlinechoices.eu
          </a>
        </li>
      </ul>

      {/* ─── 8. DO NOT TRACK ────────────────────────────────────────────────── */}
      <h2 id="do-not-track">8. Do Not Track (DNT)</h2>
      <p>
        Some browsers include a "Do Not Track" (DNT) feature that signals to websites that you do
        not wish to have your online activity tracked. There is currently no universally accepted
        technical standard for responding to DNT signals, and our Platform does not alter its data
        collection and use practices based on DNT signals.
      </p>
      <p>
        If you wish to limit tracking, we recommend using our Cookie Preference Centre (Section 7.1)
        and the opt-out tools listed in Section 7.3, which provide effective and standardised
        controls over your cookie preferences.
      </p>

      {/* ─── 9. CHANGES ─────────────────────────────────────────────────────── */}
      <h2 id="changes">9. Changes to This Cookie Policy</h2>
      <p>
        We may update this Cookie Policy from time to time to reflect changes in our technology
        stack, third-party providers, or applicable regulations. When we make material changes, we
        will:
      </p>
      <ul>
        <li>Update the "Last Updated" date at the top of this policy;</li>
        <li>Display a notification on our website to inform you of the change; and</li>
        <li>Reset your cookie consent banner where required by the nature of the change, so you can review and re-accept or decline the updated cookies.</li>
      </ul>
      <p>
        <strong>This Cookie Policy is subject to change from time to time.</strong> We encourage
        you to review it periodically to stay informed about how we use cookies. Your continued
        use of our Platform after any changes constitutes your acceptance of the updated policy
        (for Strictly Necessary and Functional cookies). For analytics and marketing cookies,
        we will seek fresh consent where required.
      </p>

      {/* ─── 10. CONTACT ────────────────────────────────────────────────────── */}
      <h2 id="contact">10. Contact Us</h2>
      <p>
        If you have any questions about our use of cookies or this Cookie Policy, please contact us:
      </p>
      <ul>
        <li><strong>Privacy / Cookies Email:</strong> <a href="mailto:privacy@nisccloud.com">privacy@nisccloud.com</a></li>
        <li><strong>General Email:</strong> <a href="mailto:support@nisccloud.com">support@nisccloud.com</a></li>
        <li><strong>Company:</strong> Nisc Cloud Limited, Nairobi, Kenya</li>
        <li><strong>ODPC Registration No.:</strong> 160-3417-5D07</li>
      </ul>
      <p>
        For complaints about how we use cookies or other data, you may also contact the Office
        of the Data Protection Commissioner (ODPC) at{" "}
        <a href="https://www.odpc.go.ke" target="_blank" rel="noopener noreferrer">
          www.odpc.go.ke
        </a>
        .
      </p>
    </LegalPageShell>
  );
}
