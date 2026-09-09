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
  invoiceNumber = "INV-2024-001",
  amount = "$299.00",
  dueDate = "January 15, 2024",
  daysOverdue = 15,
  downloadLink,
  paymentLink,
  supportEmail = "billing@nisccloud.com",
  supportPhone = "+254 748 777 666",
  suspensionDate = "February 1, 2024"
}: InvoiceFinalNoticeEmailProps) => {
  return (
    <EmailLayout preview={`FINAL NOTICE - Invoice ${invoiceNumber} - Service Suspension Imminent`}>
      <EmailHeader />
      <Section>
        <EmailText style={{ color: '#dc2626', fontWeight: 'bold', fontSize: '18px' }}>
          FINAL NOTICE - IMMEDIATE ACTION REQUIRED
        </EmailText>
        <EmailText>Dear {userFirstname},</EmailText>
        <EmailText>
          This is your <strong>FINAL NOTICE</strong> regarding outstanding invoice{' '}
          <strong>{invoiceNumber}</strong> for <strong>{amount}</strong>.
        </EmailText>
        <EmailText>
          Invoice Details:
        </EmailText>
        <EmailText>
          • Invoice Number: {invoiceNumber}
        </EmailText>
        <EmailText>
          • Amount Due: {amount}
        </EmailText>
        <EmailText>
          • Due Date: {dueDate}
        </EmailText>
        <EmailText>
          • Days Overdue: <strong style={{ color: '#dc2626' }}>{daysOverdue} days</strong>
        </EmailText>
        <EmailText>
          <strong style={{ color: '#dc2626' }}>
            SERVICE SUSPENSION NOTICE: Your account will be suspended on {suspensionDate} 
            if payment is not received by that date.
          </strong>
        </EmailText>

        <EmailText>
          <strong>REQUIRED ACTIONS:</strong>
        </EmailText>
        <EmailText>
          1. Process payment immediately to prevent service suspension
        </EmailText>
        <EmailText>
          2. Download your invoice for your records
        </EmailText>
        <EmailText>
          3. Contact our billing department if you need payment arrangements
        </EmailText>
        <EmailText>
          4. Update your payment method if there are billing issues
        </EmailText>

        {/* Action Buttons */}
        <div style={{ margin: '30px 0', textAlign: 'center' as const }}>
          <EmailButton 
            href={paymentLink || 'https://app.nisccloud.com/billing'}
            style={{ 
              backgroundColor: '#dc2626',
              color: '#fff',
              textDecoration: 'none',
              textAlign: 'center' as const,
              display: 'block',
              width: '280px',
              padding: '16px 7px',
              margin: '0 auto 15px auto',
              borderRadius: '4px',
              fontFamily: "'Inter', 'Inter Sans Serif', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif",
              fontSize: '16px',
              fontWeight: 'bold',
            }}
          >
            PROCESS PAYMENT NOW
          </EmailButton>
          <EmailButton href={downloadLink || '#'}>
            Download Invoice
          </EmailButton>
        </div>

        <EmailText>
          <strong>Billing Support:</strong> For immediate assistance with payment 
          or to discuss payment arrangements, contact our billing department:
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
          <strong style={{ color: '#dc2626' }}>
            IMPORTANT: Service suspension will result in immediate loss of access to all 
            Nisc Cloud® services. Please process payment immediately to prevent service disruption.
          </strong>
        </EmailText>
        <EmailText>
          We value your business and are committed to helping you maintain uninterrupted service. 
          Please contact us immediately if you have any questions or need assistance with payment.
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
