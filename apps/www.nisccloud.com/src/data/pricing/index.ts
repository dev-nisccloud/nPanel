export type PlanId = 'essential' | 'advanced' | 'enterprise';

export type FeatureId =
  | 'pages'
  | 'customBranding'
  | 'customDesign'
  | 'comprehensiveBranding'
  | 'seoOptimization'
  | 'brandingSupport'
  | 'tailoredAssistance'
  | 'expertGuidance'
  | 'strategicSupport'
  | 'professionalHelp'
  | 'innovativeStrategies'
  | 'effectiveSolutions'
  | 'holisticSupport'
  | 'dynamicOptions'
  | 'insightfulAdvice'
  | 'valueDrivenSupport';

export type PricingPlan = {
  id: PlanId;
  title: string;
  priceLabel: string;
  description: string;
  limit: string;
  delay: number;
  variant: 'standard' | 'highlight';
};

export type FeatureRow = {
  id: FeatureId;
  label: string;
  availability: Record<PlanId, boolean>;
};

export type PricingCategoryId =
  | 'website-hosting'
  | 'vps-hosting'
  | 'business-email-hosting'
  | 'email-marketing'
  | 'wordpress-hosting'
  | 'dedicated-hosting'
  | 'social-media-marketing'
  | 'media-buying'
  | 'seo'
  | 'pay-per-click';

export type PricingCategory = {
  id: PricingCategoryId;
  label: string;
  heading: string;
  description: string;
  plans: PricingPlan[];
  features: FeatureRow[];
};

const baseFeatureMatrix: FeatureRow[] = [
  {
    id: 'pages',
    label: 'Core features included',
    availability: { essential: true, advanced: true, enterprise: true },
  },
  {
    id: 'customBranding',
    label: 'Branding and setup support',
    availability: { essential: true, advanced: true, enterprise: true },
  },
  {
    id: 'customDesign',
    label: 'Done‑for‑you configuration',
    availability: { essential: false, advanced: true, enterprise: true },
  },
  {
    id: 'comprehensiveBranding',
    label: 'Full strategy and onboarding',
    availability: { essential: false, advanced: false, enterprise: true },
  },
  {
    id: 'seoOptimization',
    label: 'Performance & optimisation checks',
    availability: { essential: true, advanced: true, enterprise: false },
  },
  {
    id: 'brandingSupport',
    label: 'Ongoing support',
    availability: { essential: true, advanced: false, enterprise: true },
  },
  {
    id: 'tailoredAssistance',
    label: 'Tailored assistance',
    availability: { essential: false, advanced: true, enterprise: true },
  },
  {
    id: 'expertGuidance',
    label: 'Expert guidance',
    availability: { essential: true, advanced: false, enterprise: false },
  },
  {
    id: 'strategicSupport',
    label: 'Strategic support',
    availability: { essential: true, advanced: true, enterprise: true },
  },
  {
    id: 'professionalHelp',
    label: 'Professional help',
    availability: { essential: false, advanced: false, enterprise: true },
  },
  {
    id: 'innovativeStrategies',
    label: 'Advanced recommendations',
    availability: { essential: false, advanced: true, enterprise: true },
  },
  {
    id: 'effectiveSolutions',
    label: 'Account reviews',
    availability: { essential: true, advanced: true, enterprise: false },
  },
  {
    id: 'holisticSupport',
    label: 'Priority support',
    availability: { essential: false, advanced: false, enterprise: true },
  },
  {
    id: 'dynamicOptions',
    label: 'Flexible options',
    availability: { essential: false, advanced: true, enterprise: true },
  },
  {
    id: 'insightfulAdvice',
    label: 'Insights and best practices',
    availability: { essential: false, advanced: false, enterprise: true },
  },
  {
    id: 'valueDrivenSupport',
    label: 'Value‑driven support',
    availability: { essential: false, advanced: false, enterprise: true },
  },
];

const basePlans: PricingPlan[] = [
  {
    id: 'essential',
    title: 'Starter',
    priceLabel: 'From $9/mo',
    description: 'Good for trying things out or smaller projects.',
    limit: 'Best for individuals and small teams',
    delay: 0.5,
    variant: 'standard',
  },
  {
    id: 'advanced',
    title: 'Growth',
    priceLabel: 'From $29/mo',
    description: 'More power and support for growing businesses.',
    limit: 'Best for growing businesses',
    delay: 0.6,
    variant: 'highlight',
  },
  {
    id: 'enterprise',
    title: 'Scale',
    priceLabel: 'Talk to sales',
    description: 'Tailored plans for larger or complex setups.',
    limit: 'Best for larger teams and enterprises',
    delay: 0.7,
    variant: 'standard',
  },
];

export const pricingCategories: PricingCategory[] = [
  {
    id: 'website-hosting',
    label: 'Web Hosting',
    heading: 'Website Hosting pricing',
    description: 'Fast, secure hosting options for business websites and online shops.',
    plans: basePlans,
    features: baseFeatureMatrix,
  },
  {
    id: 'vps-hosting',
    label: 'VPS Hosting',
    heading: 'VPS Hosting pricing',
    description: 'Virtual private servers with more power, control, and room to grow.',
    plans: basePlans,
    features: baseFeatureMatrix,
  },
  {
    id: 'business-email-hosting',
    label: 'Business Email Hosting',
    heading: 'Business Email pricing',
    description: 'Professional email plans that match your domain and scale with your team.',
    plans: basePlans,
    features: baseFeatureMatrix,
  },
  {
    id: 'email-marketing',
    label: 'Email Marketing',
    heading: 'Email Marketing pricing',
    description: 'Email campaign plans with an easy drag‑and‑drop builder and clear reports.',
    plans: basePlans,
    features: baseFeatureMatrix,
  },
  // {
  //   id: 'wordpress-hosting',
  //   label: 'WordPress Hosting',
  //   heading: 'WordPress Hosting pricing',
  //   description: 'Managed WordPress hosting tuned for speed, security, and updates.',
  //   plans: basePlans,
  //   features: baseFeatureMatrix,
  // },
  {
    id: 'dedicated-hosting',
    label: 'Dedicated Hosting',
    heading: 'Dedicated Hosting pricing',
    description: 'Dedicated servers for your most demanding and sensitive workloads.',
    plans: basePlans,
    features: baseFeatureMatrix,
  },
  // {
  //   id: 'social-media-marketing',
  //   label: 'Social Media Marketing',
  //   heading: 'Social Media Marketing pricing',
  //   description: 'Plans for strategy, content, and management across your key platforms.',
  //   plans: basePlans,
  //   features: baseFeatureMatrix,
  // },
  // {
  //   id: 'media-buying',
  //   label: 'Media Buying',
  //   heading: 'Media Buying pricing',
  //   description: 'Support for planning, booking, and optimising media across channels.',
  //   plans: basePlans,
  //   features: baseFeatureMatrix,
  // },
  // {
  //   id: 'seo',
  //   label: 'SEO',
  //   heading: 'SEO pricing',
  //   description: 'Search optimisation packages to help more people find you online.',
  //   plans: basePlans,
  //   features: baseFeatureMatrix,
  // },
  // {
  //   id: 'pay-per-click',
  //   label: 'Pay Per Click',
  //   heading: 'PPC pricing',
  //   description: 'Pay‑per‑click management for campaigns you can track and improve.',
  //   plans: basePlans,
  //   features: baseFeatureMatrix,
  // },
];

