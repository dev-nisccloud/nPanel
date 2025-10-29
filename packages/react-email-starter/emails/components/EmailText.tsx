import { Text } from '@react-email/components';
import { emailStyles } from './shared-styles';

interface EmailTextProps {
  children: React.ReactNode;
  style?: React.CSSProperties;
}

export const EmailText = ({ children, style }: EmailTextProps) => {
  return (
    <Text style={{ ...emailStyles.text, ...style }}>
      {children}
    </Text>
  );
};
