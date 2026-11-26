import FaqBlock from "@/components/shadcn-space/blocks/faq-01/faq.tsx";
import { HOME_FAQ_CATEGORIES } from "./home-faqs.ts";

export default function Faq() {
  return (
    <div id="faq">
      <FaqBlock
        categories={HOME_FAQ_CATEGORIES}
        defaultCategory="General"
        title="Questions before you start"
      />
    </div>
  );
}
