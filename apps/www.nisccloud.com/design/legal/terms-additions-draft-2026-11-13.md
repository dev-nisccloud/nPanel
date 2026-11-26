# Terms of Service: proposed additions (draft for owner and legal review)

Status: **draft, not published.** Nothing below is in the live Terms. Each clause shows where it would go, the proposed text, a one-line review note, and why it helps. Clause numbers continue the existing numbering, so no current section is renumbered.

Owner decision (13 November 2026): the published legal pages do not include "In short" boxes. The one-line notes below are for review only and must not be added to the pages.

Source: compared against Hostinger's Terms of Service (pasted by the owner on 13 November 2026), adapted to Kenyan law, Nisc Cloud's services and the wording style of our Terms. Hostinger clauses already covered by our Terms are not repeated: auto-renewal (§6.4), service changes and discontinuation (§5.7), force majeure (§18.3) and feedback licence (§13.4).

Adding any of these is a material change to the Terms: it needs lawyer sign-off, a new "Last updated" date and the 30-day email notice under §24.

---

## 1. Sanctions compliance

**Where:** §3 Eligibility, new §3.1 (the existing §3 text becomes the introduction).

**Proposed text**

> **3.1 Sanctions Compliance**
> You confirm that: (a) you are not located in, organised under the laws of, or ordinarily resident in a country or region subject to comprehensive sanctions that apply to Nisc Cloud, our banks or our payment providers; (b) you are not named on, or owned or controlled by anyone named on, a sanctions list maintained by the United Nations Security Council, the Government of Kenya, or, where they apply to us, our banks or our payment providers, the United States, the European Union or the United Kingdom; and (c) you will not make the Services available to, or use them on behalf of, any such person or place.
> You must tell us promptly if your status changes, and give us the information we reasonably request for sanctions screening. If we know or reasonably suspect a breach of this clause, we may suspend or terminate your Account and Services immediately and without notice. Fees for Services suspended or terminated under this clause are non-refundable to the extent the law allows, and you are responsible for any losses, penalties or costs we incur because of your breach.

**In short:** You must not be under sanctions or use our services for anyone who is. If you are, we can close your account immediately.

**Why:** Card networks, Paystack and banks screen against US, EU and UK lists as well as UN lists. Without this clause, a sanctioned customer exposes Nisc Cloud to frozen settlements and penalties, especially on USD sales.

---

## 2. Account ownership and disputes

**Where:** §4, new §4.5.

**Proposed text**

> **4.5 Account Ownership and Disputes**
> The individual or legal entity named in the account details in nPanel is the owner of the Account and of the Services in it. Domain names are owned by the registrant recorded with the registry, under the rules of that registry (for example KeNIC or ICANN); where a domain in your Account is registered to someone else, we may follow the registrant's instructions about that domain.
> You must make sure your Account names the correct owner. If there is a dispute about who owns an Account or a Service (for example between a business and a former employee, developer or agency), we may restrict access to the Account or the affected Services until the parties agree in writing or a court or other competent authority decides. We are not liable for any loss caused by an ownership dispute or by restricting access while it is resolved.

**In short:** Whoever is named on the account owns it; domains belong to their registered owner. If ownership is disputed, we can freeze the account until it is settled.

**Why:** Ownership disputes between businesses, ex-staff and web agencies are common. This lets support act without taking sides or carrying liability.

---

## 3. Shared access and team members

**Where:** §4, new §4.6.

**Proposed text**

> **4.6 Shared Access and Team Members**
> nPanel lets you give other people access to your Account, for example team members, developers or agencies. If you do: (a) you confirm you trust them and authorise them to act on your behalf within the permissions you give; (b) they may see information in your Account, including billing details (but never full card numbers); (c) you are responsible for everything they do or fail to do in your Account, as if you had done it yourself; and (d) you can remove their access at any time. Any dispute between you and a person you gave access to is between you and that person.

**In short:** If you give someone access to your account, you are responsible for what they do. You can remove them at any time.

**Why:** nPanel supports team members (§5.5). This makes clear who carries the risk.

---

## 4. Account security: official communications and API keys

**Where:** §4.2, two new bullets in the "You must" list, and a new §4.7.

**Proposed bullets for §4.2**

> - Check that any message claiming to come from Nisc Cloud is genuine. **We will never ask for your password, one-time codes or other login details** by email, phone or chat. If in doubt, contact us through nPanel or support@nisccloud.com;
> - Keep any third-party apps or tools you connect to your Account secure and up to date;

**Proposed text**

> **4.7 API Keys and Automation**
> If you use our APIs, access tokens or automation tools, you must keep keys and tokens confidential, rotate them when we ask or when you suspect they are exposed, and make sure your scripts and tools use the Services within these Terms and our Acceptable Use Policy. You are responsible for all activity carried out with your keys or tokens.

**In short:** We will never ask for your password or codes. Keep your API keys secret; anything done with them is your responsibility.

**Why:** Phishing that impersonates hosting providers is a leading cause of account takeovers. A written statement helps customers spot it and protects us when they are tricked.

---

## 5. Beta services

**Where:** §5, new §5.8.

**Proposed text**

> **5.8 Beta and Preview Services**
> We may offer early versions of new Services or features, labelled as beta, preview or similar ("Beta Services"). Beta Services are provided "as is" and "as available", may contain errors, may change substantially or be withdrawn at any time, and are not covered by our Service Level Agreement. Support for them may be limited. To the fullest extent the law allows, we are not liable for any loss arising from your use of Beta Services.

**In short:** Beta features can change or stop at any time, are not covered by the SLA and come with limited support.

**Why:** Lets us launch new nPanel and Zepo AI features early without creating uptime or support commitments.

---

## 6. AI services: input and output

**Where:** §14, new §14.5 (after the existing §14.4 Takedown).

**Proposed text**

> **14.5 AI Services: Input and Output**
> Some Services, including Zepo AI and AI image generation, let you submit prompts, files, links or other material ("Input") and receive generated content or actions ("Output"). Input and Output are your User Content. We do not claim ownership of Output, except for any of our own pre-existing material it contains.
> AI Output can be inaccurate, incomplete, biased or similar to content created for others. You are responsible for: (a) having the rights and permissions needed for your Input; (b) reviewing Output for accuracy, legality and third-party rights before you use, publish or rely on it; and (c) any actions an AI Service takes on your instructions in your Account, Services or connected tools. Output is not professional, legal, financial or medical advice. To the fullest extent the law allows, we make no warranty about Output and are not liable for loss arising from your use of it.
> We process Input and Output to provide, secure and support the Services, as described in our Privacy Policy and, for your customers' personal data, our Data Processing Addendum.

**In short:** You own what you put in and what the AI produces, but you must check it before using it. AI output isn't professional advice, and we aren't responsible for how it's used.

**Why:** Zepo AI can act on customers' accounts and generate public content. This puts responsibility for review on the user and limits our liability for AI errors.

**Decision needed:** Hostinger also reserves the right to use Input and Output to train and improve its models. I have **not** included that. Add it only if Nisc Cloud actually does this, and then the Privacy Policy must say so as well.

---

## 7. Chargebacks, administrative fees and currency

**Where:** §7, new §7.5, §7.6 and §7.7.

**Proposed text**

> **7.5 Chargebacks and Payment Reversals**
> If you raise a chargeback, reversal or payment dispute without first contacting us under Section 7.4, we may suspend the affected Services while it is investigated. Where the chargeback is not upheld, you must pay the original amount together with any fees or penalties our payment providers charge us.
>
> **7.6 Administrative Fees**
> We may charge reasonable administrative fees, which we will tell you about before charging, for: (a) work outside the normal scope of the Services that you ask us to do; (b) handling domain disputes, legal requests or investigations arising from your use of the Services; and (c) recovering costs caused by your breach of this Agreement.
>
> **7.7 Currency and Exchange Rates**
> Prices are charged in the currency shown at checkout. If your bank or card account uses a different currency, your bank or card provider may convert the amount and charge exchange or foreign transaction fees. These fees, and any difference between the amount shown at checkout and the amount on your statement caused by conversion, are outside our control and are not grounds for a refund.

**In short:** Talk to us before raising a chargeback; if it isn't upheld, you cover the fees. We may charge agreed admin fees for extra work. Bank currency conversion fees are your bank's, not ours.

**Why:** Chargebacks cost us the payment, a provider fee and sometimes a penalty. Currency complaints are common for customers paying in USD.

---

## 8. Harassment of staff

**Where:** §9.2 Termination by Us for Cause, new bullet.

**Proposed bullet**

> - You or anyone acting for you threatens, abuses or harasses Nisc Cloud staff or contractors;

**In short:** No change to the §9 summary needed beyond "or abuse our staff".

**Why:** Protects the support team and gives a clear contractual basis for closing abusive accounts.

---

## 9. Your own copies of important data

**Where:** §18, new §18.5 (after §18.4 Services Without an Uptime Commitment).

**Proposed text**

> **18.5 Your Own Copies**
> We take daily backups of covered Services and keep them for 60 days, as set out in our Service Level Agreement. Backups protect our platform as a whole; they are not a substitute for your own records. You should keep your own copies of content and data that are important to your business, especially before making major changes, and particularly for Services that are not covered by our backups.

**In short:** We back up daily and keep backups for 60 days, but you should also keep your own copies of important data.

**Why:** Reduces disputes when data is lost through the customer's own changes, without weakening the SLA backup commitment (SLA §5 stays unchanged).

---

## 10. Time limit for claims

**Where:** §19, new §19.5.

**Proposed text**

> **19.5 Time Limit for Claims**
> To the extent permitted by law, any claim arising out of or relating to this Agreement or the Services must be brought within 12 months after the claim arises; otherwise it is permanently barred. This does not shorten any period that Kenyan law or other applicable law does not allow to be shortened.

**In short:** Claims must be brought within 12 months.

**Why:** Kenya's general limitation period for contract claims is 6 years. A shorter contractual period reduces long-tail risk, but a lawyer must confirm how far it can be enforced against consumers under the Consumer Protection Act, 2012.

---

## 11. No third-party beneficiaries

**Where:** §25, new §25.8.

**Proposed text**

> **25.8 No Third-Party Rights**
> This Agreement is for the benefit of you and Nisc Cloud only. No one else, including your customers, website visitors or mailbox users, has any right to enforce it.

**In short:** Only you and Nisc Cloud can enforce these Terms.

**Why:** Stops a customer's own clients or visitors from relying on our Terms (for example the uptime commitment) to bring claims against us.

---

## Liability cap (§19.2): current wording and options

**Current text:** our total liability is capped at **the greater of** (a) the fees you paid us in the 12 months before the event, or (b) **KES 5,000**.

What that means in practice:

| Customer | Fees paid in last 12 months | Current cap (greater of) |
| --- | --- | --- |
| Small web hosting customer | KES 3,000 | KES 5,000 |
| Business email customer | KES 60,000 | KES 60,000 |
| Large server customer | KES 2,000,000 | KES 2,000,000 |

KES 5,000 works as a **minimum** payout; there is no upper ceiling, so the cap grows with the size of the account.

**Hostinger:** the **lesser** of 12 months' fees or EUR 10,000. That works as a **ceiling**: no customer can recover more than EUR 10,000, however much they paid.

Options for your lawyer:

1. **Keep as is.** Customer-friendly, with no ceiling for large accounts.
2. **Fees paid in 12 months, with no minimum.** Simple and widely used.
3. **The lesser of fees paid in 12 months or a fixed ceiling** (you would choose the amount). This gives the most protection for large accounts. It needs checking against the Consumer Protection Act, 2012 for consumer customers.

**Owner decision (13 November 2026): follow Hostinger's approach (option 3).** Proposed replacement for §19.2, for the lawyer:

> **19.2 Aggregate Cap**
> Our total aggregate liability to you for all claims arising out of or in connection with this Agreement shall not exceed **the lesser of**: (a) the total Fees paid by you to Nisc Cloud for the affected Services in the 12 months immediately preceding the event giving rise to the claim; or (b) **KES 200,000**, or **USD 1,500** for Services billed in US dollars. Service credits under our Service Level Agreement count towards this limit.

**In short (replaces the current §19 summary):** We are not liable for indirect losses such as lost profits. Our total liability is capped at the fees you paid for the affected service in the last 12 months, or KES 200,000 (USD 1,500 for US dollar billing), whichever is less.

Ceiling chosen by the owner on 13 November 2026: KES 200,000, with a US dollar equivalent for USD customers. USD 1,500 is a round figure close to KES 200,000 at recent exchange rates; confirm the USD amount with the lawyer. The owner is also asking the lawyer to confirm the figure itself.

Notes for the lawyer: the exceptions in §19.3 (death or personal injury caused by negligence, fraud, and liability that Kenyan law does not allow to be limited) stay as they are. Check enforceability against consumer customers under the Consumer Protection Act, 2012. The live Terms are unchanged until approved.
