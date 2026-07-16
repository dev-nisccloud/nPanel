import { Avatar, AvatarFallback } from "@/components/ui/avatar.tsx";
import { Badge } from "@/components/ui/badge.tsx";
import { Button } from "@/components/ui/button.tsx";
import { Card, CardContent, CardFooter } from "@/components/ui/card.tsx";
import type { LucideIcon } from "lucide-react";
import { motion } from "motion/react";

export type FeatureItem = {
  icon: LucideIcon;
  /** @deprecated Use title + description for structured cards */
  content?: string;
  title?: string;
  description?: string;
};

export type FeatureTestimonial = {
  quote: string;
  name: string;
  role: string;
  avatarSrc: string;
};

export type FeatureProps = {
  badge?: string;
  title: string;
  description: string;
  featureData: FeatureItem[];
  testimonial?: FeatureTestimonial;
  heroImage?: string;
  ctaLabel?: string;
  ctaHref?: string;
};

const defaultTestimonial: FeatureTestimonial = {
  quote:
    "We went from idea to live product in under 30 days. The process was transparent at every step  we always knew exactly what was happening next.",
  name: "Sarah Mwangi",
  role: "Founder, Nairobi SaaS Startup",
  avatarSrc: "https://images.shadcnspace.com/assets/profiles/user-1.jpg",
};

const defaultHeroImage =
  "https://images.shadcnspace.com/assets/feature/feature-01-img.webp";

const Feature = ({
  badge,
  title,
  description,
  featureData,
  testimonial = defaultTestimonial,
  heroImage = defaultHeroImage,
  ctaLabel,
  ctaHref,
}: FeatureProps) => {
  return (
    <section>
      <div className="py-8 sm:py-16 lg:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-8">
          <div className="flex flex-col gap-8 md:gap-12">
            <motion.div
              initial={{ y: -20, opacity: 0 }}
              whileInView={{ y: 0, opacity: 1 }}
              viewport={{ once: true }}
              transition={{
                duration: 0.8,
                ease: [0.21, 0.47, 0.32, 0.98],
              }}
              className="flex flex-col items-center justify-center gap-4 md:flex-row md:items-end md:justify-between"
            >
              <div className="flex max-w-full flex-col items-center gap-4 text-center md:max-w-xl md:items-start md:text-left">
                {badge ? (
                  <Badge variant="outline" className="h-auto px-3 py-1 text-sm font-normal">
                    {badge}
                  </Badge>
                ) : null}
                <h2 className="text-3xl font-semibold text-foreground md:text-4xl">{title}</h2>
                <p className="text-lg font-normal text-muted-foreground">{description}</p>
              </div>
              {ctaLabel && ctaHref ? (
                <Button asChild className="h-auto cursor-pointer rounded-full px-5 py-2.5 shadow-xs">
                  <a href={ctaHref}>{ctaLabel}</a>
                </Button>
              ) : null}
            </motion.div>

            <div className="grid grid-cols-1 gap-3 md:gap-6 lg:grid-cols-2">
              <motion.div
                initial={{ x: -100, opacity: 0 }}
                whileInView={{ x: 0, opacity: 1 }}
                viewport={{ once: true }}
                transition={{
                  duration: 0.8,
                  ease: [0.21, 0.47, 0.32, 0.98],
                }}
                className="h-full w-full rounded-2xl bg-cover bg-center bg-no-repeat object-cover p-6 sm:p-16"
                style={{ backgroundImage: `url('${heroImage}')` }}
              >
                <Card className="flex items-start gap-12 rounded-lg border-none pt-6 shadow-none ring-0 sm:py-10 has-data-[slot=card-footer]:pb-6! sm:has-data-[slot=card-footer]:pb-10!">
                  <CardContent className="flex flex-col gap-6 px-6 sm:px-8">
                    <Avatar className="size-12">
                      <AvatarFallback>
                        <img
                          src={testimonial.avatarSrc}
                          alt={testimonial.name}
                          className="rounded-full"
                        />
                      </AvatarFallback>
                    </Avatar>
                    <h3 className="text-xl font-medium sm:text-2xl">
                      &ldquo;{testimonial.quote}&rdquo;
                    </h3>
                  </CardContent>
                  <CardFooter className="flex w-full flex-col items-start gap-0.5 border-none bg-card px-6 py-0 sm:px-8">
                    <p className="text-sm font-medium text-primary">{testimonial.name}</p>
                    <span className="text-xs font-normal uppercase text-muted-foreground">
                      {testimonial.role}
                    </span>
                  </CardFooter>
                </Card>
              </motion.div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:gap-6">
                {featureData.map((value, index) => (
                  <motion.div
                    key={index}
                    initial={{ x: 100, opacity: 0 }}
                    whileInView={{ x: 0, opacity: 1 }}
                    viewport={{ once: true }}
                    transition={{
                      duration: 0.8,
                      ease: [0.21, 0.47, 0.32, 0.98],
                    }}
                  >
                    <Card className="h-full border-0 bg-muted py-8 ring-0">
                      <CardContent className="flex h-full w-full flex-col items-start gap-4 px-8">
                        <value.icon className="h-6 w-6 text-muted-foreground" strokeWidth={1.5} />
                        {value.title ? (
                          <>
                            <h3 className="text-base font-semibold text-foreground">
                              {value.title}
                            </h3>
                            <p className="text-sm font-normal leading-relaxed text-muted-foreground">
                              {value.description}
                            </p>
                          </>
                        ) : (
                          <p className="text-base font-normal text-primary">{value.content}</p>
                        )}
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Feature;
