import { Button } from '@react-email/components';
import { emailStyles } from './shared-styles';

interface EmailButtonProps {
  children: React.ReactNode;
  href: string;
  style?: React.CSSProperties;
}

export const EmailButton = ({ children, href, style }: EmailButtonProps) => {
  return (
    <Button style={{ ...emailStyles.button, ...style }} href={href}>
      {children}
    </Button>
  );
};
