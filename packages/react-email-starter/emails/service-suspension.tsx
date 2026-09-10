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

interface ServiceSuspensionEmailProps {
  userFirstname?: string;
  accountId?: string;
  suspensionDate?: string;
  suspensionReason?: string;
  serviceName?: string;
  planName?: string;
  domain?: string;
  paymentLink?: string;
  supportEmail?: string;
  supportPhone?: string;
  reactivationFee?: string;
}

export const ServiceSuspensionEmail = ({
  userFirstname,
  accountId = 'ACC-2024-001',
  suspensionDate = 'March 20, 2024',
  suspensionReason = 'Payment Overdue',
  serviceName = 'Web Hosting',
  planName = 'Business Plan',
  domain = 'example.com',
  paymentLink,
  reactivationFee = '$25.00',
}: ServiceSuspensionEmailProps) => {
  return (
    <EmailLayout preview={`${serviceName} suspended — ${accountId}`}>
      <EmailHeader />
      <Section>
        <EmailText>Hello {userFirstname},</EmailText>
        <EmailText>
          Your <strong>{serviceName}</strong> service was suspended on <strong>{suspensionDate}</strong> due to{' '}
          <strong>{suspensionReason}</strong>. The service is currently unavailable.
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
            <strong>Reason:</strong> {suspensionReason}
          </EmailText>
          <EmailText style={{ margin: '8px 0' }}>
            <strong>Reactivation fee:</strong> {reactivationFee}
          </EmailText>
        </EmailDetails>
        <EmailButton href={paymentLink || 'https://app.nisccloud.com/billing'}>
          View billing
        </EmailButton>
        <EmailText>
          Settle outstanding invoices and the reactivation fee to restore this service. Your data is retained during suspension; the service may be permanently removed after 60 days.
        </EmailText>
        <EmailSignature />
      </Section>
      <EmailFooter />
    </EmailLayout>
  );
};

ServiceSuspensionEmail.PreviewProps = {
  userFirstname: 'John Doe',
  accountId: 'ACC-2024-001',
  suspensionDate: 'March 20, 2024',
  suspensionReason: 'Payment Overdue',
  serviceName: 'Web Hosting',
  planName: 'Business Plan',
  domain: 'example.com',
  paymentLink: 'https://app.nisccloud.com/billing/pay',
  supportEmail: 'billing@nisccloud.com',
  supportPhone: '+254 748 777 666',
  reactivationFee: '$25.00',
} as ServiceSuspensionEmailProps;

export default ServiceSuspensionEmail;
