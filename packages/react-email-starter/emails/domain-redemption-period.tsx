import { Section } from '@react-email/components';
import {
  EmailLayout,
  EmailHeader,
  EmailFooter,
  EmailText,
  EmailButton,
  EmailSignature,
  EmailDetails,
} from './components';

interface DomainRedemptionPeriodEmailProps {
  userFirstname?: string;
  domainName?: string;
  expirationDate?: string;
  daysInRedemption?: number;
  redemptionFee?: string;
  renewalLink?: string;
  supportEmail?: string;
  supportPhone?: string;
}

export const DomainRedemptionPeriodEmail = ({
  userFirstname,
  domainName = 'example.com',
  expirationDate = 'March 15, 2024',
  daysInRedemption = 35,
  redemptionFee = '$80.00',
  renewalLink,
}: DomainRedemptionPeriodEmailProps) => {
  const daysLeft = Math.max(0, 60 - daysInRedemption);

  return (
    <EmailLayout preview={`Last chance to restore ${domainName}`}>
      <EmailHeader />
      <Section>
        <EmailText>Hello {userFirstname},</EmailText>
        <EmailText>
          Your domain <strong>{domainName}</strong> is in the redemption period. This is the last opportunity to restore it before it can be registered by someone else.
        </EmailText>
        <EmailDetails>
          <EmailText style={{ margin: '8px 0' }}>
            <strong>Domain:</strong> {domainName}
          </EmailText>
          <EmailText style={{ margin: '8px 0' }}>
            <strong>Expired:</strong> {expirationDate}
          </EmailText>
          <EmailText style={{ margin: '8px 0' }}>
            <strong>Days in redemption:</strong> {daysInRedemption}
          </EmailText>
          <EmailText style={{ margin: '8px 0' }}>
            <strong>Redemption fee:</strong> {redemptionFee}
          </EmailText>
          <EmailText style={{ margin: '8px 0' }}>
            <strong>Approximate time left:</strong> {daysLeft} days
          </EmailText>
        </EmailDetails>
        <EmailButton href={renewalLink || 'https://app.nisccloud.com/domains/redeem'}>
          Restore domain
        </EmailButton>
        <EmailText>
          Restoration requires the redemption fee plus the annual renewal. After this period, we cannot guarantee the domain will still be available.
        </EmailText>
        <EmailSignature />
      </Section>
      <EmailFooter />
    </EmailLayout>
  );
};

DomainRedemptionPeriodEmail.PreviewProps = {
  userFirstname: 'John Doe',
  domainName: 'example.com',
  expirationDate: 'March 15, 2024',
  daysInRedemption: 35,
  redemptionFee: '$80.00',
  renewalLink: 'https://app.nisccloud.com/domains/redeem',
  supportEmail: 'domains@nisccloud.com',
  supportPhone: '+254 748 777 666',
} as DomainRedemptionPeriodEmailProps;

export default DomainRedemptionPeriodEmail;
