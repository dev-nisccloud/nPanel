import { Section } from '@react-email/components';
import { 
  EmailLayout, 
  EmailHeader, 
  EmailFooter, 
  EmailText, 
  EmailButton, 
  EmailLink, 
  EmailSignature 
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
  invoiceNumber = "INV-2024-001",
  amount = "$299.00",
  dueDate = "January 15, 2024",
  daysOverdue = 5,
  downloadLink,
  paymentLink,
  supportEmail = "billing@nisccloud.com",
  supportPhone = "+254 748 777 666"
}: InvoiceOverdueEmailProps) => {
  return (
    <EmailLayout preview={`Invoice ${invoiceNumber} is ${daysOverdue} days overdue`}>
      <EmailHeader />
      <Section>
        <EmailText>Hello {userFirstname},</EmailText>
        <EmailText>
          This is a friendly reminder that your invoice <strong>{invoiceNumber}</strong> 
          for <strong>{amount}</strong> was due on <strong>{dueDate}</strong> and is now{' '}
          <strong style={{ color: '#dc2626' }}>{daysOverdue} days overdue</strong>.
        </EmailText>
        <EmailText>
          To avoid any service interruptions, please process your payment as soon as possible.
        </EmailText>
        
        {/* Invoice Details Box */}
        <div style={{
          backgroundColor: '#f8fafc',
          border: '1px solid #e2e8f0',
          borderRadius: '8px',
          padding: '20px',
          margin: '20px 0',
        }}>
          <EmailText style={{ margin: '0 0 10px 0', fontWeight: 'bold' }}>
            Invoice Details:
          </EmailText>
          <EmailText style={{ margin: '5px 0' }}>
            Invoice Number: {invoiceNumber}
          </EmailText>
          <EmailText style={{ margin: '5px 0' }}>
            Amount Due: {amount}
          </EmailText>
          <EmailText style={{ margin: '5px 0' }}>
            Due Date: {dueDate}
          </EmailText>
          <EmailText style={{ margin: '5px 0', color: '#dc2626', fontWeight: 'bold' }}>
            Days Overdue: {daysOverdue}
          </EmailText>
        </div>

        <EmailText>
          <strong>What you can do:</strong>
        </EmailText>
        <EmailText>
          • Download your invoice for your records
        </EmailText>
        <EmailText>
          • Log in to your account to view payment options
        </EmailText>
        <EmailText>
          • Contact our billing team if you have any questions
        </EmailText>

        {/* Action Buttons */}
        <div style={{ margin: '30px 0', textAlign: 'center' as const }}>
          <EmailButton href={downloadLink || '#'}>
            Download Invoice
          </EmailButton>
          <div style={{ margin: '15px 0' }} />
          <EmailButton 
            href={paymentLink || 'https://app.nisccloud.com/billing'}
            style={{ 
              backgroundColor: '#059669',
              color: '#fff',
              textDecoration: 'none',
              textAlign: 'center' as const,
              display: 'block',
              width: '210px',
              padding: '14px 7px',
              margin: '0 auto',
              borderRadius: '4px',
              fontFamily: "'Inter', 'Inter Sans Serif', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif",
              fontSize: '15px',
              fontWeight: 'bold',
            }}
          >
            Pay Now
          </EmailButton>
        </div>

        <EmailText>
          <strong>Need Help?</strong> If you're experiencing any issues with payment or 
          have questions about this invoice, please don't hesitate to contact us:
        </EmailText>
        <EmailText>
          • Email us at{' '}
          <EmailLink href={`mailto:${supportEmail}`}>
            {supportEmail}
          </EmailLink>
        </EmailText>
        <EmailText>
          • Call our billing team at{' '}
          <EmailLink href={`tel:${supportPhone}`}>
            {supportPhone}
          </EmailLink>
        </EmailText>
        <EmailText>
          We're here to help and can work with you to resolve any payment concerns.
        </EmailText>
        <EmailText>
          <strong>Important:</strong> Continued non-payment may result in service suspension. 
          Please contact us immediately if you need to discuss payment arrangements.
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
