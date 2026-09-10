import { emailStyles } from './shared-styles';

interface EmailItemProps {
  isLast?: boolean;
  children: React.ReactNode;
}

export const EmailItem = ({ isLast = false, children }: EmailItemProps) => {
  return (
    <div style={isLast ? emailStyles.itemBlockLast : emailStyles.itemBlock}>
      {children}
    </div>
  );
};
