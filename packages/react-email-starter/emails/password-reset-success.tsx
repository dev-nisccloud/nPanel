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

interface PasswordResetSuccessEmailProps {
  userFirstname?: string;
  loginLink?: string;
  supportEmail?: string;
  supportPhone?: string;
}

export const PasswordResetSuccessEmail = ({
  userFirstname,
  loginLink,
  supportEmail = "support@nisccloud.com",
  supportPhone = "+254 748 777 666"
}: PasswordResetSuccessEmailProps) => {
  return (
    <EmailLayout preview="Password reset successful">
      <EmailHeader />
      <Section>
        <EmailText>Hello {userFirstname},</EmailText>
        <EmailText>
          Your password has been successfully reset for your Nisc Cloud account. 
          You can now log in using your new password.
        </EmailText>
        <EmailText>
          If you did not request this password change, please contact our support team immediately 
          as your account may have been compromised.
        </EmailText>
        <EmailButton href={loginLink || 'https://app.nisccloud.com/login'}>
          Log In to Your Account
        </EmailButton>
        <EmailText>
          <strong>Security Notice:</strong> If you did not make this change, please:
        </EmailText>
        <EmailText>
          • Contact us immediately at{' '}
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
          • Change your password again from a secure device
        </EmailText>
        <EmailText>
          We take account security seriously and will help you secure your account immediately.
        </EmailText>
        <EmailSignature />
      </Section>
      <EmailFooter />
    </EmailLayout>
  );
};

PasswordResetSuccessEmail.PreviewProps = {
  userFirstname: 'John Doe',
  loginLink: 'https://app.nisccloud.com/login',
  supportEmail: 'support@nisccloud.com',
  supportPhone: '+254 748 777 666',
} as PasswordResetSuccessEmailProps;

export default PasswordResetSuccessEmail;
