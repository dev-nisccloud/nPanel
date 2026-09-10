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

interface DomainExpirationReminderEmailProps {
  userFirstname?: string;
  domainName?: string;
  expirationDate?: string;
  daysUntilExpiration?: number;
  renewalLink?: string;
  supportEmail?: string;
  supportPhone?: string;
}

export const DomainExpirationReminderEmail = ({
  userFirstname,
  domainName = 'example.com',
  expirationDate = 'March 15, 2024',
  daysUntilExpiration = 30,
  renewalLink,
}: DomainExpirationReminderEmailProps) => {
  return (
    <EmailLayout preview={`${domainName} expires in ${daysUntilExpiration} days`}>
      <EmailHeader />
      <Section>
        <EmailText>Hello {userFirstname},</EmailText>
        <EmailText>
          Your domain <strong>{domainName}</strong> expires on <strong>{expirationDate}</strong>{' '}
          ({daysUntilExpiration} days from now). Renew it before then to keep your website and email running.
        </EmailText>
        <EmailDetails>
          <EmailText style={{ margin: '8px 0' }}>
            <strong>Domain:</strong> {domainName}
          </EmailText>
          <EmailText style={{ margin: '8px 0' }}>
            <strong>Expires:</strong> {expirationDate}
          </EmailText>
          <EmailText style={{ margin: '8px 0' }}>
            <strong>Days remaining:</strong> {daysUntilExpiration}
          </EmailText>
        </EmailDetails>
        <EmailButton href={renewalLink || 'https://app.nisccloud.com/domains/renew'}>
          Renew domain
        </EmailButton>
        <EmailText>
          If the domain expires, your site and email will stop working. Redemption after expiry may incur additional fees.
        </EmailText>
        <EmailSignature />
      </Section>
      <EmailFooter />
    </EmailLayout>
  );
};

DomainExpirationReminderEmail.PreviewProps = {
  userFirstname: 'John Doe',
  domainName: 'example.com',
  expirationDate: 'March 15, 2024',
  daysUntilExpiration: 30,
  renewalLink: 'https://app.nisccloud.com/domains/renew',
  supportEmail: 'domains@nisccloud.com',
  supportPhone: '+254 748 777 666',
} as DomainExpirationReminderEmailProps;

export default DomainExpirationReminderEmail;
