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

interface ServiceRestorationConfirmationEmailProps {
  userFirstname?: string;
  accountId?: string;
  restorationDate?: string;
  serviceName?: string;
  planName?: string;
  domain?: string;
  accountLink?: string;
  supportEmail?: string;
  supportPhone?: string;
  nextBillingDate?: string;
}

export const ServiceRestorationConfirmationEmail = ({
  userFirstname,
  accountId = 'ACC-2024-001',
  restorationDate = 'March 20, 2024',
  serviceName = 'Web Hosting',
  planName = 'Business Plan',
  domain = 'example.com',
  accountLink,
  nextBillingDate = 'April 20, 2024',
}: ServiceRestorationConfirmationEmailProps) => {
  return (
    <EmailLayout preview={`${serviceName} has been restored`}>
      <EmailHeader />
      <Section>
        <EmailText>Hello {userFirstname},</EmailText>
        <EmailText>
          Your <strong>{serviceName}</strong> service was restored on <strong>{restorationDate}</strong> and is now active.
        </EmailText>
        <EmailDetails>
          <EmailText style={{ margin: '8px 0' }}>
            <strong>Account:</strong> {accountId}
          </EmailText>
          <EmailText style={{ margin: '8px 0' }}>
            <strong>Service:</strong> {serviceName} — {planName}
          </EmailText>
          {domain && (
            <EmailText style={{ margin: '8px 0' }}>
              <strong>Domain:</strong> {domain}
            </EmailText>
          )}
          <EmailText style={{ margin: '8px 0' }}>
            <strong>Next billing date:</strong> {nextBillingDate}
          </EmailText>
        </EmailDetails>
        <EmailButton href={accountLink || 'https://app.nisccloud.com/dashboard'}>
          Open nPanel
        </EmailButton>
        <EmailText>
          Please confirm the service is working as expected. Enabling auto-renewal helps avoid future interruptions.
        </EmailText>
        <EmailSignature />
      </Section>
      <EmailFooter />
    </EmailLayout>
  );
};

ServiceRestorationConfirmationEmail.PreviewProps = {
  userFirstname: 'John Doe',
  accountId: 'ACC-2024-001',
  restorationDate: 'March 20, 2024',
  serviceName: 'Web Hosting',
  planName: 'Business Plan',
  domain: 'example.com',
  accountLink: 'https://app.nisccloud.com/dashboard',
  supportEmail: 'support@nisccloud.com',
  supportPhone: '+254 748 777 666',
  nextBillingDate: 'April 20, 2024',
} as ServiceRestorationConfirmationEmailProps;

export default ServiceRestorationConfirmationEmail;
