import faqData from '@/data/json/faq/faq.json';
import { cn } from '@/utils/cn';
import faqImg from '@public/images/ns-img-52.png';
import faqDark from '@public/images/ns-img-dark-31.png';
import Image from 'next/image';
import RevealAnimation from '../animation/RevealAnimation';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '../ui/accordion';

const FAQ = ({ className }: { className?: string }) => {
  return (
    <section
      className={cn('bg-background-1 dark:bg-background-6 py-16 md:py-20 lg:py-[100px] xl:py-[200px]', className)}
      aria-label="Frequently Asked Questions">
      <div className="main-container">
        <div className="flex flex-col items-center justify-between gap-y-10 lg:flex-row lg:gap-0">
          <div className="flex-1 space-y-8 md:space-y-10 lg:space-y-14">
            <div className="space-y-5 text-center lg:text-left">
              <RevealAnimation delay={0.2}>
                <span className="badge badge-cyan">FAQ</span>
              </RevealAnimation>
              <RevealAnimation delay={0.3}>
                <h2 className="max-w-[439px]" id="faq-heading">
                  Common inquiries from clients
                </h2>
              </RevealAnimation>
            </div>
            {/* faq  */}
            <RevealAnimation delay={0.4}>
              <div>
                <Accordion className="w-full max-w-[576px] space-y-2" defaultValue="1">
                  {faqData.map((item) => (
                    <AccordionItem
                      className="dark:bg-background-7 rounded-[20px] bg-white px-4"
                      key={item.id}
                      value={item.id.toString()}>
                      <AccordionTrigger
                        titleClassName="flex-1 text-left sm:text-heading-6 text-tagline-1 font-normal text-secondary dark:text-accent"
                        className="flex w-full cursor-pointer items-center justify-between pt-6 pb-6"
                        value={item.id.toString()}
                        iconType="arrow">
                        {item.question}
                      </AccordionTrigger>
                      <AccordionContent
                        value={item.id.toString()}
                        className="border-t-stroke-2 dark:border-t-stroke-6 overflow-hidden border-t data-[state=open]:pt-6 data-[state=open]:pb-8">
                        <p>{item.answer}</p>
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              </div>
            </RevealAnimation>
          </div>
          <RevealAnimation delay={0.4}>
            <figure className="relative mx-auto max-w-[450px] flex-1 lg:max-w-[684px]">
              <Image
                src={faqImg}
                alt="Business agency services illustration"
                className="size-full object-cover dark:hidden"
              />
              <Image
                src={faqDark}
                alt="Business agency services illustration"
                className="hidden size-full object-cover dark:block"
              />
            </figure>
          </RevealAnimation>
        </div>
      </div>
    </section>
  );
};

export default FAQ;
