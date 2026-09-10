import { Section } from '@react-email/components';
import {
  EmailLayout,
  EmailHeader,
  EmailFooter,
  EmailText,
  EmailSignature,
  EmailDetails,
} from './components';

interface InvoiceDeliveryEmailProps {
  customerName?: string;
  invoiceNumber?: string;
  issueDate?: string;
  dueDate?: string;
  totalAmount?: string;
  currency?: string;
  services?: Array<{
    name: string;
    description?: string;
    quantity?: number;
    price?: string;
  }>;
  supportEmail?: string;
  supportPhone?: string;
}

export const InvoiceDeliveryEmail = ({
  customerName = 'Valued Customer',
  invoiceNumber = 'INV-001',
  issueDate = 'January 1, 2024',
  dueDate = 'January 15, 2024',
  totalAmount = '0.00',
  currency = 'KES',
}: InvoiceDeliveryEmailProps) => {
  const formattedAmount = `${currency} ${totalAmount}`;

  return (
    <EmailLayout preview={`Invoice ${invoiceNumber} from Nisc Cloud®`}>
      <EmailHeader />
      <Section>
        <EmailText>Hello {customerName},</EmailText>
        <EmailText>
          Please find invoice <strong>{invoiceNumber}</strong> from Nisc Cloud® attached as a PDF.
        </EmailText>
        <EmailDetails>
          <EmailText style={{ margin: '8px 0' }}>
            <strong>Invoice number:</strong> {invoiceNumber}
          </EmailText>
          <EmailText style={{ margin: '8px 0' }}>
            <strong>Issue date:</strong> {issueDate}
          </EmailText>
          <EmailText style={{ margin: '8px 0' }}>
            <strong>Due date:</strong> {dueDate}
          </EmailText>
          <EmailText style={{ margin: '8px 0' }}>
            <strong>Amount due:</strong> {formattedAmount}
          </EmailText>
        </EmailDetails>
        <EmailText>
          Payment instructions are included in the attached invoice.
        </EmailText>
        <EmailSignature />
      </Section>
      <EmailFooter />
    </EmailLayout>
  );
};

InvoiceDeliveryEmail.PreviewProps = {
  customerName: 'John Doe',
  invoiceNumber: 'INV-001',
  issueDate: 'January 1, 2024',
  dueDate: 'January 15, 2024',
  totalAmount: '29,999.00',
  currency: 'KES',
  supportEmail: 'billing@nisccloud.com',
  supportPhone: '+254 748 777 666',
} as InvoiceDeliveryEmailProps;

export default InvoiceDeliveryEmail;
