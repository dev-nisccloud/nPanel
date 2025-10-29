import { Text } from '@react-email/components';
import { emailStyles } from './shared-styles';

interface EmailSignatureProps {
  salutation?: string;
  signature?: string;
  website?: string;
}

export const EmailSignature = ({ 
  salutation = "Best regards,",
  signature = "The Nisc Cloud Team",
  website = "https://www.nisccloud.com"
}: EmailSignatureProps) => {
  return (
    <>
      <Text style={emailStyles.salutation}>{salutation}</Text>
      <Text style={emailStyles.signature}>{signature}</Text>
      <Text style={emailStyles.text}>
        <a style={emailStyles.anchor} href={website}>
          www.nisccloud.com
        </a>
      </Text>
    </>
  );
};
