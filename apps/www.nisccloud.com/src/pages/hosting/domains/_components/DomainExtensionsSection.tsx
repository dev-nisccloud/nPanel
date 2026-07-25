import { Globe, Package } from "lucide-react";

const localTlds = [
  { ext: ".co.ke", note: "Most popular" },
  { ext: ".or.ke", note: "Organisations" },
  { ext: ".ac.ke", note: "Academic" },
  { ext: ".ke", note: "Short and bold" },
];

const globalTlds = [
  { ext: ".com" },
  { ext: ".org" },
  { ext: ".net" },
  { ext: ".africa" },
  { ext: ".shop" },
  { ext: ".online" },
];

export function DomainExtensionsSection() {
  return (
    <section className="max-w-5xl mx-auto px-4 md:px-8 pb-20 pt-4">
      <div className="text-center mb-12">
        <h2 className="text-3xl font-bold mb-3">Every Extension Your Brand Needs</h2>
        <p className="text-sm text-muted-foreground max-w-lg mx-auto">Register local and global extensions to protect your brand. Search your name to see the live price.</p>
      </div>
      <div className="grid md:grid-cols-2 gap-6">
        <div className="rounded-2xl border border-border bg-card p-6">
          <div className="flex items-center gap-2 mb-4">
            <Globe size={18} className="text-primary" />
            <h3 className="font-bold">Local Extensions</h3>
          </div>
          <div className="space-y-3">
            {localTlds.map(({ ext, note }) => (
              <div key={ext} className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <span className="font-mono font-bold text-foreground">{ext}</span>
                  {note && <span className="text-[10px] bg-primary/10 text-primary px-1.5 py-0.5 rounded font-medium">{note}</span>}
                </div>
                <span className="text-xs text-muted-foreground">Search to see price</span>
              </div>
            ))}
          </div>
        </div>
        <div className="rounded-2xl border border-border bg-card p-6">
          <div className="flex items-center gap-2 mb-4">
            <Globe size={18} className="text-primary" />
            <h3 className="font-bold">Global Extensions</h3>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {globalTlds.map(({ ext }) => (
              <div key={ext} className="flex items-center justify-between">
                <span className="font-mono font-bold text-foreground text-sm">{ext}</span>
                <span className="text-xs text-muted-foreground">Search</span>
              </div>
            ))}
          </div>
          <p className="text-xs text-muted-foreground mt-4">+190 more extensions available. Search to see live pricing.</p>
        </div>
      </div>
      <div className="mt-6 rounded-2xl border border-primary/30 bg-primary/5 p-5 flex items-start gap-4">
        <div className="w-10 h-10 rounded-xl bg-primary text-primary-foreground flex items-center justify-center shrink-0">
          <Package size={18} />
        </div>
        <div>
          <h4 className="font-bold text-sm mb-1">Protect Your Brand Across Key Extensions</h4>
          <p className="text-xs text-muted-foreground leading-relaxed">Register .co.ke, .com, .ke, and .net together when you want wider name protection. Search your name to see availability and the live price for each extension.</p>
        </div>
      </div>
    </section>
  );
}
