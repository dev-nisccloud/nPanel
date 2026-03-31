# Domain Providers API Reference

This document is based on **official documentation** (OpenProvider doc site, IETF RFCs for EPP). Use it to implement domain registration, transfer, and customer management for OpenProvider and KENIC.

---

## 1. OpenProvider

**Base docs:** [OpenProvider API Main Page](https://doc.openprovider.eu/Main_Page) · [Domain Module](https://doc.openprovider.eu/Main_Page#Domain_Module) · [Customer Module](https://doc.openprovider.eu/Main_Page#Customer_Module) · [Email Module](https://doc.openprovider.eu/Main_Page#Email_Module) (verification)

**Our code:** `packages/api/src/lib/openprovider-client.ts`, `packages/api/src/types/openprovider.ts`

### 1.1 Domain registration (create)

- **Doc:** [createDomainRequest](https://doc.openprovider.eu/API_Module_Domain_createDomainRequest)
- **Mandatory:** `ownerHandle`, `adminHandle`, `techHandle`, `billingHandle`, `domain` (name + extension), `period`. One of `nameServers` or `nsGroup` required.
- **Optional:** `autorenew`, `isPrivateWhoisEnabled`, `dnssecKeys`, `nsTemplateName`, `resellerHandle`, `comments`, `additionalData` (TLD-specific), `applicationMode` (new gTLDs), `acceptPremiumFee` (premium domains).
- **Response (success):** `code`, `desc`, `data`: `status` (ACT/REQ), `activationDate`, `expirationDate`, `expirationDateOpenprovider`, `authCode` (if TLD supports it).

Our types: `OpenProviderDomainRegistrationRequest`, `OpenProviderDomainRegistrationResponse` in `types/openprovider.ts`. Client: `registerDomain()` → POST `/domains`.

### 1.2 Domain transfer

- **Doc:** [transferDomainRequest](https://doc.openprovider.eu/API_Module_Domain_transferDomainRequest)
- **Mandatory:** `domain` (name + extension), `authCode`, `ownerHandle`, `adminHandle`, `techHandle`. One of `nameServers` or `nsGroup` (or use `importNameserversFromRegistry` for supported TLDs).
- **Optional:** `billingHandle`, `resellerHandle`, `period`, `autorenew`, `importNameserversFromRegistry` (0/1), `importContactsFromRegistry` (0/1), `dnssecKeys`, `acceptPremiumFee` (premium), `promoCode`, etc.
- **Response:** `code`, `desc`, `data`: transfer status, dates, etc.

Our types: `OpenProviderDomainTransferRequest`, `OpenProviderDomainTransferResponse`. Client: `transferDomain()` → POST `/domains/transfer`. **You still need to add Nisc/UI flow for “transfer domain” (collect auth code, then call this).**

### 1.3 Customer creation & email verification

- **Customer:** [createCustomerRequest](https://doc.openprovider.eu/API_Module_Customer_createCustomerRequest). We use REST equivalent in `openprovider-client.ts` (`createCustomer`) and in `openprovider-nisc.ts` / `clients.ts`.
- **Email verification (gTLD):** [startCustomerEmailVerificationRequest](https://doc.openprovider.eu/API_Module_Email_startCustomerEmailVerificationRequest) · [restartCustomerEmailVerificationRequest](https://doc.openprovider.eu/API_Module_Email_restartCustomerEmailVerificationRequest) · [searchEmailVerificationDomainRequest](https://doc.openprovider.eu/API_Module_Email_searchEmailVerificationDomainRequest). We call `startEmailVerification` and `checkEmailVerificationStatus` in the REST API.

---

## 2. KENIC (.ke – EPP)

**Protocol:** EPP over TLS (RFC 5730, 5731 domain, 3733 contact).  
**Our code:** `packages/api/src/lib/epp/` (epp-client, epp-xml, kenic-config), `packages/api/src/routers/kenic/` (greeting, login, domain-check, tlds).

**Implemented today:** greeting, login, logout, **domain check** (with optional fee extension).  
**Not yet implemented:** contact create, domain create, domain transfer, domain info, domain renew, host create.

KENIC uses standard EPP; the greeting from `registry.kenic.or.ke` announces object URIs (contact, domain, host) and extensions (e.g. fee, rgp, secDNS). The exact response shapes below come from **RFC 5731** (domain) and **RFC 3733** (contact).

### 2.1 EPP Domain create (RFC 5731 §3.2.1)

**Command:** `<create><domain:create>...</domain:create></create>`

**Required:**
- `domain:name` – full domain name (e.g. `example.co.ke`).
- Either `domain:ns` (hostObj or hostAttr) or nameservers per registry policy.

**Optional but typical:**
- `domain:period` – e.g. `<domain:period unit="y">1</domain:period>`.
- `domain:registrant` – contact id (must exist; create contact first).
- `domain:contact type="admin"`, `domain:contact type="tech"` – contact ids.
- `domain:authInfo` – `<domain:pw>...</domain:pw>` for the domain.

**Example (from RFC 5731):**
```xml
<domain:create xmlns:domain="urn:ietf:params:xml:ns:domain-1.0">
  <domain:name>example.com</domain:name>
  <domain:period unit="y">2</domain:period>
  <domain:ns>
    <domain:hostObj>ns1.example.net</domain:hostObj>
    <domain:hostObj>ns2.example.net</domain:hostObj>
  </domain:ns>
  <domain:registrant>jd1234</domain:registrant>
  <domain:contact type="admin">sh8013</domain:contact>
  <domain:contact type="tech">sh8013</domain:contact>
  <domain:authInfo>
    <domain:pw>2fooBAR</domain:pw>
  </domain:authInfo>
</domain:create>
```

**Success response:** result code 1000, `domain:creData` with `domain:name`, `domain:crDate`, `domain:exDate`.

So for **KENIC domain registration** you need: (1) contact(s) created first, (2) domain name, (3) period, (4) nameservers (hostObj or hostAttr), (5) registrant + admin/tech contact ids, (6) optional authInfo. **Order of operations:** contact create → domain create.

### 2.2 EPP Domain transfer (RFC 5731 §3.2.4)

**Command:** `<transfer op="request">` (gaining registrar requests the transfer).

**Required:**
- `domain:name`
- `domain:authInfo` – `<domain:pw>` **auth code** from the current registrar (losing side).

**Optional:**
- `domain:period unit="y">1</domain:period>` – add 1 year at transfer.

**Example:**
```xml
<domain:transfer op="request" xmlns:domain="urn:ietf:params:xml:ns:domain-1.0">
  <domain:name>example.com</domain:name>
  <domain:period unit="y">1</domain:period>
  <domain:authInfo>
    <domain:pw roid="JD1234-REP">2fooBAR</domain:pw>
  </domain:authInfo>
</domain:transfer>
```

**Response:** result 1001 (pending) or 1000 (if auto-approved); server returns transfer status (pendingTransfer, etc.). So for **KENIC domain transfer** you need: domain name, auth code from losing registrar, optional period.

### 2.3 EPP Contact create (RFC 3733 §3.2.1)

**Command:** `<create><contact:create>...</contact:create></create>`

**Required (typical):**
- `contact:id` – server-unique contact id (or server may assign; check KENIC greeting/spec).
- One or two `contact:postalInfo` (type `int` and/or `loc`): `name`, `org` (optional), `addr` (street, city, sp, pc, cc).
- `contact:voice` – E.164 phone.
- `contact:email`

**Optional:**
- `contact:fax`
- `contact:authInfo` – `<contact:pw>`
- `contact:disclose` – which fields to show in WHOIS

**Example (from RFC 3733):**
```xml
<contact:create xmlns:contact="urn:ietf:params:xml:ns:contact-1.0" ...>
  <contact:postalInfo type="int">
    <contact:name>John Doe</contact:name>
    <contact:org>Example Inc.</contact:org>
    <contact:addr>
      <contact:street>123 Example St</contact:street>
      <contact:city>Dublin</contact:city>
      <contact:sp>Dublin</contact:sp>
      <contact:pc>A65F4B2</contact:pc>
      <contact:cc>IE</contact:cc>
    </contact:addr>
  </contact:postalInfo>
  <contact:voice x="1234">+1.7035555555</contact:voice>
  <contact:fax>+1.7035555556</contact:fax>
  <contact:email>jdoe@example.com</contact:email>
  <contact:authInfo>
    <contact:pw>2fooBAR</contact:pw>
  </contact:authInfo>
  <contact:disclose flag="0">
    <contact:email/>
  </contact:disclose>
</contact:create>
```

So for **KENIC “customer” (contact) management** you need: id (or let server assign), name, org (optional), address (street, city, state/province, postal code, country), voice, email, optional fax and authInfo. **KENIC does not publish a separate “customer” API;** in EPP the “customer” is the **contact** object. Create contact first, then use its id as registrant/admin/tech in domain create.

### 2.4 KENIC email verification

**From public sources:** KENIC’s own site and registrar FAQs do **not** describe a registry-level email or contact verification step. Verification (if any) is typically defined by each **accredited registrar** (e.g. register.co.ke). So:

- **Do not assume** KENIC has a standard “customer email verification” like OpenProvider’s gTLD verification.
- To be sure: (1) check with your KENIC EPP account / registrar documentation, (2) run contact create and domain create against the KENIC OT&E (if available) and see if any verification is required.

---

## 3. Implementation checklist

### OpenProvider

- [x] Domain registration (create) – implemented.
- [x] Customer create + email verification – implemented (Nisc + clients).
- [ ] **Domain transfer:** Add flow in Nisc (or separate “transfer” flow): collect domain name, extension, auth code; ensure owner/admin/tech handles (or use importContactsFromRegistry where supported); call `transferDomain()`; show status (REQ/ACT) and errors from `desc`.

### KENIC

- [x] Greeting, login, domain check (with fee) – implemented.
- [x] **Contact create:** `buildContactCreateXml()` in `epp-xml.ts` (RFC 3733); `kenic.contactCreate.create` in `routers/kenic/contact-create.ts` – connect, login, contact create, parse `contact:creData` (id, crDate), logout.
- [x] **Domain create:** `buildDomainCreateXml()` in `epp-xml.ts` (RFC 5731); `kenic.domainCreate.create` – name, period, ns, registrant, admin/tech contacts, authInfo; parse `domain:creData` (name, crDate, exDate).
- [x] **Domain transfer:** `buildDomainTransferXml()` in `epp-xml.ts`; `kenic.domainTransfer.request` – name, authCode, optional period/roid; handle 1001 (pending) and 1000 (completed); parse `domain:trnData`.
- [ ] **Domain info:** Optional but useful for status and expiry. RFC 5731 §3.1.2.
- [ ] **KENIC-specifics:** After first contact/domain create against KENIC, document any extra elements or errors (e.g. TLD-specific additional data, .go.ke/.ac.ke/.sc.ke document requirements from KENIC/registrar docs).

---

## 4. References (official)

| Topic | URL |
|-------|-----|
| OpenProvider API index | https://doc.openprovider.eu/Main_Page |
| OpenProvider transfer | https://doc.openprovider.eu/API_Module_Domain_transferDomainRequest |
| OpenProvider create domain | https://doc.openprovider.eu/API_Module_Domain_createDomainRequest |
| EPP base (RFC 5730) | https://datatracker.ietf.org/doc/html/rfc5730 |
| EPP domain mapping (RFC 5731) | https://datatracker.ietf.org/doc/html/rfc5731 |
| EPP contact mapping (RFC 3733) | https://datatracker.ietf.org/doc/html/rfc3733 |
| EPP host mapping (RFC 5732) | https://datatracker.ietf.org/doc/html/rfc5732 |
| KENIC | https://kenic.or.ke (registry; EPP details via accredited registrars) |
