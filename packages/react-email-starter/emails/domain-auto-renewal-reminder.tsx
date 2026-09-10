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

interface DomainAutoRenewalReminderEmailProps {
  userFirstname?: string;
  domainName?: string;
  renewalDate?: string;
  renewalAmount?: string;
  paymentMethod?: string;
  settingsLink?: string;
  supportEmail?: string;
  supportPhone?: string;
}

export const DomainAutoRenewalReminderEmail = ({
  userFirstname,
  domainName = 'example.com',
  renewalDate = 'March 15, 2024',
  renewalAmount = '$15.99',
  paymentMethod = 'Visa ending in 1234',
  settingsLink,
}: DomainAutoRenewalReminderEmailProps) => {
  return (
    <EmailLayout preview={`${domainName} will auto-renew on ${renewalDate}`}>
      <EmailHeader />
      <Section>
        <EmailText>Hello {userFirstname},</EmailText>
        <EmailText>
          Your domain <strong>{domainName}</strong> is set to auto-renew on <strong>{renewalDate}</strong>.{' '}
          <strong>{renewalAmount}</strong> will be charged to {paymentMethod}. No action is required unless you want to change this.
        </EmailText>
        <EmailDetails>
          <EmailText style={{ margin: '8px 0' }}>
            <strong>Domain:</strong> {domainName}
          </EmailText>
          <EmailText style={{ margin: '8px 0' }}>
            <strong>Renewal date:</strong> {renewalDate}
          </EmailText>
          <EmailText style={{ margin: '8px 0' }}>
            <strong>Amount:</strong> {renewalAmount}
          </EmailText>
          <EmailText style={{ margin: '8px 0' }}>
            <strong>Payment method:</strong> {paymentMethod}
          </EmailText>
        </EmailDetails>
        <EmailButton href={settingsLink || 'https://app.nisccloud.com/domains/settings'}>
          Manage auto-renewal
        </EmailButton>
        <EmailSignature />
      </Section>
      <EmailFooter />
    </EmailLayout>
  );
};

DomainAutoRenewalReminderEmail.PreviewProps = {
  userFirstname: 'John Doe',
  domainName: 'example.com',
  renewalDate: 'March 15, 2024',
  renewalAmount: '$15.99',
  paymentMethod: 'Visa ending in 1234',
  settingsLink: 'https://app.nisccloud.com/domains/settings',
  supportEmail: 'domains@nisccloud.com',
  supportPhone: '+254 748 777 666',
} as DomainAutoRenewalReminderEmailProps;

export default DomainAutoRenewalReminderEmail;
