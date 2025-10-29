# Email Marketing Service Setup Guide

This guide walks you through setting up the email marketing service with Amazon SES and Upstash QStash.

## Prerequisites

- AWS Account with SES access
- Upstash Account
- Domain name for sending emails
- Database access (PostgreSQL)

## Step 1: AWS SES Setup

### 1.1 Create SES Account

1. Log into AWS Console
2. Navigate to Amazon SES
3. Choose your preferred region (e.g., us-east-1)
4. Note: SES is initially in sandbox mode

### 1.2 Verify Your Domain

1. In SES Console, go to "Verified identities"
2. Click "Create identity"
3. Select "Domain" and enter your domain name
4. Choose "Use a default DKIM signing key"
5. Click "Create identity"

### 1.3 Add DNS Records

After creating the identity, SES will provide DNS records to add:

**SPF Record:**
```
v=spf1 include:amazonses.com ~all
```

**DKIM Records (3 records):**
```
[token1]._domainkey.yourdomain.com CNAME [token1].dkim.amazonses.com
[token2]._domainkey.yourdomain.com CNAME [token2].dkim.amazonses.com
[token3]._domainkey.yourdomain.com CNAME [token3].dkim.amazonses.com
```

**DMARC Record (optional but recommended):**
```
v=DMARC1; p=quarantine; rua=mailto:dmarc@yourdomain.com
```

### 1.4 Create SNS Topic

1. Go to Amazon SNS in AWS Console
2. Click "Create topic"
3. Choose "Standard" topic type
4. Name: `ses-events`
5. Click "Create topic"
6. Note the Topic ARN

### 1.5 Create Configuration Set

1. In SES Console, go to "Configuration sets"
2. Click "Create configuration set"
3. Name: `npanel-email-marketing`
4. Click "Create configuration set"
5. Go to "Event destinations" tab
6. Click "Add destination"
7. Choose "Amazon SNS"
8. Select your SNS topic
9. Enable all event types:
   - Send
   - Bounce
   - Complaint
   - Delivery
   - Open
   - Click
   - Reject
   - Rendering Failure

### 1.6 Request Production Access

1. In SES Console, go to "Account dashboard"
2. Click "Request production access"
3. Fill out the form with:
   - Use case description
   - Website URL
   - Bounce/complaint handling process
4. Submit request (can take 24-48 hours)

### 1.7 Create IAM User

1. Go to IAM Console
2. Click "Users" → "Create user"
3. Username: `npanel-ses-user`
4. Attach policies: `AmazonSESFullAccess`, `AmazonSNSFullAccess`
5. Create access key
6. Note the Access Key ID and Secret Access Key

## Step 2: Upstash QStash Setup

### 2.1 Create Upstash Account

1. Go to [upstash.com](https://upstash.com)
2. Sign up for an account
3. Create a new project

### 2.2 Create QStash Project

1. In Upstash Console, click "Create Database"
2. Choose "QStash"
3. Name: `npanel-email-queue`
4. Region: Choose closest to your app
5. Click "Create"

### 2.3 Get Credentials

1. Go to your QStash project
2. Click "Details" tab
3. Copy:
   - QStash URL
   - QStash Token
   - Current Signing Key
   - Next Signing Key

## Step 3: Environment Configuration

### 3.1 Add Environment Variables

Add these variables to your `.env` file:

```bash
# AWS SES Configuration
AWS_SES_REGION=us-east-1
AWS_ACCESS_KEY_ID=your_access_key_id
AWS_SECRET_ACCESS_KEY=your_secret_access_key
AWS_SES_CONFIGURATION_SET=npanel-email-marketing
AWS_SNS_TOPIC_ARN=arn:aws:sns:us-east-1:123456789012:ses-events

# Upstash QStash
QSTASH_URL=https://qstash.upstash.io
QSTASH_TOKEN=your_qstash_token
QSTASH_CURRENT_SIGNING_KEY=your_current_signing_key
QSTASH_NEXT_SIGNING_KEY=your_next_signing_key

# Email Marketing Limits
EMAIL_DAILY_SEND_LIMIT=50000
EMAIL_MAX_SEND_RATE=14
EMAIL_BATCH_SIZE=50
EMAIL_RETRY_ATTEMPTS=3

# Webhook Configuration
EMAIL_WEBHOOK_BASE_URL=https://your-domain.com
```

### 3.2 Update Database

Run the database migration:

```bash
cd packages/db
pnpm run db:push
```

## Step 4: Webhook Configuration

### 4.1 Set Up Webhook Endpoints

Your application needs to expose these endpoints:

- `POST /api/trpc/emailMarketing.webhooks.snsWebhook` - For SNS events
- `POST /api/trpc/emailMarketing.webhooks.processQueueJob` - For QStash callbacks

### 4.2 Configure SNS Subscription

1. Go to your SNS topic in AWS Console
2. Click "Create subscription"
3. Protocol: HTTPS
4. Endpoint: `https://your-domain.com/api/trpc/emailMarketing.webhooks.snsWebhook`
5. Click "Create subscription"
6. Confirm subscription when prompted

### 4.3 Configure QStash Webhooks

QStash will automatically call your webhook endpoint when jobs are processed. No additional configuration needed.

## Step 5: Testing

### 5.1 Test Domain Verification

```typescript
// Test domain creation
const domain = await trpc.emailMarketing.domains.create.mutate({
  domainName: "yourdomain.com",
});

console.log("DNS Records to add:", domain.dnsRecords);
```

### 5.2 Test Email Sending

```typescript
// Create audience
const audience = await trpc.emailMarketing.audiences.create.mutate({
  name: "Test Audience",
});

// Add contact
await trpc.emailMarketing.contacts.add.mutate({
  audienceId: audience.id,
  email: "test@yourdomain.com",
});

// Create campaign
const campaign = await trpc.emailMarketing.campaigns.create.mutate({
  name: "Test Campaign",
  emailDomainId: domain.id,
  audienceId: audience.id,
  fromAddress: "Test <test@yourdomain.com>",
  replyToAddress: "support@yourdomain.com",
  subject: "Test Email",
  htmlContent: "<h1>Test</h1><p>This is a test email.</p>",
});

// Send campaign
await trpc.emailMarketing.campaigns.send.mutate({
  id: campaign.id,
});
```

### 5.3 Monitor Events

Check the email logs to see if events are being tracked:

```typescript
const logs = await trpc.emailMarketing.logs.getByCampaign.query({
  campaignId: campaign.id,
});

console.log("Email events:", logs.logs);
```

## Step 6: Production Considerations

### 6.1 Rate Limits

- **Sandbox Mode**: 200 emails/day, 1 email/second
- **Production Mode**: Request higher limits based on your needs
- **Configuration**: Adjust `EMAIL_MAX_SEND_RATE` based on your SES limits

### 6.2 Monitoring

- Set up CloudWatch alarms for SES metrics
- Monitor QStash queue status
- Track bounce and complaint rates
- Set up alerts for failed jobs

### 6.3 Security

- Use IAM roles instead of access keys when possible
- Rotate access keys regularly
- Enable SNS signature verification
- Use HTTPS for all webhook endpoints

### 6.4 Scaling

- Increase batch sizes for high-volume sending
- Use multiple SES regions for higher limits
- Consider using SES dedicated IPs for better deliverability
- Monitor and adjust queue processing rates

## Troubleshooting

### Common Issues

1. **Domain verification fails**
   - Check DNS records are correctly added
   - Wait for DNS propagation (up to 48 hours)
   - Verify domain format and spelling

2. **Emails not sending**
   - Check if SES is in sandbox mode
   - Verify domain is verified
   - Check rate limits and quotas
   - Ensure configuration set is properly set up

3. **SNS events not received**
   - Verify SNS topic subscription is confirmed
   - Check webhook endpoint is accessible
   - Verify signature verification is working
   - Check AWS CloudTrail for SNS delivery logs

4. **Queue jobs failing**
   - Check QStash credentials
   - Verify webhook endpoints are accessible
   - Check job payload format
   - Review QStash logs for errors

### Debug Mode

Enable debug logging by setting `NODE_ENV=development` to see detailed logs.

### Support

For issues specific to:
- **AWS SES**: Check AWS SES documentation and support
- **Upstash QStash**: Check Upstash documentation and support
- **Email Marketing Service**: Check the service documentation and logs

## Next Steps

1. **UI Development**: Build frontend interfaces for the email marketing features
2. **Templates**: Create email template system
3. **Analytics**: Add advanced analytics and reporting
4. **Automation**: Implement automated email sequences
5. **A/B Testing**: Add campaign A/B testing capabilities
