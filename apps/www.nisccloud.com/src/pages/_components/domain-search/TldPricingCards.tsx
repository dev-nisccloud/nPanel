/** Extension showcase cards. Prices appear only after a domain search. */
export function TldPricingCards() {
  const tlds = [".com", ".net", ".io", ".org", ".online", ".shop"];

  return (
    <div className="w-full mt-4">
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {tlds.map((tld) => (
          <div
            key={tld}
            className="bg-card border border-border rounded-lg p-4 flex flex-col items-center justify-center text-center space-y-2"
          >
            <div className="font-bold text-lg text-foreground">{tld}</div>
            <div className="text-xs text-muted-foreground">Search to see price</div>
          </div>
        ))}
      </div>
    </div>
  );
}
