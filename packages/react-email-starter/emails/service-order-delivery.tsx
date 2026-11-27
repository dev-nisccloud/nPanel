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

interface ServiceOrderDeliveryEmailProps {
  customerName?: string;
  orderNumber?: string;
  issueDate?: string;
  validUntil?: string;
  totalAmount?: string;
  currency?: string;
  services?: Array<{
    name: string;
    description?: string;
    quantity?: number;
    price?: string;
  }>;
}

export const ServiceOrderDeliveryEmail = ({
  customerName = 'Valued Customer',
  orderNumber = 'SO-0001',
  issueDate = '1 January 2026',
  validUntil = '31 January 2026',
  totalAmount = '0.00',
  currency = 'KES',
  services = [],
}: ServiceOrderDeliveryEmailProps) => {
  const formattedAmount = `${currency} ${totalAmount}`;

  return (
    <EmailLayout preview={`Service order ${orderNumber} from Nisc Cloud®`}>
      <EmailHeader />
      <Section>
        <EmailText>Hello {customerName},</EmailText>
        <EmailText>
          Please find service order <strong>{orderNumber}</strong> from Nisc Cloud® attached as a PDF.
        </EmailText>
        <EmailDetails>
          <EmailText style={{ margin: '8px 0' }}>
            <strong>Order reference:</strong> {orderNumber}
          </EmailText>
          <EmailText style={{ margin: '8px 0' }}>
            <strong>Issue date:</strong> {issueDate}
          </EmailText>
          <EmailText style={{ margin: '8px 0' }}>
            <strong>Valid until:</strong> {validUntil}
          </EmailText>
          <EmailText style={{ margin: '8px 0' }}>
            <strong>Total payable:</strong> {formattedAmount}
          </EmailText>
        </EmailDetails>
        {services.length > 0 && (
          <EmailDetails title="Ordered services">
            {services.map((service, index) => (
              <EmailItem key={index} isLast={index === services.length - 1}>
                <EmailText style={{ margin: '0 0 4px 0' }}>
                  <strong>{service.name}</strong>
                </EmailText>
                {service.description && (
                  <EmailText style={{ margin: '4px 0' }}>{service.description}</EmailText>
                )}
                {(service.quantity != null || service.price) && (
                  <EmailText style={{ margin: '4px 0' }}>
                    {service.quantity != null && `Quantity: ${service.quantity}`}
                    {service.quantity != null && service.price && ' · '}
                    {service.price && service.price}
                  </EmailText>
                )}
              </EmailItem>
            ))}
          </EmailDetails>
        )}
        <EmailText>
          Reply to this email if you have questions or would like to proceed. Signing the attached order confirms the details and Nisc Cloud's Terms of Service.
        </EmailText>
        <EmailSignature />
      </Section>
      <EmailFooter />
    </EmailLayout>
  );
};

ServiceOrderDeliveryEmail.PreviewProps = {
  customerName: 'Ada Lovelace',
  orderNumber: 'SO-0001',
  issueDate: '27 November 2026',
  validUntil: '27 December 2026',
  totalAmount: '29,999.00',
  currency: 'KES',
  services: [
    { name: 'Cloud Web Hosting', description: 'Website Hosting · example.com', quantity: 1, price: 'KES 15,000.00' },
  ],
} as ServiceOrderDeliveryEmailProps;

export default ServiceOrderDeliveryEmail;
