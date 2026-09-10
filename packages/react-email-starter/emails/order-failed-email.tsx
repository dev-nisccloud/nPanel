import { Section } from '@react-email/components';
import {
  EmailLayout,
  EmailHeader,
  EmailFooter,
  EmailText,
  EmailButton,
  EmailSignature,
  EmailDetails,
  EmailItem,
} from './components';

interface OrderFailedEmailProps {
  customerName?: string;
  orderNumber?: string;
  failedItems?: Array<{ name: string; error?: string }>;
  failureReason?: string;
  retryLink?: string;
}

export const OrderFailedEmail = ({
  orderNumber = 'Nisc-000000-000000-000',
  failedItems = [],
  failureReason,
  retryLink = 'https://app.nisccloud.com/agency/nisc-service-orders',
}: OrderFailedEmailProps) => {
  return (
    <EmailLayout preview={`Order could not be completed: ${orderNumber}`}>
      <EmailHeader />
      <Section>
        <EmailText>Hello,</EmailText>
        <EmailText>
          Order <strong>{orderNumber}</strong> could not be fully processed and needs attention.
        </EmailText>
        <EmailDetails>
          <EmailText style={{ margin: '8px 0' }}>
            <strong>Order number:</strong> {orderNumber}
          </EmailText>
          {failureReason && (
            <EmailText style={{ margin: '8px 0' }}>
              <strong>Reason:</strong> {failureReason}
            </EmailText>
          )}
        </EmailDetails>
        {failedItems.length > 0 && (
          <EmailDetails title="Failed items">
            {failedItems.map((item, index) => (
              <EmailItem key={index} isLast={index === failedItems.length - 1}>
                <EmailText style={{ margin: '0 0 4px 0' }}>
                  <strong>{item.name}</strong>
                </EmailText>
                {item.error && (
                  <EmailText style={{ margin: '4px 0' }}>
                    {item.error}
                  </EmailText>
                )}
              </EmailItem>
            ))}
          </EmailDetails>
        )}
        <EmailButton href={retryLink}>Open Nisc Service Orders</EmailButton>
        <EmailSignature />
      </Section>
      <EmailFooter />
    </EmailLayout>
  );
};

OrderFailedEmail.PreviewProps = {
  customerName: 'Admin',
  orderNumber: 'Nisc-2026-034438-309',
  failedItems: [
    { name: 'heliumcreations.com - Domain transfer', error: 'Transfer auth code invalid' },
    { name: 'example.com - Web Hosting', error: 'Domain is required for hosting' },
  ],
  failureReason: 'One or more items failed during provisioning.',
  retryLink: 'https://app.nisccloud.com/agency/nisc-service-orders',
} as OrderFailedEmailProps;

export default OrderFailedEmail;
