import { Section } from '@react-email/components';
import {
  EmailLayout,
  EmailHeader,
  EmailFooter,
  EmailText,
  EmailButton,
  EmailSignature,
} from './components';

export interface CampaignCompletedEmailProps {
  recipientName?: string;
  campaignName?: string;
  subject?: string;
  sentAt?: string;
  totalRecipients?: number;
  viewCampaignLink?: string;
}

export const CampaignCompletedEmail = ({
  recipientName,
  campaignName,
  subject,
  sentAt,
  totalRecipients = 0,
  viewCampaignLink,
}: CampaignCompletedEmailProps) => {
  const greeting = recipientName ? `Hello ${recipientName},` : 'Hello,';

  return (
    <EmailLayout preview={`Your email campaign "${campaignName ?? 'Campaign'}" has finished sending`}>
      <EmailHeader />
      <Section>
        <EmailText>{greeting}</EmailText>
        <EmailText>
          Your email campaign has finished sending. Here is a brief summary:
        </EmailText>
        <EmailText>
          <strong>Campaign:</strong> {campaignName ?? ' '}
        </EmailText>
        <EmailText>
          <strong>Subject:</strong> {subject ?? ' '}
        </EmailText>
        {sentAt && (
          <EmailText>
            <strong>Sent at:</strong> {sentAt}
          </EmailText>
        )}
        <EmailText>
          <strong>Total recipients:</strong> {totalRecipients.toLocaleString()}
        </EmailText>
        <EmailText>
          Log in to your dashboard to see the full report including opens, clicks, and delivery details.
        </EmailText>
        {viewCampaignLink && (
          <EmailButton href={viewCampaignLink}>
            View Campaign Report
          </EmailButton>
        )}
        <EmailText>
          If you have any questions about your campaign performance, our support team is here to help.
        </EmailText>
        <EmailSignature />
      </Section>
      <EmailFooter />
    </EmailLayout>
  );
};

CampaignCompletedEmail.PreviewProps = {
  recipientName: 'Jane',
  campaignName: 'Product Launch Announcement',
  subject: 'Introducing our new product line',
  sentAt: 'Jan 30, 2026 at 2:45 PM',
  totalRecipients: 1250,
  viewCampaignLink: 'https://app.nisccloud.com/agency/email-marketing/campaigns/camp_123',
} as CampaignCompletedEmailProps;

export default CampaignCompletedEmail;
