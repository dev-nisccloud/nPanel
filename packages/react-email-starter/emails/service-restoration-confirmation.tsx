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
  accountId = "ACC-2024-001",
  restorationDate = "March 20, 2024",
  serviceName = "Web Hosting",
  planName = "Business Plan",
  domain = "example.com",
  accountLink,
  supportEmail = "support@nisccloud.com",
  supportPhone = "+254 748 777 666",
  nextBillingDate = "April 20, 2024"
}: ServiceRestorationConfirmationEmailProps) => {
  return (
    <EmailLayout preview={`Services Restored - Account ${accountId}`}>
      <EmailHeader />
      <Section>
        <EmailText style={{ color: '#16a34a', fontWeight: 'bold', fontSize: '18px' }}>
          SERVICES SUCCESSFULLY RESTORED
        </EmailText>
        <EmailText>Dear {userFirstname},</EmailText>
        <EmailText>
          Great news! Your <strong>{serviceName}</strong> service has been successfully 
          restored as of <strong>{restorationDate}</strong>.
        </EmailText>
        <EmailText>
          Your account <strong>{accountId}</strong> remains active and this 
          service is now fully operational.
        </EmailText>
        
        {/* Restored Service Details */}
        <div style={{
          backgroundColor: '#f0fdf4',
          border: '2px solid #22c55e',
          borderRadius: '8px',
          padding: '20px',
          margin: '20px 0',
        }}>
          <EmailText style={{ margin: '0 0 15px 0', fontWeight: 'bold', color: '#16a34a' }}>
            RESTORED SERVICE:
          </EmailText>
          <EmailText style={{ margin: '5px 0', fontWeight: 'bold' }}>
            {serviceName} - {planName}
          </EmailText>
          {domain && (
            <EmailText style={{ margin: '2px 0 0 20px', color: '#6b7280' }}>
              Domain: {domain}
            </EmailText>
          )}
          <EmailText style={{ margin: '10px 0 0 0', color: '#16a34a', fontWeight: 'bold' }}>
            Status: ACTIVE
          </EmailText>
        </div>

        <EmailText>
          <strong>What's Now Available with {serviceName}:</strong>
        </EmailText>
        {serviceName === "Web Hosting" && (
          <>
            <EmailText>
              • Your website is accessible to visitors
            </EmailText>
            <EmailText>
              • All hosting resources are online
            </EmailText>
            <EmailText>
              • Database connections are active
            </EmailText>
            <EmailText>
              • SSL certificates are renewed and active
            </EmailText>
          </>
        )}
        {serviceName === "Email Hosting" && (
          <>
            <EmailText>
              • Email services are fully functional
            </EmailText>
            <EmailText>
              • Email accounts are accessible
            </EmailText>
            <EmailText>
              • Email forwarding is active
            </EmailText>
            <EmailText>
              • Email storage is fully available
            </EmailText>
          </>
        )}

        <EmailText>
          <strong>Next Steps:</strong>
        </EmailText>
        {serviceName === "Web Hosting" && (
          <>
            <EmailText>
              1. Test your website functionality
            </EmailText>
            <EmailText>
              2. Update any DNS settings if needed
            </EmailText>
            <EmailText>
              3. Verify SSL certificate is working
            </EmailText>
            <EmailText>
              4. Check database connections
            </EmailText>
          </>
        )}
        {serviceName === "Email Hosting" && (
          <>
            <EmailText>
              1. Test your email functionality
            </EmailText>
            <EmailText>
              2. Verify email accounts are working
            </EmailText>
            <EmailText>
              3. Check email forwarding settings
            </EmailText>
            <EmailText>
              4. Test email storage access
            </EmailText>
          </>
        )}
        <EmailText>
          5. Review your account settings and billing information
        </EmailText>
        <EmailText>
          6. Consider enabling auto-renewal to prevent future suspensions
        </EmailText>

        <EmailButton href={accountLink || 'https://app.nisccloud.com/dashboard'}>
          Access Your Account
        </EmailButton>

        <EmailText>
          <strong>Important Reminders:</strong>
        </EmailText>
        <EmailText>
          • Next billing date: {nextBillingDate}
        </EmailText>
        <EmailText>
          • Keep your payment method up to date
        </EmailText>
        <EmailText>
          • Monitor your account for any issues
        </EmailText>
        <EmailText>
          • Contact support if you need assistance
        </EmailText>

        <EmailText>
          <strong>Prevent Future Suspensions:</strong>
        </EmailText>
        <EmailText>
          • Enable auto-renewal for all services
        </EmailText>
        <EmailText>
          • Set up payment notifications
        </EmailText>
        <EmailText>
          • Monitor your account regularly
        </EmailText>
        <EmailText>
          • Keep contact information current
        </EmailText>

        <EmailText>
          <strong>Need Assistance?</strong> Our support team is here to help:
        </EmailText>
        <EmailText>
          • Email: <EmailLink href={`mailto:${supportEmail}`}>
            {supportEmail}
          </EmailLink>
        </EmailText>
        <EmailText>
          • Phone: <EmailLink href={`tel:${supportPhone}`}>
            {supportPhone}
          </EmailLink>
        </EmailText>
        <EmailText>
          • Live Chat: Available 24/7 in your account dashboard
        </EmailText>

        <EmailText>
          Thank you for choosing Nisc Cloud®. We appreciate your business and are 
          committed to providing reliable cloud services for your needs.
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
