import { Section } from '@react-email/components';
import {
  EmailButton,
  EmailFooter,
  EmailHeader,
  EmailLayout,
  EmailSignature,
  EmailText,
  emailStyles,
} from './components';

interface CheckoutEmailCodeEmailProps {
  otpCode?: string;
  expiresInMinutes?: number;
  /** Set when the email already has an account: no code, just a sign-in link. */
  signInLink?: string;
}

export const CheckoutEmailCodeEmail = ({
  otpCode,
  expiresInMinutes = 10,
  signInLink,
}: CheckoutEmailCodeEmailProps) => {
  if (signInLink) {
    return (
      <EmailLayout preview="You already have a Nisc Cloud account">
        <EmailHeader />
        <Section>
          <EmailText>Hello,</EmailText>
          <EmailText>
            Someone started a checkout on nisccloud.com with this email address. You already have a Nisc Cloud account, so sign in to finish your purchase.
          </EmailText>
          <EmailButton href={signInLink}>Sign in to continue</EmailButton>
          <EmailText>
            If this wasn&apos;t you, you can ignore this email. Nothing has been charged or changed.
          </EmailText>
          <EmailSignature />
        </Section>
        <EmailFooter />
      </EmailLayout>
    );
  }

  return (
    <EmailLayout preview={`Your Nisc Cloud checkout code is ${otpCode}`}>
      <EmailHeader />
      <Section>
        <EmailText>Hello,</EmailText>
        <EmailText>
          Enter this code on nisccloud.com to confirm your email and continue to payment.
        </EmailText>
        <EmailText style={emailStyles.otpCode}>{otpCode}</EmailText>
        <EmailText>
          This code expires in {expiresInMinutes} minutes and can only be used once. If you didn&apos;t start a checkout, you can ignore this email.
        </EmailText>
        <EmailSignature />
      </Section>
      <EmailFooter />
    </EmailLayout>
  );
};

CheckoutEmailCodeEmail.PreviewProps = {
  otpCode: '834291',
  expiresInMinutes: 10,
} as CheckoutEmailCodeEmailProps;

export default CheckoutEmailCodeEmail;
