import { motion } from "motion/react";
import type { ReactNode } from "react";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button.tsx";
import { Link } from "react-router-dom";
import { niscWebsiteImage } from "@/lib/nisc-website-images.ts";
import { NiscWebsiteHeroImage } from "@/components/NiscWebsiteHeroImage.tsx";

type SecurityHeroProps = {
  title?: ReactNode;
  description?: string;
  imageSrc?: string;
  imageAlt?: string;
  plansId?: string;
  /** Coded artwork shown instead of the hero image when provided. */
  visual?: ReactNode;
};

export default function SecurityHero({
  title = (
    <>
      Keep Your Website
      {" "}<br />
      <span className="text-primary">Safe and Online</span>
    </>
  ),
  description = "SSL certificates, malware scanning, firewall protection, and daily backups, managed by our security team so you can focus on your business.",
  imageSrc = niscWebsiteImage("website security.png"),
  imageAlt = "Website Security illustration",
  plansId = "security-plans",
  visual,
}: SecurityHeroProps = {}) {

  return (
    <section className="relative overflow-hidden px-4 pt-24 pb-8 lg:pb-10">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col items-center gap-8 lg:flex-row lg:gap-12">
          <motion.div
            initial={{ opacity: 0, x: -28 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
            className="flex-1 flex flex-col items-start text-left max-w-2xl"
          >
            <h1 className="text-[36px] font-extrabold leading-[1.15] mb-6 text-balance">
              {title}
            </h1>
            <p className="text-lg text-muted-foreground leading-relaxed mb-8 max-w-xl">
              {description}
            </p>
            <div className="flex flex-col sm:flex-row gap-3">
              <Button
                className="bg-primary text-primary-foreground font-bold px-8 rounded-2xl h-12 cursor-pointer hover:opacity-90 shadow-lg shadow-primary/30 gap-2"
                onClick={() => document.getElementById(plansId)?.scrollIntoView({ behavior: "smooth" })}
              >
                Choose Your Plan <ArrowRight size={15} />
              </Button>
              <Button asChild
                variant="ghost"
                className="border border-border/60 rounded-2xl h-12 cursor-pointer font-medium hover:border-primary/40 hover:bg-primary/5 transition-all"
              ><Link to={"/contact"}>
                Talk to an Expert
              </Link></Button>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 28 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.7, delay: 0.1 }}
            className="flex-1 w-full lg:max-w-[720px] xl:max-w-[780px] relative"
          >
            {visual ?? (
              <NiscWebsiteHeroImage
                src={imageSrc}
                alt={imageAlt}
                standalone
              />
            )}
          </motion.div>
        </div>
      </div>
    </section>
  );
}
