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
    <EmailLayout preview={`You've been invited to join ${teamName} on nPanel`}>
      <EmailHeader />
      <Section>
        <EmailText>Hello,</EmailText>
        <EmailText>
          {inviterName} has invited you to join <strong>{teamName}</strong> on nPanel.
        </EmailText>
        <EmailDetails>
          <EmailText style={{ margin: '8px 0' }}>
            <strong>Team:</strong> {teamName}
          </EmailText>
          <EmailText style={{ margin: '8px 0' }}>
            <strong>Role:</strong> {teamRole}
          </EmailText>
          <EmailText style={{ margin: '8px 0' }}>
            <strong>Invited by:</strong> {inviterName}
          </EmailText>
        </EmailDetails>
        <EmailButton href={acceptInviteLink || '#'}>
          Accept invitation
        </EmailButton>
        <EmailText>
          This invitation expires in {expiresInDays} days. If you were not expecting it, you can ignore this email. No account will be created unless you accept.
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
