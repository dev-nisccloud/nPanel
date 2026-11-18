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

interface AccountCreatedEmailProps {
  userFirstname?: string;
  email?: string;
  setPasswordLink?: string;
}

export const AccountCreatedEmail = ({
  userFirstname,
  email,
  setPasswordLink,
}: AccountCreatedEmailProps) => {
  return (
    <EmailLayout preview="Your account has been created - Nisc Cloud®">
      <EmailHeader />
      <Section>
        <EmailText>Hello {userFirstname},</EmailText>
        <EmailText>
          An account has been created for you with Nisc Cloud®. Set your password to confirm your email and open nPanel, where you can manage your services.
        </EmailText>
        <EmailDetails title="Your account">
          <EmailText style={{ margin: '8px 0' }}>
            <strong>Email:</strong> {email}
          </EmailText>
        </EmailDetails>
        <EmailButton href={setPasswordLink || '#'}>
          Set your password
        </EmailButton>
        <EmailText>
          This link works once and expires in 72 hours. If it expires, use &quot;Forgot your password?&quot; on the sign-in page.
        </EmailText>
        <EmailSignature />
      </Section>
      <EmailFooter />
    </EmailLayout>
  );
};

AccountCreatedEmail.PreviewProps = {
  userFirstname: 'John Doe',
  email: 'john.doe@example.com',
  setPasswordLink: 'https://app.nisccloud.com/auth/reset-password?token=example&welcome=1',
} as AccountCreatedEmailProps;

export default AccountCreatedEmail;
