import { TldLogo } from "./TldLogo.tsx";

/** Extension showcase row  TLD logos under the search bar. */
export function TldPricingCards() {
  const tlds: { tld: string; variant: "kenyan" | "openprovider" }[] = [
    { tld: "co.ke", variant: "kenyan" },
    { tld: "ke", variant: "kenyan" },
    { tld: "com", variant: "openprovider" },
    { tld: "net", variant: "openprovider" },
    { tld: "org", variant: "openprovider" },
    { tld: "io", variant: "openprovider" },
  ];

  return (
    <div className="w-full mt-4">
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {tlds.map(({ tld, variant }) => (
          <div
            key={tld}
            className="border border-border rounded-lg p-4 flex items-center justify-center"
          >
            <TldLogo tld={tld} variant={variant} size={72} />
          </div>
        ))}
      </div>
    </div>
  );
}
