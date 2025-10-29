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
  domainName = "example.com",
  renewalDate = "March 15, 2024",
  renewalAmount = "$15.99",
  paymentMethod = "Visa ending in 1234",
  settingsLink,
  supportEmail = "domains@nisccloud.com",
  supportPhone = "+254 748 777 666"
}: DomainAutoRenewalReminderEmailProps) => {
  return (
    <EmailLayout preview={`Auto-renewal reminder for ${domainName}`}>
      <EmailHeader />
      <Section>
        <EmailText>Hello {userFirstname},</EmailText>
        <EmailText>
          This is a friendly reminder that your domain <strong>{domainName}</strong> 
          is set to auto-renew on <strong>{renewalDate}</strong>.
        </EmailText>
        <EmailText>
          The renewal fee of <strong>{renewalAmount}</strong> will be automatically 
          charged to your payment method on file.
        </EmailText>
        
        {/* Auto-Renewal Details Box */}
        <div style={{
          backgroundColor: '#f0f9ff',
          border: '1px solid #0ea5e9',
          borderRadius: '8px',
          padding: '20px',
          margin: '20px 0',
        }}>
          <EmailText style={{ margin: '0 0 10px 0', fontWeight: 'bold', color: '#0369a1' }}>
            Auto-Renewal Details:
          </EmailText>
          <EmailText style={{ margin: '5px 0' }}>
            Domain Name: {domainName}
          </EmailText>
          <EmailText style={{ margin: '5px 0' }}>
            Renewal Date: {renewalDate}
          </EmailText>
          <EmailText style={{ margin: '5px 0' }}>
            Renewal Amount: {renewalAmount}
          </EmailText>
          <EmailText style={{ margin: '5px 0' }}>
            Payment Method: {paymentMethod}
          </EmailText>
          <EmailText style={{ margin: '5px 0', color: '#0369a1', fontWeight: 'bold' }}>
            Status: AUTO-RENEWAL ENABLED
          </EmailText>
        </div>

        <EmailText>
          <strong>What happens with auto-renewal?</strong>
        </EmailText>
        <EmailText>
          • Your domain will be automatically renewed before expiration
        </EmailText>
        <EmailText>
          • Payment will be processed using your saved payment method
        </EmailText>
        <EmailText>
          • You'll receive a confirmation email after successful renewal
        </EmailText>
        <EmailText>
          • No action is required on your part
        </EmailText>

        <EmailText>
          <strong>Want to make changes?</strong>
        </EmailText>
        <EmailText>
          • Update your payment method if needed
        </EmailText>
        <EmailText>
          • Change renewal period (1, 2, or 3 years)
        </EmailText>
        <EmailText>
          • Disable auto-renewal if you prefer manual renewal
        </EmailText>
        <EmailText>
          • Review your domain settings and DNS configuration
        </EmailText>

        <EmailButton href={settingsLink || 'https://app.nisccloud.com/domains/settings'}>
          Manage Auto-Renewal Settings
        </EmailButton>

        <EmailText>
          <strong>Benefits of Auto-Renewal:</strong>
        </EmailText>
        <EmailText>
          • Never worry about domain expiration
        </EmailText>
        <EmailText>
          • Avoid service interruptions
        </EmailText>
        <EmailText>
          • Save time with automatic processing
        </EmailText>
        <EmailText>
          • Often receive better renewal rates
        </EmailText>

        <EmailText>
          <strong>Payment Information:</strong>
        </EmailText>
        <EmailText>
          • We'll charge {renewalAmount} to {paymentMethod}
        </EmailText>
        <EmailText>
          • Payment will be processed on {renewalDate}
        </EmailText>
        <EmailText>
          • You'll receive a receipt via email
        </EmailText>
        <EmailText>
          • Update payment method anytime before renewal
        </EmailText>

        <EmailText>
          <strong>Questions about Auto-Renewal?</strong> Contact our support team:
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
          Thank you for choosing Nisc Cloud for your domain management needs.
        </EmailText>
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
