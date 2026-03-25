import { Img } from '@react-email/components';
import { companyBranding } from './shared-styles';

interface EmailHeaderProps {
  logoWidth?: string;
  logoHeight?: string;
  showCompanyName?: boolean;
}

export const EmailHeader = ({ 
  logoWidth = companyBranding.logo.width,
  logoHeight = companyBranding.logo.height,
}: EmailHeaderProps) => {
  return (
    <Img
      src={companyBranding.logo.src}
      width={logoWidth}
      height={logoHeight}
      alt={companyBranding.logo.alt}
    />
  );
};
