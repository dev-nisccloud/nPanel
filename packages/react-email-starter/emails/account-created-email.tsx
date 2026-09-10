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
  password?: string;
  loginLink?: string;
}

export const AccountCreatedEmail = ({
  userFirstname,
  email,
  password,
  loginLink,
}: AccountCreatedEmailProps) => {
  return (
    <EmailLayout preview="Your account has been created - Nisc Cloud®">
      <EmailHeader />
      <Section>
        <EmailText>Hello {userFirstname},</EmailText>
        <EmailText>
          An account has been created for you with Nisc Cloud®. You can now log in to nPanel to access your dashboard and manage your services.
        </EmailText>
        <EmailDetails title="Your login credentials">
          <EmailText style={{ margin: '8px 0' }}>
            <strong>Email:</strong> {email}
          </EmailText>
          <EmailText style={{ margin: '8px 0' }}>
            <strong>Password:</strong> {password}
          </EmailText>
        </EmailDetails>
        <EmailButton href={loginLink || '#'}>
          Log in to nPanel
        </EmailButton>
        <EmailText>
          <strong>Important:</strong> Change this password to one of your choosing after your first login.
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
  password: 'TempPassword123!',
  loginLink: 'https://app.nisccloud.com/login',
} as AccountCreatedEmailProps;

export default AccountCreatedEmail;
