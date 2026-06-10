import { motion } from "motion/react";
import { ArrowRight, ChevronRight, Zap } from "lucide-react";
import { AnimatedGradientText } from "@/components/ui/animated-gradient-text.tsx";
import { WorldMap } from "@/components/ui/map.tsx";
import { Typewriter } from "@/components/ui/typewriter.tsx";
import { cn } from "@/lib/utils.ts";

const clients = [
  { name: "Amarom", logo: "/clients/amarom2.png" },
  { name: "Defen Group", logo: "/clients/defen-group-logo.png" },
  { name: "Liveright", logo: "/clients/liveright-logo.png" },
  { name: "MMA", logo: "/clients/mma-logo.png" },
  { name: "Stanjo", logo: "/clients/stanjo.png" },
  { name: "Epitome", logo: "/clients/epitome-logo.png" },
  { name: "Luxewrap", logo: "/clients/luxewrap-logo.png" },
  { name: "Medplus", logo: "/clients/medplus-logo.png" },
  { name: "Farma24", logo: "/clients/farma24-logo.png" },
  { name: "Ashut", logo: "/clients/ashut-logo.png" },
  { name: "Trelanbrams", logo: "/clients/trelanbrams-logo.png" },
  { name: "Datini", logo: "/clients/datini-logo.png" },
  { name: "HB", logo: "/clients/hb-logo.webp" },
  { name: "Cruises Bob", logo: "/clients/cruisesbob-logo.png" },
  { name: "Insaac", logo: "/clients/insaac2.png" },
  { name: "2tokee", logo: "/clients/2tokee.png" },
  { name: "APL", logo: "/clients/apl-logo.png" },
] as const;

const allClients = [...clients, ...clients];
import { Button } from "@/components/ui/button.tsx";
import { useNavigate } from "react-router-dom";

const nairobiHub = { lat: -1.2921, lng: 36.8219, label: "Nairobi" };

/** One representative city per region — avoids clustered pins (e.g. NYC / DC / Toronto). */
const globalDestinations = [
  { lat: 51.5074, lng: -0.1278, label: "London" },
  { lat: 40.7128, lng: -74.006, label: "New York" },
  { lat: -23.5505, lng: -46.6333, label: "São Paulo" },
  { lat: -33.9249, lng: 18.4241, label: "Cape Town" },
  { lat: 25.2048, lng: 55.2708, label: "Dubai" },
  { lat: 19.076, lng: 72.8777, label: "Mumbai" },
  { lat: 1.3521, lng: 103.8198, label: "Singapore" },
  { lat: 35.6762, lng: 139.6503, label: "Tokyo" },
  { lat: -33.8688, lng: 151.2093, label: "Sydney" },
] as const;

const heroMapDots = globalDestinations.map((end, index) => ({
  start: index === 0 ? nairobiHub : { lat: nairobiHub.lat, lng: nairobiHub.lng },
  end,
}));

const socialProof = [
  { dot: "bg-emerald-400", text: "500+ Businesses Powered" },
  { dot: "bg-primary", text: "99.9% Uptime" },
  { dot: "bg-amber-400", text: "Results in 30 Days" },
];

export default function Hero() {
  const navigate = useNavigate();

  return (
    <section
      id="hero"
      className="relative flex items-center pt-16 overflow-x-hidden lg:min-h-[90vh] bg-background"
    >
      {/* Subtle dot grid */}
      <div
        className="absolute inset-0 opacity-30 pointer-events-none"
        style={{
          backgroundImage: "radial-gradient(oklch(0.6 0.02 240 / 0.4) 1px, transparent 1px)",
          backgroundSize: "28px 28px",
        }}
      />
      {/* Soft radial accent */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: "radial-gradient(ellipse 65% 55% at 82% 40%, oklch(0.92 0.04 235 / 0.22) 0%, transparent 70%)",
        }}
      />

      <div className="max-w-7xl mx-auto px-4 md:px-8 py-16 md:py-20 lg:py-28 grid lg:grid-cols-2 gap-14 lg:gap-20 items-center w-full relative z-10">

        {/* Left: text */}
        <div className="max-w-xl">
          <motion.div
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="mb-7"
          >
            <AnimatedGradientText className="mx-0 rounded-full text-xs">
              <Zap size={11} className="shrink-0 fill-[#ffaa40] text-[#ffaa40]" />
              <hr className="mx-2 h-4 w-px shrink-0 border-0 bg-border" />
              <span
                className={cn(
                  "inline animate-gradient bg-gradient-to-r from-[#ffaa40] via-[#9c40ff] to-[#ffaa40] bg-[length:var(--bg-size)_100%] bg-clip-text text-transparent",
                )}
              >
                Kenya&apos;s All-In-One Digital Partner
              </span>
              <ChevronRight className="ml-1 size-3 text-muted-foreground transition-transform duration-300 ease-in-out group-hover:translate-x-0.5" />
            </AnimatedGradientText>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.08 }}
            className="text-5xl md:text-6xl lg:text-[66px] font-bold tracking-tight leading-[1.08] mb-5"
          >
            <span className="text-foreground">Built to </span>
            <Typewriter
              text={["Create.", "Launch.", "Grow."]}
              speed={65}
              waitTime={1800}
              deleteSpeed={35}
              initialDelay={400}
              className="text-primary"
              cursorChar="|"
              hideCursorOnType
            />
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.16 }}
            className="text-lg text-muted-foreground leading-relaxed mb-9 max-w-md"
          >
            We build your brand, put it online, and drive real growth - web design, cloud hosting, SEO, and AI automation, all under one roof.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.24 }}
            className="flex flex-col sm:flex-row gap-3 mb-10"
          >
            <Button
              size="lg"
              onClick={() => navigate("/contact")}
              className="bg-primary text-primary-foreground hover:opacity-90 cursor-pointer font-semibold text-[15px] px-7 gap-2 rounded-full"
            >
              Get Your Free Strategy Call
              <ArrowRight size={15} />
            </Button>
            <Button
              size="lg"
              variant="outline"
              onClick={() => navigate("/pricing")}
              className="cursor-pointer font-medium text-[15px] rounded-full"
            >
              View Pricing
            </Button>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-muted-foreground"
          >
            {socialProof.map(({ dot, text }) => (
              <div key={text} className="flex items-center gap-2">
                <div className={`w-1.5 h-1.5 rounded-full ${dot}`} />
                <span>{text}</span>
              </div>
            ))}
          </motion.div>
        </div>

        {/* Right: global connectivity map */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.25 }}
          className="flex w-full flex-col gap-5 lg:gap-6"
        >
          <div className="space-y-1.5 text-center lg:text-left">
            <p className="text-base font-semibold tracking-tight text-foreground">
              Fast everywhere. Secure always.
            </p>
            <p className="mx-auto max-w-xs text-sm leading-relaxed text-muted-foreground lg:mx-0 lg:max-w-sm">
              A global server network that keeps your site loading anywhere, everywhere
            </p>
          </div>
          <WorldMap
            dots={heroMapDots}
            lineColor="#38b6ff"
            showLabels
            blend
            className="w-full max-w-2xl mx-auto lg:mx-0 lg:max-w-none [mask-image:linear-gradient(to_bottom,transparent,black_8%,black_92%,transparent)]"
          />
        </motion.div>

        {/* Trusted by — full-width row below both columns */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.6 }}
          className="col-span-full pb-4"
        >
          <p className="text-center text-xs font-mono font-semibold tracking-widest text-muted-foreground/60 uppercase mb-6">
            Trusted by businesses across Kenya
          </p>
          <div className="relative overflow-hidden">
            <div className="absolute inset-y-0 left-0 w-16 bg-gradient-to-r from-background to-transparent z-10 pointer-events-none" />
            <div className="absolute inset-y-0 right-0 w-16 bg-gradient-to-l from-background to-transparent z-10 pointer-events-none" />
            <div className="flex overflow-hidden">
              <motion.div
                className="flex gap-10 items-center shrink-0"
                animate={{ x: ["0%", "-50%"] }}
                transition={{ duration: 42, repeat: Infinity, ease: "linear" }}
              >
                {allClients.map((client, i) => (
                  <div
                    key={`${client.name}-${i}`}
                    className="flex items-center justify-center opacity-50 hover:opacity-90 grayscale hover:grayscale-0 transition-all duration-300 shrink-0 px-1"
                    title={client.name}
                  >
                    <img
                      src={client.logo}
                      alt={client.name}
                      className="h-7 w-auto max-w-[120px] object-contain"
                      loading="lazy"
                    />
                  </div>
                ))}
              </motion.div>
            </div>
          </div>
        </motion.div>

      </div>
    </section>
  );
}
