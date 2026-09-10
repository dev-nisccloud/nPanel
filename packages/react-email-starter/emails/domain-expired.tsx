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

interface DomainExpiredEmailProps {
  userFirstname?: string;
  domainName?: string;
  expirationDate?: string;
  daysSinceExpiration?: number;
  renewalLink?: string;
  supportEmail?: string;
  supportPhone?: string;
}

export const DomainExpiredEmail = ({
  userFirstname,
  domainName = 'example.com',
  expirationDate = 'March 15, 2024',
  daysSinceExpiration = 1,
  renewalLink,
}: DomainExpiredEmailProps) => {
  return (
    <EmailLayout preview={`${domainName} has expired`}>
      <EmailHeader />
      <Section>
        <EmailText>Hello {userFirstname},</EmailText>
        <EmailText>
          Your domain <strong>{domainName}</strong> expired on <strong>{expirationDate}</strong>{' '}
          ({daysSinceExpiration} day{daysSinceExpiration !== 1 ? 's' : ''} ago). Your website and email for this domain are currently unavailable.
        </EmailText>
        <EmailDetails>
          <EmailText style={{ margin: '8px 0' }}>
            <strong>Domain:</strong> {domainName}
          </EmailText>
          <EmailText style={{ margin: '8px 0' }}>
            <strong>Expired:</strong> {expirationDate}
          </EmailText>
        </EmailDetails>
        <EmailButton href={renewalLink || 'https://app.nisccloud.com/domains/renew'}>
          Renew domain
        </EmailButton>
        <EmailText>
          Days 1–30 after expiry: renew at the standard rate. Days 31–60: redemption fees apply. After 60 days, the domain may be released.
        </EmailText>
        <EmailSignature />
      </Section>
      <EmailFooter />
    </EmailLayout>
  );
};

DomainExpiredEmail.PreviewProps = {
  userFirstname: 'John Doe',
  domainName: 'example.com',
  expirationDate: 'March 15, 2024',
  daysSinceExpiration: 1,
  renewalLink: 'https://app.nisccloud.com/domains/renew',
  supportEmail: 'domains@nisccloud.com',
  supportPhone: '+254 748 777 666',
} as DomainExpiredEmailProps;

export default DomainExpiredEmail;
