import { Section } from '@react-email/components';
import {
  EmailLayout,
  EmailHeader,
  EmailFooter,
  EmailText,
  EmailLink,
  EmailSignature,
} from './components';

interface InvoiceSuccessEmailProps {
  customerName?: string;
  invoiceNumber?: string;
  orderNumber?: string;
  totalAmount?: string;
  currency?: string;
  supportEmail?: string;
  supportPhone?: string;
  invoiceLink?: string;
}

export const InvoiceSuccessEmail = ({
  customerName = "Valued Customer",
  invoiceNumber = "INV-001",
  orderNumber,
  totalAmount = "0.00",
  currency = "KES",
  supportEmail = "accounts@nisccloud.com",
  supportPhone = "+254 748 777 666",
  invoiceLink,
}: InvoiceSuccessEmailProps) => {
  const formattedAmount = `${currency} ${totalAmount}`;

  return (
    <EmailLayout preview={`Your invoice ${invoiceNumber} from Nisc Cloud Limited`}>
      <EmailHeader />
      <Section>
        <EmailText>Dear {customerName},</EmailText>
        <EmailText>
          Thank you for your order. This is the <strong>invoice</strong> for the service you ordered.
        </EmailText>

        <div
          style={{
            backgroundColor: '#f0fdf4',
            border: '1px solid #86efac',
            borderRadius: '8px',
            padding: '20px',
            margin: '20px 0',
          }}
        >
          <EmailText style={{ margin: '0 0 15px 0', fontWeight: 'bold', fontSize: '16px', color: '#059669' }}>
            Invoice attached
          </EmailText>
          <EmailText style={{ margin: '8px 0' }}>
            <strong>Invoice Number:</strong> {invoiceNumber}
          </EmailText>
          {orderNumber && (
            <EmailText style={{ margin: '8px 0' }}>
              <strong>Order Number:</strong> {orderNumber}
            </EmailText>
          )}
          <EmailText style={{ margin: '8px 0', fontSize: '16px', fontWeight: 'bold', color: '#059669' }}>
            <strong>Total Amount:</strong> {formattedAmount}
          </EmailText>
        </div>

        {invoiceLink && (
          <EmailText>
            You can view the invoice in your dashboard:{' '}
            <EmailLink href={invoiceLink}>View invoice in dashboard</EmailLink>
          </EmailText>
        )}

        <EmailText>
          <strong>Need help?</strong> Contact us at{' '}
          <EmailLink href={`mailto:${supportEmail}`}>{supportEmail}</EmailLink>
          {supportPhone && ` or ${supportPhone}`}.
        </EmailText>
        <EmailText>Thank you for choosing Nisc Cloud Limited.</EmailText>
        <EmailSignature />
      </Section>
      <EmailFooter />
    </EmailLayout>
  );
};

InvoiceSuccessEmail.PreviewProps = {
  customerName: 'John Doe',
  invoiceNumber: 'INV-001',
  orderNumber: 'NISC-00042',
  totalAmount: '29,999.00',
  currency: 'KES',
  supportEmail: 'accounts@nisccloud.com',
  supportPhone: '+254 748 777 666',
  invoiceLink: undefined, // Set at send time from VITE_PUBLIC_APP_URL + /{teamSlug}/invoices
} as InvoiceSuccessEmailProps;

export default InvoiceSuccessEmail;
