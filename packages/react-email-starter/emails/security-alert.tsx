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
  supportEmail = 'security@nisccloud.com',
  supportPhone = '+254 748 777 666',
  suspiciousActivity = 'password reset',
}: SecurityAlertEmailProps) => {
  return (
    <EmailLayout preview="Security alert: unusual activity on your account">
      <EmailHeader />
      <Section>
        <EmailText>Hello {userFirstname},</EmailText>
        <EmailText>
          We detected a {suspiciousActivity} request on your Nisc Cloud® account that we could not confirm was made by you.
        </EmailText>
        <EmailText>
          If this was not you, secure your account now: change your password, review recent activity, and enable two-factor authentication if it is not already on.
        </EmailText>
        <EmailButton href={resetPasswordLink || 'https://app.nisccloud.com/reset-password'}>
          Secure my account
        </EmailButton>
        <EmailText>
          If you need help, contact us at{' '}
          <EmailLink href={`mailto:${supportEmail}`}>{supportEmail}</EmailLink>
          {' '}or{' '}
          <EmailLink href={`tel:${supportPhone}`}>{supportPhone}</EmailLink>.
          If you made this request, you can ignore this alert.
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
