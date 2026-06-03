import { Section } from '@react-email/components';
import {
  EmailLayout,
  EmailHeader,
  EmailFooter,
  EmailText,
  EmailLink,
  EmailSignature
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
  customerName = "Valued Customer",
  invoiceNumber = "INV-001",
  issueDate = "January 1, 2024",
  dueDate = "January 15, 2024",
  totalAmount = "0.00",
  currency = "KES",
  supportEmail = "billing@nisccloud.com",
  supportPhone = "+254 748 777 666"
}: InvoiceDeliveryEmailProps) => {
  const formattedAmount = `${currency} ${totalAmount}`;

  return (
    <EmailLayout preview={`Invoice ${invoiceNumber} from Nisc Cloud®`}>
      <EmailHeader />
      <Section>
        <EmailText>Dear {customerName},</EmailText>
        <EmailText>
          You have received an invoice from <strong>Nisc Cloud®</strong> for the services provided.
        </EmailText>

        {/* Invoice Details Box */}
        <div style={{
          backgroundColor: '#f8fafc',
          border: '1px solid #e2e8f0',
          borderRadius: '8px',
          padding: '20px',
          margin: '20px 0',
        }}>
          <EmailText style={{ margin: '0 0 15px 0', fontWeight: 'bold', fontSize: '16px' }}>
            Invoice Information:
          </EmailText>
          <EmailText style={{ margin: '8px 0' }}>
            <strong>Invoice Number:</strong> {invoiceNumber}
          </EmailText>
          <EmailText style={{ margin: '8px 0' }}>
            <strong>Issue Date:</strong> {issueDate}
          </EmailText>
          <EmailText style={{ margin: '8px 0' }}>
            <strong>Due Date:</strong> {dueDate}
          </EmailText>
          <EmailText style={{ margin: '8px 0', fontSize: '18px', fontWeight: 'bold', color: '#059669' }}>
            <strong>Total Amount:</strong> {formattedAmount}
          </EmailText>
        </div>

        <EmailText>
          <strong>Invoice Attachment:</strong> Please find your detailed invoice attached to this email as a PDF document.
          You can download and save it for your records.
        </EmailText>

        <EmailText>
          <strong>Payment Instructions:</strong> Please review the payment details included in the attached invoice.
          If you have any questions about this invoice or need assistance with payment, please don't hesitate to contact us.
        </EmailText>

        <EmailText>
          <strong>Need Help?</strong> Our billing team is here to assist you:
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
          Thank you for choosing Nisc Cloud®. We appreciate your business.
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



