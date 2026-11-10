/** Extension showcase row under the search bar. */
export function TldPricingCards() {
  const tlds: { tld: string; note: string; local?: boolean }[] = [
    { tld: "co.ke", note: "Kenyan business", local: true },
    { tld: "ke", note: "Kenya", local: true },
    { tld: "com", note: "Global" },
    { tld: "net", note: "Networks" },
    { tld: "org", note: "Organisations" },
    { tld: "io", note: "Tech & startups" },
  ];

  return (
    <ul className="mt-4 grid w-full grid-cols-3 gap-2 sm:grid-cols-6">
      {tlds.map(({ tld, note, local }) => (
        <li
          key={tld}
          className="flex flex-col items-center justify-center rounded-xl border border-border bg-background/80 px-2 py-2.5 text-center"
        >
          <span className="sr-only">.{tld}</span>
          <span aria-hidden className="text-base font-bold tracking-tight text-foreground">
            <span className={local ? "text-[#b9411f] dark:text-brand-orange" : "text-sky-700 dark:text-primary"}>.</span>
            {tld}
          </span>
          <span className="mt-0.5 text-[11px] leading-tight text-muted-foreground">{note}</span>
        </li>
      ))}
    </ul>
  );
}
