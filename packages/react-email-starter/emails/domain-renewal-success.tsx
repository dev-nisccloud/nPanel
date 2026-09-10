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

interface DomainRenewalSuccessEmailProps {
  userFirstname?: string;
  domainName?: string;
  renewalDate?: string;
  nextExpirationDate?: string;
  renewalPeriod?: string;
  amount?: string;
  accountLink?: string;
  supportEmail?: string;
  supportPhone?: string;
}

export const DomainRenewalSuccessEmail = ({
  userFirstname,
  domainName = 'example.com',
  renewalDate = 'March 10, 2024',
  nextExpirationDate = 'March 10, 2025',
  renewalPeriod = '1 year',
  amount = '$15.99',
  accountLink,
}: DomainRenewalSuccessEmailProps) => {
  return (
    <EmailLayout preview={`${domainName} has been renewed`}>
      <EmailHeader />
      <Section>
        <EmailText>Hello {userFirstname},</EmailText>
        <EmailText>
          Your domain <strong>{domainName}</strong> has been renewed and remains active until{' '}
          <strong>{nextExpirationDate}</strong>.
        </EmailText>
        <EmailDetails>
          <EmailText style={{ margin: '8px 0' }}>
            <strong>Domain:</strong> {domainName}
          </EmailText>
          <EmailText style={{ margin: '8px 0' }}>
            <strong>Renewed:</strong> {renewalDate}
          </EmailText>
          <EmailText style={{ margin: '8px 0' }}>
            <strong>New expiry:</strong> {nextExpirationDate}
          </EmailText>
          <EmailText style={{ margin: '8px 0' }}>
            <strong>Period:</strong> {renewalPeriod}
          </EmailText>
          <EmailText style={{ margin: '8px 0' }}>
            <strong>Amount paid:</strong> {amount}
          </EmailText>
        </EmailDetails>
        <EmailButton href={accountLink || 'https://app.nisccloud.com/domains'}>
          Manage domain
        </EmailButton>
        <EmailSignature />
      </Section>
      <EmailFooter />
    </EmailLayout>
  );
};

DomainRenewalSuccessEmail.PreviewProps = {
  userFirstname: 'John Doe',
  domainName: 'example.com',
  renewalDate: 'March 10, 2024',
  nextExpirationDate: 'March 10, 2025',
  renewalPeriod: '1 year',
  amount: '$15.99',
  accountLink: 'https://app.nisccloud.com/domains',
  supportEmail: 'domains@nisccloud.com',
  supportPhone: '+254 748 777 666',
} as DomainRenewalSuccessEmailProps;

export default DomainRenewalSuccessEmail;
