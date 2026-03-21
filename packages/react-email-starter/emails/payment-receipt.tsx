import { Section } from '@react-email/components';
import { 
  EmailLayout, 
  EmailHeader, 
  EmailFooter, 
  EmailText, 
  EmailLink, 
  EmailSignature 
} from './components';

interface PaymentReceiptEmailProps {
  customerName?: string;
  receiptNumber?: string;
  transactionDate?: string;
  amount?: string;
  currency?: string;
  paymentMethod?: string;
  supportEmail?: string;
  supportPhone?: string;
}

export const PaymentReceiptEmail = ({
  customerName = "Valued Customer",
  receiptNumber = "N/A",
  transactionDate = "N/A",
  amount = "0.00",
  currency = "KES",
  paymentMethod = "M-Pesa",
  supportEmail = "support@nisccloud.com",
  supportPhone = "+254 748 777 666",
}: PaymentReceiptEmailProps) => {
  const formattedAmount = `${currency} ${amount}`;
  const mailtoLink = `mailto:${supportEmail}`;
  const telLink = `tel:${supportPhone}`;

  return (
    <EmailLayout preview={`Payment Receipt - ${receiptNumber}`}>
      <EmailHeader />
      <Section>
        <EmailText>Dear {customerName},</EmailText>
        <EmailText>
          This email confirms that we have successfully received your payment.
        </EmailText>
        
        {/* Payment Confirmation Box */}
        <div style={{
          backgroundColor: '#f0fdf4',
          border: '1px solid #86efac',
          borderRadius: '8px',
          padding: '20px',
          margin: '20px 0',
        }}>
          <EmailText style={{ margin: '0 0 15px 0', fontWeight: 'bold', fontSize: '18px', color: '#059669' }}>
            Payment Received
          </EmailText>
          <EmailText style={{ margin: '8px 0', color: '#166534' }}>
            Your payment has been successfully processed and recorded in our system.
          </EmailText>
        </div>

        {/* Payment Details Box */}
        <div style={{
          backgroundColor: '#f8fafc',
          border: '1px solid #e2e8f0',
          borderRadius: '8px',
          padding: '20px',
          margin: '20px 0',
        }}>
          <EmailText style={{ margin: '0 0 15px 0', fontWeight: 'bold', fontSize: '16px' }}>
            Payment Information:
          </EmailText>
          <EmailText style={{ margin: '8px 0' }}>
            <strong>Receipt Number:</strong> {receiptNumber}
          </EmailText>
          <EmailText style={{ margin: '8px 0' }}>
            <strong>Transaction Date:</strong> {transactionDate}
          </EmailText>
          <EmailText style={{ margin: '8px 0' }}>
            <strong>Payment Method:</strong> {paymentMethod}
          </EmailText>
          <EmailText style={{ margin: '8px 0', fontSize: '18px', fontWeight: 'bold', color: '#059669' }}>
            <strong>Amount Paid:</strong> {formattedAmount}
          </EmailText>
        </div>

        <EmailText>
          <strong>What's Next?</strong>
        </EmailText>
        <EmailText>
          Your order is being processed and services will be activated shortly. You will receive a separate confirmation email once your services are ready.
        </EmailText>
        <EmailText>
          <strong>Need Help?</strong> Our support team is here to assist you:
        </EmailText>
        <EmailText>
          Email: <EmailLink href={mailtoLink}>
            {supportEmail}
          </EmailLink>
        </EmailText>
        <EmailText>
          Phone: <EmailLink href={telLink}>
            {supportPhone}
          </EmailLink>
        </EmailText>
        <EmailText>
          Thank you for choosing <strong>Nisc Cloud Limited</strong>. We appreciate your business!
        </EmailText>
        <EmailSignature />
      </Section>
      <EmailFooter />
    </EmailLayout>
  );
};

PaymentReceiptEmail.PreviewProps = {
  customerName: 'John Doe',
  receiptNumber: 'UADNX3OCC7',
  transactionDate: 'January 13, 2025 at 08:00 AM',
  amount: '1,000.00',
  currency: 'KES',
  paymentMethod: 'M-Pesa',
  supportEmail: 'support@nisccloud.com',
  supportPhone: '+254 748 777 666',
} as PaymentReceiptEmailProps;

export default PaymentReceiptEmail;
