import { Section } from '@react-email/components';
import {
  EmailLayout,
  EmailHeader,
  EmailFooter,
  EmailText,
  EmailButton,
  EmailSignature,
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
    <EmailLayout preview={`Your email campaign "${campaignName ?? 'Campaign'}" has been created`}>
      <EmailHeader />
      <Section>
        <EmailText>{greeting}</EmailText>
        <EmailText>
          Your email campaign has been created successfully and is ready to send or schedule.
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
          <strong>Recipients:</strong> {recipientCount.toLocaleString()}
        </EmailText>
        <EmailText>
          You can review the campaign, send it now, or schedule it for later from your email marketing dashboard.
        </EmailText>
        {viewCampaignLink && (
          <>
            <EmailButton href={viewCampaignLink}>
              View Campaign
            </EmailButton>
            <EmailText>
              Or copy and paste this link into your browser:
            </EmailText>
            <EmailText
              style={{
                wordBreak: 'break-all',
                color: '#666',
                fontSize: '14px',
                backgroundColor: '#f4f4f4',
                padding: '10px',
                borderRadius: '4px',
              }}
            >
              {viewCampaignLink}
            </EmailText>
          </>
        )}
        <EmailText>
          If you did not create this campaign, please contact your team administrator or support.
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
