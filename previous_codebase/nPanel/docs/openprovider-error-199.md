# OpenProvider API Error 199: "An unknown error has occurred!"

## Official definition (from OpenProvider)

**Source:** [API Error Codes – Openprovider](https://support.openprovider.eu/hc/en-us/articles/216644928-API-Error-Codes)

| Code | Description | Resolution |
|------|-------------|------------|
| **199** | An unknown error has occurred! | No immediate resolution, contact [support@openprovider.com](mailto:support@openprovider.com) please. |

**Error code ranges** ([API module Error handling](https://doc.openprovider.eu/API_module_Error_handling)):

- **1xx** = customer management or **authentication** module  
- 2xx = nameservers  
- 3–7xx = domains management  
- 8xx = DNS, 9xx = payments, etc.

So **199 is in the 1xx band**: it is treated as a customer/authentication-related error. OpenProvider do **not** document a specific cause for 199; it is a generic fallback when they don’t map the failure to another code.

---

## What our code does when 199 occurs

1. **Where it happens**  
   Error 199 is returned on **domain registration** (`registerDomain`), after:
   - Auth (login)
   - Customer/handle exists and is used (or created earlier)
   - Email verification checked (verified)
   - We call `client.registerDomain({ name, extension, period, owner_handle, admin_handle, tech_handle })`

2. **Request we send** (`openprovider-nisc.ts` → `registerDomain`):
   - `name` = label (e.g. `fineyakwoyo`)
   - `extension` = TLD (e.g. `.com`)
   - `period` = years (from billing cycle, default 1)
   - `owner_handle` = `admin_handle` = `tech_handle` = same OpenProvider handle (from `integration.platformCustomerId`)
   - We do **not** send `additional_data` for registration.

3. **Handle (contact) creation** (`buildOpenProviderCustomerRequest` in `openprovider-nisc.ts`):
   - Built from user profile: name, address, city, country, postalCode, state, phone, email.
   - Country: we send `"KE"` when profile country is `"Kenya"`, otherwise the profile country value.
   - Address: we split on spaces and use last token as house number, rest as street (can be wrong for some formats).
   - Phone: we parse 254… and build country_code / area_code / subscriber_number.

So the **actual cause** of 199 is **not** specified by OpenProvider; it is “unknown” by design. From context (1xx + registration), plausible contributors include:

- **Handle/contact data** not accepted by the registry for this TLD (e.g. format, country, or validation rules).
- **Account/agreement**: e.g. Processor Agreement not signed or account restricted (see code 197: “Account is blocked because of non-signed agreement”).
- **Registry/backend** returning an error that OpenProvider does not map to a specific code, so they return 199.

---

## What to do when you get 199

1. **Contact OpenProvider support**  
   Email [support@openprovider.com](mailto:support@openprovider.com) with:
   - Domain name and TLD (e.g. `fineyakwoyo.com`).
   - That the error is **code 199**, description “An unknown error has occurred!”.
   - The **exact request** you send for `registerDomain` (see below; we now log it so you can copy from processing logs).
   - Handle ID used as owner/admin/tech (and, if possible, a note that it was created via your NISC flow and passed email verification).

2. **Check account/agreement**  
   - Sign the [Processor Agreement](https://cp.openprovider.eu/documentation/contracts.php) if not already done.  
   - In the control panel, confirm the account is not blocked (code 197).

3. **Verify contact data for the handle**  
   - In OpenProvider CP, open the handle used for owner/admin/tech and check:
     - Country code (e.g. KE) and state if required (e.g. US/CA/UK/IE).
     - Address and phone format (see [supported country codes](https://support.openprovider.eu/hc/en-us/articles/13344317042450-Supported-country-codes-for-registration)).
   - For some TLDs, [additional data](https://doc.openprovider.eu/API_Format_Additional_Data) may be required; for plain .com we don’t send any, which is usually correct.

4. **Use the new request logging**  
   We log the **registerDomain request** (and raw response) in NISC order processing logs. When you contact support, grab from the logs:
   - **`processor_register_domain_request`** – request body we sent (domain name, extension, period, owner/admin/tech handle).
   - **`processor_api_raw_response`** with `call: "registerDomain"` – full API response (including code 199 and `rawResponse`).  
   That gives support the exact payload and response for the failing call.

---

## Insufficient funds / balance (reseller account)

**Question:** Does OpenProvider document an error like “reseller account does not have sufficient funds to proceed”?

**Answer:** They do **not** use that exact phrase in the public error list, but they **do** document insufficient-balance errors with different wording:

| Code | Description | Resolution |
|------|-------------|------------|
| **310** | Credit is not enough! | Balance is insufficient, please increase balance. |
| **920** | Your balance is insufficient | (9xx = authorization, payments and invoicing) |
| 927 | Increase balance payment failed | |
| 1091 | Payment required for the successful order | |

- **310** is in the **3–7xx (domains)** band—typically when a domain operation (e.g. register/renew) fails due to balance.
- **920** is in the **9xx (payments and invoicing)** band—general “balance is insufficient” for payment-related flows.

So if the failure were **purely** “not enough funds,” OpenProvider would be expected to return **310** or **920**, not 199. If you received **199** instead, then either:

1. The failure is **not** balance-related (e.g. handle/registry/agreement), or  
2. Their backend sometimes returns the generic **199** instead of **310**/920 (worth asking support when you contact them).

To check balance: Reseller Control Panel [https://cp.openprovider.eu](https://cp.openprovider.eu) (or [RCP](https://rcp.openprovider.eu)) and/or the API payment/transaction endpoints.

---

## References

- [API Error Codes](https://support.openprovider.eu/hc/en-us/articles/216644928-API-Error-Codes)  
- [API module Error handling](https://doc.openprovider.eu/API_module_Error_handling)  
- [API Format Additional Data](https://doc.openprovider.eu/API_Format_Additional_Data)  
- [Processor Agreement](https://cp.openprovider.eu/documentation/contracts.php)  
- [Supported country codes](https://support.openprovider.eu/hc/en-us/articles/13344317042450-Supported-country-codes-for-registration)
