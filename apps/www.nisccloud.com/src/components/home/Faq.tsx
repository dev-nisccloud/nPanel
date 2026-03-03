import RevealAnimation from '@/components/animation/RevealAnimation';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { CheckmarkIcon } from '@/icons';

interface FAQItem {
  id: string;
  question: string;
  answer: string;
  features: string[];
}

const faqItems: FAQItem[] = [
  {
    id: '1',
    question: 'How Do These Tools Support My Business Growth?',
    answer:
      'Our financial management platform provides comprehensive tools designed to drive sustainable business growth through better financial control, insights, and strategic planning.',
    features: [
      'Real-time cash flow tracking and forecasting',
      'Advanced analytics and growth insights',
      'Automated expense management',
      'Budget planning and variance analysis',
    ],
  },
  {
    id: '2',
    question: 'Are the Tools Flexible for Different Business Needs?',
    answer:
      'Absolutely. Our platform is designed with flexibility at its core, allowing you to customize financial workflows, reporting structures, and features to match your specific business requirements.',
    features: [
      'Customizable chart of accounts',
      'Industry-specific templates',
      'Flexible approval workflows',
      'Configurable dashboards and reports',
    ],
  },
  {
    id: '3',
    question: 'Can the Platform Handle High Traffic and Workload?',
    answer:
      'Yes, our platform is built on enterprise-grade infrastructure designed to handle high volumes of financial transactions, multiple users, and complex reporting requirements without performance degradation.',
    features: [
      'Cloud-based auto-scaling architecture',
      'Real-time transaction processing',
      '99.9% uptime guarantee',
      'Optimized database performance',
    ],
  },
  {
    id: '4',
    question: 'Do I Need Technical Skills to Use the System?',
    answer:
      'No technical skills required. Our platform features an intuitive, user-friendly interface designed for finance professionals and business owners, with comprehensive training and support available.',
    features: [
      'Simple drag-and-drop interface',
      'Step-by-step wizards',
      'Video tutorials and documentation',
      '24/7 customer support',
    ],
  },
  {
    id: '5',
    question: 'Can These Tools Integrate With My Existing Software?',
    answer:
      'Yes, our platform offers seamless integration with a wide range of accounting software, banking systems, payment processors, and business applications to streamline your financial operations.',
    features: [
      'QuickBooks, Xero, and Sage integration',
      'Bank API integrations',
      'Stripe, PayPal, and Square integration',
      'RESTful API for custom integrations',
    ],
  },
];

const Faq = () => {
  return (
    <section className="py-12 md:py-14 lg:py-18 xl:py-24">
      <div className="main-container">
        <div className="flex flex-col items-center justify-center gap-y-10 xl:flex-row xl:items-start xl:justify-between xl:gap-y-0">
          <div className="space-y-3 text-center sm:text-left">
            <RevealAnimation delay={0.1}>
              <h2 className="w-full xl:max-w-[391px]">Build & Grow with Scalable Tools</h2>
            </RevealAnimation>
            <RevealAnimation delay={0.2}>
              <p className="w-full text-lg leading-[150%] font-normal xl:max-w-[391px]">
                Get quick answers to the most common questions about our platform and services.
              </p>
            </RevealAnimation>
          </div>

          {/* faq item  */}
          <RevealAnimation delay={0.3}>
            <div className="w-full max-w-[653px]">
              <Accordion
                className="bg-background-4 w-full space-y-1 overflow-hidden rounded-3xl p-1 md:rounded-4xl"
                defaultValue="1">
                {faqItems.map((item) => (
                  <AccordionItem
                    key={item.id}
                    value={item.id}
                    className="rounded-[18px] bg-white px-5 transition-all duration-500 ease-in-out data-[state=closed]:pb-0 data-[state=open]:pb-8 md:rounded-[28px] md:px-8">
                    <AccordionTrigger
                      value={item.id}
                      className="flex w-full cursor-pointer items-center justify-between pt-8 transition-all duration-500 ease-in-out data-[state=closed]:pb-8 data-[state=open]:pb-4"
                      titleClassName="lg:text-heading-6 text-tagline-1 text-secondary my-auto flex-1 text-left font-normal"
                      iconType="arrow">
                      {item.question}
                    </AccordionTrigger>
                    <AccordionContent
                      value={item.id}
                      className="border-t-0 pt-0 transition-all duration-500 ease-in-out">
                      <div className="space-y-6">
                        <p className="text-secondary/80 text-tagline-2 max-w-[500px] leading-[150%] font-normal md:text-lg">
                          {item.answer}
                        </p>

                        <ul className="space-y-2 md:space-y-1">
                          {item.features.map((feature) => (
                            <li key={`${item.id}-${feature}`} className="flex items-center justify-start gap-x-3">
                              <span className="bg-background-4 flex size-5 shrink-0 items-center justify-center rounded-full">
                                <CheckmarkIcon />
                              </span>
                              <p className="text-secondary/60 text-tagline-2 leading-[150%] font-normal md:text-lg">
                                {feature}
                              </p>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </div>
          </RevealAnimation>
        </div>
      </div>
    </section>
  );
};

Faq.displayName = 'Faq';
export default Faq;
