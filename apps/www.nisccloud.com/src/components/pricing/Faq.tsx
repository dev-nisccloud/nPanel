import faqImg from '@public/images/ns-img-52.png';
import faqImgDark from '@public/images/ns-img-dark-31.png';
import Image from 'next/image';
import RevealAnimation from '../animation/RevealAnimation';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '../ui/accordion';

interface FAQItem {
  id: string;
  question: string;
  answer: string;
}

const faqItems: FAQItem[] = [
  {
    id: '1',
    question: 'What is the primary role of a business agency?',
    answer:
      'When collaborating with a business agency, you can generally expect an extensive array of services designed to not only support your current operations but also to foster growth and innovation within your business. These services often include strategic planning, marketing solutions, financial consulting, and operational improvements.',
  },
  {
    id: '2',
    question: 'What kinds of services should I anticipate ?',
    answer:
      'When working with a business agency, you can typically anticipate a wide range of services tailored to support and grow your business.',
  },
  {
    id: '3',
    question: 'How often should I consider updating my website?',
    answer:
      'When collaborating with a business agency, you can generally expect an extensive array of services designed to not only support your current operations but also to foster growth and innovation within your business. These services often include strategic planning, marketing solutions, financial consulting, and operational improvements.',
  },
  {
    id: '4',
    question: 'How often is it recommended to refresh my website?',
    answer:
      'When collaborating with a business agency, you can generally expect an extensive array of services designed to not only support your current operations but also to foster growth and innovation within your business. These services often include strategic planning, marketing solutions, financial consulting, and operational improvements.',
  },
];

const Faq = () => {
  return (
    <section
      className="py-[50px] md:py-[70px] lg:py-[85px] xl:pt-[200px] xl:pb-[100px]"
      aria-label="Frequently Asked Questions">
      <div className="main-container">
        <div className="flex flex-col items-center justify-between gap-8 lg:flex-row lg:gap-0">
          <div className="flex-1 space-y-14 text-center lg:text-left">
            <div className="space-y-5">
              <RevealAnimation delay={0.2}>
                <span className="badge badge-cyan">FAQ</span>
              </RevealAnimation>
              <RevealAnimation delay={0.3}>
                <h2 className="mx-auto lg:mx-0 lg:max-w-[439px]" id="faq-heading">
                  Common inquiries from clients
                </h2>
              </RevealAnimation>
            </div>

            {/* faq accordion  */}
            <RevealAnimation delay={0.4}>
              <div>
                <Accordion className="mx-auto w-full max-w-[576px] lg:mx-0" defaultValue="1">
                  {faqItems.map((item) => (
                    <AccordionItem key={item.id} value={item.id}>
                      <AccordionTrigger
                        className="flex w-full cursor-pointer items-center justify-between pt-6 pb-6"
                        titleClassName="flex-1 text-left xl:text-heading-6 text-tagline-1 font-normal text-secondary dark:text-accent"
                        value={item.id}
                        iconType="arrow">
                        {item.question}
                      </AccordionTrigger>

                      <AccordionContent
                        value={item.id}
                        className="border-t-stroke-2 dark:border-t-stroke-6 overflow-hidden border-t data-[state=open]:pt-6 data-[state=open]:pb-8">
                        <p>{item.answer}</p>
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              </div>
            </RevealAnimation>
          </div>

          {/* <!-- faq image --> */}
          <RevealAnimation delay={0.3}>
            <figure className="relative w-full max-w-[684px] flex-1 overflow-hidden">
              <Image
                className="size-full object-cover dark:hidden"
                src={faqImg}
                alt="Business agency services illustration"
                loading="lazy"
              />
              <Image
                className="hidden size-full object-cover dark:inline-block"
                src={faqImgDark}
                alt="Business agency services illustration"
                loading="lazy"
              />
            </figure>
          </RevealAnimation>
        </div>
      </div>
    </section>
  );
};

export default Faq;
