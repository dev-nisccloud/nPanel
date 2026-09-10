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

export interface CampaignCancelledEmailProps {
  recipientName?: string;
  campaignName?: string;
  subject?: string;
  cancelledAt?: string;
  viewCampaignLink?: string;
}

export const CampaignCancelledEmail = ({
  recipientName,
  campaignName,
  subject,
  cancelledAt,
  viewCampaignLink,
}: CampaignCancelledEmailProps) => {
  const greeting = recipientName ? `Hello ${recipientName},` : 'Hello,';

  return (
    <EmailLayout preview={`Campaign cancelled: ${campaignName ?? 'Campaign'}`}>
      <EmailHeader />
      <Section>
        <EmailText>{greeting}</EmailText>
        <EmailText>
          Your scheduled campaign has been cancelled and will not be sent.
        </EmailText>
        <EmailDetails>
          <EmailText style={{ margin: '8px 0' }}>
            <strong>Campaign:</strong> {campaignName ?? ' '}
          </EmailText>
          <EmailText style={{ margin: '8px 0' }}>
            <strong>Subject:</strong> {subject ?? ' '}
          </EmailText>
          <EmailText style={{ margin: '8px 0' }}>
            <strong>Cancelled:</strong> {cancelledAt ?? ' '}
          </EmailText>
        </EmailDetails>
        {viewCampaignLink && (
          <EmailButton href={viewCampaignLink}>View campaigns</EmailButton>
        )}
        <EmailSignature />
      </Section>
      <EmailFooter />
    </EmailLayout>
  );
};

CampaignCancelledEmail.PreviewProps = {
  recipientName: 'Jane',
  campaignName: 'Weekly Newsletter',
  subject: "This week's updates and tips",
  cancelledAt: 'Jan 30, 2026 at 2:45 PM',
  viewCampaignLink: 'https://app.nisccloud.com/agency/email-marketing/campaigns',
} as CampaignCancelledEmailProps;

export default CampaignCancelledEmail;
