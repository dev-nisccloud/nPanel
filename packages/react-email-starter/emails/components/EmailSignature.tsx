import { Text } from '@react-email/components';
import { companyBranding, emailStyles } from './shared-styles';

interface EmailSignatureProps {
  salutation?: string;
  signature?: string;
  tagline?: string;
}

export const EmailSignature = ({
  salutation = "Best regards,",
  signature = "The Nisc Cloud® Team",
  tagline = companyBranding.tagline,
}: EmailSignatureProps) => {
  return (
    <>
      <Text style={emailStyles.salutation}>{salutation}</Text>
      <Text style={emailStyles.signature}>{signature}</Text>
      <Text style={emailStyles.signatureTagline}>{tagline}</Text>
    </>
  );
};
