import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Check, ChevronRight, X, Search, Globe, Plus, Minus, Sparkles } from "lucide-react";
import { Dialog, DialogContent } from "@/components/ui/dialog.tsx";
import { Button } from "@/components/ui/button.tsx";
import { Input } from "@/components/ui/input.tsx";
import { Badge } from "@/components/ui/badge.tsx";
import { cn } from "@/lib/utils.ts";
import { useNavigate } from "react-router-dom";

export type OrderPlan = {
  id: string;
  name: string;
  price: number;
  period: string;
  features: string[];
};

type Addon = { id: string; label: string; price: number; period: string };

type OrderDialogProps = {
  open: boolean;
  onClose: () => void;
  plan: OrderPlan | null;
  addons?: Addon[];
  serviceType: "hosting" | "marketing";
};

const HOSTING_STEPS = ["Plan & Add-ons", "Domain", "Review & Pay"];
const MARKETING_STEPS = ["Plan & Add-ons", "Project Brief", "Review & Pay"];

function StepIndicator({ current, steps }: { current: number; steps: string[] }) {
  return (
    <div className="flex items-center mb-8">
      {steps.map((step, i) => (
        <div key={step} className="flex items-center flex-1 last:flex-none">
          <div className="flex flex-col items-center shrink-0">
            <div
              className={cn(
                "w-9 h-9 rounded-2xl flex items-center justify-center text-sm font-bold border-2 transition-all duration-300",
                i < current
                  ? "bg-primary border-primary text-primary-foreground shadow-md shadow-primary/30"
                  : i === current
                  ? "bg-primary/10 border-primary text-primary"
                  : "bg-muted border-border text-muted-foreground"
              )}
            >
              {i < current ? <Check size={14} /> : i + 1}
            </div>
            <span
              className={cn(
                "text-[10px] mt-1.5 font-semibold whitespace-nowrap",
                i === current ? "text-primary" : i < current ? "text-primary/60" : "text-muted-foreground"
              )}
            >
              {step}
            </span>
          </div>
          {i < steps.length - 1 && (
            <div
              className={cn(
                "h-0.5 flex-1 mx-2 mb-5 rounded-full transition-all duration-300",
                i < current ? "bg-primary" : "bg-border"
              )}
            />
          )}
        </div>
      ))}
    </div>
  );
}

export default function OrderDialog({ open, onClose, plan, addons = [], serviceType }: OrderDialogProps) {
  const [step, setStep] = useState(0);
  const [domainOption, setDomainOption] = useState<"new" | "existing" | "none">("new");
  const [domainQuery, setDomainQuery] = useState("");
  const [selectedDomain, setSelectedDomain] = useState("");
  const [brief, setBrief] = useState("");
  const [selectedAddons, setSelectedAddons] = useState<string[]>([]);
  const navigate = useNavigate();

  const steps = serviceType === "hosting" ? HOSTING_STEPS : MARKETING_STEPS;

  const toggleAddon = (id: string) => {
    setSelectedAddons((prev) =>
      prev.includes(id) ? prev.filter((a) => a !== id) : [...prev, id]
    );
  };

  const addonTotal = addons
    .filter((a) => selectedAddons.includes(a.id))
    .reduce((s, a) => s + a.price, 0);
  const total = (plan?.price ?? 0) + addonTotal;

  const handleClose = () => {
    setStep(0);
    setDomainQuery("");
    setSelectedDomain("");
    setSelectedAddons([]);
    setBrief("");
    onClose();
  };

  const mockDomains = domainQuery.length > 2
    ? [
        { domain: `${domainQuery}.co.ke`, price: 999, available: true },
        { domain: `${domainQuery}.com`, price: 1200, available: true },
        { domain: `${domainQuery}.africa`, price: 1500, available: domainQuery.length % 2 === 0 },
        { domain: `${domainQuery}.net`, price: 1100, available: true },
      ]
    : [];

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-lg p-0 overflow-hidden rounded-3xl border border-border shadow-2xl">
        {/* Gradient header */}
        <div className="bg-gradient-to-br from-primary/15 via-primary/8 to-transparent px-7 pt-7 pb-5 border-b border-border/60">
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Sparkles size={14} className="text-primary" />
                <span className="text-xs font-bold text-primary uppercase tracking-widest">New Order</span>
              </div>
              <h2 className="text-xl font-extrabold text-foreground">{plan?.name}</h2>
              <p className="text-muted-foreground text-sm mt-0.5">
                <span className="text-2xl font-extrabold text-primary">KES {plan?.price.toLocaleString()}</span>
                <span className="text-xs ml-1">/{plan?.period}</span>
              </p>
            </div>
            <button
              onClick={handleClose}
              className="w-8 h-8 rounded-xl bg-muted/60 flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer"
            >
              <X size={15} />
            </button>
          </div>
        </div>

        <div className="px-7 py-6">
          <StepIndicator current={step} steps={steps} />

          <AnimatePresence mode="wait">
            {/* ── Step 0: Plan confirmation + Add-ons ── */}
            {step === 0 && (
              <motion.div
                key="plan"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.2 }}
              >
                <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-3">
                  What's included
                </p>
                <div className="bg-muted/30 rounded-2xl p-4 mb-5">
                  <ul className="space-y-2">
                    {plan?.features.map((f) => (
                      <li key={f} className="flex items-center gap-2.5 text-sm">
                        <div className="w-4 h-4 rounded-full bg-primary/15 flex items-center justify-center shrink-0">
                          <Check size={10} className="text-primary" />
                        </div>
                        {f}
                      </li>
                    ))}
                  </ul>
                </div>

                {addons.length > 0 && (
                  <>
                    <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-3">
                      Boost your plan (optional)
                    </p>
                    <div className="space-y-2">
                      {addons.map((addon) => (
                        <button
                          key={addon.id}
                          onClick={() => toggleAddon(addon.id)}
                          className={cn(
                            "w-full flex items-center justify-between p-3.5 rounded-2xl border text-sm transition-all cursor-pointer",
                            selectedAddons.includes(addon.id)
                              ? "border-primary bg-primary/8 shadow-sm shadow-primary/10"
                              : "border-border hover:border-primary/40 bg-card"
                          )}
                        >
                          <span className="font-medium">{addon.label}</span>
                          <span className="flex items-center gap-2.5">
                            <span className="text-muted-foreground text-xs">
                              KES {addon.price.toLocaleString()}/{addon.period}
                            </span>
                            <div
                              className={cn(
                                "w-5 h-5 rounded-lg flex items-center justify-center transition-colors",
                                selectedAddons.includes(addon.id)
                                  ? "bg-primary text-primary-foreground"
                                  : "bg-muted text-muted-foreground"
                              )}
                            >
                              {selectedAddons.includes(addon.id)
                                ? <Minus size={10} />
                                : <Plus size={10} />}
                            </div>
                          </span>
                        </button>
                      ))}
                    </div>
                  </>
                )}
              </motion.div>
            )}

            {/* ── Step 1: Domain (hosting) ── */}
            {step === 1 && serviceType === "hosting" && (
              <motion.div
                key="domain"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.2 }}
              >
                <div className="flex gap-2 mb-5">
                  {(["new", "existing", "none"] as const).map((opt) => (
                    <button
                      key={opt}
                      onClick={() => setDomainOption(opt)}
                      className={cn(
                        "flex-1 py-2.5 rounded-2xl text-xs font-bold border transition-all cursor-pointer",
                        domainOption === opt
                          ? "border-primary bg-primary/10 text-primary"
                          : "border-border text-muted-foreground hover:border-primary/40"
                      )}
                    >
                      {opt === "new" ? "New Domain" : opt === "existing" ? "I Have One" : "Later"}
                    </button>
                  ))}
                </div>

                {domainOption === "new" && (
                  <>
                    <div className="relative mb-3">
                      <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
                      <Input
                        className="pl-9 rounded-2xl"
                        placeholder="Search your domain name..."
                        value={domainQuery}
                        onChange={(e) => setDomainQuery(e.target.value)}
                      />
                    </div>
                    <div className="space-y-2 min-h-[110px]">
                      {mockDomains.map((r) => (
                        <button
                          key={r.domain}
                          disabled={!r.available}
                          onClick={() => setSelectedDomain(r.domain)}
                          className={cn(
                            "w-full flex items-center justify-between p-3.5 rounded-2xl border text-sm transition-all",
                            !r.available
                              ? "opacity-40 cursor-not-allowed border-border"
                              : selectedDomain === r.domain
                              ? "border-primary bg-primary/8 cursor-pointer"
                              : "border-border hover:border-primary/40 cursor-pointer bg-card"
                          )}
                        >
                          <span className="flex items-center gap-2">
                            <Globe size={13} className="text-muted-foreground" />
                            <span className="font-semibold">{r.domain}</span>
                            <Badge
                              className={cn(
                                "text-[10px] px-2 py-0",
                                r.available ? "bg-emerald-100 text-emerald-700" : "bg-muted text-muted-foreground"
                              )}
                            >
                              {r.available ? "Available" : "Taken"}
                            </Badge>
                          </span>
                          <span className="text-muted-foreground text-xs font-medium">
                            KES {r.price.toLocaleString()}/yr
                          </span>
                        </button>
                      ))}
                      {domainQuery.length <= 2 && (
                        <p className="text-center text-sm text-muted-foreground py-8">
                          Type to check domain availability
                        </p>
                      )}
                    </div>
                  </>
                )}

                {domainOption === "existing" && (
                  <div>
                    <Input
                      className="rounded-2xl"
                      placeholder="e.g. mybusiness.co.ke"
                      value={selectedDomain}
                      onChange={(e) => setSelectedDomain(e.target.value)}
                    />
                    <p className="text-xs text-muted-foreground mt-2.5 leading-relaxed">
                      You'll update your nameservers after checkout - we'll walk you through every step.
                    </p>
                  </div>
                )}

                {domainOption === "none" && (
                  <div className="bg-muted/30 rounded-2xl p-5 text-sm text-muted-foreground text-center">
                    No problem. You can add a domain anytime from your nPanel dashboard.
                  </div>
                )}
              </motion.div>
            )}

            {/* ── Step 1: Brief (marketing) ── */}
            {step === 1 && serviceType === "marketing" && (
              <motion.div
                key="brief"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.2 }}
              >
                <p className="text-sm text-muted-foreground mb-4 leading-relaxed">
                  Tell us about your business so our team can prepare a tailored brief before your onboarding call.
                </p>
                <textarea
                  className="w-full border border-border rounded-2xl p-4 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary/30 min-h-[140px] bg-muted/20 transition"
                  placeholder="Describe your business, target audience, goals, and any specific requirements..."
                  value={brief}
                  onChange={(e) => setBrief(e.target.value)}
                />
              </motion.div>
            )}

            {/* ── Step 2: Review & Pay ── */}
            {step === 2 && (
              <motion.div
                key="summary"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.2 }}
              >
                <div className="bg-muted/30 rounded-2xl p-5 space-y-3 mb-5">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground font-medium">{plan?.name}</span>
                    <span className="font-bold">KES {plan?.price.toLocaleString()}/{plan?.period}</span>
                  </div>
                  {selectedDomain && (
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Domain: {selectedDomain}</span>
                      <span className="font-semibold text-primary">Added</span>
                    </div>
                  )}
                  {addons
                    .filter((a) => selectedAddons.includes(a.id))
                    .map((a) => (
                      <div key={a.id} className="flex justify-between text-sm">
                        <span className="text-muted-foreground">{a.label}</span>
                        <span>+KES {a.price.toLocaleString()}/{a.period}</span>
                      </div>
                    ))}
                  <div className="border-t border-border pt-3 flex justify-between font-extrabold">
                    <span>Total</span>
                    <span className="text-primary text-lg">KES {total.toLocaleString()}/{plan?.period}</span>
                  </div>
                </div>

                <p className="text-xs text-muted-foreground text-center mb-5 leading-relaxed">
                  Our team will contact you within <strong>2 hours</strong> to complete setup.
                  Pay via M-Pesa, card, or bank transfer.
                </p>

                <Button
                  className="w-full bg-primary text-primary-foreground font-bold cursor-pointer rounded-2xl h-12 hover:opacity-90 shadow-lg shadow-primary/25"
                  onClick={() => { navigate("/contact"); handleClose(); }}
                >
                  Proceed to Payment <ChevronRight size={16} className="ml-1" />
                </Button>

                <div className="flex items-center justify-center gap-4 mt-4 text-xs text-muted-foreground">
                  <span>🔒 Secure checkout</span>
                  <span>•</span>
                  <span>M-Pesa accepted</span>
                  <span>•</span>
                  <span>Cancel anytime</span>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Navigation */}
          {step < 2 && (
            <div className="flex gap-3 mt-7">
              {step > 0 && (
                <Button
                  variant="ghost"
                  onClick={() => setStep((s) => s - 1)}
                  className="rounded-2xl cursor-pointer border border-border hover:border-primary/40"
                >
                  Back
                </Button>
              )}
              <Button
                className="flex-1 bg-primary text-primary-foreground font-semibold cursor-pointer rounded-2xl h-11 hover:opacity-90"
                onClick={() => setStep((s) => s + 1)}
              >
                {step === 0 ? "Continue" : "Review Order"}
                <ChevronRight size={16} className="ml-1" />
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
