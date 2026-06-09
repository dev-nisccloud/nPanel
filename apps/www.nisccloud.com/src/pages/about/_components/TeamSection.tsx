import { motion } from "motion/react";
import { ExternalLink, Share2 } from "lucide-react";

const team = [
  {
    name: "Marcus Reid",
    role: "Founder & CEO",
    bio: "15 years in digital strategy. Former growth lead at two Y Combinator startups. Built the Atom Approach from first principles.",
    image:
      "https://images.unsplash.com/photo-1566843457184-655eedf6f1ef?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3NzIwMTN8MHwxfHNlYXJjaHwyfHxkaWdpdGFsJTIwYWdlbmN5JTIwZm91bmRlciUyMENFTyUyMHBvcnRyYWl0JTIwcHJvZmVzc2lvbmFsfGVufDB8fHx8MTc3NzYxOTExNnww&ixlib=rb-4.1.0&q=80&w=400",
    accent: "border-primary",
    linkedIn: "#",
    twitter: "#",
  },
  {
    name: "Priya Sharma",
    role: "Head of Design",
    bio: "Award-winning UX designer with a background in cognitive psychology. Believes every pixel has a purpose.",
    image:
      "https://images.unsplash.com/photo-1629904869392-ae2a682d4d01?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3NzIwMTN8MHwxfHNlYXJjaHwyfHx0ZWNoJTIwdGVhbSUyMHByb2Zlc3Npb25hbHMlMjBvZmZpY2UlMjBjb2xsYWJvcmF0aW9ufGVufDB8fHx8MTc3NzYxOTExNnww&ixlib=rb-4.1.0&q=80&w=400",
    accent: "border-blue-400",
    linkedIn: "#",
    twitter: "#",
  },
  {
    name: "Jordan Cole",
    role: "Head of Marketing",
    bio: "Managed $10M+ in ad spend across Google, Meta, and LinkedIn. Obsessed with attribution and ROI.",
    image:
      "https://images.unsplash.com/photo-1589832486202-cf43d3c2547b?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3NzIwMTN8MHwxfHNlYXJjaHwzfHxkaWdpdGFsJTIwYWdlbmN5JTIwZm91bmRlciUyMENFTyUyMHBvcnRyYWl0JTIwcHJvZmVzc2lvbmFsfGVufDB8fHx8MTc3NzYxOTExNnww&ixlib=rb-4.1.0&q=80&w=400",
    accent: "border-green-400",
    linkedIn: "#",
    twitter: "#",
  },
  {
    name: "Aisha Okonkwo",
    role: "Lead Developer",
    bio: "Full-stack engineer who turned down FAANG to help small businesses scale. Ships fast, breaks nothing.",
    image:
      "https://images.unsplash.com/photo-1537458123646-5df662310a69?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3NzIwMTN8MHwxfHNlYXJjaHw2fHx0ZWNoJTIwdGVhbSUyMHByb2Zlc3Npb25hbHMlMjBvZmZpY2UlMjBjb2xsYWJvcmF0aW9ufGVufDB8fHx8MTc3NzYxOTExNnww&ixlib=rb-4.1.0&q=80&w=400",
    accent: "border-yellow-400",
    linkedIn: "#",
    twitter: "#",
  },
  {
    name: "Ryan Nakamura",
    role: "Automation Architect",
    bio: "Built automation systems that save clients hundreds of hours per month. Thinks in workflows, speaks in plain English.",
    image:
      "https://images.unsplash.com/photo-1600896997793-b8ed3459a17f?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3NzIwMTN8MHwxfHNlYXJjaHw0fHxkaWdpdGFsJTIwYWdlbmN5JTIwZm91bmRlciUyMENFTyUyMHBvcnRyYWl0JTIwcHJvZmVzc2lvbmFsfGVufDB8fHx8MTc3NzYxOTExNnww&ixlib=rb-4.1.0&q=80&w=400",
    accent: "border-purple-400",
    linkedIn: "#",
    twitter: "#",
  },
  {
    name: "Sofia Delgado",
    role: "Client Success Lead",
    bio: "The glue that holds client relationships together. Ensures every engagement delivers on its promises — and then some.",
    image:
      "https://images.unsplash.com/photo-1681949287382-052ea3954a51?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3NzIwMTN8MHwxfHNlYXJjaHw4fHx0ZWNoJTIwdGVhbSUyMHByb2Zlc3Npb25hbHMlMjBvZmZpY2UlMjBjb2xsYWJvcmF0aW9ufGVufDB8fHx8MTc3NzYxOTExNnww&ixlib=rb-4.1.0&q=80&w=400",
    accent: "border-pink-400",
    linkedIn: "#",
    twitter: "#",
  },
];

export default function TeamSection() {
  return (
    <section className="py-20 px-4 md:px-8">
      <div className="max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center mb-16"
        >
          <p className="text-sm font-bold text-primary tracking-widest uppercase mb-3">
            The People Behind the Results
          </p>
          <h2 className="text-4xl md:text-5xl font-bold mb-4">Meet the Team</h2>
          <p className="text-muted-foreground max-w-xl mx-auto">
            A crew of strategists, designers, engineers, and marketers who care
            deeply about the businesses they serve.
          </p>
        </motion.div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {team.map((member, i) => (
          <motion.div
            key={member.name}
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: i * 0.08 }}
            className="group bg-card border border-border rounded-2xl overflow-hidden hover:border-primary/40 transition-all duration-300"
          >
            {/* Photo */}
            <div className="relative overflow-hidden aspect-[4/3]">
              <img
                src={member.image}
                alt={member.name}
                className="w-full h-full object-cover object-top group-hover:scale-105 transition-transform duration-500"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-background/80 via-transparent to-transparent" />
              {/* Social links overlay */}
              <div className="absolute bottom-3 right-3 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                <a
                  href={member.linkedIn}
                  className="bg-background/80 backdrop-blur-sm p-2 rounded-full hover:bg-primary hover:text-primary-foreground transition-colors cursor-pointer"
                >
                  <ExternalLink className="w-4 h-4" />
                </a>
                <a
                  href={member.twitter}
                  className="bg-background/80 backdrop-blur-sm p-2 rounded-full hover:bg-primary hover:text-primary-foreground transition-colors cursor-pointer"
                >
                  <Share2 className="w-4 h-4" />
                </a>
              </div>
            </div>

            {/* Info */}
            <div className={`p-5 border-t-2 ${member.accent}`}>
              <h3 className="font-bold text-lg">{member.name}</h3>
              <p className="text-xs text-primary font-semibold tracking-wide mb-2">
                {member.role}
              </p>
              <p className="text-sm text-muted-foreground">{member.bio}</p>
            </div>
          </motion.div>
        ))}
        </div>
      </div>
    </section>
  );
}
