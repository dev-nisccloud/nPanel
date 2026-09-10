import { Section } from '@react-email/components';
import {
  EmailLayout,
  EmailHeader,
  EmailFooter,
  EmailText,
  EmailButton,
  EmailSignature,
} from './components';

export type AccountEmailChangePurpose = 'confirm' | 'verify';

interface AccountEmailChangeEmailProps {
  userFirstname?: string;
  newEmail?: string;
  actionLink?: string;
  /** confirm = approve from current email; verify = confirm ownership of new email */
  purpose?: AccountEmailChangePurpose;
}

export const AccountEmailChangeEmail = ({
  userFirstname,
  newEmail,
  actionLink,
  purpose = 'confirm',
}: AccountEmailChangeEmailProps) => {
  const isConfirm = purpose === 'confirm';
  const preview = isConfirm
    ? 'Approve your account email change'
    : 'Verify your new account email';
  const buttonLabel = isConfirm ? 'Approve email change' : 'Verify new email';

  return (
    <EmailLayout preview={preview}>
      <EmailHeader />
      <Section>
        <EmailText>Hello {userFirstname},</EmailText>
        {isConfirm ? (
          <EmailText>
            A request was made to change the email address on your Nisc Cloud® account to{' '}
            <strong>{newEmail || 'a new address'}</strong>. If this was you, approve the change below. We will then send a verification link to the new address.
          </EmailText>
        ) : (
          <EmailText>
            You approved an email change for your Nisc Cloud® account. Verify that you own{' '}
            <strong>{newEmail || 'this address'}</strong> to complete the update. Your account email will only change after this step.
          </EmailText>
        )}
        <EmailButton href={actionLink || '#'}>{buttonLabel}</EmailButton>
        <EmailText>
          If you did not request this change, you can ignore this email. No changes will be made to your account.
        </EmailText>
        <EmailSignature />
      </Section>
      <EmailFooter />
    </EmailLayout>
  );
};

AccountEmailChangeEmail.PreviewProps = {
  userFirstname: 'John Doe',
  newEmail: 'new-email@example.com',
  actionLink: 'https://www.nisccloud.com',
  purpose: 'confirm',
} as AccountEmailChangeEmailProps;

export default AccountEmailChangeEmail;
