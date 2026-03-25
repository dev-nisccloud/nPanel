import { Section } from '@react-email/components';
import { 
  EmailLayout, 
  EmailHeader, 
  EmailFooter, 
  EmailText, 
  EmailButton, 
  EmailSignature 
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
    <EmailLayout preview="Your agency account has been created - Nisc Cloud">
      <EmailHeader />
      <Section>
        <EmailText>Hello {userFirstname},</EmailText>
        <EmailText>
          An agency user account has been created for you on Nisc Cloud. You now have access to the agency dashboard where you can manage clients, services, and team resources.
        </EmailText>
        <EmailText>
          <strong>Your account details:</strong>
        </EmailText>
        <EmailText>
          <strong>Email:</strong> {email}
        </EmailText>
        <EmailText>
          <strong>Password:</strong> {password}
        </EmailText>
        <EmailText>
          <strong>Role:</strong> {role}
        </EmailText>
        <EmailText>
          You can log in to your agency dashboard using the button below:
        </EmailText>
        <EmailButton href={loginLink || '#'}>
          Log in to Agency Dashboard
        </EmailButton>
        <EmailText>
          <strong>Important Security Notice:</strong>
        </EmailText>
        <EmailText>
          For security purposes, we strongly recommend that you change your password to a secure one of your choice after your first login.
        </EmailText>
        <EmailText>
          As an agency user, you have access to various administrative functions. If you have any questions about your role or permissions, please contact your administrator.
        </EmailText>
        <EmailText>
          If you have any questions or need assistance, feel free to reach out to our support team. We're here to help!
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

