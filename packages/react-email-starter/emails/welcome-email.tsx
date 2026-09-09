import { Section } from '@react-email/components';
import { 
  EmailLayout, 
  EmailHeader, 
  EmailFooter, 
  EmailText, 
  EmailButton, 
  EmailSignature 
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
        <EmailText>Welcome to Nisc Cloud®, {userFirstname}!</EmailText>
        <EmailText>
          Thank you for joining Nisc Cloud®. We&apos;re excited to help you transform your business and stand out in the market.
        </EmailText>
        <EmailText>
          To get started, please log in to nPanel and complete your profile setup.
        </EmailText>
        <EmailButton href={loginLink || '#'}>
          Get Started
        </EmailButton>
        <EmailText>
          If you have any questions, feel free to reach out to our support team. We're here to help!
        </EmailText>
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
