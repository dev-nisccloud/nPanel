import { Section } from '@react-email/components';
import {
  EmailLayout,
  EmailHeader,
  EmailFooter,
  EmailText,
  EmailButton,
  EmailSignature,
  EmailDetails,
  EmailItem,
} from './components';

interface OrderConfirmationEmailProps {
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
    status?: string;
  }>;
  supportEmail?: string;
  supportPhone?: string;
  orderLink?: string;
}

export const OrderConfirmationEmail = ({
  customerName = 'Valued Customer',
  orderNumber = 'ORD-001',
  orderDate = 'January 1, 2024',
  totalAmount = '0.00',
  currency = 'KES',
  orderItems = [],
  orderLink,
}: OrderConfirmationEmailProps) => {
  const formattedAmount = `${currency} ${totalAmount}`;

  return (
    <EmailLayout preview={`Order confirmed: ${orderNumber}`}>
      <EmailHeader />
      <Section>
        <EmailText>Hello {customerName},</EmailText>
        <EmailText>
          Your order <strong>{orderNumber}</strong> has been confirmed and the services below have been provisioned on your account.
        </EmailText>
        <EmailDetails>
          <EmailText style={{ margin: '8px 0' }}>
            <strong>Order number:</strong> {orderNumber}
          </EmailText>
          <EmailText style={{ margin: '8px 0' }}>
            <strong>Date:</strong> {orderDate}
          </EmailText>
          <EmailText style={{ margin: '8px 0' }}>
            <strong>Total:</strong> {formattedAmount}
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
        {orderLink && (
          <EmailButton href={orderLink}>View order</EmailButton>
        )}
        <EmailText>
          A detailed invoice will be sent separately. You can manage these services from nPanel.
        </EmailText>
        <EmailSignature />
      </Section>
      <EmailFooter />
    </EmailLayout>
  );
};

OrderConfirmationEmail.PreviewProps = {
  customerName: 'John Doe',
  orderNumber: 'ORD-2024-001',
  orderDate: 'January 15, 2024',
  totalAmount: '29,999.00',
  currency: 'KES',
  orderItems: [
    {
      name: 'Web Hosting Plan - Premium',
      description: 'Premium hosting package with 24/7 support and unlimited bandwidth',
      quantity: 1,
      price: 'KES 15,000.00',
      status: 'PROVISIONED',
    },
    {
      name: 'Domain Registration - example.com',
      description: 'Annual domain registration',
      quantity: 1,
      price: 'KES 2,500.00',
      status: 'PROVISIONED',
    },
    {
      name: 'SSL Certificate - Standard',
      description: 'Standard SSL certificate for secure connections',
      quantity: 1,
      price: 'KES 12,499.00',
      status: 'PROVISIONED',
    },
  ],
  supportEmail: 'support@nisccloud.com',
  supportPhone: '+254 748 777 666',
  orderLink: 'https://app.nisccloud.com/orders/ORD-2024-001',
} as OrderConfirmationEmailProps;

export default OrderConfirmationEmail;
