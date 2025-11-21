import { Section } from '@react-email/components';
import { 
  EmailLayout, 
  EmailHeader, 
  EmailFooter, 
  EmailText, 
  EmailLink, 
  EmailSignature 
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
  customerName = "Valued Customer",
  orderNumber = "ORD-001",
  orderDate = "January 1, 2024",
  totalAmount = "0.00",
  currency = "KES",
  orderItems = [],
  supportEmail = "support@nisccloud.com",
  supportPhone = "+254 748 777 666",
  orderLink = "#"
}: OrderConfirmationEmailProps) => {
  const formattedAmount = `${currency} ${totalAmount}`;

  return (
    <EmailLayout preview={`Order Confirmation - ${orderNumber}`}>
      <EmailHeader />
      <Section>
        <EmailText>Dear {customerName},</EmailText>
        <EmailText>
          Thank you for your order! We're pleased to confirm that we have <strong>successfully received and allocated</strong> your order.
        </EmailText>
        
        {/* Order Confirmation Box */}
        <div style={{
          backgroundColor: '#f0fdf4',
          border: '1px solid #86efac',
          borderRadius: '8px',
          padding: '20px',
          margin: '20px 0',
        }}>
          <EmailText style={{ margin: '0 0 15px 0', fontWeight: 'bold', fontSize: '18px', color: '#059669' }}>
            ✓ Order Confirmed & Allocated
          </EmailText>
          <EmailText style={{ margin: '8px 0', color: '#166534' }}>
            Your order has been successfully processed and all services have been allocated to your account.
          </EmailText>
        </div>

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
            <strong>Order Date:</strong> {orderDate}
          </EmailText>
          <EmailText style={{ margin: '8px 0', fontSize: '18px', fontWeight: 'bold', color: '#059669' }}>
            <strong>Total Amount:</strong> {formattedAmount}
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
              <div key={index} style={{ marginBottom: '12px', paddingBottom: '12px', borderBottom: index < orderItems.length - 1 ? '1px solid #e2e8f0' : 'none' }}>
                <EmailText style={{ margin: '0 0 4px 0', fontWeight: '600' }}>
                  {item.name}
                </EmailText>
                {item.description && (
                  <EmailText style={{ margin: '4px 0', color: '#64748b', fontSize: '14px' }}>
                    {item.description}
                  </EmailText>
                )}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '8px' }}>
                  {(item.quantity || item.price) && (
                    <EmailText style={{ margin: '4px 0', fontSize: '14px', color: '#64748b' }}>
                      {item.quantity && `Qty: ${item.quantity}`}
                      {item.quantity && item.price && ' • '}
                      {item.price && `Price: ${item.price}`}
                    </EmailText>
                  )}
                  {/* {item.status && (
                    <EmailText style={{ 
                      margin: '4px 0', 
                      fontSize: '12px', 
                      fontWeight: '600',
                      color: item.status === 'PROVISIONED' ? '#059669' : item.status === 'PROVISIONING' ? '#f59e0b' : '#64748b',
                      backgroundColor: item.status === 'PROVISIONED' ? '#d1fae5' : item.status === 'PROVISIONING' ? '#fef3c7' : '#f1f5f9',
                      padding: '4px 8px',
                      borderRadius: '4px',
                      display: 'inline-block'
                    }}>
                      {item.status === 'PROVISIONED' ? '✓ Active' : item.status === 'PROVISIONING' ? '⏳ Processing' : item.status}
                    </EmailText>
                  )} */}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Invoice Information */}
        <div style={{
          backgroundColor: '#eff6ff',
          border: '1px solid #bfdbfe',
          borderRadius: '8px',
          padding: '20px',
          margin: '20px 0',
        }}>
          <EmailText style={{ margin: '0 0 10px 0', fontWeight: 'bold', fontSize: '16px', color: '#1e40af' }}>
            Invoice Information
          </EmailText>
          <EmailText style={{ margin: '8px 0', color: '#1e3a8a' }}>
            You will receive a separate email with your detailed invoice for this order. The invoice will include:
          </EmailText>
          <EmailText style={{ margin: '4px 0', color: '#1e3a8a', fontSize: '14px' }}>
            • Complete breakdown of all charges
          </EmailText>
          <EmailText style={{ margin: '4px 0', color: '#1e3a8a', fontSize: '14px' }}>
            • Payment instructions and details
          </EmailText>
          <EmailText style={{ margin: '4px 0', color: '#1e3a8a', fontSize: '14px' }}>
            • PDF attachment for your records
          </EmailText>
        </div>

        <EmailText>
          <strong>What's Next?</strong>
        </EmailText>
        <EmailText>
          • Your services are now active and ready to use
        </EmailText>
        <EmailText>
          • You can manage your order and services through your account dashboard
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
          Thank you for choosing <strong>Nisc Cloud Limited</strong>. We appreciate your business and look forward to serving you!
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
      status: 'PROVISIONED'
    },
    {
      name: 'Domain Registration - example.com',
      description: 'Annual domain registration',
      quantity: 1,
      price: 'KES 2,500.00',
      status: 'PROVISIONED'
    },
    {
      name: 'SSL Certificate - Standard',
      description: 'Standard SSL certificate for secure connections',
      quantity: 1,
      price: 'KES 12,499.00',
      status: 'PROVISIONED'
    }
  ],
  supportEmail: 'support@nisccloud.com',
  supportPhone: '+254 748 777 666',
  orderLink: 'https://app.nisccloud.com/orders/ORD-2024-001',
} as OrderConfirmationEmailProps;

export default OrderConfirmationEmail;

