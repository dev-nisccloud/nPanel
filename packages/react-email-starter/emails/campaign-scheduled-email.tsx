import { Section } from '@react-email/components';
import {
  EmailLayout,
  EmailHeader,
  EmailFooter,
  EmailText,
  EmailButton,
  EmailSignature,
  EmailDetails,
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
    <EmailLayout preview={`Campaign scheduled: ${campaignName ?? 'Campaign'}`}>
      <EmailHeader />
      <Section>
        <EmailText>{greeting}</EmailText>
        <EmailText>
          Your email campaign is scheduled and will send automatically at the time you selected. You can cancel or reschedule it from nPanel before it sends.
        </EmailText>
        <EmailDetails>
          <EmailText style={{ margin: '8px 0' }}>
            <strong>Campaign:</strong> {campaignName ?? ' '}
          </EmailText>
          <EmailText style={{ margin: '8px 0' }}>
            <strong>Subject:</strong> {subject ?? ' '}
          </EmailText>
          <EmailText style={{ margin: '8px 0' }}>
            <strong>Scheduled for:</strong> {scheduledAt ?? ' '}
          </EmailText>
          <EmailText style={{ margin: '8px 0' }}>
            <strong>Recipients:</strong> {recipientCount.toLocaleString()}
          </EmailText>
        </EmailDetails>
        {viewCampaignLink && (
          <EmailButton href={viewCampaignLink}>View campaign</EmailButton>
        )}
        <EmailText>
          If you did not schedule this campaign, contact your administrator to cancel it.
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
  subject: "This week's updates and tips",
  scheduledAt: 'Feb 1, 2026 at 9:00 AM',
  recipientCount: 3200,
  viewCampaignLink: 'https://app.nisccloud.com/agency/email-marketing/campaigns/camp_456',
} as CampaignScheduledEmailProps;

export default CampaignScheduledEmail;
