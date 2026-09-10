import { Section } from '@react-email/components';
import {
  EmailLayout,
  EmailHeader,
  EmailFooter,
  EmailText,
  EmailButton,
  EmailLink,
  EmailSignature,
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
  supportEmail = 'support@nisccloud.com',
}: PasswordResetSuccessEmailProps) => {
  return (
    <EmailLayout preview="Your password has been reset">
      <EmailHeader />
      <Section>
        <EmailText>Hello {userFirstname},</EmailText>
        <EmailText>
          Your Nisc Cloud® password has been reset. You can now log in with your new password.
        </EmailText>
        <EmailButton href={loginLink || 'https://app.nisccloud.com/login'}>
          Log in to nPanel
        </EmailButton>
        <EmailText>
          If you did not make this change, contact us immediately at{' '}
          <EmailLink href={`mailto:${supportEmail}`}>{supportEmail}</EmailLink>
          {' '}and reset your password again from a device you trust.
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
