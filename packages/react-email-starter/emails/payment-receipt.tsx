import { Section } from '@react-email/components';
import {
  EmailLayout,
  EmailHeader,
  EmailFooter,
  EmailText,
  EmailSignature,
  EmailDetails,
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
  customerName = 'Valued Customer',
  receiptNumber = 'N/A',
  transactionDate = 'N/A',
  amount = '0.00',
  currency = 'KES',
  paymentMethod = 'M-Pesa',
}: PaymentReceiptEmailProps) => {
  const formattedAmount = `${currency} ${amount}`;

  return (
    <EmailLayout preview={`Payment receipt ${receiptNumber}`}>
      <EmailHeader />
      <Section>
        <EmailText>Hello {customerName},</EmailText>
        <EmailText>
          We have received your payment of <strong>{formattedAmount}</strong>.
        </EmailText>
        <EmailDetails>
          <EmailText style={{ margin: '8px 0' }}>
            <strong>Receipt number:</strong> {receiptNumber}
          </EmailText>
          <EmailText style={{ margin: '8px 0' }}>
            <strong>Date:</strong> {transactionDate}
          </EmailText>
          <EmailText style={{ margin: '8px 0' }}>
            <strong>Payment method:</strong> {paymentMethod}
          </EmailText>
          <EmailText style={{ margin: '8px 0' }}>
            <strong>Amount paid:</strong> {formattedAmount}
          </EmailText>
        </EmailDetails>
        <EmailText>
          You will receive a separate confirmation once your services are ready.
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
