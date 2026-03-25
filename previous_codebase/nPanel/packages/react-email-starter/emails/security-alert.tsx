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

interface SecurityAlertEmailProps {
  userFirstname?: string;
  resetPasswordLink?: string;
  supportEmail?: string;
  supportPhone?: string;
  suspiciousActivity?: string;
}

export const SecurityAlertEmail = ({
  userFirstname,
  resetPasswordLink,
  supportEmail = "security@nisccloud.com",
  supportPhone = "+254 748 777 666",
  suspiciousActivity = "password reset"
}: SecurityAlertEmailProps) => {
  return (
    <EmailLayout preview="Security Alert - Unauthorized Account Activity">
      <EmailHeader />
      <Section>
        <EmailText style={{ color: '#dc2626', fontWeight: 'bold' }}>
          SECURITY ALERT
        </EmailText>
        <EmailText>Hello {userFirstname},</EmailText>
        <EmailText>
          We detected suspicious activity on your Nisc Cloud account. Someone recently 
          requested a {suspiciousActivity} for your account.
        </EmailText>
        <EmailText>
          <strong>If this was NOT you:</strong> Your account may have been compromised. 
          Please take immediate action to secure your account.
        </EmailText>
        <EmailButton href={resetPasswordLink || 'https://app.nisccloud.com/reset-password'}>
          Secure My Account Now
        </EmailButton>
        <EmailText>
          <strong>Immediate Actions Required:</strong>
        </EmailText>
        <EmailText>
          1. Change your password immediately using the button above
        </EmailText>
        <EmailText>
          2. Enable two-factor authentication if not already enabled
        </EmailText>
        <EmailText>
          3. Review your recent account activity
        </EmailText>
        <EmailText>
          4. Contact our security team at{' '}
          <EmailLink href={`mailto:${supportEmail}`}>
            {supportEmail}
          </EmailLink>
        </EmailText>
        <EmailText>
          <strong>Emergency Support:</strong> Call us immediately at{' '}
          <EmailLink href={`tel:${supportPhone}`}>
            {supportPhone}
          </EmailLink>
        </EmailText>
        <EmailText>
          We're monitoring your account and will help you secure it. 
          If you initiated this action, you can safely ignore this alert.
        </EmailText>
        <EmailSignature />
      </Section>
      <EmailFooter />
    </EmailLayout>
  );
};

SecurityAlertEmail.PreviewProps = {
  userFirstname: 'John Doe',
  resetPasswordLink: 'https://app.nisccloud.com/reset-password',
  supportEmail: 'security@nisccloud.com',
  supportPhone: '+254 748 777 666',
  suspiciousActivity: 'password reset',
} as SecurityAlertEmailProps;

export default SecurityAlertEmail;
