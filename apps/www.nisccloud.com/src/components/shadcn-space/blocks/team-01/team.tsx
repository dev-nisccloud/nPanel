import { Badge } from "@/components/ui/badge.tsx";
import { motion } from "motion/react";

const TEAM_IMAGES = [
  "https://images.shadcnspace.com/assets/team/team-img-01.png",
  "https://images.shadcnspace.com/assets/team/team-img-02.png",
  "https://images.shadcnspace.com/assets/team/team-img-03.png",
  "https://images.shadcnspace.com/assets/team/team-img-04.png",
] as const;

type TeamMember = {
  name: string;
  role: string;
  description: string;
};

const teamData: TeamMember[] = [
  {
    name: "Marcus Reid",
    role: "Founder & CEO",
    description:
      "15 years in digital strategy. Former growth lead at two Y Combinator startups. Built the Atom Approach from first principles.",
  },
  {
    name: "Priya Sharma",
    role: "Head of Design",
    description:
      "Award-winning UX designer with a background in cognitive psychology. Believes every pixel has a purpose.",
  },
  {
    name: "Jordan Cole",
    role: "Head of Marketing",
    description:
      "Managed $10M+ in ad spend across Google, Meta, and LinkedIn. Obsessed with attribution and ROI.",
  },
  {
    name: "Aisha Okonkwo",
    role: "Lead Developer",
    description:
      "Full-stack engineer who turned down FAANG to help small businesses scale. Ships fast, breaks nothing.",
  },
  {
    name: "Ryan Nakamura",
    role: "Automation Architect",
    description:
      "Built automation systems that save clients hundreds of hours per month. Thinks in workflows, speaks in plain English.",
  },
  {
    name: "Sofia Delgado",
    role: "Client Success Lead",
    description:
      "The glue that holds client relationships together. Ensures every engagement delivers on its promises — and then some.",
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
              Meet the creative minds behind our success
            </h2>
          </motion.div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 w-full">
            {teamData.map((member, index) => (
              <motion.div
                key={member.name}
                initial={{ y: 40, opacity: 0 }}
                whileInView={{ y: 0, opacity: 1 }}
                viewport={{ once: true }}
                transition={{
                  duration: 0.8,
                  delay: index * 0.1,
                  ease: [0.21, 0.47, 0.32, 0.98],
                }}
                className="group flex flex-col items-center justify-center gap-6"
              >
                <img
                  className="w-full h-full group-hover:grayscale transition-all duration-300"
                  src={TEAM_IMAGES[index % TEAM_IMAGES.length]}
                  alt={member.name}
                />
                <div className="w-full flex flex-col gap-4 items-center justify-center">
                  <div className="flex flex-col items-center justify-center gap-2 text-center">
                    <h3 className="text-2xl font-medium text-foreground">
                      {member.name}
                    </h3>
                    <p className="text-sm font-normal text-muted-foreground">
                      {member.role}
                    </p>
                  </div>
                  <p className="text-sm font-normal text-muted-foreground text-center leading-relaxed">
                    {member.description}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default Team;
