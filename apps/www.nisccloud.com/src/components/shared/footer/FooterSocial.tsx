import behanceIcon from '@public/images/icons/behance.svg';
import dribbbleIcon from '@public/images/icons/dribbble.svg';
import facebookIcon from '@public/images/icons/facebook.svg';
import instagramIcon from '@public/images/icons/instagram.svg';
import linkedinIcon from '@public/images/icons/linkedin.svg';
import youtubeIcon from '@public/images/icons/youtube.svg';
import Image from 'next/image';
import Link from 'next/link';

const FooterSocial = () => {
  return (
    <div className="flex items-center gap-3">
      <Link href="#" className="footer-social-link">
        <span className="sr-only">Facebook</span>
        <Image src={facebookIcon} alt="Facebook" width={24} height={24} className="size-6" />
      </Link>
      <div className="bg-stroke-1/20 h-6 w-px"></div>
      <Link href="#" className="footer-social-link">
        <span className="sr-only">Instagram</span>
        <Image src={instagramIcon} alt="Instagram" width={24} height={24} className="size-6" />
      </Link>
      <div className="bg-stroke-1/20 h-6 w-px"></div>
      <Link href="#" className="footer-social-link">
        <span className="sr-only">Youtube</span>
        <Image src={youtubeIcon} alt="Youtube" width={24} height={24} className="size-6" />
      </Link>
      <div className="bg-stroke-1/20 h-6 w-px"></div>
      <Link href="#" className="footer-social-link">
        <span className="sr-only">LinkedIn</span>
        <Image src={linkedinIcon} alt="LinkedIn" width={24} height={24} className="size-6" />
      </Link>
      <div className="bg-stroke-1/20 h-6 w-px"></div>
      <Link href="#" className="footer-social-link">
        <span className="sr-only">Dribbble</span>
        <Image src={dribbbleIcon} alt="Dribbble" width={24} height={24} className="size-6" />
      </Link>
      <div className="bg-stroke-1/20 h-6 w-px"></div>
      <Link href="#" className="footer-social-link">
        <span className="sr-only">Behance</span>
        <Image src={behanceIcon} alt="Behance" width={24} height={24} className="size-6" />
      </Link>
    </div>
  );
};

FooterSocial.displayName = 'FooterSocial';
export default FooterSocial;
