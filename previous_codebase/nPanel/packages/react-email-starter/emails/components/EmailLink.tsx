import { Link } from '@react-email/components';
import { emailStyles } from './shared-styles';

interface EmailLinkProps {
  children: React.ReactNode;
  href: string;
  style?: React.CSSProperties;
}

export const EmailLink = ({ children, href, style }: EmailLinkProps) => {
  return (
    <Link style={{ ...emailStyles.anchor, ...style }} href={href}>
      {children}
    </Link>
  );
};
