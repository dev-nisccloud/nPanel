import { Section } from '@react-email/components';
import {
  EmailLayout,
  EmailHeader,
  EmailFooter,
  EmailText,
  EmailSignature,
  EmailDetails,
} from './components';

interface ServiceRenewalReminderEmailProps {
  recipientName?: string;
  /** Service type e.g. "Domains" or "Web Hosting - Starter" */
  serviceName?: string;
  /** Specific subscription name e.g. domain name "example.com" or primary domain */
  subscriptionName?: string;
  subscriptionDate?: string;
  expiryDate?: string;
  /** e.g. "Your service will be suspended 7 days after the expiry date if not renewed." */
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
}: ServiceRenewalReminderEmailProps) => {
  return (
    <EmailLayout preview={`Renewal reminder: ${subscriptionName || serviceName}`}>
      <EmailHeader />
      <Section>
        <EmailText>
          Hello{recipientName ? ` ${recipientName}` : ''},
        </EmailText>
        <EmailText>
          Your {serviceName.toLowerCase()} subscription is approaching its expiry date. Log in to nPanel to renew.
        </EmailText>
        <EmailDetails>
          <EmailText style={{ margin: '8px 0' }}>
            <strong>Service:</strong> {serviceName}
          </EmailText>
          {subscriptionName && (
            <EmailText style={{ margin: '8px 0' }}>
              <strong>Name:</strong> {subscriptionName}
            </EmailText>
          )}
          <EmailText style={{ margin: '8px 0' }}>
            <strong>Started:</strong> {subscriptionDate}
          </EmailText>
          <EmailText style={{ margin: '8px 0' }}>
            <strong>Expires:</strong> {expiryDate}
          </EmailText>
        </EmailDetails>
        <EmailText>{gracePeriodText}</EmailText>
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
