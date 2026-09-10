import { Section } from '@react-email/components';
import {
  EmailLayout,
  EmailHeader,
  EmailFooter,
  EmailText,
  EmailButton,
  EmailSignature,
} from './components';

interface ResetPasswordEmailProps {
  userFirstname?: string;
  resetPasswordLink?: string;
}

export const ResetPasswordEmail = ({
  userFirstname,
  resetPasswordLink,
}: ResetPasswordEmailProps) => {
  return (
    <EmailLayout preview="Reset your password">
      <EmailHeader />
      <Section>
        <EmailText>Hello {userFirstname},</EmailText>
        <EmailText>
          We received a request to reset the password for your Nisc Cloud® account. Use the button below to set a new password.
        </EmailText>
        <EmailButton href={resetPasswordLink || '#'}>
          Reset password
        </EmailButton>
        <EmailText>
          If you did not request this, you can ignore this email. No changes will be made to your account.
        </EmailText>
        <EmailSignature />
      </Section>
      <EmailFooter />
    </EmailLayout>
  );
};

ResetPasswordEmail.PreviewProps = {
  userFirstname: 'John Doe',
  resetPasswordLink: 'https://www.nisccloud.com',
} as ResetPasswordEmailProps;

export default ResetPasswordEmail;
