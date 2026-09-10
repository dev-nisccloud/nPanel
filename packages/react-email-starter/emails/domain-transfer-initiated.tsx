import { Section } from '@react-email/components';
import {
  EmailLayout,
  EmailHeader,
  EmailFooter,
  EmailText,
  EmailButton,
  EmailSignature,
  EmailDetails,
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
  domainName = 'example.com',
  transferDate = 'March 20, 2024',
  newRegistrar = 'New Registrar Inc.',
  authorizationCode = 'ABC123XYZ',
  transferLink,
}: DomainTransferInitiatedEmailProps) => {
  return (
    <EmailLayout preview={`Domain transfer started for ${domainName}`}>
      <EmailHeader />
      <Section>
        <EmailText>Hello {userFirstname},</EmailText>
        <EmailText>
          A transfer of <strong>{domainName}</strong> to <strong>{newRegistrar}</strong> was initiated on{' '}
          <strong>{transferDate}</strong>. If you started this, complete authorization with the new registrar. If you did not, contact us immediately.
        </EmailText>
        <EmailDetails>
          <EmailText style={{ margin: '8px 0' }}>
            <strong>Domain:</strong> {domainName}
          </EmailText>
          <EmailText style={{ margin: '8px 0' }}>
            <strong>Transfer date:</strong> {transferDate}
          </EmailText>
          <EmailText style={{ margin: '8px 0' }}>
            <strong>New registrar:</strong> {newRegistrar}
          </EmailText>
          <EmailText style={{ margin: '8px 0' }}>
            <strong>Authorization code:</strong> {authorizationCode}
          </EmailText>
        </EmailDetails>
        <EmailButton href={transferLink || 'https://app.nisccloud.com/domains/transfer'}>
          View transfer status
        </EmailButton>
        <EmailText>
          Keep the authorization code private. Do not change nameservers during the transfer. Transfers typically complete within 5–7 days after authorization and can usually be cancelled within 5 days.
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
