import { motion } from "motion/react";
import { CLIENT_LOGOS } from "@/lib/clients.ts";

const allClients = [...CLIENT_LOGOS, ...CLIENT_LOGOS];

export default function TrustedBy() {
  return (
    <section className="py-12 border-y border-border/50 bg-muted/20 overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 md:px-8">
        <motion.p
          initial={{ opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center text-xs font-mono font-bold tracking-widest text-muted-foreground uppercase mb-8"
        >
          Trusted by businesses running on
        </motion.p>

        <div className="relative">
          <div className="absolute inset-y-0 left-0 w-20 bg-gradient-to-r from-background/80 to-transparent z-10 pointer-events-none" />
          <div className="absolute inset-y-0 right-0 w-20 bg-gradient-to-l from-background/80 to-transparent z-10 pointer-events-none" />

          <div className="flex overflow-hidden">
            <motion.div
              className="flex gap-12 items-center shrink-0"
              animate={{ x: ["0%", "-50%"] }}
              transition={{
                duration: 42,
                repeat: Infinity,
                ease: "linear" as const,
              }}
            >
              {allClients.map((client, i) => (
                <div
                  key={`${client.name}-${i}`}
                  className="flex items-center justify-center opacity-90 hover:opacity-100 transition-opacity duration-300 shrink-0 px-2 py-2"
                  title={client.name}
                >
                  <img
                    src={client.logo}
                    alt={client.name}
                    className="h-16 w-auto max-w-[210px] object-contain sm:h-20 md:h-24"
                    loading="lazy"
                  />
                </div>
              ))}
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  );
}
