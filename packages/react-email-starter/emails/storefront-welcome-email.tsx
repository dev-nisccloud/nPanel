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

interface StorefrontWelcomeEmailProps {
  firstName?: string;
  email?: string;
  temporaryPassword?: string;
  loginLink?: string;
  verificationLink?: string;
  planName?: string;
}

export const StorefrontWelcomeEmail = ({
  firstName = 'there',
  email = '',
  temporaryPassword = '',
  loginLink = 'https://app.nisccloud.com/auth/login',
  planName,
}: StorefrontWelcomeEmailProps) => {
  return (
    <EmailLayout preview="Your Nisc Cloud® account is ready">
      <EmailHeader />
      <Section>
        <EmailText>Hello {firstName},</EmailText>
        <EmailText>
          Your Nisc Cloud® account has been created
          {planName ? (
            <>
              {' '}and we have received your order for <strong>{planName}</strong>
            </>
          ) : (
            <> and we have received your order</>
          )}
          . You can log in to nPanel now to track your order and manage your services.
        </EmailText>
        <EmailDetails title="Your login credentials">
          <EmailText style={{ margin: '8px 0' }}>
            <strong>Email:</strong> {email}
          </EmailText>
          <EmailText style={{ margin: '8px 0' }}>
            <strong>Temporary password:</strong> {temporaryPassword}
          </EmailText>
        </EmailDetails>
        <EmailButton href={loginLink}>Log in to nPanel</EmailButton>
        <EmailText>
          <strong>Important:</strong> Change this password after your first login via My Profile → Change Password. A separate email has been sent to verify your address; verification is not required to get started.
        </EmailText>
        <EmailSignature />
      </Section>
      <EmailFooter />
    </EmailLayout>
  );
};

StorefrontWelcomeEmail.PreviewProps = {
  firstName: 'Jane',
  email: 'jane.doe@example.com',
  temporaryPassword: 'xK9#mR2p',
  loginLink: 'https://app.nisccloud.com/auth/login',
  planName: 'Business SEO – Monthly',
} as StorefrontWelcomeEmailProps;

export default StorefrontWelcomeEmail;
