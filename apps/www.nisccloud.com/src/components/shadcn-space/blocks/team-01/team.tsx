import { Badge } from "@/components/ui/badge.tsx";
import { motion } from "motion/react";
import {
  BarChart3,
  Code2,
  Headset,
  Palette,
  Server,
  Workflow,
  type LucideIcon,
} from "lucide-react";

/**
 * Role-based team section. Named people and portraits were removed because the
 * previous content was template placeholder data (fictional names and CDN stock
 * photos). Replace with real team members only once the owner supplies names,
 * roles and consented photographs.
 */
type TeamRole = {
  icon: LucideIcon;
  role: string;
  description: string;
};

const teamRoles: TeamRole[] = [
  {
    icon: Server,
    role: "Hosting and infrastructure",
    description:
      "Runs the domains, hosting, email and server platform, monitors uptime against our targets and handles migrations.",
  },
  {
    icon: Palette,
    role: "Brand and web design",
    description:
      "Designs identities and websites that are clear, usable and built to convert, not just to look good.",
  },
  {
    icon: BarChart3,
    role: "Marketing and growth",
    description:
      "Runs SEO, paid media, social and email with measurable goals and reporting you can read.",
  },
  {
    icon: Code2,
    role: "Development",
    description:
      "Builds fast, reliable websites, ecommerce and custom software, and ships carefully so your business stays online.",
  },
  {
    icon: Workflow,
    role: "Automation and Zepo AI",
    description:
      "Sets up workflows, chat and follow-up automation that save time, and explains every step in plain language.",
  },
  {
    icon: Headset,
    role: "Client success and support",
    description:
      "Keeps projects on track and makes sure there is always a real person who owns your account.",
  },
];

const Team = () => {
  return (
    <section>
      <div className="lg:py-20 sm:py-16 py-8">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-16 flex flex-col items-center justify-center gap-8 md:gap-16">
          <motion.div
            initial={{ y: -40, opacity: 0 }}
            whileInView={{ y: 0, opacity: 1 }}
            viewport={{ once: true }}
            transition={{
              duration: 0.8,
              ease: [0.21, 0.47, 0.32, 0.98],
            }}
            className="max-w-xl mx-auto flex flex-col items-center justify-center text-center gap-4"
          >
            <Badge variant="outline" className="px-3 py-1 h-auto text-sm">
              Team
            </Badge>
            <h2 className="text-3xl md:text-5xl font-medium text-foreground">
              The team behind your account
            </h2>
            <p className="text-base text-muted-foreground">
              One team covers infrastructure, design, marketing, development, automation and support, so you
              never have to coordinate between providers.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 w-full">
            {teamRoles.map((member, index) => (
              <motion.div
                key={member.role}
                initial={{ y: 40, opacity: 0 }}
                whileInView={{ y: 0, opacity: 1 }}
                viewport={{ once: true }}
                transition={{
                  duration: 0.8,
                  delay: index * 0.08,
                  ease: [0.21, 0.47, 0.32, 0.98],
                }}
                className="flex flex-col gap-4 rounded-2xl border border-border/60 bg-card p-6"
              >
                <span className="inline-flex size-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <member.icon className="size-5" aria-hidden />
                </span>
                <h3 className="text-lg font-bold tracking-tight text-foreground">{member.role}</h3>
                <p className="text-sm leading-relaxed text-muted-foreground">{member.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default Team;
