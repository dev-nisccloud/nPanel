import { Section } from '@react-email/components';
import { 
  EmailLayout, 
  EmailHeader, 
  EmailFooter, 
  EmailText, 
  EmailLink, 
  EmailSignature 
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
  customerName = "Valued Customer",
  orderNumber = "ORD-001",
  orderDate = "January 1, 2024",
  totalAmount = "0.00",
  currency = "KES",
  orderItems = [],
  supportEmail = "support@nisccloud.com",
  supportPhone = "+254 748 777 666"
}: OrderReceivedEmailProps) => {
  const formattedAmount = `${currency} ${totalAmount}`;

  return (
    <EmailLayout preview={`Order Received - ${orderNumber}`}>
      <EmailHeader />
      <Section>
        <EmailText>Dear {customerName},</EmailText>
        <EmailText>
          We have received your order and payment. Here are the details:
        </EmailText>

        {/* Order Details Box */}
        <div style={{
          backgroundColor: '#f8fafc',
          border: '1px solid #e2e8f0',
          borderRadius: '8px',
          padding: '20px',
          margin: '20px 0',
        }}>
          <EmailText style={{ margin: '0 0 15px 0', fontWeight: 'bold', fontSize: '16px' }}>
            Order Information:
          </EmailText>
          <EmailText style={{ margin: '8px 0' }}>
            <strong>Order Number:</strong> {orderNumber}
          </EmailText>
          <EmailText style={{ margin: '8px 0' }}>
            <strong>Order Date &amp; Time:</strong> {orderDate}
          </EmailText>
          <EmailText style={{ margin: '8px 0', fontSize: '18px', fontWeight: 'bold', color: '#059669' }}>
            <strong>Total Amount (incl. VAT):</strong> {formattedAmount}
          </EmailText>
        </div>

        {/* Order Items List */}
        {orderItems.length > 0 && (
          <div style={{
            backgroundColor: '#ffffff',
            border: '1px solid #e2e8f0',
            borderRadius: '8px',
            padding: '20px',
            margin: '20px 0',
          }}>
            <EmailText style={{ margin: '0 0 15px 0', fontWeight: 'bold' }}>
              Order Items:
            </EmailText>
            {orderItems.map((item, index) => (
              <div
                key={index}
                style={{
                  marginBottom: '12px',
                  paddingBottom: '12px',
                  borderBottom: index < orderItems.length - 1 ? '1px solid #e2e8f0' : 'none'
                }}
              >
                <EmailText style={{ margin: '0 0 4px 0', fontWeight: 600 }}>
                  {item.name}
                </EmailText>
                {item.description && (
                  <EmailText style={{ margin: '4px 0', color: '#64748b', fontSize: '14px' }}>
                    {item.description}
                  </EmailText>
                )}
                {(item.quantity || item.price) && (
                  <EmailText style={{ margin: '4px 0', fontSize: '14px', color: '#64748b' }}>
                    {item.quantity && `Qty: ${item.quantity}`}
                    {item.quantity && item.price && ' • '}
                    {item.price && `Price: ${item.price}`}
                  </EmailText>
                )}
              </div>
            ))}
          </div>
        )}

        <EmailText>
          You will receive another email once your order has been fully processed and your services have been provisioned.
        </EmailText>

        <EmailText>
          <strong>Need Help?</strong> Our support team is here to assist you:
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
          Thank you for choosing <strong>Nisc Cloud®</strong>. We appreciate your business!
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

