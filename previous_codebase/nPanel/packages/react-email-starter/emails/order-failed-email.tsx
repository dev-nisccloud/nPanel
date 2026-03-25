import { Section } from '@react-email/components';
import {
  EmailLayout,
  EmailHeader,
  EmailFooter,
  EmailText,
  EmailButton,
  EmailSignature,
} from './components';

interface OrderFailedEmailProps {
  customerName?: string;
  orderNumber?: string;
  failedItems?: Array<{ name: string; error?: string }>;
  failureReason?: string;
  retryLink?: string;
  supportEmail?: string;
  supportPhone?: string;
}

export const OrderFailedEmail = ({
  customerName = "Admin",
  orderNumber = "NISC-000000-000000-000",
  failedItems = [],
  failureReason,
  retryLink = "https://app.nisccloud.com/agency/nisc-service-orders",
  supportEmail = "support@nisccloud.com",
  supportPhone = "+254 748 777 666",
}: OrderFailedEmailProps) => {
  return (
    <EmailLayout preview={`[NISC Admin] Order could not be completed: ${orderNumber}`}>
      <EmailHeader />
      <Section>
        <EmailText>Hi {customerName},</EmailText>
        <EmailText>
          A NISC service order could not be fully processed and requires attention.
        </EmailText>

        {/* Failure status box */}
        <div
          style={{
            backgroundColor: '#fef2f2',
            border: '1px solid #fecaca',
            borderRadius: '8px',
            padding: '20px',
            margin: '20px 0',
          }}
        >
          <EmailText
            style={{
              margin: '0 0 15px 0',
              fontWeight: 'bold',
              fontSize: '18px',
              color: '#b91c1c',
            }}
          >
            Order could not be completed
          </EmailText>
          <EmailText style={{ margin: '8px 0', color: '#991b1b' }}>
            One or more items failed during provisioning. Review the details below and retry from the NISC Service Orders page if needed.
          </EmailText>
        </div>

        {/* Order & reason */}
        <div
          style={{
            backgroundColor: '#f8fafc',
            border: '1px solid #e2e8f0',
            borderRadius: '8px',
            padding: '20px',
            margin: '20px 0',
          }}
        >
          <EmailText style={{ margin: '0 0 15px 0', fontWeight: 'bold', fontSize: '16px' }}>
            Order information
          </EmailText>
          <EmailText style={{ margin: '8px 0' }}>
            <strong>Order number:</strong> {orderNumber}
          </EmailText>
          {failureReason && (
            <EmailText style={{ margin: '8px 0', color: '#b91c1c', fontWeight: '600' }}>
              <strong>Reason:</strong> {failureReason}
            </EmailText>
          )}
        </div>

        {/* Failed items */}
        {failedItems.length > 0 && (
          <div
            style={{
              backgroundColor: '#ffffff',
              border: '1px solid #e2e8f0',
              borderRadius: '8px',
              padding: '20px',
              margin: '20px 0',
            }}
          >
            <EmailText style={{ margin: '0 0 15px 0', fontWeight: 'bold' }}>
              Failed items
            </EmailText>
            {failedItems.map((item, index) => (
              <div
                key={index}
                style={{
                  marginBottom: '12px',
                  paddingBottom: '12px',
                  borderBottom:
                    index < failedItems.length - 1 ? '1px solid #e2e8f0' : 'none',
                }}
              >
                <EmailText style={{ margin: '0 0 4px 0', fontWeight: 600 }}>
                  {item.name}
                </EmailText>
                {item.error && (
                  <EmailText style={{ margin: '4px 0', color: '#b91c1c', fontSize: '14px' }}>
                    {item.error}
                  </EmailText>
                )}
              </div>
            ))}
          </div>
        )}

        <EmailText>
          You can retry failed items from the NISC Service Orders page.
        </EmailText>

        <EmailButton href={retryLink}>Open NISC Service Orders</EmailButton>

        <EmailText>
          <strong>Need help?</strong> Contact support: {supportEmail} / {supportPhone}
        </EmailText>
        <EmailSignature />
      </Section>
      <EmailFooter />
    </EmailLayout>
  );
};

OrderFailedEmail.PreviewProps = {
  customerName: 'Admin',
  orderNumber: 'NISC-2026-034438-309',
  failedItems: [
    { name: 'heliumcreations.com - Domain transfer', error: 'Transfer auth code invalid' },
    { name: 'example.com - Web Hosting', error: 'Domain is required for hosting' },
  ],
  failureReason: 'One or more items failed during provisioning.',
  retryLink: 'https://app.nisccloud.com/agency/nisc-service-orders',
  supportEmail: 'support@nisccloud.com',
  supportPhone: '+254 748 777 666',
} as OrderFailedEmailProps;

export default OrderFailedEmail;
