import { Section } from '@react-email/components';
import {
  EmailLayout,
  EmailHeader,
  EmailFooter,
  EmailText,
  EmailButton,
  EmailSignature,
  EmailDetails,
} from './components';

interface InvoiceOverdueEmailProps {
  userFirstname?: string;
  invoiceNumber?: string;
  amount?: string;
  dueDate?: string;
  daysOverdue?: number;
  downloadLink?: string;
  paymentLink?: string;
  supportEmail?: string;
  supportPhone?: string;
}

export const InvoiceOverdueEmail = ({
  userFirstname,
  invoiceNumber = 'INV-2024-001',
  amount = '$299.00',
  dueDate = 'January 15, 2024',
  daysOverdue = 5,
  paymentLink,
}: InvoiceOverdueEmailProps) => {
  return (
    <EmailLayout preview={`Invoice ${invoiceNumber} is ${daysOverdue} days overdue`}>
      <EmailHeader />
      <Section>
        <EmailText>Hello {userFirstname},</EmailText>
        <EmailText>
          Invoice <strong>{invoiceNumber}</strong> for <strong>{amount}</strong> was due on{' '}
          <strong>{dueDate}</strong> and is now <strong>{daysOverdue} days overdue</strong>.
          Please settle this invoice to avoid service interruption.
        </EmailText>
        <EmailDetails>
          <EmailText style={{ margin: '8px 0' }}>
            <strong>Invoice number:</strong> {invoiceNumber}
          </EmailText>
          <EmailText style={{ margin: '8px 0' }}>
            <strong>Amount due:</strong> {amount}
          </EmailText>
          <EmailText style={{ margin: '8px 0' }}>
            <strong>Due date:</strong> {dueDate}
          </EmailText>
          <EmailText style={{ margin: '8px 0' }}>
            <strong>Days overdue:</strong> {daysOverdue}
          </EmailText>
        </EmailDetails>
        <EmailButton href={paymentLink || 'https://app.nisccloud.com/billing'}>
          Pay now
        </EmailButton>
        <EmailText>
          If you have already paid, you can disregard this reminder. Continued non-payment may result in service suspension.
        </EmailText>
        <EmailSignature />
      </Section>
      <EmailFooter />
    </EmailLayout>
  );
};

InvoiceOverdueEmail.PreviewProps = {
  userFirstname: 'John Doe',
  invoiceNumber: 'INV-2024-001',
  amount: '$299.00',
  dueDate: 'January 15, 2024',
  daysOverdue: 5,
  downloadLink: 'https://app.nisccloud.com/invoices/INV-2024-001/download',
  paymentLink: 'https://app.nisccloud.com/billing/pay',
  supportEmail: 'billing@nisccloud.com',
  supportPhone: '+254 748 777 666',
} as InvoiceOverdueEmailProps;

export default InvoiceOverdueEmail;
