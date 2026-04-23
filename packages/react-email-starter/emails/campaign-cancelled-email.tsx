import { Section } from '@react-email/components';
import {
  EmailLayout,
  EmailHeader,
  EmailFooter,
  EmailText,
  EmailButton,
  EmailSignature,
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
    <EmailLayout preview={`Your scheduled campaign "${campaignName ?? 'Campaign'}" was cancelled`}>
      <EmailHeader />
      <Section>
        <EmailText>{greeting}</EmailText>
        <EmailText>
          You cancelled your scheduled campaign. It will not be sent.
        </EmailText>
        <EmailText>
          <strong>Campaign:</strong> {campaignName ?? ' '}
        </EmailText>
        <EmailText>
          <strong>Subject:</strong> {subject ?? ' '}
        </EmailText>
        <EmailText>
          <strong>Cancelled at:</strong> {cancelledAt ?? ' '}
        </EmailText>
        <EmailText>
          No emails will be sent for this scheduled send. You can create or schedule a new campaign anytime from your dashboard.
        </EmailText>
        {viewCampaignLink && (
          <EmailButton href={viewCampaignLink}>
            View Campaigns
          </EmailButton>
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
