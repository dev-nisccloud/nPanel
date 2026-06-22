import { Hr, Section } from '@react-email/components';
import {
  EmailLayout,
  EmailHeader,
  EmailFooter,
  EmailText,
  EmailButton,
  EmailSignature,
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
  verificationLink,
  planName,
}: StorefrontWelcomeEmailProps) => {
  return (
    <EmailLayout preview={`Welcome to Nisc Cloud® — your account is ready`}>
      <EmailHeader />
      <Section>
        <EmailText>Hi {firstName},</EmailText>
        <EmailText>
          Welcome to <strong>Nisc Cloud®</strong>! Your account has been created
          and your order is being processed.{' '}
          {planName ? (
            <>
              We received your purchase for <strong>{planName}</strong> and our
              team is on it.
            </>
          ) : (
            <>We received your order and our team is on it.</>
          )}
        </EmailText>

        {/* Account credentials box */}
        <div
          style={{
            backgroundColor: '#f0f9ff',
            border: '1px solid #bae6fd',
            borderRadius: '8px',
            padding: '20px 24px',
            margin: '24px 0',
          }}
        >
          <EmailText
            style={{ margin: '0 0 12px 0', fontWeight: 'bold', fontSize: '15px', color: '#0369a1' }}
          >
            Your nPanel Login Details
          </EmailText>
          <EmailText style={{ margin: '6px 0' }}>
            <strong>Email:</strong> {email}
          </EmailText>
          <EmailText style={{ margin: '6px 0' }}>
            <strong>Temporary Password:</strong>{' '}
            <span
              style={{
                fontFamily: 'monospace',
                backgroundColor: '#e0f2fe',
                padding: '2px 8px',
                borderRadius: '4px',
                fontSize: '15px',
                letterSpacing: '0.05em',
              }}
            >
              {temporaryPassword}
            </span>
          </EmailText>
        </div>

        <EmailButton href={loginLink}>Log in to nPanel</EmailButton>

        <Hr style={{ borderColor: '#e5e7eb', margin: '28px 0' }} />

        {/* Email verification notice */}
        <div
          style={{
            backgroundColor: '#fefce8',
            border: '1px solid #fde047',
            borderRadius: '8px',
            padding: '16px 20px',
            margin: '0 0 20px 0',
          }}
        >
          <EmailText
            style={{ margin: '0 0 6px 0', fontWeight: 'bold', fontSize: '14px', color: '#854d0e' }}
          >
            📧 Verify your email address
          </EmailText>
          <EmailText style={{ margin: '0', fontSize: '14px', color: '#713f12' }}>
            We've also sent you a separate verification email. Verifying your
            email helps secure your account, but you can log in and access your
            services right away — it's not required to get started.
            {verificationLink && (
              <>
                {' '}
                <a
                  href={verificationLink}
                  style={{ color: '#92400e', fontWeight: 'bold' }}
                >
                  Verify now →
                </a>
              </>
            )}
          </EmailText>
        </div>

        {/* Security notice */}
        <div
          style={{
            backgroundColor: '#fef2f2',
            border: '1px solid #fecaca',
            borderRadius: '8px',
            padding: '16px 20px',
            margin: '0 0 24px 0',
          }}
        >
          <EmailText
            style={{ margin: '0 0 6px 0', fontWeight: 'bold', fontSize: '14px', color: '#991b1b' }}
          >
            🔒 Important security notice
          </EmailText>
          <EmailText style={{ margin: '0', fontSize: '14px', color: '#7f1d1d' }}>
            Your temporary password above was generated automatically. Please
            change it immediately after your first login via{' '}
            <strong>My Profile → Change Password</strong>. Never share your
            password with anyone.
          </EmailText>
        </div>

        <EmailText>
          Once logged in, you can track your order, manage your services, and
          update your account details from the nPanel dashboard.
        </EmailText>

        <EmailText>
          Have a question?{' '}
          <a href="mailto:support@nisccloud.com" style={{ color: '#38b6ff' }}>
            support@nisccloud.com
          </a>{' '}
          or call us at{' '}
          <a href="tel:+254748777666" style={{ color: '#38b6ff' }}>
            +254 748 777 666
          </a>
          .
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
