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

interface AgencyUserCreatedEmailProps {
  userFirstname?: string;
  email?: string;
  role?: string;
  setPasswordLink?: string;
}

export const AgencyUserCreatedEmail = ({
  userFirstname,
  email,
  role,
  setPasswordLink,
}: AgencyUserCreatedEmailProps) => {
  return (
    <EmailLayout preview="Your Nisc HQ account has been created - Nisc Cloud®">
      <EmailHeader />
      <Section>
        <EmailText>Hello {userFirstname},</EmailText>
        <EmailText>
          A Nisc HQ account has been created for you with Nisc Cloud®. Set your password to confirm your email and open Nisc HQ in nPanel.
        </EmailText>
        <EmailDetails title="Your account">
          <EmailText style={{ margin: '8px 0' }}>
            <strong>Email:</strong> {email}
          </EmailText>
          <EmailText style={{ margin: '8px 0' }}>
            <strong>Role:</strong> {role}
          </EmailText>
        </EmailDetails>
        <EmailButton href={setPasswordLink || '#'}>
          Set your password
        </EmailButton>
        <EmailText>
          This link works once and expires in 72 hours. If it expires, use &quot;Forgot your password?&quot; on the sign-in page.
        </EmailText>
        <EmailSignature />
      </Section>
      <EmailFooter />
    </EmailLayout>
  );
};

AgencyUserCreatedEmail.PreviewProps = {
  userFirstname: 'Jane Smith',
  email: 'jane.smith@agency.com',
  role: 'AGENCY_USER',
  setPasswordLink: 'https://app.nisccloud.com/auth/reset-password?token=example&welcome=1',
} as AgencyUserCreatedEmailProps;

export default AgencyUserCreatedEmail;
