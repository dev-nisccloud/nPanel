# Email Marketing Service

A comprehensive email marketing service built with Amazon SES, featuring domain management, campaign organization, audience management, real-time event tracking, and fault-tolerant queue system.

## Features

- **Domain Management**: Connect and verify domains for sending emails
- **Flexible Addressing**: Define "From" and "Reply-To" addresses per campaign
- **Campaign Management**: Group email marketing activities into campaigns
- **Audience Management**: Multi-tenant contact list management
- **Real-time Tracking**: Track opens, clicks, bounces, complaints, and deliveries
- **Fault-tolerant Queue**: Background job processing with retry logic
- **Multi-tenant Support**: Team-based and agency-wide operations

## Architecture

### Database Schema

The service uses a comprehensive Prisma schema with the following main models:

- **EmailDomain**: Domain verification and management
- **EmailCampaign**: Campaign organization and content
- **Audience**: Top-level audience metadata
- **AudienceContact**: Individual contacts linked to audiences
- **EmailLog**: Real-time event logging from SNS
- **SESConfiguration**: Platform-level SES settings
- **Activity Logs**: Advanced logging for all entities

### AWS SES Integration

- **Domain Verification**: Automated DKIM, SPF, and DMARC setup
- **Email Sending**: Single and bulk email sending with rate limiting
- **Configuration Sets**: SNS event destination management
- **Monitoring**: Quota and reputation tracking

### Queue System (Upstash QStash)

- **Campaign Send Jobs**: Process campaign sending in batches
- **Bulk Email Jobs**: Send emails to contact batches
- **Domain Verification Jobs**: Check verification status
- **Retry Logic**: Exponential backoff with configurable attempts
- **Fault Tolerance**: Dead letter queue for failed jobs

### Event Tracking (SNS Webhooks)

- **Real-time Events**: Bounce, complaint, delivery, open, click tracking
- **Signature Verification**: Secure SNS webhook processing
- **Event Handlers**: Dedicated handlers for each event type
- **Contact Status Updates**: Automatic status updates based on events

## API Endpoints

### Domain Management (`emailMarketing.domains`)

- `create`: Add new domain for verification
- `list`: Get user/team domains
- `getById`: Get domain details with DNS records
- `checkVerification`: Check verification status
- `delete`: Remove domain

### Audience Management (`emailMarketing.audiences`)

- `create`: Create new audience
- `list`: Get user/team audiences
- `getById`: Get audience with contacts
- `update`: Update audience metadata
- `delete`: Delete audience

### Contact Management (`emailMarketing.contacts`)

- `add`: Add single contact to audience
- `bulkAdd`: Add multiple contacts
- `list`: Get contacts in audience
- `getById`: Get contact details
- `update`: Update contact information
- `unsubscribe`: Unsubscribe contact
- `delete`: Remove contact

### Campaign Management (`emailMarketing.campaigns`)

- `create`: Create new campaign
- `list`: Get user/team campaigns
- `getById`: Get campaign details
- `update`: Update campaign (draft only)
- `schedule`: Schedule campaign for later
- `send`: Send campaign immediately
- `pause`: Pause sending campaign
- `delete`: Delete campaign

### Email Logs (`emailMarketing.logs`)

- `getByCampaign`: Get logs for campaign
- `getByContact`: Get logs for contact
- `getStats`: Get campaign statistics

### Webhooks (`emailMarketing.webhooks`)

- `snsWebhook`: Process SNS events from SES
- `processQueueJob`: Process QStash job callbacks

## Environment Configuration

### Required Environment Variables

```bash
# AWS SES Configuration
AWS_SES_REGION=us-east-1
AWS_ACCESS_KEY_ID=your_access_key
AWS_SECRET_ACCESS_KEY=your_secret_key
AWS_SES_CONFIGURATION_SET=npanel-email-marketing
AWS_SNS_TOPIC_ARN=arn:aws:sns:us-east-1:xxx:ses-events

# Upstash QStash
QSTASH_URL=https://qstash.upstash.io
QSTASH_TOKEN=your_token
QSTASH_CURRENT_SIGNING_KEY=your_signing_key
QSTASH_NEXT_SIGNING_KEY=your_next_signing_key

# Email Marketing Limits
EMAIL_DAILY_SEND_LIMIT=50000
EMAIL_MAX_SEND_RATE=14
EMAIL_BATCH_SIZE=50
EMAIL_RETRY_ATTEMPTS=3

# Webhook Configuration
EMAIL_WEBHOOK_BASE_URL=https://your-domain.com
```

## Setup Instructions

### 1. AWS SES Setup

1. **Create SES Account**: Set up Amazon SES in your AWS account
2. **Verify Domain**: Add your domain to SES and verify it
3. **Create SNS Topic**: Create SNS topic for event notifications
4. **Configure Configuration Set**: Set up configuration set with SNS destination
5. **Request Production Access**: Move out of sandbox mode

### 2. Upstash QStash Setup

1. **Create Upstash Account**: Sign up at upstash.com
2. **Create QStash Project**: Create a new QStash project
3. **Get Credentials**: Copy URL and token from dashboard
4. **Configure Webhooks**: Set up webhook endpoints

### 3. Database Migration

```bash
cd packages/db
pnpm run db:push
```

### 4. Environment Variables

Add all required environment variables to your `.env` file.

## Usage Examples

### Creating a Domain

```typescript
const domain = await trpc.emailMarketing.domains.create.mutate({
  domainName: "example.com",
  teamId: "team-123", // Optional
});

// Add DNS records returned by the API
console.log(domain.dnsRecords);
```

### Creating an Audience

```typescript
const audience = await trpc.emailMarketing.audiences.create.mutate({
  name: "Newsletter Subscribers",
  description: "Monthly newsletter audience",
  teamId: "team-123", // Optional
});
```

### Adding Contacts

```typescript
// Single contact
await trpc.emailMarketing.contacts.add.mutate({
  audienceId: "audience-123",
  email: "user@example.com",
  firstName: "John",
  lastName: "Doe",
});

// Bulk contacts
await trpc.emailMarketing.contacts.bulkAdd.mutate({
  audienceId: "audience-123",
  contacts: [
    { email: "user1@example.com", firstName: "John" },
    { email: "user2@example.com", firstName: "Jane" },
  ],
});
```

### Creating and Sending a Campaign

```typescript
// Create campaign
const campaign = await trpc.emailMarketing.campaigns.create.mutate({
  name: "Welcome Email",
  emailDomainId: "domain-123",
  audienceId: "audience-123",
  fromAddress: "Welcome <welcome@example.com>",
  replyToAddress: "support@example.com",
  subject: "Welcome to our service!",
  htmlContent: "<h1>Welcome!</h1><p>Thank you for joining us.</p>",
  textContent: "Welcome! Thank you for joining us.",
});

// Send campaign
await trpc.emailMarketing.campaigns.send.mutate({
  id: campaign.id,
});
```

### Getting Campaign Statistics

```typescript
const stats = await trpc.emailMarketing.logs.getStats.query({
  campaignId: "campaign-123",
});

console.log(`Delivery Rate: ${stats.rates.deliveryRate}%`);
console.log(`Open Rate: ${stats.rates.openRate}%`);
console.log(`Click Rate: ${stats.rates.clickRate}%`);
```

## Security Considerations

- **SNS Signature Verification**: All webhooks verify SNS signatures
- **Environment Variables**: Sensitive config stored in environment variables
- **Multi-tenant Isolation**: Users can only access their own data
- **Rate Limiting**: Respects SES rate limits and quotas
- **Input Validation**: All inputs validated with Zod schemas

## Monitoring and Logging

- **Activity Logs**: Comprehensive logging for all operations
- **Queue Monitoring**: Track job status and failures
- **SES Monitoring**: Monitor quotas and reputation
- **Error Handling**: Graceful error handling with retries

## Troubleshooting

### Common Issues

1. **Domain Verification Fails**
   - Check DNS records are correctly added
   - Wait for DNS propagation
   - Verify domain format

2. **Emails Not Sending**
   - Check SES sandbox mode status
   - Verify domain is verified
   - Check rate limits

3. **Queue Jobs Failing**
   - Check QStash credentials
   - Verify webhook endpoints
   - Check job payload format

4. **SNS Events Not Received**
   - Verify SNS topic configuration
   - Check webhook endpoint accessibility
   - Verify signature verification

### Debug Mode

Enable debug logging by setting `NODE_ENV=development` to see detailed logs.

## Contributing

1. Follow the existing code structure
2. Add comprehensive tests for new features
3. Update documentation for API changes
4. Ensure all environment variables are documented

## License

This email marketing service is part of the nPanel project and follows the same license terms.
