Openprovider domain integration plan and API overview

This report explains how to integrate Openprovider’s REST API (version v1beta at https://api.openprovider.eu/v1beta) to implement a domain‑reseller workflow. The integration must start with authentication and then follow a logical sequence: retrieving available TLDs and their prices, managing customer handles, checking domain availability and pricing, registering/transferring domains, managing DNS records, and handling optional add‑ons (e.g., SSL, SpamExpert). Each section below summarises the relevant API endpoints, explains what they do, and provides a sample request/response from the official documentation.

1 Authentication

Openprovider uses Bearer Authentication. You first obtain a token via a login call, then include Authorization: Bearer <token> in every subsequent request.

| Endpoint               | Description                                                                                                                                | Sample request & response                                                                                                                                                                                                                                                                                  |
| ---------------------- | ------------------------------------------------------------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **`POST /auth/login`** | Logs in with your Openprovider reseller credentials (username, password and optional IP address).  The response includes a security token. | The documentation shows a cURL example: `curl -X POST https://api.openprovider.eu/v1beta/auth/login -d '{"username":"user","password":"***","ip":"0.0.0.0"}'`.  The response returns the token under `data.token` and `reseller_id`.  Include this token in the `Authorization` header (`Bearer <token>`). |

2 Retrieve TLDs and pricing

Before offering domains to your customers, you need to know which TLDs are available, their registration rules and pricing. Openprovider’s TLD API allows you to list and filter extensions, and retrieve additional data requirements.

| Endpoint                                     | Description                                                                                                                                                         | Key request parameters                                                                                                                                                              | Notes                                                                                                                                                                                               |
| -------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **`GET /tlds`**                              | Searches TLDs and returns extension information such as allowed registration periods, transfer/renewal availability, IDN scripts, DNSSEC support and pricing tiers. | `limit` (max results), `offset`, `extensions` (array of TLDs), `status` (`ACT`), `with_price` (true/false), `with_description`, `with_restrictions` etc.                            | The support article shows fields such as `name` (extension), `min_period`, `max_period`, `transfer_available`, `renew_available`, `idn_script`, `dnssec_allowed` and `transfer_auth_code_required`. |
| **`GET /domains/prices`**                    | Returns price information for a specific domain operation (create, transfer, renew etc.) and period.                                                                | Required query parameters include `domain.name`, `domain.extension`, `operation` (e.g., create), and `period`.  The request may include `additional_data.idn_script` for IDN names. | The response contains a `price` object with `product` and `reseller` prices (each with currency and price), plus flags indicating whether the domain is premium or promotional.                     |
| **`GET /domains/additional-data`**           | Returns extra fields required for registering a particular extension.                                                                                               | `domain.extension`                                                                                                                                                                  | Example: querying `.no` returns fields like `company_registration_number` with descriptions and a `required` flag.                                                                                  |
| **`GET /domains/additional-data/customers`** | Returns additional customer fields required by a specific extension.                                                                                                | `domain.extension` (and optionally `domain.name`)                                                                                                                                   | Example: for `.eu` the response includes fields such as `whois_email` and `country_of_citizenship` with descriptions and whether they are required.                                                 |

Industry best‑practice for TLD retrieval

List TLDs with status=ACT to retrieve only active extensions. Use with_price=true to include the reseller price so your application can display accurate pricing.

Cache the list locally and update periodically (e.g., daily). TLD information does not change frequently.

When a user selects a specific extension, call additional‑data endpoints to determine any special fields needed for that TLD and adjust your registration form accordingly.

3 Customer (handle) management

Domains are registered to “handles” that encapsulate the registrant’s contact details. You must create a customer handle (owner/admin/billing/tech contact) before registering or transferring a domain.

| Endpoint                      | Description                                                                                                                                                                                                                      | Sample request & response                                                                                                                 |
| ----------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------- |
| **`POST /customers`**         | Creates a new customer handle.  Required fields include `name` (first\_name, last\_name), `address` (street, number, zipcode, city, country, state) and `phone`.  `email` is required; `company_name` and `tags` are optional.   | The cURL example shows sending JSON with contact details and extra attributes; the response returns a unique `handle` like `CV904716-NL`. |
| **`PUT /customers/{handle}`** | Updates an existing handle.  You can change most contact information but not the registrant’s name or company name (these require creating a new handle).  Use this to add missing fields such as birth date or passport number. | Response contains `status` indicating success.                                                                                            |
| **`GET /customers`**          | Searches existing handles.  Filters include `handle_pattern`, `email_pattern`, `first_name_pattern`, `last_name_pattern`, `company_name_pattern`, `comment_pattern`, `with_additional_data`, `limit` and `offset`.               | Example response shows an array of results with fields such as `handle`, `company_name`, `email`, and `additional_data`.                  |

gTLD email verification

ICANN requires verification of registrant email addresses for gTLDs. After creating a handle and purchasing a gTLD, call:

POST /customers/verifications/emails/start to initiate a verification email. Parameters are email, handle and language. The response returns an ID and confirmation that the email was sent
support.openprovider.eu
.

GET /customers/verifications/emails/domains to check verification status. You can filter by domain, handle, email, status, is_suspended, etc. The response lists domains with status and expiration_date
support.openprovider.eu
.

Ensure that registrant email addresses are verified before completing gTLD registrations; otherwise the domain may be suspended.

4 Checking domain availability and prices
4.1 Check availability of one or more domains

| Endpoint                  | Description                                                                                                                                     | Important parameters                                                                                                                                                                      | Sample response                                                                                                                                                                                                            |
| ------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **`POST /domains/check`** | Checks whether domains are available and optionally returns the registration price and WHOIS data.  You can check multiple domains in one call. | `domains` (array of objects with `extension` and `name`); `with_price` (boolean to include price); `with_whois` (boolean to include WHOIS); `additional_data.idn_script` (for IDN names). | The response returns a `results` array.  Each element has `domain`, `price` (product & reseller with currency), `is_premium`, `premium` (create price for premium domains), and `status` (`free`, `reserved` or `in use`). |

4.2 Retrieve price for a specific domain operation

Although domains/check can return a price, you can also call GET /domains/prices to retrieve pricing for a single domain operation and period. See the TLD retrieval section above for details
support.openprovider.eu
.

5 Domain lifecycle operations

After obtaining a handle and verifying that a domain is available, you can register or transfer it. Later you may search, update, renew or delete domains.

5.1 Register a domain

| Endpoint             | Description                                                                                                                                                                                                                 | Required parameters                                                                                                                                                                                                                                                                                                                                                                                                                                            | Sample response                                                                                                                                              |
| -------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **`POST /domains/`** | Registers a domain.  The domain will be registered immediately if the TLD supports real‑time provisioning and your account has sufficient funds.  Otherwise the status will be `requested` until the registry processes it. | `name` (domain name without extension); `extension` is included in the body’s `name` field; `period` (integer, default 1 year); `owner_handle`, `admin_handle`, `tech_handle` (Openprovider handles); `billing_handle` (optional); `reseller_handle` (optional); `name_servers` (array of nameserver objects) or `ns_group`; `autorenew` (on/off/default); optional fields like `is_private_whois_enabled`, `promo_code`, `dnssec_keys` and `additional_data`. | Example response includes `activation_date`, `auth_code` (if applicable), `expiration_date`, `renewal_date`, `id` (domain ID) and `status` (`ACT` or `REQ`). |

5.2 Transfer a domain
| Endpoint                     | Description                                                                                                                      | Required parameters                                                                                                                                                                                                                                                                    | Sample response                                                                                                                                                                                             |
| ---------------------------- | -------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **`POST /domains/transfer`** | Transfers a domain from another registrar to Openprovider.  Make sure the domain is unlocked and you have its EPP/transfer code. | `domain` (name & extension); `auth_code` (transfer code); `owner_handle`, `admin_handle`, `tech_handle`; `autorenew`; `name_servers` (to set nameservers during transfer).  Additional parameters control import of contacts/nameservers from the registry (not shown in quick‑start). | The response returns `auth_code` (internal code for further transfers), `expiration_date` and `renewal_date` plus `status` (`REQ` if pending approval).  Notes explain that the transfer may take 5‑7 days. |

5.3 Search domains / retrieve domain ID

To update or renew a domain you need its internal ID. Use:

| Endpoint            | Description                                                                             | Key filters                                                                                                       | Sample response                                                                                                                                                                                                                                                                                         |
| ------------------- | --------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **`GET /domains/`** | Searches the domains in your account and returns details including internal domain IDs. | `domain_name_pattern` (wildcard search without extension), `limit` (max results), `status` (ACT, REQ, DEL, FAIL). | Response contains an array of domain objects with fields such as `id`, `domain` (name & extension), `owner_handle`, `name_servers`, `status`, `auth_code`, `autorenew`, creation/expiration dates, DNSSEC, lock status and more.  Use the returned `id` when updating, renewing or deleting the domain. |

5.4 Update domain attributes
| Endpoint                | Description                                                                                                                                                                                                                                                                 | Key fields that can be modified                                                                                                                                                                                                              | Sample response                                                          |
| ----------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------ |
| **`PUT /domains/{id}`** | Updates contact handles, nameservers, autorenew status, WHOIS privacy, DNSSEC settings and other attributes for a domain.  Note: you cannot change the owner via this endpoint unless the TLD allows it—otherwise you must perform a “trade” (update registrant) operation. | `owner_handle` (if allowed), `admin_handle`, `tech_handle`, `billing_handle`, `ns_group` or `name_servers`, `autorenew` (`on`,`off`,`default`), `is_locked` (boolean), `is_private_whois_enabled`, `is_dnssec_enabled`, `dnssec_keys`, etc.. | Response returns the domain `id` and the new `status` (typically `ACT`). |

5.5 Request or reset transfer authcode
| Endpoint                                | Description                                                                                                 | Parameters                                                     | Response                                          |
| --------------------------------------- | ----------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------- | ------------------------------------------------- |
| **`GET /domains/{id}/authcode`**        | Retrieves the current transfer code for the domain.                                                         | `id` – domain ID.                                              | Returns `auth_code` and `success` flag.           |
| **`POST /domains/{id}/authcode/reset`** | Generates a new authcode; necessary when transferring to another registrar or performing an internal trade. | `id` (domain ID); `auth_code_type` (`external` or `internal`). | Response contains `auth_code` and `success` flag. |

5.6 Renew a domain
| Endpoint                       | Description                                                                                                                                                                                  | Parameters                                        | Response                                                        |
| ------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------- | --------------------------------------------------------------- |
| **`POST /domains/{id}/renew`** | Renews a domain for a number of periods (years/quarters/months depending on the TLD).  If `autorenew` is enabled the domain will renew automatically; use this endpoint for manual renewals. | `period` – number of renewal periods (default 1). | Response returns `status` (e.g., `ACT` for successful renewal). |

5.7 Delete or restore a domain
| Endpoint                         | Description                                                                                                                                                                                                                       | Notes |
| -------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----- |
| **`DELETE /domains/{id}`**       | Deletes a domain registration.  The domain is removed immediately; some TLDs may not allow restoration and refunds are not guaranteed.  Provide `domain.name` and `domain.extension` as query parameters to confirm the deletion. |       |
| **`POST /domains/{id}/restore`** | Restores a domain that was deleted manually or expired within the registry’s restoration period (usually up to 30–60 days).  This call reactivates the domain.                                                                    |       |

6 DNS hosting and records

Openprovider offers free DNS hosting and an optional premium DNS service (powered by Sectigo). After registering a domain, you can create DNS zones on Openprovider nameservers and manage DNS records via API.
| Operation               | Endpoint                   | Description                                                                                                                                                                                                                                                                                                                                | Key parameters |
| ----------------------- | -------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | -------------- |
| **Create zone**         | `POST /dns/zones`          | Creates a DNS zone.  Required fields: `domain` (name & extension), `type` (`master` or `slave`), and `records` (list of DNS records) when `type=master`.  Optional: `template_name` (apply DNS template), `provider` (`sectigo` for premium), `secured` (enable DNSSEC), `master_ip` (for slave zones).  Response contains `success=true`. |                |
| **List zones**          | `GET /dns/zones/`          | Retrieves zones.  Filters: `limit`, `offset`, `name_pattern`, `type`, `with_records`, `with_history`.  Response contains zone properties such as `name`, `type`, `active`, `creation_date`, and optionally records/history.                                                                                                                |                |
| **Get a specific zone** | `GET /dns/zones/{name}`    | Retrieves a specific zone and optionally its records.  Parameters: `name` (zone name), `with_records` (boolean), `with_history` and `with_dnskey`.                                                                                                                                                                                         |                |
| **Modify a zone**       | `PUT /dns/zones/{name}`    | Updates zone settings or records.  You can update the zone by rewriting it (provide full zone) or modify individual records using `records: { add: [], update: [], remove: [] }`.  Set `is_spamexperts_enabled` to enable Openprovider’s spam‑filter MX service.                                                                           |                |
| **Delete zone**         | `DELETE /dns/zones/{name}` | Deletes a DNS zone; after deletion, the zone and its records will no longer respond.                                                                                                                                                                                                                                                       |                |

Record objects include name, type (A, AAAA, CNAME, MX, SRV, TXT, NS, TLSA, SSHFP, CAA), value, prio (for MX and SRV), and ttl (allowed values 900–86400 seconds)
docs.openprovider.com
. Use the add, update and remove arrays when modifying records.

7 Additional products and add‑ons

Openprovider’s API also supports other product categories. These add‑ons can be offered as upsells when integrating domains:

SSL certificates – list and buy SSL products. Use GET /ssl/products to retrieve available certificates with pricing and supported software
docs.openprovider.com
, then order them with POST /ssl/orders (not shown in the quick‑start but documented elsewhere). This integration allows you to upsell certificates when users register domains.

SpamExpert – an email spam‑filter service. The API can generate a login URL for the SpamExpert control panel (see the POST /spamexperts/login endpoint in the docs). You can add or remove SpamExpert filters on domains as part of premium DNS plans.

DNSSEC keys – supported by various endpoints (POST /domains/ and PUT /domains/{id}) to enable DNSSEC. Use the dnssec_keys array in the request.

8 Putting it all together – recommended integration flow

Authenticate using POST /auth/login and store the returned token; include it in subsequent requests.

Retrieve active TLDs and pricing using GET /tlds with status=ACT and with_price=true. Display available extensions, min/max registration periods and prices to users.

Determine additional data requirements for the chosen TLD: call GET /domains/additional-data and GET /domains/additional-data/customers to know which extra fields (e.g., company registration number, IDN script) must be collected.

Create or reuse customer handles: search for an existing handle using GET /customers or create one via POST /customers. For gTLDs, initiate email verification via POST /customers/verifications/emails/start and poll status via GET /customers/verifications/emails/domains until verified.

Check domain availability and price: call POST /domains/check for the selected domain(s) with with_price=true. Inform the user whether the domain is free, reserved or in use and show the price (including premium fees if applicable).

Register or transfer the domain:

Registration: send a POST /domains/ request with the domain name, registration period, contact handles, nameservers (or NS group) and any additional data fields collected earlier. If the registration requires manual verification (e.g., for restricted TLDs), monitor the status until it becomes ACT.

Transfer: call POST /domains/transfer with the domain name, transfer code (auth_code), contact handles, nameservers and autorenew flag. Poll for completion; some transfers take several days and require approval
docs.openprovider.com
.

Create DNS zone for the domain using POST /dns/zones with default NS and required records (A/AAAA, MX, etc.). Alternatively, apply a DNS template if available. Use the premium provider parameter to create a premium zone.

Manage DNS records: to add, update or delete records, call PUT /dns/zones/{name} with the appropriate records modifications. Use GET /dns/zones/{name} with with_records=true to retrieve existing records before modifying them.

Post‑registration operations:

Use GET /domains/ to list domains and retrieve their IDs.

Modify domain attributes or nameservers via PUT /domains/{id}.

Retrieve/reset auth codes when the customer wants to transfer out (GET /domains/{id}/authcode, POST /domains/{id}/authcode/reset).

Renew domains manually via POST /domains/{id}/renew when autorenew is off.

Delete or restore domains with DELETE /domains/{id} and POST /domains/{id}/restore when needed.

Offer add‑ons such as SSL certificates and SpamExpert using their respective endpoints (GET /ssl/products, POST /ssl/orders, etc.).

9 Key considerations and best practices

Error handling: API responses include code (0 for success) and desc. Always check for non‑zero codes and handle errors (e.g., invalid handle, insufficient balance, restricted TLD) gracefully.

Caching: Cache TLD lists, pricing and additional data locally to minimise API calls. Refresh periodically to capture price changes or new TLDs.

Security: Store the API token securely and refresh it when it expires. Use HTTPS for all API calls. Do not log sensitive information such as passwords or tokens.

Compliance: Ensure gTLD email verification is completed and keep registrant contact details up‑to‑date to comply with ICANN rules.

Testing: Use Openprovider’s OT&E (testing) environment to develop and test integration before connecting to production.

By following this structured plan and using the endpoints described above, you can build a robust domain reseller system that interacts with Openprovider’s REST API to provision domains, manage customer handles, perform transfers, and maintain DNS records.