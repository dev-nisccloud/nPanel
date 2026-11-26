/** Extension quick picks under the search bar; picking one searches the typed name with that ending. */
export function TldPricingCards({ onPick }: { onPick?: (tld: string) => void }) {
  const tlds: { tld: string; note: string; local?: boolean }[] = [
    { tld: "co.ke", note: "Kenyan business", local: true },
    { tld: "ke", note: "Kenya", local: true },
    { tld: "com", note: "Global" },
    { tld: "net", note: "Networks" },
    { tld: "org", note: "Organisations" },
    { tld: "io", note: "Tech & startups" },
  ];

  return (
    <div className="mt-5">
      <p className="text-xs font-medium text-white/60">Popular endings</p>
      <ul className="mt-2.5 flex flex-wrap justify-center gap-2">
        {tlds.map(({ tld, note, local }) => (
          <li key={tld}>
            <button
              type="button"
              onClick={() => onPick?.(tld)}
              className="group inline-flex min-h-11 items-center gap-2 rounded-full border border-white/15 bg-white/[0.06] px-4 text-left transition-colors hover:border-white/40 hover:bg-white/[0.12] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70"
              aria-label={`Search .${tld} (${note})`}
            >
              <span className="text-sm font-bold tracking-tight text-white">
                <span className={local ? "text-brand-orange" : "text-primary"}>.</span>
                {tld}
              </span>
              <span className="text-xs text-white/60">{note}</span>
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
