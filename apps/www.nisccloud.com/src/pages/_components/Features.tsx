import { Badge } from "@/components/ui/badge";
import { Marquee } from "@/components/ui/marquee";
import { Sparkles, Target, Zap, HeartHandshake, Server, Shield, BarChart3, Headset } from "lucide-react";

const marqueeData = [
  "How do I get my business found on Google?",
  "Is my website fast and secure enough?",
  "How do I automate replies to my customers?",
  "Where can I register a .co.ke domain?",
  "How do I track my Facebook Ads ROI?",
  "Do I need a custom professional email address?",
  "What's the best way to design my brand logo?",
  "How can I manage my clients in one place?",
  "Why is my website down again?",
  "How do I send marketing emails that actually convert?",
  "Can someone just handle all my IT and marketing?",
];

const features = [
  {
    description:
      "No jargon, no overcomplication — just clear steps you can follow to start and grow your business confidently.",
    icon: Sparkles,
    title: "We make things simple",
  },
  {
    description:
      "Every strategy we create is designed to help you launch faster, grow smarter, and increase profits.",
    icon: Target,
    title: "We focus on real results",
  },
  {
    description:
      "With years of hands-on experience across industries, we bring proven strategies and practical solutions to the table.",
    icon: Zap,
    title: "We know what works",
  },
  {
    description:
      "From your first idea to scaling your business, we provide ongoing support, not just a one-time plan.",
    icon: HeartHandshake,
    title: "With you all the way",
  },
  {
    description:
      "Your websites and apps run on enterprise-grade servers ensuring 99.9% uptime and lightning-fast load speeds.",
    icon: Server,
    title: "Lightning Fast Hosting",
  },
  {
    description:
      "We protect your data and your customers with automated SSL certificates, daily backups, and robust firewalls.",
    icon: Shield,
    title: "Bank-Grade Security",
  },
  {
    description:
      "Whether you have 100 visitors or 100,000, our cloud infrastructure effortlessly scales with your business growth.",
    icon: BarChart3,
    title: "Built to Scale",
  },
  {
    description:
      "Got a question at 3 AM? Our dedicated technical team is always online to help you resolve issues instantly.",
    icon: Headset,
    title: "24/7 Expert Support",
  },
];

export default function Features() {
  const m1 = marqueeData.slice(0, marqueeData.length / 3);
  const m2 = marqueeData.slice(
    marqueeData.length / 3,
    (marqueeData.length / 3) * 2,
  );
  const m3 = marqueeData.slice((marqueeData.length / 3) * 2);

  return (
    <section className="relative bg-muted/30 py-20 sm:py-32 overflow-hidden">
      <div className="mx-auto max-w-full">
        <div className="text-center mb-8 px-4 md:px-8">
          <div className="inline-flex items-center gap-2 bg-primary/10 border border-primary/20 rounded-full px-4 py-1.5 text-xs text-primary font-mono mb-4 tracking-wide">
            CLEARING THE PATH
          </div>
          <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-3 text-balance">
            Removing the roadblocks to your success
          </h2>
          <p className="text-muted-foreground text-base max-w-2xl mx-auto">
            It's easy to get lost in a sea of advice, conflicting opinions, and
            endless "must-dos." We filter out the noise, focus on what truly
            matters, and give you the kind of clarity that lets your business
            shine in the market.
          </p>
        </div>
          
        <div 
          className="relative w-full overflow-hidden mt-12 mb-16"
          style={{
            WebkitMaskImage: "linear-gradient(to right, transparent, black 10%, black 90%, transparent)",
            maskImage: "linear-gradient(to right, transparent, black 10%, black 90%, transparent)"
          }}
        >
          <div className="flex w-full flex-col">
            <Marquee className="[--duration:45s] [--gap:1rem]" repeat={4}>
                {m1.map((q) => (
                  <Badge
                    className="rounded-xl border-primary/20 bg-background/50 backdrop-blur-sm px-5 py-2.5 text-sm font-medium text-foreground/80 hover:bg-primary/5 hover:text-primary transition-colors cursor-default"
                    key={q}
                    variant="outline"
                  >
                    {q}
                  </Badge>
                ))}
              </Marquee>

              <Marquee
                className="[--duration:50s] [--gap:1rem]"
                repeat={4}
                reverse
              >
                {m2.map((q) => (
                  <Badge
                    className="rounded-xl border-primary/20 bg-background/50 backdrop-blur-sm px-5 py-2.5 text-sm font-medium text-foreground/80 hover:bg-primary/5 hover:text-primary transition-colors cursor-default"
                    key={q}
                    variant="outline"
                  >
                    {q}
                  </Badge>
                ))}
              </Marquee>

              <Marquee className="[--duration:42s] [--gap:1rem]" repeat={4}>
                {m3.map((q) => (
                  <Badge
                    className="rounded-xl border-primary/20 bg-background/50 backdrop-blur-sm px-5 py-2.5 text-sm font-medium text-foreground/80 hover:bg-primary/5 hover:text-primary transition-colors cursor-default"
                    key={q}
                    variant="outline"
                  >
                    {q}
                  </Badge>
                ))}
              </Marquee>
            </div>
          </div>

        <div className="mt-10 max-w-7xl mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 border-t border-border/60">
          {features.map((feature, idx) => {
            const Icon = feature.icon;
            return (
              <div
                className={`flex flex-col gap-5 px-6 py-10 transition-colors hover:bg-muted/50 border-b border-border/60 ${
                  idx % 2 === 0 ? "sm:border-r" : "sm:border-r-0"
                } ${idx % 4 !== 3 ? "lg:border-r" : "lg:border-r-0"}`}
                key={feature.title}
              >
                <div className="p-3 bg-primary/10 border border-primary/20 shadow-sm shadow-primary/10 rounded-2xl w-fit">
                  <Icon className="size-8 text-primary" />
                </div>

                <div className="flex flex-col gap-2 pt-6">
                  <h3 className="font-bold text-xl tracking-tight">
                    {feature.title}
                  </h3>
                  <p className="leading-relaxed text-muted-foreground text-sm">
                    {feature.description}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
