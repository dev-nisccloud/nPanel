import { Column, Img, Link, Row, Section, Text } from '@react-email/components';
import { companyBranding, emailStyles } from './shared-styles';

interface EmailFooterProps {
  showSocialLinks?: boolean;
  customAddress?: string;
  customEmail?: string;
  customPhone?: string;
}

export const EmailFooter = ({ 
  showSocialLinks = true,
  customAddress,
  customEmail,
  customPhone
}: EmailFooterProps) => {
  const address = customAddress || companyBranding.address;
  const email = customEmail || companyBranding.email;
  const phone = customPhone || companyBranding.phone;

  return (
    <Section style={emailStyles.footerSection}>
      <Row>
        <Column style={emailStyles.footerLeftColumn}>
          <Img
            alt={companyBranding.footerLogo.alt}
            height={companyBranding.footerLogo.height}
            src={companyBranding.footerLogo.src}
          />
          <Text style={emailStyles.footerTagline}>
            {companyBranding.tagline}
          </Text>
        </Column>
        <Column align="left" style={emailStyles.footerRightColumn}>
          <Row>
            <Text style={emailStyles.footerAddress}>
              {address}
            </Text>
            <Text style={emailStyles.footerContact}>
              {email}
            </Text>
            <Text style={emailStyles.footerContact}>
              {phone}
            </Text>
          </Row>
          {showSocialLinks && (
            <Row style={emailStyles.socialRow}>
              <Column style={emailStyles.socialColumn}>
                <Link href={companyBranding.socialLinks.facebook}>
                  <Img
                    alt="Facebook"
                    height="36"
                    src="https://react.email/static/facebook-logo.png"
                    width="36"
                  />
                </Link>
              </Column>
              <Column style={emailStyles.socialColumn}>
                <Link href={companyBranding.socialLinks.twitter}>
                  <Img alt="X" height="36" src="https://react.email/static/x-logo.png" width="36" />
                </Link>
              </Column>
              <Column style={emailStyles.socialColumn}>
                <Link href={companyBranding.socialLinks.instagram}>
                  <Img
                    alt="Instagram"
                    height="36"
                    src="https://react.email/static/instagram-logo.png"
                    width="36"
                  />
                </Link>
              </Column>
            </Row>
          )}
        </Column>
      </Row>
    </Section>
  );
};
