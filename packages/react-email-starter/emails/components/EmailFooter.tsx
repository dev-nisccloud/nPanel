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

  const websiteDisplay = companyBranding.website.replace(/^https?:\/\//, "");

  return (
    <Section style={emailStyles.footerSection}>
      <Row>
        <Column align="left" style={emailStyles.footerLeftColumn}>
          <Row>
            <Text style={emailStyles.footerAddress}>
              {address}
            </Text>
            <Text style={emailStyles.footerContact}>
              {email}
            </Text>
            <Text style={emailStyles.footerContact}>
              <Link href={companyBranding.website} style={emailStyles.footerContactLink}>
                {websiteDisplay}
              </Link>
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
        <Column align="right" style={emailStyles.footerRightColumn}>
          <Img
            alt={companyBranding.footerLogo.alt}
            width={companyBranding.footerLogo.width}
            height={companyBranding.footerLogo.height}
            src={companyBranding.footerLogo.src}
            style={emailStyles.footerLogoImg}
          />
        </Column>
      </Row>
    </Section>
  );
};
