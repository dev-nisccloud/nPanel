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
  
  interface ResetPasswordEmailProps {
    userFirstname?: string;
    resetPasswordLink?: string;
  }
  
  export const ResetPasswordEmail = ({
    userFirstname,
    resetPasswordLink,
  }: ResetPasswordEmailProps) => {
    return (
      <EmailLayout preview="Reset your password">
        <EmailHeader />
        <Section>
          <EmailText>Hello {userFirstname},</EmailText>
          <EmailText>
            Someone recently requested a password change for your Nisc Cloud®
            account. If this was you, you can set a new password here:
          </EmailText>
          <EmailButton href={resetPasswordLink || '#'}>
            Reset password
          </EmailButton>
          <EmailText>
            If you don&apos;t want to change your password or didn&apos;t
            request this, just ignore this message, no changes will be made to your account.
          </EmailText>
          <EmailText>
            To keep your account secure, please don&apos;t forward this email
            to anyone. See our Help Center for{' '}
            <EmailLink href={resetPasswordLink || '#'}>
              more security tips.
            </EmailLink>
          </EmailText>
          <EmailSignature />
        </Section>
        <EmailFooter />
      </EmailLayout>
    );
  };
  
  ResetPasswordEmail.PreviewProps = {
    userFirstname: 'John Doe',
    resetPasswordLink: 'https://www.nisccloud.com',
  } as ResetPasswordEmailProps;
  
  export default ResetPasswordEmail;
  