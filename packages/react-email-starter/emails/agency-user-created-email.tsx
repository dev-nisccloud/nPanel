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
  password?: string;
  role?: string;
  loginLink?: string;
}

export const AgencyUserCreatedEmail = ({
  userFirstname,
  email,
  password,
  role,
  loginLink,
}: AgencyUserCreatedEmailProps) => {
  return (
    <EmailLayout preview="Your agency account has been created - Nisc Cloud®">
      <EmailHeader />
      <Section>
        <EmailText>Hello {userFirstname},</EmailText>
        <EmailText>
          An agency user account has been created for you with Nisc Cloud®. You now have access to the nPanel agency dashboard.
        </EmailText>
        <EmailDetails title="Your account details">
          <EmailText style={{ margin: '8px 0' }}>
            <strong>Email:</strong> {email}
          </EmailText>
          <EmailText style={{ margin: '8px 0' }}>
            <strong>Password:</strong> {password}
          </EmailText>
          <EmailText style={{ margin: '8px 0' }}>
            <strong>Role:</strong> {role}
          </EmailText>
        </EmailDetails>
        <EmailButton href={loginLink || '#'}>
          Log in to nPanel
        </EmailButton>
        <EmailText>
          <strong>Important:</strong> Change this password to one of your choosing after your first login.
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
  password: 'TempPassword123!',
  role: 'AGENCY_USER',
  loginLink: 'https://app.nisccloud.com/login',
} as AgencyUserCreatedEmailProps;

export default AgencyUserCreatedEmail;
