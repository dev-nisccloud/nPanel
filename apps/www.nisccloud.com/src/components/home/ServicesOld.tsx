'use client';

import { cn } from '@/utils/cn';
import Image from 'next/image';
import RevealAnimation from '../animation/RevealAnimation';
import LinkButton from '../ui/button/Button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tab-v2';

interface Tab {
  id: string;
  label: string;
}

interface ServiceData {
  id: string;
  title: string;
  description: string;
  image: string;
  imageAlt: string;
  slug: string;
}

const Services = () => {
  const tabs: Tab[] = [
    { id: 'payments', label: 'Payments' },
    { id: 'analytics', label: 'Analytics' },
    { id: 'invoices', label: 'Invoices' },
    { id: 'security', label: 'Security' },
    { id: 'automation', label: 'Automation' },
  ];

  const servicesData: ServiceData[] = [
    {
      id: 'payments',
      title: 'Effortless payment management',
      description:
        'Our comprehensive payment management system provides instant notifications for every transaction, detailed payment history with advanced filtering options, and seamless integration with multiple payment gateways. Monitor incoming and outgoing payments, set up recurring payment schedules, and gain complete visibility into your cash flow with intuitive dashboards and customizable reports.',
      image: '/images/ns-img-561.png',
      imageAlt:
        'Financial management platform showing payment processing dashboard with real-time transaction tracking',
      slug: 'effortless-payment-management',
    },
    {
      id: 'analytics',
      title: 'Actionable financial insights',
      description:
        'Monitor performance, track trends, and make smarter decisions with real-time analytics and clear reporting. Our advanced analytics engine transforms raw financial data into actionable insights through interactive dashboards, customizable KPI tracking, and predictive trend analysis. Visualize revenue patterns, identify growth opportunities, and understand spending behaviors with comprehensive charts and graphs.',
      image: '/images/ns-img-577.png',
      imageAlt:
        'Financial analytics dashboard displaying real-time performance metrics, trends, and data-driven insights for business decision making',
      slug: 'actionable-financial-insights',
    },
    {
      id: 'invoices',
      title: 'Simple, smart invoicing',
      description:
        'Create, send, and manage invoices effortlessly while keeping every transaction organized and on time. Streamline your billing process with professional invoice templates that can be customized with your branding, automated invoice generation based on recurring services, and intelligent payment reminders to reduce late payments. Track invoice status in real-time, from draft to sent, viewed, and paid, with automatic updates and notifications.',
      image: '/images/ns-img-576.png',
      imageAlt:
        'Invoice management system interface showing automated invoice creation, sending, and payment tracking features',
      slug: 'simple-smart-invoicing',
    },
    {
      id: 'security',
      title: 'Built-in payment protection',
      description:
        'Keep every transaction secure with advanced encryption, compliance, and full data control. Our enterprise-grade security infrastructure employs bank-level encryption protocols, multi-factor authentication, and continuous monitoring to protect your financial data. We maintain strict compliance with industry standards including PCI DSS, GDPR, and SOC 2, ensuring your sensitive information meets the highest security benchmarks.',
      image: '/images/ns-img-578.png',
      imageAlt:
        'Enterprise-grade security features including encryption, compliance protocols, and data protection controls for financial transactions',
      slug: 'built-in-payment-protection',
    },
    {
      id: 'automation',
      title: 'Payments that run themselves',
      description:
        'Automate workflows, reduce manual tasks, and streamline operations with intelligent payment automation. Transform your financial processes with smart automation rules that handle repetitive tasks automatically, from scheduled payments and recurring billing to invoice generation and payment reconciliation. Create custom workflows that trigger actions based on specific conditions, reducing human error and ensuring consistency.',
      image: '/images/ns-img-575.png',
      imageAlt:
        'Intelligent payment automation system with workflow management tools for streamlining financial operations and reducing manual tasks',
      slug: 'payments-that-run-themselves',
    },
  ];

  return (
    <Tabs defaultValue="payments">
      <section className="py-18 md:py-20 lg:py-24 xl:py-39">
        <div className="main-container">
          <div className="space-y-8">
            {/* tab list */}
            <RevealAnimation delay={0.1}>
              <TabsList
                className="md:bg-background-3 grid w-full items-center justify-center gap-3 p-1 max-sm:!grid-cols-12 md:flex-nowrap md:gap-1 md:rounded-full"
                style={{ gridTemplateColumns: 'repeat(15, 1fr)' }}>
                {tabs.map((tab) => (
                  <TabsTrigger
                    key={tab.id}
                    value={tab.id}
                    ariaLabel={`${tab.label} service tab`}
                    className={cn(
                      'font-inter-tight text-tagline-1 bg-background-4 rounded-2xl px-6 py-[14px] font-medium md:rounded-[80px] md:bg-white',
                      tab.id === 'automation' ? 'col-span-12 sm:col-span-3' : 'col-span-6 sm:col-span-3',
                    )}>
                    <span className="relative z-20">{tab.label}</span>
                  </TabsTrigger>
                ))}
              </TabsList>
            </RevealAnimation>

            {/* tab content */}
            {servicesData.map((service) => (
              <TabsContent
                key={service.id}
                value={service.id}
                display="flex"
                className="h-auto flex-col items-center justify-center md:flex-row xl:h-[624px]">
                <figure className="h-[380px] w-full max-w-[450px] overflow-hidden rounded-t-[28px] md:rounded-t-none md:rounded-l-[28px] lg:h-[480px] lg:max-w-[500px] xl:h-auto xl:max-w-[645px]">
                  <Image
                    src={service.image}
                    alt={service.imageAlt}
                    width={645}
                    height={624}
                    className="size-full object-cover"
                    priority
                  />
                </figure>

                <div className="bg-background-2 flex h-[380px] max-w-[450px] items-center justify-center rounded-b-[28px] pr-4 pl-4 md:w-auto md:rounded-r-[28px] md:rounded-b-none md:pr-14 md:pl-[42px] lg:h-[480px] lg:rounded-br-[28px] xl:h-[624px] xl:max-w-[645px]">
                  <div className="space-y-12 xl:space-y-39">
                    <div className="max-w-[547px] space-y-2 text-center md:text-left">
                      <h3 id={`heading-${service.id}`} className="text-heading-4 text-secondary font-normal">
                        {service.title}
                      </h3>
                      <p className="line-clamp-4 lg:line-clamp-none">{service.description}</p>
                    </div>

                    <div className="pointer-events-auto">
                      <LinkButton
                        href={`/services/${service.slug}`}
                        className="btn-v3-secondary btn-v3-lg mx-auto sm:mx-0">
                        Learn more
                      </LinkButton>
                    </div>
                  </div>
                </div>
              </TabsContent>
            ))}
          </div>
        </div>
      </section>
    </Tabs>
  );
};

Services.displayName = 'Services';
export default Services;
