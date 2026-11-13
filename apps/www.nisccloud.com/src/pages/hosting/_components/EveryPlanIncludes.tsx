import { Check } from "lucide-react";

/** Owner-confirmed inclusions shared by every plan, shown below the plan cards. */
export function EveryPlanIncludes({ items }: { items: string[] }) {
  return (
    <div className="mt-10 flex flex-col items-center gap-3 text-center">
      <p className="type-label text-foreground">Every plan includes</p>
      <ul className="flex max-w-4xl flex-wrap justify-center gap-2">
        {items.map((item) => (
          <li
            key={item}
            className="inline-flex items-center gap-1.5 rounded-full border border-primary/25 bg-primary/[0.06] px-3 py-1.5 text-sm font-medium text-foreground"
          >
            <Check className="size-3.5 text-primary dark:text-primary" strokeWidth={3} aria-hidden />
            {item}
          </li>
        ))}
      </ul>
    </div>
  );
}
