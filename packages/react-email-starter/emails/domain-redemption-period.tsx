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
  domainName = "example.com",
  expirationDate = "March 15, 2024",
  daysInRedemption = 35,
  redemptionFee = "$80.00",
  renewalLink,
  supportEmail = "domains@nisccloud.com",
  supportPhone = "+254 748 777 666"
}: DomainRedemptionPeriodEmailProps) => {
  return (
    <EmailLayout preview={`FINAL CHANCE: Domain ${domainName} in redemption period`}>
      <EmailHeader />
      <Section>
        <EmailText>Hello {userFirstname},</EmailText>
        <EmailText>
          <strong style={{ color: '#dc2626' }}>FINAL CHANCE:</strong> Your domain{' '}
          <strong>{domainName}</strong> is now in the redemption period. This is your 
          last opportunity to restore your domain before it becomes available for public registration.
        </EmailText>
        <EmailText>
          Your domain expired on <strong>{expirationDate}</strong> and has been in the 
          redemption period for <strong>{daysInRedemption} days</strong>.
        </EmailText>
        
        {/* Redemption Details Box */}
        <div style={{
          backgroundColor: '#fef2f2',
          border: '2px solid #dc2626',
          borderRadius: '8px',
          padding: '20px',
          margin: '20px 0',
        }}>
          <EmailText style={{ margin: '0 0 10px 0', fontWeight: 'bold', color: '#dc2626' }}>
            Redemption Period Details:
          </EmailText>
          <EmailText style={{ margin: '5px 0' }}>
            Domain Name: {domainName}
          </EmailText>
          <EmailText style={{ margin: '5px 0' }}>
            Expiration Date: {expirationDate}
          </EmailText>
          <EmailText style={{ margin: '5px 0' }}>
            Days in Redemption: {daysInRedemption}
          </EmailText>
          <EmailText style={{ margin: '5px 0' }}>
            Redemption Fee: {redemptionFee}
          </EmailText>
          <EmailText style={{ margin: '5px 0', color: '#dc2626', fontWeight: 'bold' }}>
            Status: REDEMPTION PERIOD
          </EmailText>
        </div>

        <EmailText>
          <strong>What is the Redemption Period?</strong>
        </EmailText>
        <EmailText>
          The redemption period is a 30-day grace period after domain expiration where 
          you can still restore your domain, but additional fees apply. After this period, 
          your domain will be released and available for anyone to register.
        </EmailText>

        <EmailText>
          <strong>Time Remaining:</strong>
        </EmailText>
        <EmailText>
          • You have approximately {Math.max(0, 60 - daysInRedemption)} days left to restore your domain
        </EmailText>
        <EmailText>
          • After the redemption period, your domain will be permanently lost
        </EmailText>
        <EmailText>
          • Restoration requires payment of the redemption fee plus renewal fees
        </EmailText>

        <EmailButton 
          href={renewalLink || 'https://app.nisccloud.com/domains/redeem'}
          style={{ 
            backgroundColor: '#dc2626',
            color: '#fff',
            textDecoration: 'none',
            textAlign: 'center' as const,
            display: 'block',
            width: '280px',
            padding: '16px 7px',
            margin: '0 auto',
            borderRadius: '4px',
            fontFamily: "'Inter', 'Inter Sans Serif', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif",
            fontSize: '16px',
            fontWeight: 'bold',
          }}
        >
          RESTORE DOMAIN NOW
        </EmailButton>

        <EmailText>
          <strong>Restoration Costs:</strong>
        </EmailText>
        <EmailText>
          • Redemption Fee: {redemptionFee}
        </EmailText>
        <EmailText>
          • Annual Renewal Fee: Standard renewal rate
        </EmailText>
        <EmailText>
          • Total Cost: Redemption fee + renewal fee
        </EmailText>

        <EmailText>
          <strong>Important Notes:</strong>
        </EmailText>
        <EmailText>
          • Restoration must be completed before the redemption period ends
        </EmailText>
        <EmailText>
          • Once released, your domain may be registered by anyone
        </EmailText>
        <EmailText>
          • We cannot guarantee domain availability after release
        </EmailText>
        <EmailText>
          • Consider registering alternative domains as backup
        </EmailText>

        <EmailText>
          <strong>Need Immediate Help?</strong> Contact our domain restoration specialists:
        </EmailText>
        <EmailText>
          • Email us at{' '}
          <EmailLink href={`mailto:${supportEmail}`}>
            {supportEmail}
          </EmailLink>
        </EmailText>
        <EmailText>
          • Call our support team at{' '}
          <EmailLink href={`tel:${supportPhone}`}>
            {supportPhone}
          </EmailLink>
        </EmailText>
        <EmailText>
          We strongly recommend acting quickly to restore your domain and avoid permanent loss.
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
