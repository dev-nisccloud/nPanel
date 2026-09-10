import { EmailText } from './EmailText';
import { emailStyles } from './shared-styles';

interface EmailDetailsProps {
  title?: string;
  children: React.ReactNode;
}

export const EmailDetails = ({ title, children }: EmailDetailsProps) => {
  return (
    <div style={emailStyles.detailsBox}>
      {title && (
        <EmailText style={emailStyles.detailsTitle}>{title}</EmailText>
      )}
      {children}
    </div>
  );
};
