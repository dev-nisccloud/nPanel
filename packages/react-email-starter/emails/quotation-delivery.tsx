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

interface QuotationDeliveryEmailProps {
  customerName?: string;
  quotationNumber?: string;
  issueDate?: string;
  totalAmount?: string;
  currency?: string;
  services?: Array<{
    name: string;
    description?: string;
    quantity?: number;
    price?: string;
  }>;
  supportEmail?: string;
  supportPhone?: string;
}

export const QuotationDeliveryEmail = ({
  customerName = 'Valued Customer',
  quotationNumber = 'QUOT-0001',
  issueDate = 'January 1, 2024',
  totalAmount = '0.00',
  currency = 'KES',
  services = [],
}: QuotationDeliveryEmailProps) => {
  const formattedAmount = `${currency} ${totalAmount}`;

  return (
    <EmailLayout preview={`Quotation ${quotationNumber} from Nisc Cloud®`}>
      <EmailHeader />
      <Section>
        <EmailText>Hello {customerName},</EmailText>
        <EmailText>
          Please find quotation <strong>{quotationNumber}</strong> from Nisc Cloud® attached as a PDF.
        </EmailText>
        <EmailDetails>
          <EmailText style={{ margin: '8px 0' }}>
            <strong>Quotation number:</strong> {quotationNumber}
          </EmailText>
          <EmailText style={{ margin: '8px 0' }}>
            <strong>Issue date:</strong> {issueDate}
          </EmailText>
          <EmailText style={{ margin: '8px 0' }}>
            <strong>Total:</strong> {formattedAmount}
          </EmailText>
        </EmailDetails>
        {services.length > 0 && (
          <EmailDetails title="Items quoted">
            {services.map((service, index) => (
              <EmailItem key={index} isLast={index === services.length - 1}>
                <EmailText style={{ margin: '0 0 4px 0' }}>
                  <strong>{service.name}</strong>
                </EmailText>
                {service.description && (
                  <EmailText style={{ margin: '4px 0' }}>
                    {service.description}
                  </EmailText>
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
          Reply to this email if you have questions or would like to proceed.
        </EmailText>
        <EmailSignature />
      </Section>
      <EmailFooter />
    </EmailLayout>
  );
};

QuotationDeliveryEmail.PreviewProps = {
  customerName: 'John Doe',
  quotationNumber: 'QUOT-0001',
  issueDate: 'January 1, 2024',
  totalAmount: '29,999.00',
  currency: 'KES',
  services: [
    { name: 'Web Hosting Plan', description: 'Premium hosting package', quantity: 1, price: 'KES 15,000.00' },
    { name: 'Domain Registration', quantity: 2, price: 'KES 2,500.00' },
  ],
  supportEmail: 'billing@nisccloud.com',
  supportPhone: '+254 748 777 666',
} as QuotationDeliveryEmailProps;

export default QuotationDeliveryEmail;
