import { Section } from "@react-email/components";
import {
  EmailFooter,
  EmailHeader,
  EmailLayout,
  EmailSignature,
  EmailText,
} from "./components";

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
        <EmailText>Hello {userFirstname || "there"},</EmailText>
        <EmailText>
          Use the verification code below to finish signing in to your nPanel account.
        </EmailText>
        <EmailText
          style={{
            fontSize: "30px",
            fontWeight: 700,
            letterSpacing: "10px",
            textAlign: "center",
            margin: "28px 0",
          }}
        >
          {otpCode}
        </EmailText>
        <EmailText>
          This code expires in {expiresInMinutes} minutes and can only be used once.
        </EmailText>
        <EmailText>
          If you did not try to sign in, please reset your password and contact support
          immediately.
        </EmailText>
        <EmailSignature />
      </Section>
      <EmailFooter />
    </EmailLayout>
  );
};

EmailOtpEmail.PreviewProps = {
  userFirstname: "John Doe",
  otpCode: "834291",
  expiresInMinutes: 10,
} as EmailOtpEmailProps;

export default EmailOtpEmail;
