import { motion } from "motion/react";
import type { ReactNode } from "react";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button.tsx";
import { useNavigate } from "react-router-dom";
import { niscWebsiteImage } from "@/lib/nisc-website-images.ts";
import { NiscWebsiteHeroImage } from "@/components/NiscWebsiteHeroImage.tsx";

type SecurityHeroProps = {
  title?: ReactNode;
  description?: string;
  imageSrc?: string;
  imageAlt?: string;
  plansId?: string;
};

export default function SecurityHero({
  title = (
    <>
      Keep Your Website
      <br />
      <span className="text-primary">Safe and Online</span>
    </>
  ),
  description = "SSL certificates, malware scanning, firewall protection, and daily backups, managed by our security team so you can focus on your business.",
  imageSrc = niscWebsiteImage("website security.png"),
  imageAlt = "Website Security illustration",
  plansId = "security-plans",
}: SecurityHeroProps = {}) {
  const navigate = useNavigate();

  return (
    <section className="relative pt-28 pb-16 px-4 overflow-hidden">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col lg:flex-row items-center gap-12 lg:gap-16 min-h-[520px]">
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
                Get Started <ArrowRight size={15} />
              </Button>
              <Button
                variant="ghost"
                className="border border-border/60 rounded-2xl h-12 cursor-pointer font-medium hover:border-primary/40 hover:bg-primary/5 transition-all"
                onClick={() => navigate("/contact")}
              >
                Talk to an Expert
              </Button>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 28 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.7, delay: 0.1 }}
            className="flex-1 w-full lg:max-w-[720px] xl:max-w-[780px] relative"
          >
            <NiscWebsiteHeroImage
              src={imageSrc}
              alt={imageAlt}
              standalone
            />
          </motion.div>
        </div>
      </div>
    </section>
  );
}
