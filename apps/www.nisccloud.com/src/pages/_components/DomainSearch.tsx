import { useState } from "react";
import { motion } from "motion/react";
import { Search, CheckCircle2, XCircle, Loader2, ArrowRight, Globe } from "lucide-react";
import { Button } from "@/components/ui/button.tsx";
import { Input } from "@/components/ui/input.tsx";
import { useNavigate } from "react-router-dom";

const tlds = [
  { ext: ".co.ke", price: "KSh 1,200", highlight: true },
  { ext: ".com", price: "KSh 1,560" },
  { ext: ".net", price: "KSh 1,559" },
  { ext: ".org", price: "KSh 1,038" },
  { ext: ".online", price: "KSh 128" },
  { ext: ".shop", price: "KSh 128" },
];

type ResultStatus = "available" | "taken" | null;

export default function DomainSearch() {
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ResultStatus>(null);
  const [searchedDomain, setSearchedDomain] = useState("");

  const handleSearch = () => {
    const clean = query.trim().toLowerCase().replace(/^https?:\/\//, "").replace(/\/$/, "");
    if (!clean) return;
    setLoading(true);
    setResult(null);
    setSearchedDomain(clean.includes(".") ? clean : `${clean}.co.ke`);

    // Simulate a check — in production this calls the OpenProvider/KENIC API
    setTimeout(() => {
      setLoading(false);
      // Deterministic mock based on query length for demo
      setResult(clean.length % 3 === 0 ? "taken" : "available");
    }, 1200);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") handleSearch();
  };

  return (
    <section className="py-16 relative overflow-hidden">
      {/* Background accent */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse 80% 50% at 50% 50%, oklch(0.55 0.18 195 / 0.06), transparent)",
        }}
      />
      <div
        className="absolute inset-0 opacity-[0.025] pointer-events-none"
        style={{
          backgroundImage: "radial-gradient(oklch(0.55 0.18 195) 1px, transparent 1px)",
          backgroundSize: "28px 28px",
        }}
      />

      <div className="max-w-4xl mx-auto px-4 md:px-8 relative">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center mb-10"
        >
          <div className="inline-flex items-center gap-2 bg-primary/10 border border-primary/20 rounded-full px-4 py-1.5 text-xs text-primary font-mono mb-4">
            CLAIM YOUR NAME ONLINE
          </div>
          <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-3 text-balance">
            Find Your Perfect Domain
          </h2>
          <p className="text-muted-foreground text-base max-w-xl mx-auto">
            Search for available .co.ke, .com, .net and more. Register your domain and have it live with hosting in minutes.
          </p>
        </motion.div>

        {/* Search box */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="bg-card border border-border/60 rounded-2xl p-6 shadow-xl shadow-primary/5 mb-6"
        >
          <div className="flex gap-3">
            <div className="relative flex-1">
              <Globe size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Enter your business name (e.g. safaritours)"
                className="pl-9 h-12 rounded-xl text-base border-border/60 focus-visible:ring-primary/30"
              />
            </div>
            <Button
              onClick={handleSearch}
              disabled={loading || !query.trim()}
              className="h-12 px-6 rounded-xl font-bold gap-2 cursor-pointer shrink-0"
            >
              {loading ? <Loader2 size={16} className="animate-spin" /> : <Search size={16} />}
              Search
            </Button>
          </div>

          {/* Result */}
          {loading && (
            <div className="mt-4 flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 size={14} className="animate-spin" />
              Checking availability for <span className="font-semibold text-foreground">{searchedDomain}</span>…
            </div>
          )}

          {result && !loading && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              className={`mt-4 flex items-center justify-between rounded-xl px-4 py-3 border ${
                result === "available"
                  ? "bg-green-500/8 border-green-500/25"
                  : "bg-destructive/8 border-destructive/25"
              }`}
            >
              <div className="flex items-center gap-3">
                {result === "available" ? (
                  <CheckCircle2 size={18} className="text-green-500 shrink-0" />
                ) : (
                  <XCircle size={18} className="text-destructive shrink-0" />
                )}
                <div>
                  <span className="font-bold text-sm">{searchedDomain}</span>
                  <span className="ml-2 text-sm text-muted-foreground">
                    {result === "available" ? "is available!" : "is already taken"}
                  </span>
                </div>
              </div>
              {result === "available" && (
                <Button
                  size="sm"
                  className="rounded-full gap-1.5 cursor-pointer"
                  onClick={() => navigate("/cloud-hosting/domains")}
                >
                  Register <ArrowRight size={12} />
                </Button>
              )}
              {result === "taken" && (
                <Button
                  size="sm"
                  variant="secondary"
                  className="rounded-full gap-1.5 cursor-pointer"
                  onClick={() => {
                    const base = query.trim().split(".")[0];
                    setQuery(base);
                    setResult(null);
                  }}
                >
                  Try another
                </Button>
              )}
            </motion.div>
          )}
        </motion.div>

        {/* TLD price row */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="grid grid-cols-3 sm:grid-cols-6 gap-3"
        >
          {tlds.map((t) => (
            <div
              key={t.ext}
              className={`rounded-xl border p-3 text-center cursor-pointer hover:border-primary/50 transition-all duration-200 ${
                t.highlight
                  ? "border-primary/40 bg-primary/8"
                  : "border-border/50 bg-card/60"
              }`}
              onClick={() => {
                if (query.trim()) {
                  const base = query.trim().replace(/\.[^.]+$/, "");
                  setQuery(base + t.ext);
                }
              }}
            >
              <div className={`font-bold text-sm ${t.highlight ? "text-primary" : ""}`}>{t.ext}</div>
              <div className="text-[10px] text-muted-foreground mt-0.5 line-through opacity-60">from</div>
              <div className="text-xs font-semibold mt-0.5">{t.price}</div>
            </div>
          ))}
        </motion.div>

        <motion.p
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.4, delay: 0.3 }}
          className="text-center text-xs text-muted-foreground mt-5"
        >
          Prices shown are annual registration fees in KSh. Free WHOIS privacy included.{" "}
          <button
            onClick={() => navigate("/cloud-hosting/domains")}
            className="text-primary underline underline-offset-2 cursor-pointer hover:opacity-80"
          >
            View all TLDs
          </button>
        </motion.p>
      </div>
    </section>
  );
}
