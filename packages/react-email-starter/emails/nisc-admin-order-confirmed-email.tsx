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

export interface NiscAdminOrderConfirmedEmailProps {
  /** Customer / purchaser display name (for admin context). */
  customerName?: string;
  orderNumber?: string;
  orderDate?: string;
  totalAmount?: string;
  currency?: string;
  orderItems?: Array<{
    name: string;
    description?: string;
    price?: string;
    status?: string;
  }>;
  orderLink?: string;
}

export const NiscAdminOrderConfirmedEmail = ({
  customerName = 'Customer',
  orderNumber = 'Nisc-000000-000000-000',
  orderDate = '',
  totalAmount = '0',
  currency = 'KES',
  orderItems = [],
  orderLink = 'https://app.nisccloud.com/agency/nisc-service-orders',
}: NiscAdminOrderConfirmedEmailProps) => {
  const formattedTotal = `${currency} ${totalAmount}`;

  return (
    <EmailLayout preview={`Order confirmed: ${orderNumber}`}>
      <EmailHeader />
      <Section>
        <EmailText>Hello,</EmailText>
        <EmailText>
          Order <strong>{orderNumber}</strong> has been fully processed and all items are provisioned.
        </EmailText>
        <EmailDetails>
          <EmailText style={{ margin: '8px 0' }}>
            <strong>Order number:</strong> {orderNumber}
          </EmailText>
          {orderDate && (
            <EmailText style={{ margin: '8px 0' }}>
              <strong>Date:</strong> {orderDate}
            </EmailText>
          )}
          <EmailText style={{ margin: '8px 0' }}>
            <strong>Customer:</strong> {customerName}
          </EmailText>
          <EmailText style={{ margin: '8px 0' }}>
            <strong>Total:</strong> {formattedTotal}
          </EmailText>
        </EmailDetails>
        {orderItems.length > 0 && (
          <EmailDetails title="Line items">
            {orderItems.map((item, index) => (
              <EmailItem key={index} isLast={index === orderItems.length - 1}>
                <EmailText style={{ margin: '0 0 4px 0' }}>
                  <strong>{item.name}</strong>
                  {item.status ? ` — ${item.status}` : ''}
                </EmailText>
                {item.description && (
                  <EmailText style={{ margin: '4px 0' }}>
                    {item.description}
                  </EmailText>
                )}
                {item.price && (
                  <EmailText style={{ margin: '4px 0' }}>
                    {item.price}
                  </EmailText>
                )}
              </EmailItem>
            ))}
          </EmailDetails>
        )}
        <EmailButton href={orderLink}>View order</EmailButton>
        <EmailSignature />
      </Section>
      <EmailFooter />
    </EmailLayout>
  );
};

NiscAdminOrderConfirmedEmail.PreviewProps = {
  customerName: 'Finey Akwoyo',
  orderNumber: 'Nisc-2026-235933-462',
  orderDate: '2026-05-14',
  totalAmount: '1350',
  currency: 'KES',
  orderItems: [
    {
      name: 'Domains',
      description: 'example.co.ke',
      price: 'KES 1350',
      status: 'PROVISIONED',
    },
    {
      name: 'Web Hosting - Business',
      description: 'Primary domain: clientsite.com',
      price: 'KES 4999',
      status: 'PROVISIONED',
    },
  ],
  orderLink: 'https://app.nisccloud.com/agency/nisc-service-orders?order=nisc_123',
} as NiscAdminOrderConfirmedEmailProps;

export default NiscAdminOrderConfirmedEmail;
