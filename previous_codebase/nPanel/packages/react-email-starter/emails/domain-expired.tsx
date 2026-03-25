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
  domainName = "example.com",
  expirationDate = "March 15, 2024",
  daysSinceExpiration = 1,
  renewalLink,
  supportEmail = "domains@nisccloud.com",
  supportPhone = "+254 748 777 666"
}: DomainExpiredEmailProps) => {
  return (
    <EmailLayout preview={`URGENT: Domain ${domainName} has expired`}>
      <EmailHeader />
      <Section>
        <EmailText>Hello {userFirstname},</EmailText>
        <EmailText>
          <strong style={{ color: '#dc2626' }}>URGENT NOTICE:</strong> Your domain{' '}
          <strong>{domainName}</strong> expired on <strong>{expirationDate}</strong> 
          ({daysSinceExpiration} day{daysSinceExpiration !== 1 ? 's' : ''} ago).
        </EmailText>
        <EmailText>
          Your website and email services are currently unavailable due to this expiration. 
          Immediate action is required to restore your services.
        </EmailText>
        
        {/* Domain Details Box */}
        <div style={{
          backgroundColor: '#fef2f2',
          border: '2px solid #dc2626',
          borderRadius: '8px',
          padding: '20px',
          margin: '20px 0',
        }}>
          <EmailText style={{ margin: '0 0 10px 0', fontWeight: 'bold', color: '#dc2626' }}>
            Expired Domain Details:
          </EmailText>
          <EmailText style={{ margin: '5px 0' }}>
            Domain Name: {domainName}
          </EmailText>
          <EmailText style={{ margin: '5px 0' }}>
            Expiration Date: {expirationDate}
          </EmailText>
          <EmailText style={{ margin: '5px 0', color: '#dc2626', fontWeight: 'bold' }}>
            Status: EXPIRED
          </EmailText>
        </div>

        <EmailText>
          <strong>Immediate Impact:</strong>
        </EmailText>
        <EmailText>
          • Your website is no longer accessible
        </EmailText>
        <EmailText>
          • Email services have been suspended
        </EmailText>
        <EmailText>
          • DNS services are no longer active
        </EmailText>
        <EmailText>
          • Your domain is at risk of being released to the public
        </EmailText>

        <EmailText>
          <strong>What you need to do:</strong>
        </EmailText>
        <EmailText>
          • Renew your domain immediately to restore services
        </EmailText>
        <EmailText>
          • Check if additional redemption fees apply
        </EmailText>
        <EmailText>
          • Update your DNS settings if needed after renewal
        </EmailText>

        <EmailButton 
          href={renewalLink || 'https://app.nisccloud.com/domains/renew'}
          style={{ 
            backgroundColor: '#dc2626',
            color: '#fff',
            textDecoration: 'none',
            textAlign: 'center' as const,
            display: 'block',
            width: '250px',
            padding: '16px 7px',
            margin: '0 auto',
            borderRadius: '4px',
            fontFamily: "'Inter', 'Inter Sans Serif', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif",
            fontSize: '16px',
            fontWeight: 'bold',
          }}
        >
          RENEW DOMAIN NOW
        </EmailButton>

        <EmailText>
          <strong>Important Timeline:</strong>
        </EmailText>
        <EmailText>
          • Days 1-30: Grace period (renewal at standard rate)
        </EmailText>
        <EmailText>
          • Days 31-60: Redemption period (additional fees apply)
        </EmailText>
        <EmailText>
          • After 60 days: Domain may be released to public registration
        </EmailText>

        <EmailText>
          <strong>Need Immediate Assistance?</strong> Contact our domain specialists:
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
          We understand the urgency and are here to help you restore your services as quickly as possible.
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
