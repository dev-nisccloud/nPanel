# AWS Email Marketing Setup   Complete Guide for nPanel Email Marketing feature

This is a complete step-by-step guide to setting up everything you need in AWS to power
email marketing with domain verification, email sending, and full event tracking
(open, click, bounce, complaint, delivery). Every single click is documented.

**Do NOT skip steps or jump ahead. Every section depends on the one before it.**

---

## Table of Contents

1. [Understand the overall architecture first](#1-understand-the-overall-architecture-first)
2. [Create an IAM user for your app](#2-create-an-iam-user-for-your-app)
3. [Get your AWS credentials (Access Keys)](#3-get-your-aws-credentials-access-keys)
4. [Verify your sending domain in SES](#4-verify-your-sending-domain-in-ses)
5. [Add DNS records at your domain provider](#5-add-dns-records-at-your-domain-provider)
6. [Configure custom MAIL FROM domain](#6-configure-custom-mail-from-domain)
7. [Request SES production access](#7-request-ses-production-access)
8. [Create an SES Configuration Set](#8-create-an-ses-configuration-set)
9. [Create an SNS Topic](#9-create-an-sns-topic)
10. [Add SNS as an event destination on your configuration set](#10-add-sns-as-an-event-destination-on-your-configuration-set)
11. [Update the SNS topic access policy to allow SES to publish](#11-update-the-sns-topic-access-policy-to-allow-ses-to-publish)
12. [Subscribe your webhook endpoint to the SNS topic](#12-subscribe-your-webhook-endpoint-to-the-sns-topic)
13. [Confirm the SNS subscription from your app](#13-confirm-the-sns-subscription-from-your-app)
14. [Set your environment variables](#14-set-your-environment-variables)
15. [How to test everything end-to-end](#15-how-to-test-everything-end-to-end)
16. [What events you will receive and what to do with them](#16-what-events-you-will-receive-and-what-to-do-with-them)
17. [Production launch checklist](#17-production-launch-checklist)

---

## 1) Understand the overall architecture first

Before touching the console, understand exactly what gets built and how the pieces connect.

```
Your App API
    │
    │  POST /send (with from email e.g. hello@yourdomain.com)
    │
    ▼
  SES SDK call (SendRawEmail)
    │
    │  SES checks: is this domain verified? is it in a configuration set?
    │
    ▼
  Email delivered to recipient's inbox
    │
    │  Recipient opens email / clicks link / email bounces / spam complaint
    │
    ▼
  SES fires event → SNS Topic (because config set has SNS destination)
    │
    ▼
  SNS POSTs JSON to your webhook URL (POST /api/webhooks/sns)
    │
    ▼
  Your webhook updates email status in DB
  (openedAt, clickedAt, bouncedAt, etc.)
    │
    ▼
  Your analytics queries count these fields → open rate, click rate, bounce rate
```

**Key rule:** A domain must be verified before you can use it in the `From` field.
SES will refuse the send if the domain is unverified.

---

## 2) Create an IAM user for your app

Your app needs AWS credentials to call SES. Create a dedicated IAM user.

1. Open the [AWS Management Console](https://console.aws.amazon.com/).
2. In the top search bar, type **IAM** and press Enter.
3. In the left sidebar, click **Users**.
4. Click the orange **Create user** button.
5. In the **User name** field, type something like `myapp-ses-user`.
6. Leave **Provide user access to the AWS Management Console** unchecked
   (your app does not need console access   only API access).
7. Click **Next**.
8. On the **Set permissions** page, select **Attach policies directly**.
9. In the search box, type **AmazonSESFullAccess**.
10. Check the box next to **AmazonSESFullAccess**.
11. In the search box, clear it and type **AmazonSNSFullAccess**.
12. Check the box next to **AmazonSNSFullAccess**.
13. Click **Next**.
14. Review everything and click **Create user**.

> **Why SES + SNS full access?**
> SES access is needed to verify domains and send emails.
> SNS access is needed to create topics and confirm subscriptions.
> In production you can tighten these to specific actions only (see step 3 note).

---

## 3) Get your AWS credentials (Access Keys)

You must generate an access key for the IAM user you just created.
Without this, your app cannot authenticate to AWS.

1. Still in IAM, click **Users** in the left sidebar.
2. Click the name of the user you just created (`myapp-ses-user`).
3. Click the **Security credentials** tab.
4. Scroll down to **Access keys**.
5. Click **Create access key**.
6. On "Access key best practices", select **Application running outside AWS**.
7. Click **Next**.
8. (Optional) Add a description tag like `myapp production`.
9. Click **Create access key**.
10. **IMPORTANT:** On the next screen you will see:
    - **Access key ID**   copy this now.
    - **Secret access key**   copy this now. You will NEVER see it again.
11. Save both values somewhere secure (password manager, .env file).
12. Click **Done**.

Your environment variables from these values:

```
AWS_SES_ACCESS_KEY_ID=<the access key ID you copied>
AWS_SES_SECRET_ACCESS_KEY=<the secret access key you copied>
```

> **Note:** For production tighten permissions to only these SES actions:
> `ses:SendRawEmail`, `ses:GetSendQuota`, `ses:VerifyDomainDkim`,
> `ses:SetIdentityMailFromDomain`, `ses:GetIdentityDkimAttributes`,
> `ses:GetIdentityVerificationAttributes`, `ses:SetIdentityFeedbackForwardingEnabled`,
> `ses:DeleteIdentity`

---

## 4) Verify your sending domain in SES

This is the core step. Until a domain is verified, SES will refuse all sends from it.
Verification works by you adding DNS records that prove you own the domain.

1. In the AWS Console search bar, type **SES** and press Enter. Make sure you see
   **Amazon Simple Email Service** and click it.
2. **Check your region.** In the top right, confirm you are in **us-east-1
   (US East N. Virginia)**. If not, click the region dropdown and select it.
   All steps from here must stay in the same region.
3. In the left sidebar under **Configuration**, click **Verified identities**.
4. Click the orange **Create identity** button.
5. Under **Identity type**, select **Domain** (not Email address   Domain covers
   all addresses on that domain).
6. In the **Domain** field, type your domain without `www`. Example: `yourdomain.com`.
7. Under **DKIM signing key length**, leave it as **2048 bit** (this is the default
   and more secure).
8. Under **DKIM configuration**, make sure **Use a Easy DKIM** is selected.
   This means AWS will automatically generate and manage DKIM keys for you.
9. Leave everything else as default for now.
10. Click **Create identity** at the bottom right.

After creating you will land on the identity's detail page. You will see:

- **DKIM status: Pending**   this is correct. It becomes `Verified` after you add DNS records.
- A section called **View DNS records**   expand it. You will see 3 CNAME records.
  These are your DKIM records. Keep this page open for the next step.

---

## 5) Add DNS records at your domain provider

You must add the DKIM CNAME records from SES into your domain's DNS. This proves
to the world that your domain is authorized to send email.

1. Still on the SES verified identity page, expand **View DNS records**.
2. You will see a table with 3 rows. Each row has:
   - **Name** (looks like: `xxxxxxxxxxxx._domainkey.yourdomain.com`)
   - **Type** (always CNAME)
   - **Value** (looks like: `xxxxxxxxxxxx.dkim.amazonses.com`)
3. Open a new browser tab and log into wherever your domain DNS is managed
   (Cloudflare, GoDaddy, Namecheap, Route53, etc).
4. Add each of the 3 CNAME records. For each record set:
   - Record type: **CNAME**
   - Name/Host: the value in the **Name** column from SES
     (some DNS providers want just the subdomain part, not the full domain.
     For example if the name is `abc123._domainkey.yourdomain.com` and your
     DNS provider automatically appends your domain, you would only enter
     `abc123._domainkey`)
   - Value/Target: the value in the **Value** column from SES
   - TTL: 3600 (or leave as default)
5. Save each record.
6. DNS propagation usually takes between 5 minutes and 72 hours.
   Go back to the SES console to check the status.
7. In SES, go to **Verified identities** and click your domain name.
8. The **DKIM status** will change from **Pending** to **Verified** once AWS
   has detected your DNS records. Keep checking every 15–30 minutes.

> **How to check from terminal:**
> ```
> nslookup -type=CNAME xxxxxxxxxxxx._domainkey.yourdomain.com
> ```
> When it returns the `.dkim.amazonses.com` value, DNS is propagated.

---

## 6) Configure custom MAIL FROM domain

This step sets a custom bounce address that improves deliverability and email
alignment. It makes SES use `plunk.yourdomain.com` (or any subdomain you choose)
as the MAIL FROM domain instead of a generic amazonses.com address.

This is what `setIdentityMailFromDomain` does in the codebase.

1. In SES, go to **Verified identities**.
2. Click on your domain (`yourdomain.com`).
3. Click the **Authentication** tab.
4. Scroll to **Custom MAIL FROM domain**.
5. Click **Edit**.
6. In the **MAIL FROM domain** field, enter a subdomain of your verified domain.
   For example: `mail.yourdomain.com` or `bounce.yourdomain.com`.
7. Under **Behavior on MX failure**, leave it as **Use the default MAIL FROM domain**.
8. Click **Save changes**.
9. SES will now show you 2 more DNS records to add:
   - 1 MX record
   - 1 TXT record (SPF)
10. Add both of these DNS records at your domain provider the same way you added
    the CNAME records in step 5.
11. Come back and check the MAIL FROM status. It will change from **Pending** to
    **Verified** once DNS propagates.

---

## 7) Request SES production access

All new SES accounts are in **sandbox mode**. In sandbox:
- You can only send email to addresses you have manually verified.
- Daily sending limit is 200 emails.
- Rate is 1 email per second.

For real use, you must request production access.

**Important: Complete steps 4, 5, and 6 first. Having a verified domain speeds up approval.**

1. In the SES console left sidebar, click **Account dashboard**.
2. At the top of the page you will see a yellow/orange warning box that says
   **"Your Amazon SES account is in the sandbox"**.
3. On the right side of that box, click **View Get set up page**.
4. Then click **Request production access**.
5. A modal will appear. Fill it in:
   - **Mail type**: choose **Transactional** if you send receipts, password resets,
     notifications. Choose **Marketing** if you're sending newsletters/campaigns.
     If you do both, choose the type that applies to the majority.
   - **Website URL**: enter your website URL (e.g. `https://yourapp.com`).
   - **Additional contacts**: enter your email address (and up to 3 others if needed).
   - **Preferred contact language**: select English.
   - **Acknowledgement**: check the box to confirm you only send to users who
     requested it and that you handle bounces/complaints.
6. Click **Submit request**.
7. A banner will appear confirming the request was submitted.

**Wait time:** AWS Support typically responds within 24 hours. You will receive an email
to the contact you provided. Once approved your account is in production mode.

---

## 8) Create an SES Configuration Set

A configuration set is a named group of rules. You attach it to your sends and it
tells SES where to publish tracking events (open, click, bounce, etc).

**You must have a configuration set to get analytics. Without it, SES will not
publish any events.**

1. In the SES console left sidebar, under **Configuration**, click **Configuration sets**.
2. Click **Create set**.
3. Fill in the form:
   - **Configuration set name**: type `myapp-config-set`.
     (Only letters, numbers, hyphens, underscores allowed. Max 64 characters.)
   - **Sending IP pool**: leave as default `ses-default-dedicated-pool`.
   - **Tracking options** (expand if needed):
     - Leave **Use a custom redirect domain** unchecked for now.
   - **Advanced delivery options**: leave default.
   - **Reputation options**: check **Enabled** under Reputation metrics.
     This lets you see bounce/complaint stats in CloudWatch later.
   - **Suppression list options**: leave as default (use account-level suppression).
   - **Tags**: skip for now.
4. Click **Create set**.

You now have a configuration set. Keep this name   it goes into your env variable:

```
SES_CONFIGURATION_SET=myapp-config-set
```

---

## 9) Create an SNS Topic

SNS (Simple Notification Service) is the AWS messaging system that will receive events
from SES and forward them to your webhook. You create a topic (a named channel),
then SES publishes to it, and your server subscribes to receive those messages.

**Must be in the SAME region as your SES configuration (us-east-1).**

1. In the AWS Console search bar, type **SNS** and press Enter.
   Click **Simple Notification Service**.
2. In the SNS left sidebar, click **Topics**.
3. Click **Create topic**.
4. Under **Type**, select **Standard**.
   > **Important:** Do NOT select FIFO. SES only supports Standard type topics.
5. Under **Name**, type `myapp-ses-events`.
6. Under **Display name**, optionally type `MyApp SES Events`.
7. Leave everything else as default for now.
   (The access policy will be updated in step 11.)
8. Scroll down and click **Create topic**.
9. After creation, you will land on the topic's detail page.
10. Copy the **ARN** shown at the top. It will look like:
    `arn:aws:sns:us-east-1:111122223333:myapp-ses-events`
    Save this   you'll need it in step 11.

---

## 10) Add SNS as an event destination on your configuration set

Now you connect your configuration set to your SNS topic. This is what tells SES
"when these events happen, publish them to this SNS topic".

1. In the SES console left sidebar, under **Configuration**, click **Configuration sets**.
2. Click the name of your configuration set (`myapp-config-set`).
3. Click the **Event destinations** tab.
4. Click **Add destination**.

#### Step A   Select event types

5. Under **Sending and delivery**, check all the boxes you want to track:
   - ✅ **Sends**   when SES accepts the email for delivery
   - ✅ **Deliveries**   when recipient mail server successfully accepted the email
   - ✅ **Hard bounces**   permanent delivery failures (invalid address, etc)
   - ✅ **Complaints**   recipient marked as spam
   - ✅ **Rendering failures**   template rendering errors (optional)
   - ✅ **Delivery delays**   temporary failures (optional)
6. Under **Open and click tracking**, check both:
   - ✅ **Opens**
   - ✅ **Clicks**
7. Click **Next**.

#### Step B   Specify destination

8. Under **Destination type**, select **Amazon SNS**.
9. Under **Name**, type `sns-events-destination`.
10. Make sure **Event publishing** is set to **Enabled**.
11. Under **SNS topic**, click the dropdown and select the topic you just created
    (`myapp-ses-events`). If you don't see it, make sure you are in the same region.
12. Click **Next**.

#### Step C   Review

13. Review your selections. Confirm:
    - Event types include Opens, Clicks, Deliveries, Bounces, Complaints.
    - Destination type is Amazon SNS.
    - Destination name is `sns-events-destination`.
    - Event publishing is Enabled.
14. Click **Add destination**.

You will be taken to the event destination summary page. A green success banner
will confirm it was created.

---

## 11) Update the SNS topic access policy to allow SES to publish

Right now SES cannot actually write to your SNS topic because the topic's access
policy doesn't allow it. You must add an explicit permission.

1. From the event destination summary page, in the **Destination type** column,
   click **Amazon SNS**. This takes you to the SNS Topics list.
2. Click on the name of your topic (`myapp-ses-events`).
3. On the topic detail page, click the **Edit** button.
4. Expand the **Access policy** section by clicking on it.
5. You will see a JSON editor with a default policy. You need to **add** a new
   statement to the existing `Statement` array.

Replace the entire policy JSON with **one** `AllowSESPublish` statement (substitute your values).

> **Do not use `"Action": "SNS:*"`** (uppercase). SNS topic policies reject it with
> `Policy statement action out of service scope`. Use lowercase `sns:Publish` only.
> You do not need a separate “management” statement — your IAM user already manages the topic.

**nPanel production example** (account `847766693391`):

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "AllowSESPublish",
      "Effect": "Allow",
      "Principal": {
        "Service": "ses.amazonaws.com"
      },
      "Action": "sns:Publish",
      "Resource": "arn:aws:sns:us-east-1:847766693391:npanel-email-marketing-sns-topic-production",
      "Condition": {
        "StringEquals": {
          "AWS:SourceAccount": "847766693391"
        },
        "ArnLike": {
          "AWS:SourceArn": "arn:aws:ses:us-east-1:847766693391:configuration-set/npanel-email-marketing-config-set-production"
        }
      }
    }
  ]
}
```

**nPanel naming by environment:**

| Environment | SNS topic | Configuration set |
|---|---|---|
| Development | `npanel-email-marketing-sns-topic-dev` | `npanel-email-marketing-config-set` |
| Staging | `npanel-email-marketing-sns-topic-staging` | `npanel-email-marketing-config-set-staging` |
| Production | `npanel-email-marketing-sns-topic-production` | `npanel-email-marketing-config-set-production` |

Generic template (replace `YOUR_ACCOUNT_ID`, topic name, and config set name):

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "AllowSESPublish",
      "Effect": "Allow",
      "Principal": {
        "Service": "ses.amazonaws.com"
      },
      "Action": "sns:Publish",
      "Resource": "arn:aws:sns:us-east-1:YOUR_ACCOUNT_ID:YOUR_SNS_TOPIC_NAME",
      "Condition": {
        "StringEquals": {
          "AWS:SourceAccount": "YOUR_ACCOUNT_ID"
        },
        "ArnLike": {
          "AWS:SourceArn": "arn:aws:ses:us-east-1:YOUR_ACCOUNT_ID:configuration-set/YOUR_CONFIG_SET_NAME"
        }
      }
    }
  ]
}
```

6. Click **Save changes**.

---

## 12) Subscribe your webhook endpoint to the SNS topic

Now you tell SNS to send events to your app's webhook URL.

**Prerequisite:** Your app must be deployed and accessible at a public HTTPS URL.
SNS will not subscribe to `localhost` or HTTP. You need a real HTTPS endpoint.

For development, use a tunneling tool like [ngrok](https://ngrok.com/) or
[Cloudflare Tunnel](https://developers.cloudflare.com/cloudflare-one/connections/connect-apps/)
to expose your local server temporarily.

1. In SNS, click **Topics** in the left sidebar.
2. Click your topic (`myapp-ses-events`).
3. Scroll down and click **Create subscription**.
4. Under **Protocol**, select **HTTPS**.
5. Under **Endpoint**, type the full URL of your webhook.
   Example: `https://npanel-server.nisccloud.com/api/webhooks/sns`
   > nPanel listens on **`/api/webhooks/sns`** (not `/webhooks/sns`). Use the **API**
   > server host, not workers or the web SPA.
6. Leave **Enable raw message delivery** unchecked.
   (If checked, your endpoint won't receive the SNS metadata   you need it.)
7. Click **Create subscription**.

The subscription will show as **Pending confirmation**. SNS has just sent a POST
request to your webhook with a `SubscriptionConfirmation` message. Your app must
handle this to confirm.

---

## 13) Confirm the SNS subscription from your app

SNS sends a confirmation message to your webhook before it starts delivering events.
Your webhook must detect this and confirm it.

The confirmation POST body looks like this (JSON):

```json
{
  "Type": "SubscriptionConfirmation",
  "MessageId": "...",
  "Token": "...",
  "TopicArn": "arn:aws:sns:us-east-1:111122223333:myapp-ses-events",
  "Message": "...",
  "SubscribeURL": "https://sns.us-east-1.amazonaws.com/?Action=ConfirmSubscription&TopicArn=...&Token=...",
  "Timestamp": "...",
  "SignatureVersion": "1",
  "Signature": "...",
  "SigningCertURL": "https://sns.us-east-1.amazonaws.com/SimpleNotificationService-..."
}
```

Your webhook handler must:

1. Parse the JSON body.
2. Check if `body.Type === "SubscriptionConfirmation"`.
3. Validate that `SubscribeURL` is from a trusted AWS SNS host.
   The hostname must match: `sns.<region>.amazonaws.com`
4. Make an HTTP GET request to the `SubscribeURL`.
5. Return 200 OK to SNS.

After your app requests the `SubscribeURL`, go back to SNS in the AWS console.
The subscription status will change from **Pending confirmation** to **Confirmed**.

Once confirmed, every time SES fires an event (open, click, bounce, etc.), SNS
will POST it to your webhook automatically.

**Security check for SubscribeURL**   validate host before requesting it:
```ts
const parsedUrl = new URL(body.SubscribeURL);
const isTrustedSNSHost = /^sns\.[a-z0-9-]+\.amazonaws\.com$/.test(parsedUrl.hostname);
if (parsedUrl.protocol !== 'https:' || !isTrustedSNSHost) {
  // reject   this is not from AWS
}
```

This is exactly what the codebase does in:
`apps/api/src/controllers/Webhooks.ts` (lines 35–86)

---

## 14) Set your environment variables

After completing all steps above, you have everything needed to set these values
in your app:

```env
# AWS credentials (from step 3)
AWS_SES_REGION=us-east-1
AWS_SES_ACCESS_KEY_ID=<your access key id>
AWS_SES_SECRET_ACCESS_KEY=<your secret access key>

# Configuration set name (from step 8)
SES_CONFIGURATION_SET=myapp-config-set

# Optional: a second config set for sends where you want tracking disabled
# If this is set, the app enables a tracking toggle feature
# SES_CONFIGURATION_SET_NO_TRACKING=myapp-config-set-no-tracking

# Optional: override the emails-per-second rate limit
# If not set, the app fetches MaxSendRate from your SES account automatically
# In sandbox this is 1/s. In production it's usually 14/s or higher
# EMAIL_RATE_LIMIT_PER_SECOND=14
```

---

## 15) How to test everything end-to-end

### Test 1   Verify domain is working

In SES console, go to **Verified identities** and confirm:
- Domain status is **Verified**
- DKIM status is **Verified**
- MAIL FROM status is **Verified** (if you did step 6)

### Test 2   Send a test email via SES console

1. In SES, go to **Verified identities**.
2. Click your domain.
3. Click **Send test email**.
4. Fill in:
   - **From address**: `hello@yourdomain.com`
   - **Scenario**: Custom
   - **To address**: your own email address (while in sandbox, this must be a
     verified address or you must add it as a verified email identity)
   - **Subject**: Test
   - **Body**: Hello world
5. Click **Send test email**.
6. Check the inbox. If you receive it, SES sending works.

### Test 3   Verify SNS subscription is confirmed

1. In SNS, click Topics, click your topic.
2. Scroll to Subscriptions.
3. Status must show **Confirmed** (not **Pending confirmation**).
4. If still pending: check your server logs to see if the SubscriptionConfirmation
   POST arrived and whether your handler made the request to `SubscribeURL`.

### Test 4   Trigger a test bounce event

SES has a built-in simulator. Send to the simulator address to trigger events:

| Address | Event triggered |
|---|---|
| `bounce@simulator.amazonses.com` | Hard bounce |
| `complaint@simulator.amazonses.com` | Complaint |
| `success@simulator.amazonses.com` | Successful delivery |
| `ooto@simulator.amazonses.com` | Out of office (soft bounce) |

Send a test email to one of these addresses.
Within seconds your webhook should receive an SNS notification with the event.
Check your server logs.

---

## 16) What events you will receive and what to do with them

Your webhook receives a POST with `Content-Type: text/plain` (SNS quirk  
parse it as JSON regardless).

The outer SNS wrapper looks like:

```json
{
  "Type": "Notification",
  "MessageId": "...",
  "TopicArn": "arn:aws:sns:...",
  "Message": "{...nested SES event JSON as a string...}",
  "Timestamp": "..."
}
```

Parse `body.Message` as JSON to get the actual SES event:

```json
{
  "eventType": "Delivery",
  "mail": {
    "messageId": "...",
    "source": "hello@yourdomain.com",
    "commonHeaders": { "subject": "..." }
  },
  "delivery": { ... }
}
```

| `eventType` value | What it means | What to do in DB |
|---|---|---|
| `Delivery` | Email reached recipient mail server | Set `status = DELIVERED`, `deliveredAt = now` |
| `Open` | Recipient opened the email | Set `openedAt`, increment `opens` counter |
| `Click` | Recipient clicked a link | Set `clickedAt`, increment `clicks`, store which link |
| `Bounce` (Permanent) | Email address does not exist / rejected | Set `status = BOUNCED`, `bouncedAt`, unsubscribe contact |
| `Bounce` (Transient) | Temporary failure (full inbox etc) | Log only, do NOT unsubscribe |
| `Complaint` | Recipient marked as spam | Set `status = COMPLAINED`, unsubscribe contact immediately |

Compute rates:

```
openRate    = (count of emails with openedAt not null) / (count SENT) * 100
clickRate   = (count of emails with clickedAt not null) / (count SENT) * 100
bounceRate  = (count of emails with bouncedAt not null) / (count SENT) * 100
deliverRate = (count of emails with deliveredAt not null) / (count SENT) * 100
```

**You do NOT need any per-domain setup to receive these events.**
They flow automatically for all sends that use your configuration set.

---

## 17) Production launch checklist

Work through each item in order before going live:

- [ ] IAM user created with SES + SNS permissions
- [ ] AWS access key and secret saved in env
- [ ] SES region set to `us-east-1` consistently everywhere
- [ ] Domain identity created in SES
- [ ] 3 DKIM CNAME records added at DNS provider
- [ ] DKIM status shows **Verified** in SES console
- [ ] Custom MAIL FROM domain configured
- [ ] MAIL FROM MX and TXT/SPF records added at DNS provider
- [ ] MAIL FROM status shows **Verified** in SES console
- [ ] SES production access requested and approved
- [ ] Configuration set created (`myapp-config-set`)
- [ ] SNS Standard topic created (`myapp-ses-events`)
- [ ] SNS topic ARN saved
- [ ] All tracking event types added to config set event destination
  (Sends, Deliveries, Bounces, Complaints, Opens, Clicks)
- [ ] SNS topic access policy updated to allow `ses.amazonaws.com` to publish
- [ ] Webhook endpoint deployed at public HTTPS URL
- [ ] SNS subscription created pointing to webhook URL
- [ ] SNS subscription status shows **Confirmed**
- [ ] Environment variables set in app
- [ ] Test send successfully reaches inbox
- [ ] Bounce simulator test triggers webhook
- [ ] Webhook correctly updates DB status on bounce/delivery/open/click

---

## Official AWS Docs Reference

| Topic | Link |
|---|---|
| SES verified identities | https://docs.aws.amazon.com/ses/latest/dg/creating-identities.html |
| SES DKIM setup | https://docs.aws.amazon.com/ses/latest/dg/send-email-authentication-dkim.html |
| SES Easy DKIM | https://docs.aws.amazon.com/ses/latest/dg/send-email-authentication-dkim-easy.html |
| SES production access | https://docs.aws.amazon.com/ses/latest/dg/request-production-access.html |
| SES configuration sets | https://docs.aws.amazon.com/ses/latest/dg/creating-configuration-sets.html |
| SES event destinations | https://docs.aws.amazon.com/ses/latest/dg/event-destinations-manage.html |
| SES SNS event destination | https://docs.aws.amazon.com/ses/latest/dg/event-publishing-add-event-destination-sns.html |
| SES sending quota | https://docs.aws.amazon.com/ses/latest/dg/manage-sending-quotas.html |
| SNS topics | https://docs.aws.amazon.com/sns/latest/dg/sns-create-topic.html |
| SNS HTTPS subscriptions | https://docs.aws.amazon.com/sns/latest/dg/sns-subscribe-https-s-endpoints-to-topic.html |
| SNS subscription confirmation | https://docs.aws.amazon.com/sns/latest/dg/http-subscription-confirmation-json.html |
| SNS prepare endpoint | https://docs.aws.amazon.com/sns/latest/dg/SendMessageToHttp.prepare.html |
| IAM user guide | https://docs.aws.amazon.com/IAM/latest/UserGuide/introduction.html |
