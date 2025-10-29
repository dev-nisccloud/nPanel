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
  accountId = "ACC-2024-001",
  suspensionDate = "March 20, 2024",
  suspensionReason = "Payment Overdue",
  serviceName = "Web Hosting",
  planName = "Business Plan",
  domain = "example.com",
  paymentLink,
  supportEmail = "billing@nisccloud.com",
  supportPhone = "+254 748 777 666",
  reactivationFee = "$25.00"
}: ServiceSuspensionEmailProps) => {
  return (
    <EmailLayout preview={`SERVICE SUSPENDED - Account ${accountId}`}>
      <EmailHeader />
      <Section>
        <EmailText style={{ color: '#dc2626', fontWeight: 'bold', fontSize: '18px' }}>
          SERVICE SUSPENSION NOTICE
        </EmailText>
        <EmailText>Dear {userFirstname},</EmailText>
        <EmailText>
          We regret to inform you that your <strong>{serviceName}</strong> service 
          has been suspended as of <strong>{suspensionDate}</strong> due to{' '}
          <strong>{suspensionReason}</strong>.
        </EmailText>
        <EmailText>
          Your account <strong>{accountId}</strong> remains active, but this specific 
          service is currently unavailable.
        </EmailText>
        
        {/* Suspended Service Details */}
        <div style={{
          backgroundColor: '#fef2f2',
          border: '2px solid #dc2626',
          borderRadius: '8px',
          padding: '20px',
          margin: '20px 0',
        }}>
          <EmailText style={{ margin: '0 0 15px 0', fontWeight: 'bold', color: '#dc2626' }}>
            SUSPENDED SERVICE:
          </EmailText>
          <EmailText style={{ margin: '5px 0', fontWeight: 'bold' }}>
            {serviceName} - {planName}
          </EmailText>
          {domain && (
            <EmailText style={{ margin: '2px 0 0 20px', color: '#6b7280' }}>
              Domain: {domain}
            </EmailText>
          )}
          <EmailText style={{ margin: '10px 0 0 0', color: '#dc2626', fontWeight: 'bold' }}>
            Status: SUSPENDED
          </EmailText>
        </div>

        <EmailText>
          <strong>Impact of {serviceName} Suspension:</strong>
        </EmailText>
        {serviceName === "Web Hosting" && (
          <>
            <EmailText>
              • Your website is no longer accessible to visitors
            </EmailText>
            <EmailText>
              • All hosting resources are offline
            </EmailText>
            <EmailText>
              • Database connections are terminated
            </EmailText>
            <EmailText>
              • SSL certificates are no longer active
            </EmailText>
          </>
        )}
        {serviceName === "Email Hosting" && (
          <>
            <EmailText>
              • Email services have been disabled
            </EmailText>
            <EmailText>
              • Email accounts are inaccessible
            </EmailText>
            <EmailText>
              • Email forwarding is suspended
            </EmailText>
            <EmailText>
              • Email storage is temporarily unavailable
            </EmailText>
          </>
        )}

        <EmailText>
          <strong>To Restore Your {serviceName}:</strong>
        </EmailText>
        <EmailText>
          1. Process payment for outstanding invoices
        </EmailText>
        <EmailText>
          2. Pay reactivation fee: {reactivationFee}
        </EmailText>
        <EmailText>
          3. Update payment method if needed
        </EmailText>
        <EmailText>
          4. Contact support for assistance with restoration
        </EmailText>

        {/* Action Button */}
        <div style={{ margin: '30px 0', textAlign: 'center' as const }}>
          <EmailButton href="https://app.nisccloud.com/billing">
            View Billing Details
          </EmailButton>
        </div>

        <EmailText>
          <strong>Reactivation Process:</strong>
        </EmailText>
        <EmailText>
          • Payment processing: 1-2 hours
        </EmailText>
        <EmailText>
          • Service restoration: 2-4 hours
        </EmailText>
        <EmailText>
          • DNS propagation: Up to 24 hours
        </EmailText>
        <EmailText>
          • Full functionality: Within 24 hours
        </EmailText>

        <EmailText>
          <strong>Important Information:</strong>
        </EmailText>
        <EmailText>
          • Your {serviceName} data is preserved during suspension
        </EmailText>
        <EmailText>
          • Backup services remain active for 30 days
        </EmailText>
        <EmailText>
          • Reactivation fee applies to suspended services
        </EmailText>
        <EmailText>
          • Service will be permanently deleted after 60 days
        </EmailText>

        <EmailText>
          <strong>Need Immediate Assistance?</strong> Contact our support team:
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
          <strong style={{ color: '#dc2626' }}>
            URGENT: We strongly recommend immediate action to restore your {serviceName} 
            and prevent permanent data loss.
          </strong>
        </EmailText>
        <EmailText>
          We understand the impact this suspension has on your business and are committed 
          to helping you restore your {serviceName} as quickly as possible.
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
