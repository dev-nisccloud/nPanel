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

interface TeamInviteEmailProps {
  invitedUserEmail?: string;
  inviterName?: string;
  teamName?: string;
  teamRole?: string;
  acceptInviteLink?: string;
  expiresInDays?: number;
}

export const TeamInviteEmail = ({
  inviterName,
  teamName,
  teamRole = 'Member',
  acceptInviteLink,
  expiresInDays = 7,
}: TeamInviteEmailProps) => {
  return (
    <EmailLayout preview={`You've been invited to join ${teamName} on npanel`}>
      <EmailHeader />
      <Section>
        <EmailText>Hello,</EmailText>
        <EmailText>
          {inviterName} has invited you to join <strong>{teamName}</strong> on npanel as a {teamRole}.
        </EmailText>
        <EmailText>
          npanel is Nisc Cloud&apos;s comprehensive management platform for your cloud services.
          It helps teams manage domains, hosting services, WordPress installations, and all your
          Nisc Cloud resources from one centralized dashboard.
        </EmailText>
        <EmailText>
          By accepting this invitation, you will be able to:
        </EmailText>
        <EmailText style={{ marginLeft: '20px', lineHeight: '1.8' }}>
          • Collaborate with your team members<br />
          • Access and manage team resources<br />
          • View invoices and billing information<br />
          • Manage domains and hosting services<br />
          • Monitor team activity and usage
        </EmailText>
        <EmailButton href={acceptInviteLink || '#'}>
          Accept Invitation
        </EmailButton>
        <EmailText>
          Or copy and paste this link into your browser:
        </EmailText>
        <EmailText style={{
          wordBreak: 'break-all',
          color: '#666',
          fontSize: '14px',
          backgroundColor: '#f4f4f4',
          padding: '10px',
          borderRadius: '4px',
        }}>
          {acceptInviteLink}
        </EmailText>
        <EmailText style={{ color: '#666', fontSize: '14px' }}>
          This invitation will expire in {expiresInDays} days. If you don&apos;t accept it by then,
          you&apos;ll need to request a new invitation from {inviterName}.
        </EmailText>
        <EmailText>
          If you weren&apos;t expecting this invitation or don&apos;t want to join this team,
          you can safely ignore this email. No account will be created without your consent.
        </EmailText>
        <EmailText>
          If you have any questions about this invitation, please contact {inviterName} directly
          or reach out to our support team at{' '}
          <EmailLink href="mailto:support@nisccloud.com">
            support@nisccloud.com
          </EmailLink>
          .
        </EmailText>
        <EmailSignature />
      </Section>
      <EmailFooter />
    </EmailLayout>
  );
};

TeamInviteEmail.PreviewProps = {
  invitedUserEmail: 'john.doe@example.com',
  inviterName: 'Jane Smith',
  teamName: 'Acme Corporation',
  teamRole: 'Member',
  acceptInviteLink: 'https://app.nisccloud.com/accept-invite?code=abc123xyz',
  expiresInDays: 7,
} as TeamInviteEmailProps;

export default TeamInviteEmail;

