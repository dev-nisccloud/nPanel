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
    <EmailLayout preview={`Campaign sent: ${campaignName ?? 'Campaign'}`}>
      <EmailHeader />
      <Section>
        <EmailText>{greeting}</EmailText>
        <EmailText>
          Your email campaign has finished sending.
        </EmailText>
        <EmailDetails>
          <EmailText style={{ margin: '8px 0' }}>
            <strong>Campaign:</strong> {campaignName ?? ' '}
          </EmailText>
          <EmailText style={{ margin: '8px 0' }}>
            <strong>Subject:</strong> {subject ?? ' '}
          </EmailText>
          {sentAt && (
            <EmailText style={{ margin: '8px 0' }}>
              <strong>Sent:</strong> {sentAt}
            </EmailText>
          )}
          <EmailText style={{ margin: '8px 0' }}>
            <strong>Recipients:</strong> {totalRecipients.toLocaleString()}
          </EmailText>
        </EmailDetails>
        {viewCampaignLink && (
          <EmailButton href={viewCampaignLink}>View report</EmailButton>
        )}
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
