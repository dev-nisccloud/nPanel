import { Section } from '@react-email/components';
import { 
  EmailLayout, 
  EmailHeader, 
  EmailFooter, 
  EmailText, 
  EmailButton, 
  EmailLink, 
  EmailSignature 
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
  domainName = "example.com",
  expirationDate = "March 15, 2024",
  daysUntilExpiration = 30,
  renewalLink,
  supportEmail = "domains@nisccloud.com",
  supportPhone = "+254 748 777 666"
}: DomainExpirationReminderEmailProps) => {
  return (
    <EmailLayout preview={`Domain ${domainName} expires in ${daysUntilExpiration} days`}>
      <EmailHeader />
      <Section>
        <EmailText>Hello {userFirstname},</EmailText>
        <EmailText>
          This is a friendly reminder that your domain <strong>{domainName}</strong> 
          is set to expire on <strong>{expirationDate}</strong> 
          ({daysUntilExpiration} days from now).
        </EmailText>
        <EmailText>
          To ensure uninterrupted service for your website and email, please renew your domain 
          before the expiration date.
        </EmailText>
        
        {/* Domain Details Box */}
        <div style={{
          backgroundColor: '#f8fafc',
          border: '1px solid #e2e8f0',
          borderRadius: '8px',
          padding: '20px',
          margin: '20px 0',
        }}>
          <EmailText style={{ margin: '0 0 10px 0', fontWeight: 'bold' }}>
            Domain Details:
          </EmailText>
          <EmailText style={{ margin: '5px 0' }}>
            Domain Name: {domainName}
          </EmailText>
          <EmailText style={{ margin: '5px 0' }}>
            Expiration Date: {expirationDate}
          </EmailText>
          <EmailText style={{ margin: '5px 0' }}>
            Days Remaining: {daysUntilExpiration}
          </EmailText>
        </div>

        <EmailText>
          <strong>What happens if you don't renew?</strong>
        </EmailText>
        <EmailText>
          • Your website will become inaccessible
        </EmailText>
        <EmailText>
          • Email services will stop working
        </EmailText>
        <EmailText>
          • Your domain may become available for others to register
        </EmailText>
        <EmailText>
          • Additional fees may apply for redemption after expiration
        </EmailText>

        <EmailButton href={renewalLink || 'https://app.nisccloud.com/domains/renew'}>
          Renew Domain Now
        </EmailButton>

        <EmailText>
          <strong>Need Help?</strong> Our domain experts are here to assist you:
        </EmailText>
        <EmailText>
          • Email us at{' '}
          <EmailLink href={`mailto:${supportEmail}`}>
            {supportEmail}
          </EmailLink>
        </EmailText>
        <EmailText>
          • Call our support team at{' '}
          <EmailLink href={`tel:${supportPhone}`}>
            {supportPhone}
          </EmailLink>
        </EmailText>
        <EmailText>
          We recommend renewing your domain for multiple years to avoid future interruptions 
          and often at a better rate.
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
