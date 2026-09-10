import { Section } from '@react-email/components';
import {
  EmailFooter,
  EmailHeader,
  EmailLayout,
  EmailSignature,
  EmailText,
  emailStyles,
} from './components';

interface EmailOtpEmailProps {
  userFirstname?: string;
  otpCode: string;
  expiresInMinutes?: number;
}

export const EmailOtpEmail = ({
  userFirstname,
  otpCode,
  expiresInMinutes = 10,
}: EmailOtpEmailProps) => {
  return (
    <EmailLayout preview={`Your nPanel verification code is ${otpCode}`}>
      <EmailHeader />
      <Section>
        <EmailText>Hello {userFirstname || 'there'},</EmailText>
        <EmailText>
          Use this verification code to finish signing in to nPanel.
        </EmailText>
        <EmailText style={emailStyles.otpCode}>
          {otpCode}
        </EmailText>
        <EmailText>
          This code expires in {expiresInMinutes} minutes and can only be used once. If you did not try to sign in, reset your password and contact support.
        </EmailText>
        <EmailSignature />
      </Section>
      <EmailFooter />
    </EmailLayout>
  );
};

EmailOtpEmail.PreviewProps = {
  userFirstname: 'John Doe',
  otpCode: '834291',
  expiresInMinutes: 10,
} as EmailOtpEmailProps;

export default EmailOtpEmail;
