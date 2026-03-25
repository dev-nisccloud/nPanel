import { Section } from '@react-email/components';
import {
  EmailLayout,
  EmailHeader,
  EmailFooter,
  EmailText,
  EmailButton,
  EmailSignature,
} from './components';

export interface CampaignScheduledEmailProps {
  recipientName?: string;
  campaignName?: string;
  subject?: string;
  scheduledAt?: string;
  recipientCount?: number;
  viewCampaignLink?: string;
}

export const CampaignScheduledEmail = ({
  recipientName,
  campaignName,
  subject,
  scheduledAt,
  recipientCount = 0,
  viewCampaignLink,
}: CampaignScheduledEmailProps) => {
  const greeting = recipientName ? `Hello ${recipientName},` : 'Hello,';

  return (
    <EmailLayout preview={`Your email campaign "${campaignName ?? 'Campaign'}" is scheduled`}>
      <EmailHeader />
      <Section>
        <EmailText>{greeting}</EmailText>
        <EmailText>
          Your email campaign has been scheduled and will be sent automatically at the date and time you selected.
        </EmailText>
        <EmailText>
          <strong>Campaign details:</strong>
        </EmailText>
        <EmailText>
          <strong>Campaign name:</strong> {campaignName ?? '—'}
        </EmailText>
        <EmailText>
          <strong>Subject:</strong> {subject ?? '—'}
        </EmailText>
        <EmailText>
          <strong>Scheduled for:</strong> {scheduledAt ?? '—'}
        </EmailText>
        <EmailText>
          <strong>Recipients:</strong> {recipientCount.toLocaleString()}
        </EmailText>
        <EmailText>
          No further action is required. The campaign will be sent at the scheduled time. You can cancel or reschedule it from your dashboard before it sends.
        </EmailText>
        {viewCampaignLink && (
          <EmailButton href={viewCampaignLink}>
            View Campaign
          </EmailButton>
        )}
        <EmailText>
          If you did not schedule this campaign, please contact your team administrator or support to cancel it.
        </EmailText>
        <EmailSignature />
      </Section>
      <EmailFooter />
    </EmailLayout>
  );
};

CampaignScheduledEmail.PreviewProps = {
  recipientName: 'Jane',
  campaignName: 'Weekly Newsletter',
  subject: 'This week\'s updates and tips',
  scheduledAt: 'Feb 1, 2026 at 9:00 AM',
  recipientCount: 3200,
  viewCampaignLink: 'https://app.nisccloud.com/agency/email-marketing/campaigns/camp_456',
} as CampaignScheduledEmailProps;

export default CampaignScheduledEmail;
