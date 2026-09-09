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
  domainName = "example.com",
  renewalDate = "March 10, 2024",
  nextExpirationDate = "March 10, 2025",
  renewalPeriod = "1 year",
  amount = "$15.99",
  accountLink,
  supportEmail = "domains@nisccloud.com",
  supportPhone = "+254 748 777 666"
}: DomainRenewalSuccessEmailProps) => {
  return (
    <EmailLayout preview={`Domain ${domainName} successfully renewed`}>
      <EmailHeader />
      <Section>
        <EmailText>Hello {userFirstname},</EmailText>
        <EmailText>
          Great news! Your domain <strong>{domainName}</strong> has been successfully renewed 
          on <strong>{renewalDate}</strong>.
        </EmailText>
        <EmailText>
          Thank you for choosing Nisc Cloud® for your domain services. Your domain is now 
          secure and will remain active until <strong>{nextExpirationDate}</strong>.
        </EmailText>
        
        {/* Renewal Details Box */}
        <div style={{
          backgroundColor: '#f0fdf4',
          border: '2px solid #22c55e',
          borderRadius: '8px',
          padding: '20px',
          margin: '20px 0',
        }}>
          <EmailText style={{ margin: '0 0 10px 0', fontWeight: 'bold', color: '#16a34a' }}>
            Renewal Confirmation:
          </EmailText>
          <EmailText style={{ margin: '5px 0' }}>
            Domain Name: {domainName}
          </EmailText>
          <EmailText style={{ margin: '5px 0' }}>
            Renewal Date: {renewalDate}
          </EmailText>
          <EmailText style={{ margin: '5px 0' }}>
            Next Expiration: {nextExpirationDate}
          </EmailText>
          <EmailText style={{ margin: '5px 0' }}>
            Renewal Period: {renewalPeriod}
          </EmailText>
          <EmailText style={{ margin: '5px 0' }}>
            Amount Paid: {amount}
          </EmailText>
          <EmailText style={{ margin: '5px 0', color: '#16a34a', fontWeight: 'bold' }}>
            Status: ACTIVE
          </EmailText>
        </div>

        <EmailText>
          <strong>What's Next?</strong>
        </EmailText>
        <EmailText>
          • Your website and email services are fully operational
        </EmailText>
        <EmailText>
          • DNS settings remain unchanged
        </EmailText>
        <EmailText>
          • You can manage your domain settings anytime
        </EmailText>
        <EmailText>
          • Consider enabling auto-renewal for future convenience
        </EmailText>

        <EmailButton href={accountLink || 'https://app.nisccloud.com/domains'}>
          Manage Domain Settings
        </EmailButton>

        <EmailText>
          <strong>Pro Tips for Domain Management:</strong>
        </EmailText>
        <EmailText>
          • Enable auto-renewal to avoid future expiration
        </EmailText>
        <EmailText>
          • Keep your contact information up to date
        </EmailText>
        <EmailText>
          • Consider multi-year renewals for better rates
        </EmailText>
        <EmailText>
          • Set up domain monitoring for important domains
        </EmailText>

        <EmailText>
          <strong>Need Assistance?</strong> Our domain experts are here to help:
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
          We appreciate your business and look forward to continuing to serve your 
          domain management needs.
        </EmailText>
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
