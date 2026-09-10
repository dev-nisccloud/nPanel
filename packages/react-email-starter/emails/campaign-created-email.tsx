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

export interface CampaignCreatedEmailProps {
  recipientName?: string;
  campaignName?: string;
  subject?: string;
  recipientCount?: number;
  viewCampaignLink?: string;
}

export const CampaignCreatedEmail = ({
  recipientName,
  campaignName,
  subject,
  recipientCount = 0,
  viewCampaignLink,
}: CampaignCreatedEmailProps) => {
  const greeting = recipientName ? `Hello ${recipientName},` : 'Hello,';

  return (
    <EmailLayout preview={`Campaign created: ${campaignName ?? 'Campaign'}`}>
      <EmailHeader />
      <Section>
        <EmailText>{greeting}</EmailText>
        <EmailText>
          Your email campaign has been created and is ready to send or schedule.
        </EmailText>
        <EmailDetails>
          <EmailText style={{ margin: '8px 0' }}>
            <strong>Campaign:</strong> {campaignName ?? ' '}
          </EmailText>
          <EmailText style={{ margin: '8px 0' }}>
            <strong>Subject:</strong> {subject ?? ' '}
          </EmailText>
          <EmailText style={{ margin: '8px 0' }}>
            <strong>Recipients:</strong> {recipientCount.toLocaleString()}
          </EmailText>
        </EmailDetails>
        {viewCampaignLink && (
          <EmailButton href={viewCampaignLink}>View campaign</EmailButton>
        )}
        <EmailText>
          If you did not create this campaign, contact your administrator.
        </EmailText>
        <EmailSignature />
      </Section>
      <EmailFooter />
    </EmailLayout>
  );
};

CampaignCreatedEmail.PreviewProps = {
  recipientName: 'Jane',
  campaignName: 'Product Launch Announcement',
  subject: 'Introducing our new product line',
  recipientCount: 1250,
  viewCampaignLink: 'https://app.nisccloud.com/agency/email-marketing/campaigns/camp_123',
} as CampaignCreatedEmailProps;

export default CampaignCreatedEmail;
