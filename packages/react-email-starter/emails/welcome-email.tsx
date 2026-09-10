import { Section } from '@react-email/components';
import {
  EmailLayout,
  EmailHeader,
  EmailFooter,
  EmailText,
  EmailButton,
  EmailSignature,
} from './components';

interface WelcomeEmailProps {
  userFirstname?: string;
  loginLink?: string;
}

export const WelcomeEmail = ({
  userFirstname,
  loginLink,
}: WelcomeEmailProps) => {
  return (
    <EmailLayout preview="Welcome to Nisc Cloud®">
      <EmailHeader />
      <Section>
        <EmailText>Hello {userFirstname},</EmailText>
        <EmailText>
          Welcome to Nisc Cloud®. Your account is ready. Log in to nPanel to complete your profile and start managing your services.
        </EmailText>
        <EmailButton href={loginLink || '#'}>
          Log in to nPanel
        </EmailButton>
        <EmailSignature />
      </Section>
      <EmailFooter />
    </EmailLayout>
  );
};

WelcomeEmail.PreviewProps = {
  userFirstname: 'John Doe',
  loginLink: 'https://app.nisccloud.com/login',
} as WelcomeEmailProps;

export default WelcomeEmail;
