import { Body, Container, Head, Html } from '@react-email/components';
import { emailStyles } from './shared-styles';

interface EmailLayoutProps {
  children: React.ReactNode;
  preview?: string;
}

export const EmailLayout = ({ children, preview }: EmailLayoutProps) => {
  return (
    <Html>
      <Head />
      <Body style={emailStyles.main}>
        {preview && <div style={{ display: 'none' }}>{preview}</div>}
        <Container style={emailStyles.container}>
          {children}
        </Container>
      </Body>
    </Html>
  );
};
