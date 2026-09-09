import { Section } from '@react-email/components';
import { 
  EmailLayout, 
  EmailHeader, 
  EmailFooter, 
  EmailText, 
  EmailButton, 
  EmailSignature 
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
        <EmailText>
          <strong>Your login credentials:</strong>
        </EmailText>
        <EmailText>
          <strong>Email:</strong> {email}
        </EmailText>
        <EmailText>
          <strong>Password:</strong> {password}
        </EmailText>
        <EmailText>
          You can log in to your account using the button below:
        </EmailText>
        <EmailButton href={loginLink || '#'}>
          Log in to nPanel
        </EmailButton>
        <EmailText>
          <strong>Important Security Notice:</strong>
        </EmailText>
        <EmailText>
          For security purposes, we strongly recommend that you change your password to a secure one of your choice after your first login.
        </EmailText>
        <EmailText>
          If you have any questions or need assistance, feel free to reach out to our support team. We're here to help!
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

