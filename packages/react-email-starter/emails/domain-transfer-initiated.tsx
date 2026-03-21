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

interface DomainTransferInitiatedEmailProps {
  userFirstname?: string;
  domainName?: string;
  transferDate?: string;
  newRegistrar?: string;
  authorizationCode?: string;
  transferLink?: string;
  supportEmail?: string;
  supportPhone?: string;
}

export const DomainTransferInitiatedEmail = ({
  userFirstname,
  domainName = "example.com",
  transferDate = "March 20, 2024",
  newRegistrar = "New Registrar Inc.",
  authorizationCode = "ABC123XYZ",
  transferLink,
  supportEmail = "domains@nisccloud.com",
  supportPhone = "+254 748 777 666"
}: DomainTransferInitiatedEmailProps) => {
  return (
    <EmailLayout preview={`Domain transfer initiated for ${domainName}`}>
      <EmailHeader />
      <Section>
        <EmailText>Hello {userFirstname},</EmailText>
        <EmailText>
          A domain transfer has been initiated for <strong>{domainName}</strong> on{' '}
          <strong>{transferDate}</strong>. The domain is being transferred to{' '}
          <strong>{newRegistrar}</strong>.
        </EmailText>
        <EmailText>
          If you initiated this transfer, please complete the authorization process 
          to proceed. If you did not request this transfer, please contact us immediately.
        </EmailText>
        
        {/* Transfer Details Box */}
        <div style={{
          backgroundColor: '#f8fafc',
          border: '1px solid #e2e8f0',
          borderRadius: '8px',
          padding: '20px',
          margin: '20px 0',
        }}>
          <EmailText style={{ margin: '0 0 10px 0', fontWeight: 'bold' }}>
            Transfer Details:
          </EmailText>
          <EmailText style={{ margin: '5px 0' }}>
            Domain Name: {domainName}
          </EmailText>
          <EmailText style={{ margin: '5px 0' }}>
            Transfer Date: {transferDate}
          </EmailText>
          <EmailText style={{ margin: '5px 0' }}>
            New Registrar: {newRegistrar}
          </EmailText>
          <EmailText style={{ margin: '5px 0' }}>
            Authorization Code: {authorizationCode}
          </EmailText>
          <EmailText style={{ margin: '5px 0', color: '#059669', fontWeight: 'bold' }}>
            Status: PENDING AUTHORIZATION
          </EmailText>
        </div>

        <EmailText>
          <strong>What happens next?</strong>
        </EmailText>
        <EmailText>
          • You will receive an authorization email from the new registrar
        </EmailText>
        <EmailText>
          • Click the authorization link to approve the transfer
        </EmailText>
        <EmailText>
          • The transfer will complete within 5-7 days after authorization
        </EmailText>
        <EmailText>
          • Your domain services will remain active during the transfer
        </EmailText>

        <EmailButton href={transferLink || 'https://app.nisccloud.com/domains/transfer'}>
          View Transfer Status
        </EmailButton>

        <EmailText>
          <strong>Important Information:</strong>
        </EmailText>
        <EmailText>
          • Keep your authorization code safe: {authorizationCode}
        </EmailText>
        <EmailText>
          • Do not change nameservers during the transfer process
        </EmailText>
        <EmailText>
          • Contact the new registrar if you don't receive authorization emails
        </EmailText>
        <EmailText>
          • Transfers can be cancelled within 5 days if needed
        </EmailText>

        <EmailText>
          <strong>If you did NOT request this transfer:</strong>
        </EmailText>
        <EmailText>
          • Contact us immediately to cancel the transfer
        </EmailText>
        <EmailText>
          • This may indicate unauthorized access to your account
        </EmailText>
        <EmailText>
          • We can help secure your account and prevent future unauthorized transfers
        </EmailText>

        <EmailText>
          <strong>Need Assistance?</strong> Our domain specialists are here to help:
        </EmailText>
        <EmailText>
          • Email us at{' '}
          <EmailLink href={`mailto:${supportEmail}`}>
            {supportEmail}
          </EmailLink>
        </EmailText>
        <EmailText>
          • Call our support team at{' '}
          <EmailLink href={`tel:${supportPhone}`}>
            {supportPhone}
          </EmailLink>
        </EmailText>
        <EmailText>
          We're here to ensure your domain transfer process goes smoothly and securely.
        </EmailText>
        <EmailSignature />
      </Section>
      <EmailFooter />
    </EmailLayout>
  );
};

DomainTransferInitiatedEmail.PreviewProps = {
  userFirstname: 'John Doe',
  domainName: 'example.com',
  transferDate: 'March 20, 2024',
  newRegistrar: 'New Registrar Inc.',
  authorizationCode: 'ABC123XYZ',
  transferLink: 'https://app.nisccloud.com/domains/transfer',
  supportEmail: 'domains@nisccloud.com',
  supportPhone: '+254 748 777 666',
} as DomainTransferInitiatedEmailProps;

export default DomainTransferInitiatedEmail;
