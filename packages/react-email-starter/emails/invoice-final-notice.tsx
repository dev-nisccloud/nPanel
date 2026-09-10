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

interface InvoiceFinalNoticeEmailProps {
  userFirstname?: string;
  invoiceNumber?: string;
  amount?: string;
  dueDate?: string;
  daysOverdue?: number;
  downloadLink?: string;
  paymentLink?: string;
  supportEmail?: string;
  supportPhone?: string;
  suspensionDate?: string;
}

export const InvoiceFinalNoticeEmail = ({
  userFirstname,
  invoiceNumber = 'INV-2024-001',
  amount = '$299.00',
  dueDate = 'January 15, 2024',
  daysOverdue = 15,
  paymentLink,
  suspensionDate = 'February 1, 2024',
}: InvoiceFinalNoticeEmailProps) => {
  return (
    <EmailLayout preview={`Final notice: invoice ${invoiceNumber} — service suspension on ${suspensionDate}`}>
      <EmailHeader />
      <Section>
        <EmailText>Hello {userFirstname},</EmailText>
        <EmailText>
          This is a final notice for invoice <strong>{invoiceNumber}</strong> of{' '}
          <strong>{amount}</strong>. Your service will be suspended on{' '}
          <strong>{suspensionDate}</strong> if payment is not received by that date.
        </EmailText>
        <EmailDetails>
          <EmailText style={{ margin: '8px 0' }}>
            <strong>Invoice number:</strong> {invoiceNumber}
          </EmailText>
          <EmailText style={{ margin: '8px 0' }}>
            <strong>Amount due:</strong> {amount}
          </EmailText>
          <EmailText style={{ margin: '8px 0' }}>
            <strong>Original due date:</strong> {dueDate}
          </EmailText>
          <EmailText style={{ margin: '8px 0' }}>
            <strong>Days overdue:</strong> {daysOverdue}
          </EmailText>
          <EmailText style={{ margin: '8px 0' }}>
            <strong>Suspension date:</strong> {suspensionDate}
          </EmailText>
        </EmailDetails>
        <EmailButton href={paymentLink || 'https://app.nisccloud.com/billing'}>
          Pay now
        </EmailButton>
        <EmailText>
          If you need a payment arrangement, reply to this email before the suspension date.
        </EmailText>
        <EmailSignature />
      </Section>
      <EmailFooter />
    </EmailLayout>
  );
};

InvoiceFinalNoticeEmail.PreviewProps = {
  userFirstname: 'John Doe',
  invoiceNumber: 'INV-2024-001',
  amount: '$299.00',
  dueDate: 'January 15, 2024',
  daysOverdue: 15,
  downloadLink: 'https://app.nisccloud.com/invoices/INV-2024-001/download',
  paymentLink: 'https://app.nisccloud.com/billing/pay',
  supportEmail: 'billing@nisccloud.com',
  supportPhone: '+254 748 777 666',
  suspensionDate: 'February 1, 2024',
} as InvoiceFinalNoticeEmailProps;

export default InvoiceFinalNoticeEmail;
