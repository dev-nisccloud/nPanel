import { Section } from '@react-email/components';
import {
  EmailLayout,
  EmailHeader,
  EmailFooter,
  EmailText,
  EmailLink,
  EmailSignature,
  EmailDetails,
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
  customerName = 'Valued Customer',
  invoiceNumber = 'INV-001',
  orderNumber,
  totalAmount = '0.00',
  currency = 'KES',
  invoiceLink,
}: InvoiceSuccessEmailProps) => {
  const formattedAmount = `${currency} ${totalAmount}`;

  return (
    <EmailLayout preview={`Invoice ${invoiceNumber} from Nisc Cloud®`}>
      <EmailHeader />
      <Section>
        <EmailText>Hello {customerName},</EmailText>
        <EmailText>
          Thank you for your order. Your invoice is attached to this email.
        </EmailText>
        <EmailDetails>
          <EmailText style={{ margin: '8px 0' }}>
            <strong>Invoice number:</strong> {invoiceNumber}
          </EmailText>
          {orderNumber && (
            <EmailText style={{ margin: '8px 0' }}>
              <strong>Order number:</strong> {orderNumber}
            </EmailText>
          )}
          <EmailText style={{ margin: '8px 0' }}>
            <strong>Amount:</strong> {formattedAmount}
          </EmailText>
        </EmailDetails>
        {invoiceLink && (
          <EmailText>
            You can also view it in nPanel:{' '}
            <EmailLink href={invoiceLink}>Open invoice</EmailLink>
          </EmailText>
        )}
        <EmailSignature />
      </Section>
      <EmailFooter />
    </EmailLayout>
  );
};

InvoiceSuccessEmail.PreviewProps = {
  customerName: 'John Doe',
  invoiceNumber: 'INV-001',
  orderNumber: 'Nisc-00042',
  totalAmount: '29,999.00',
  currency: 'KES',
  supportEmail: 'accounts@nisccloud.com',
  supportPhone: '+254 748 777 666',
  invoiceLink: undefined,
} as InvoiceSuccessEmailProps;

export default InvoiceSuccessEmail;
