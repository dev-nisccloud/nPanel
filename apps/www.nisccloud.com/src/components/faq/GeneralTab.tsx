import faqData from '@/data/json/faq/faq.json';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '../ui/accordion';

const GeneralTab = () => {
  return (
    <Accordion className="mx-auto w-full max-w-[850px] space-y-4" defaultValue="1">
      {faqData.map((item) => (
        <AccordionItem
          className="dark:bg-background-7 rounded-[20px] bg-white px-6 sm:px-8"
          key={item.id}
          value={item.id.toString()}>
          <AccordionTrigger
            titleClassName="flex-1 text-left sm:text-heading-6 text-tagline-1 font-normal text-secondary dark:text-accent"
            className="flex w-full cursor-pointer items-center justify-between pt-5 pb-5 sm:pt-8 sm:pb-8"
            value={item.id.toString()}
            iconType="arrow">
            {item.question}
          </AccordionTrigger>
          <AccordionContent
            value={item.id.toString()}
            className="border-t-stroke-2 dark:border-t-stroke-6 overflow-hidden border-t data-[state=open]:pt-6 data-[state=open]:pb-8">
            {' '}
            <p>{item.answer}</p>
          </AccordionContent>
        </AccordionItem>
      ))}
    </Accordion>
  );
};

export default GeneralTab;
