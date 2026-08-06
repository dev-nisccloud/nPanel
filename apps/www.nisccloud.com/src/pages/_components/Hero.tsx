import { motion } from "motion/react";
import { ArrowRight } from "lucide-react";
// import { Paintbrush, Server, Bot, TrendingUp } from "lucide-react";
import { Typewriter } from "@/components/ui/typewriter.tsx";
import { Button } from "@/components/ui/button.tsx";
import { useNavigate } from "react-router-dom";
// import DisplayCards from "@/components/ui/display-cards.tsx";
import { niscWebsiteImage } from "@/lib/nisc-website-images.ts";
import { NiscWebsiteHeroImage } from "@/components/NiscWebsiteHeroImage.tsx";

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

const socialProof = [
  { dot: "bg-emerald-400", text: "100+ Businesses Served" },
  { dot: "bg-primary", text: "99.99% Uptime" },
  { dot: "bg-amber-400", text: "Results in 30 Days" },
];

// const heroCards = [
//   {
//     icon: <Bot className="size-4 text-primary" />,
//     title: "Automate with AI",
//     description: "Chatbots, content help, and follow-ups that work while you sleep.",
//     date: "Step 04",
//     iconClassName: "text-primary",
//     titleClassName: "text-primary",
//     className:
//       "[grid-area:stack] hover:-translate-y-24 before:absolute before:w-[100%] before:outline-1 before:rounded-xl before:outline-border before:h-[100%] before:content-[''] before:bg-blend-overlay before:bg-background/50 hover:before:opacity-0 before:transition-opacity before:duration-700 before:left-0 before:top-0",
//   },
//   {
//     icon: <TrendingUp className="size-4 text-primary" />,
//     title: "Get More Customers",
//     description: "SEO, social, and ads that bring real people to your business.",
//     date: "Step 03",
//     iconClassName: "text-primary",
//     titleClassName: "text-primary",
//     className:
//       "[grid-area:stack] translate-x-4 translate-y-4 sm:translate-x-8 sm:translate-y-8 hover:-translate-y-16 before:absolute before:w-[100%] before:outline-1 before:rounded-xl before:outline-border before:h-[100%] before:content-[''] before:bg-blend-overlay before:bg-background/50 hover:before:opacity-0 before:transition-opacity before:duration-700 before:left-0 before:top-0",
//   },
//   {
//     icon: <Server className="size-4 text-primary" />,
//     title: "Go Online",
//     description: "Fast hosting, domains, and business email that stay reliable.",
//     date: "Step 02",
//     iconClassName: "text-primary",
//     titleClassName: "text-primary",
//     className:
//       "[grid-area:stack] translate-x-8 translate-y-8 sm:translate-x-16 sm:translate-y-16 hover:-translate-y-8 before:absolute before:w-[100%] before:outline-1 before:rounded-xl before:outline-border before:h-[100%] before:content-[''] before:bg-blend-overlay before:bg-background/50 hover:before:opacity-0 before:transition-opacity before:duration-700 before:left-0 before:top-0",
//   },
//   {
//     icon: <Paintbrush className="size-4 text-primary" />,
//     title: "Create My Brand",
//     description: "Logo, website look, and brand kit that feel like one story.",
//     date: "Step 01",
//     iconClassName: "text-primary",
//     titleClassName: "text-primary",
//     className:
//       "[grid-area:stack] translate-x-12 translate-y-12 sm:translate-x-24 sm:translate-y-24 hover:translate-y-12",
//   },
// ];

export default function Hero() {
  const navigate = useNavigate();

  return (
    <section
      id="hero"
      className="relative pt-16 overflow-x-hidden bg-background lg:flex lg:min-h-[90vh] lg:items-center"
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

      <div className="relative z-10 mx-auto grid w-full max-w-7xl grid-cols-1 items-start gap-8 px-4 pt-6 pb-10 md:px-8 md:pt-8 lg:grid-cols-[minmax(0,0.95fr)_minmax(0,1.15fr)] lg:items-center lg:gap-12 lg:pt-10 lg:pb-14">

        {/* Left: text */}
        <div className="order-1 max-w-xl lg:order-1">
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.08 }}
            className="text-5xl md:text-6xl lg:text-[70px] font-extrabold tracking-tight leading-[1.05] text-balance mb-3"
          >
            <span className="text-foreground">Create.</span>{" "}
            <span className="text-primary">Launch.</span>{" "}
            <span className="text-foreground">Grow.</span>
          </motion.h1>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.12 }}
            className="text-xl md:text-2xl font-semibold text-foreground/80 mb-6 flex items-center flex-wrap gap-x-2 min-h-[36px]"
          >
            <span className="text-muted-foreground">Built to</span>
            <Typewriter
              text={[
                "design your brand & logo.",
                "put your website online.",
                "bring you more customers.",
                "make your work automatic."
              ]}
              speed={55}
              waitTime={2000}
              deleteSpeed={30}
              initialDelay={300}
              className="text-primary font-bold"
              cursorChar="|"
              hideCursorOnType
            />
          </motion.div>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.18 }}
            className="text-lg text-muted-foreground leading-relaxed mb-9 max-w-lg"
          >
            We help businesses of every size get online, stay online, and grow.
            One team for hosting, brand, and marketing so you are not juggling
            five different vendors.
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

        {/* Trusted by  directly below hero copy on mobile */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.6 }}
          className="order-2 col-span-full pb-0 lg:order-3"
        >
          <p className="mb-4 text-center text-xs font-mono font-semibold tracking-widest text-muted-foreground/60 uppercase lg:mb-6">
            Trusted by growing businesses
          </p>
          <div className="relative overflow-hidden">
            <div className="absolute inset-y-0 left-0 w-16 bg-gradient-to-r from-background to-transparent z-10 pointer-events-none" />
            <div className="absolute inset-y-0 right-0 w-16 bg-gradient-to-l from-background to-transparent z-10 pointer-events-none" />
            <div className="flex overflow-hidden">
              <motion.div
                className="flex gap-8 items-center shrink-0"
                animate={{ x: ["0%", "-50%"] }}
                transition={{ duration: 42, repeat: Infinity, ease: "linear" }}
              >
                {allClients.map((client, i) => (
                  <div
                    key={`${client.name}-${i}`}
                    className="flex items-center justify-center opacity-90 hover:opacity-100 transition-opacity duration-300 shrink-0 px-2 py-1"
                    title={client.name}
                  >
                    <img
                      src={client.logo}
                      alt={client.name}
                      className="h-9 w-auto max-w-[140px] object-contain sm:h-10 md:h-11"
                      loading="lazy"
                    />
                  </div>
                ))}
              </motion.div>
            </div>
          </div>
        </motion.div>

        {/* Right: hero image (same pattern as service pages) */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.25 }}
          className="order-3 hidden w-full items-center justify-center overflow-visible lg:order-2 lg:flex"
        >
          {/*
          <div className="mx-auto max-w-md space-y-2 text-center lg:mx-0 lg:text-left">
            <h3 className="text-lg font-bold tracking-tight text-foreground">
              Everything you need to grow online
            </h3>
            <p className="text-sm leading-relaxed text-muted-foreground">
              Design, hosting, marketing, and smart tools that work together.
              You get one plan, one team, and clear next steps.
            </p>
          </div>
          <div className="flex w-full items-center justify-center py-2 sm:py-4 lg:py-6">
            <div className="w-full max-w-md">
              <DisplayCards cards={heroCards} />
            </div>
          </div>
          */}
          <NiscWebsiteHeroImage
            src={niscWebsiteImage("everything you need online 3.png")}
            alt="Everything you need online"
            standalone
            className="max-h-none w-[118%] max-w-none"
          />
        </motion.div>

      </div>
    </section>
  );
}
