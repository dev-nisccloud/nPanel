import { Section } from '@react-email/components';
import {
  EmailLayout,
  EmailHeader,
  EmailFooter,
  EmailText,
  EmailSignature,
} from './components';

interface ServiceRenewalReminderEmailProps {
  recipientName?: string;
  /** Service type e.g. "Domains" or "Web Hosting - Starter" */
  serviceName?: string;
  /** Specific subscription name e.g. domain name "example.com" or primary domain */
  subscriptionName?: string;
  subscriptionDate?: string;
  expiryDate?: string;
  /** e.g. "Your service will be suspended 7 days after the expiry date if not renewed." or "For domain services, suspension is immediate after expiry." */
  gracePeriodText?: string;
  supportEmail?: string;
  supportPhone?: string;
}

export const ServiceRenewalReminderEmail = ({
  recipientName,
  serviceName = 'Service',
  subscriptionName,
  subscriptionDate = ' ',
  expiryDate = ' ',
  gracePeriodText = 'Your service will be suspended 7 days after the expiry date if not renewed.',
  supportEmail = 'support@nisccloud.com',
  supportPhone = '+254 748 777 666',
}: ServiceRenewalReminderEmailProps) => {
  return (
    <EmailLayout preview={`Renewal reminder: ${subscriptionName || serviceName}`}>
      <EmailHeader />
      <Section>
        <EmailText>
          Hello{recipientName ? ` ${recipientName}` : ''},
        </EmailText>
        <EmailText>
          This is a reminder that your subscription is approaching or has reached its expiry date.
        </EmailText>

        {/* Service details box - same style as domain-expiration-reminder */}
        <div style={{
          backgroundColor: '#f8fafc',
          border: '1px solid #e2e8f0',
          borderRadius: '8px',
          padding: '20px',
          margin: '20px 0',
        }}>
          <EmailText style={{ margin: '0 0 10px 0', fontWeight: 'bold' }}>
            Subscription details
          </EmailText>
          <EmailText style={{ margin: '5px 0' }}>
            Service: {serviceName}
          </EmailText>
          {subscriptionName && (
            <EmailText style={{ margin: '5px 0' }}>
              Name: {subscriptionName}
            </EmailText>
          )}
          <EmailText style={{ margin: '5px 0' }}>
            Subscription date: {subscriptionDate}
          </EmailText>
          <EmailText style={{ margin: '5px 0' }}>
            Expiry date: {expiryDate}
          </EmailText>
        </div>

        <EmailText>
          {gracePeriodText}
        </EmailText>
        <EmailText>
          To renew your service, please log in to the panel.
        </EmailText>

        <EmailText>
          <strong>Need help?</strong> Contact us:
        </EmailText>
        <EmailText>
          • Email: <a href={`mailto:${supportEmail}`} style={{ color: '#38b6ff' }}>{supportEmail}</a>
        </EmailText>
        <EmailText>
          • Phone: <a href={`tel:${supportPhone}`} style={{ color: '#38b6ff' }}>{supportPhone}</a>
        </EmailText>

        <EmailSignature />
      </Section>
      <EmailFooter />
    </EmailLayout>
  );
};

ServiceRenewalReminderEmail.PreviewProps = {
  recipientName: 'Customer',
  serviceName: 'Domains',
  subscriptionName: 'example.com',
  subscriptionDate: '15 Jan 2024',
  expiryDate: '15 Jan 2025',
  gracePeriodText: 'For domain services, suspension is immediate after expiry.',
} as ServiceRenewalReminderEmailProps;

export default ServiceRenewalReminderEmail;
