import { Section } from '@react-email/components';
import {
  EmailLayout,
  EmailHeader,
  EmailFooter,
  EmailText,
  EmailSignature,
  EmailDetails,
  EmailItem,
} from './components';

interface OrderReceivedEmailProps {
  customerName?: string;
  orderNumber?: string;
  orderDate?: string;
  totalAmount?: string;
  currency?: string;
  orderItems?: Array<{
    name: string;
    description?: string;
    quantity?: number;
    price?: string;
  }>;
  supportEmail?: string;
  supportPhone?: string;
}

export const OrderReceivedEmail = ({
  customerName = 'Valued Customer',
  orderNumber = 'ORD-001',
  orderDate = 'January 1, 2024',
  totalAmount = '0.00',
  currency = 'KES',
  orderItems = [],
}: OrderReceivedEmailProps) => {
  const formattedAmount = `${currency} ${totalAmount}`;

  return (
    <EmailLayout preview={`Order received: ${orderNumber}`}>
      <EmailHeader />
      <Section>
        <EmailText>Hello {customerName},</EmailText>
        <EmailText>
          We have received your order and payment. Your services will be provisioned shortly.
        </EmailText>
        <EmailDetails>
          <EmailText style={{ margin: '8px 0' }}>
            <strong>Order number:</strong> {orderNumber}
          </EmailText>
          <EmailText style={{ margin: '8px 0' }}>
            <strong>Date:</strong> {orderDate}
          </EmailText>
          <EmailText style={{ margin: '8px 0' }}>
            <strong>Total (incl. VAT):</strong> {formattedAmount}
          </EmailText>
        </EmailDetails>
        {orderItems.length > 0 && (
          <EmailDetails title="Items">
            {orderItems.map((item, index) => (
              <EmailItem key={index} isLast={index === orderItems.length - 1}>
                <EmailText style={{ margin: '0 0 4px 0' }}>
                  <strong>{item.name}</strong>
                </EmailText>
                {item.description && (
                  <EmailText style={{ margin: '4px 0' }}>
                    {item.description}
                  </EmailText>
                )}
                {(item.quantity || item.price) && (
                  <EmailText style={{ margin: '4px 0' }}>
                    {item.quantity && `Qty: ${item.quantity}`}
                    {item.quantity && item.price && ' · '}
                    {item.price}
                  </EmailText>
                )}
              </EmailItem>
            ))}
          </EmailDetails>
        )}
        <EmailText>
          You will receive another email once your services are ready.
        </EmailText>
        <EmailSignature />
      </Section>
      <EmailFooter />
    </EmailLayout>
  );
};

OrderReceivedEmail.PreviewProps = {
  customerName: 'Finey Otieno Akwoyo',
  orderNumber: 'Nisc-2026-034438-309',
  orderDate: '2026-02-25 10:30 AM',
  totalAmount: '2,194.02',
  currency: 'KES',
  orderItems: [
    {
      name: '(heliumcreations.com) Domain - Transfer',
      description: 'Subscription: 21 May 2026 – 21 May 2027 (1 year)',
      quantity: 1,
      price: 'KES 2,544.06',
    },
  ],
  supportEmail: 'support@nisccloud.com',
  supportPhone: '+254 748 777 666',
} as OrderReceivedEmailProps;

export default OrderReceivedEmail;
