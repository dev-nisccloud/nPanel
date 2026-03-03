import { FooterData } from '@/interface';

export const footerLinks: FooterData[] = [
  {
    title: 'Company',
    links: [
      { label: 'About', href: '/about' },
      { label: 'Team', href: '/team' },
      { label: 'Why Choose Us', href: '/why-choose-us' },
      { label: 'Success Stories', href: '/success-stories' },
      { label: 'Contact Us', href: '/contact-us' },
    ],
  },
  {
    title: 'Support',
    links: [
      { label: 'FAQ', href: '/faq' },
      { label: 'Security', href: '/security' },
      { label: 'Whitepaper', href: '/whitepaper' },
      { label: 'Download', href: '/download' },
    ],
  },
  {
    title: 'Legal Policies',
    links: [
      { label: 'Terms & Conditions', href: '/terms-conditions' },
      { label: 'Privacy Policy', href: '/privacy-policy' },
      { label: 'Refund Policy', href: '/refund-policy' },
      { label: 'Referral Program', href: '/referral-program' },
      { label: 'GDPR', href: '/gdpr' },
      { label: 'Legal', href: '/legal' },
    ],
  },
];
