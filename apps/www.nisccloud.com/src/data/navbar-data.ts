import { MobileMenuGroup } from '@/components/shared/mobile-menu/MobileMenu';
import { FooterOneData } from '@/interface';

// Same order and structure as Navbar: Pricing, Services (Domains, Hosting, Email, Digital Marketing), Engage, Blog, Contact us, Get started
export const mobileMenuData: MobileMenuGroup[] = [
  {
    id: 'pricing',
    title: 'Pricing',
    submenu: [{ id: 'pricing', label: 'Pricing', href: '/pricing' }],
  },
  {
    id: 'domains',
    title: 'Domains',
    submenu: [
      { id: 'registration', label: 'Registration', href: '/domain-search' },
      { id: 'transfer', label: 'Transfer', href: '/services/domains' },
    ],
  },
  {
    id: 'hosting',
    title: 'Hosting',
    submenu: [
      { id: 'website-hosting', label: 'Website Hosting', href: '/services/website-hosting' },
      { id: 'wordpress-hosting', label: 'WordPress Hosting', href: '/services/wordpress-hosting' },
      { id: 'vps-hosting', label: 'VPS Hosting', href: '/services/vps-hosting' },
      { id: 'dedicated-hosting', label: 'Dedicated Hosting', href: '/services/dedicated-hosting' },
    ],
  },
  {
    id: 'email',
    title: 'Email',
    submenu: [
      { id: 'business-email', label: 'Business Email', href: '/services/business-email' },
      { id: 'email-marketing', label: 'Email Marketing', href: '/email-marketing' },
    ],
  },
  {
    id: 'digital-marketing',
    title: 'Digital Marketing',
    submenu: [
      { id: 'seo', label: 'SEO', href: '/services/seo' },
      { id: 'social-media-marketing', label: 'Social Media Marketing', href: '/services/social-media-marketing' },
      { id: 'media-buying', label: 'Media Buying', href: '/services/media-buying' },
      { id: 'ppc', label: 'Pay Per Click', href: '/services/pay-per-click' },
    ],
  },
  {
    id: 'engage',
    title: 'Engage',
    submenu: [
      { id: 'contact', label: 'Contact', href: '/contact-us' },
      { id: 'services', label: 'Services', href: '/services' },
      { id: 'careers', label: 'Careers', href: '/career' },
      { id: 'testimonials', label: 'Testimonials', href: '/testimonial' },
      { id: 'customers', label: 'Customers', href: '/customer' },
    ],
  },
  {
    id: 'blog',
    title: 'Blog',
    submenu: [{ id: 'blog', label: 'Blog', href: '/blog' }],
  },
  {
    id: 'contact-us',
    title: 'Contact us',
    submenu: [{ id: 'contact-us', label: 'Contact us', href: '/contact-us' }],
  },
  {
    id: 'get-started',
    title: 'Get started',
    submenu: [{ id: 'signup', label: 'Get started', href: '/signup' }],
  },
];

export const footerData: FooterOneData[] = [
  {
    title: 'Company',
    links: [
      { label: 'About Us', href: '/about' },
      { label: 'Career', href: '/career' },
      { label: 'Case Studies', href: '#' },
      { label: 'Contact Us', href: '/contact-us' },
    ],
  },
  {
    title: 'Support',
    links: [
      { label: 'FAQ', href: '/faq' },
      { label: 'Documentation', href: '#' },
      { label: 'Tutorial', href: '/tutorial' },
      { label: 'Community', href: '/community' },
    ],
  },
  {
    title: 'Legal Policies',
    links: [
      { label: 'Terms & Conditions', href: '/terms-conditions' },
      { label: 'Privacy Policy', href: '/privacy-policy' },
      { label: 'Refund Policy', href: '/refund-policy' },
      { label: 'GDPR Compliance', href: '/gdpr' },
      { label: 'Affiliate Policy', href: '#' },
    ],
  },
];
