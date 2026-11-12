import { Link } from "react-router-dom";
import { motion, useReducedMotion } from "motion/react";
import { ArrowRight, Handshake, HeartHandshake, Quote, Sparkles } from "lucide-react";

const CEO = {
  name: "Naftaly",
  role: "Founder & CEO, Nisc Cloud",
  photo: "/about/ceo-naftaly.webp",
};

const MESSAGE = [
  "I started Nisc Cloud in 2019 because I kept meeting business owners who had been let down by technology. One company built the website, another hosted it and a third ran the email. When something broke, nobody owned the problem.",
  "I believed businesses deserved one partner that takes responsibility, from the first idea to the everyday running of the business. That is still how we work.",
  "Our team builds brands, websites and software. We keep domains, hosting, email and servers running through nPanel, and we help businesses grow with marketing and automation. Thousands of customers trust us with the systems their business depends on, and we treat that trust as our first responsibility.",
];

const AUDIENCES = [
  {
    icon: HeartHandshake,
    to: "To our clients",
    text: "Thank you. Our promise is simple: straight answers, work that goes live, and a team that stays with you after it does.",
  },
  {
    icon: Handshake,
    to: "To partners and investors",
    text: "We are building for the long term. We grow by being useful, earn trust by being accountable and reinvest in the people and infrastructure that keep businesses online.",
  },
  {
    icon: Sparkles,
    to: "To future team members",
    text: "Come here to own real work. You will learn fast, work next to people who care about doing it properly, and see your work keep a business open.",
  },
];

export default function CeoMessage() {
  const reduce = useReducedMotion();
  const rise = (delay = 0) =>
    reduce
      ? {}
      : {
          initial: { opacity: 0, y: 24 },
          whileInView: { opacity: 1, y: 0 },
          viewport: { once: true, margin: "-60px" },
          transition: { duration: 0.6, delay, ease: [0.22, 1, 0.36, 1] as const },
        };

  return (
    <section id="ceo-message" aria-labelledby="ceo-message-title" className="relative overflow-hidden px-4 py-20 md:px-8 md:py-28">
      <div
        aria-hidden
        className="pointer-events-none absolute -left-40 top-20 -z-10 size-[520px] rounded-full bg-[#38b6ff]/10 blur-3xl"
      />
      <div className="mx-auto grid max-w-7xl gap-12 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] lg:gap-20">
        <motion.figure {...rise()} className="relative mx-auto w-full max-w-md self-start lg:sticky lg:top-28 lg:max-w-none">
          <div className="relative overflow-hidden rounded-[32px] bg-[#02070A] ring-1 ring-black/5">
            <div
              className="pointer-events-none absolute inset-0"
              style={{ background: "radial-gradient(70% 55% at 70% 0%, rgb(56 182 255 / 0.35), transparent 70%)" }}
              aria-hidden
            />
            <img
              src={CEO.photo}
              alt={`${CEO.name}, ${CEO.role}`}
              loading="lazy"
              className="relative aspect-[4/5] w-full object-cover object-[60%_top]"
            />
            <div className="pointer-events-none absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-[#02070A]/80 to-transparent" aria-hidden />
            <figcaption className="absolute inset-x-5 bottom-5 flex items-end justify-between gap-3 text-white">
              <span>
                <span className="block text-xl font-semibold">{CEO.name}</span>
                <span className="block text-sm text-white/75">{CEO.role}</span>
              </span>
              <span className="rounded-full bg-white/15 px-3 py-1 text-xs font-semibold backdrop-blur-md">Since 2019</span>
            </figcaption>
          </div>
          <span className="absolute -right-3 -top-3 grid size-14 place-items-center rounded-2xl bg-[#38b6ff] text-[#02070A] shadow-lg" aria-hidden>
            <Quote className="size-6" />
          </span>
        </motion.figure>

        <div>
          <motion.p {...rise()} className="type-label text-[#38b6ff]">
            Message from our CEO
          </motion.p>
          <motion.h2 {...rise(0.05)} id="ceo-message-title" className="type-h2 mt-3 max-w-2xl text-balance">
            We built Nisc Cloud so a business never has to wonder who is responsible. <span className="text-[#38b6ff]">We are.</span>
          </motion.h2>

          <motion.div {...rise(0.1)} className="mt-8 space-y-5 text-base leading-relaxed text-muted-foreground md:text-lg">
            {MESSAGE.map((paragraph, index) => (
              <p key={paragraph.slice(0, 24)} className={index === 0 ? "text-foreground" : undefined}>
                {paragraph}
              </p>
            ))}
          </motion.div>

          <ul className="mt-10 grid gap-4 md:grid-cols-3">
            {AUDIENCES.map((item, index) => (
              <motion.li
                key={item.to}
                {...rise(index * 0.08)}
                className="group rounded-[22px] border border-border bg-card p-5 transition-colors hover:border-[#38b6ff]/60"
              >
                <span className="grid size-10 place-items-center rounded-xl bg-[#38b6ff]/10 text-[#38b6ff] transition-colors group-hover:bg-[#38b6ff] group-hover:text-[#02070A]">
                  <item.icon className="size-5" aria-hidden />
                </span>
                <p className="mt-4 text-sm font-semibold">{item.to}</p>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{item.text}</p>
              </motion.li>
            ))}
          </ul>

          <motion.blockquote {...rise()} className="relative mt-10 overflow-hidden rounded-[24px] bg-[#02070A] p-7 text-white md:p-8">
            <div className="pointer-events-none absolute -right-10 -top-10 size-40 rounded-full bg-[#38b6ff]/25 blur-2xl" aria-hidden />
            <p className="relative text-2xl font-semibold tracking-tight md:text-3xl">
              Get online. Stay online. <span className="text-[#38b6ff]">Grow your business.</span>
            </p>
            <p className="relative mt-2 text-base text-white/70">That is our job, and we are proud to do it.</p>
            <footer className="relative mt-6 flex items-center gap-3 text-sm">
              <span className="h-px w-8 bg-[#38b6ff]" aria-hidden />
              <span className="font-semibold">{CEO.name}</span>
              <span className="text-white/60">{CEO.role}</span>
            </footer>
          </motion.blockquote>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link
              to="/contact"
              className="inline-flex min-h-12 items-center justify-center gap-2 rounded-[12px] bg-[#38b6ff] px-6 text-base font-semibold text-[#02070A] hover:bg-[#38b6ff]/85 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#38b6ff] focus-visible:ring-offset-2"
            >
              Work with us
              <ArrowRight className="size-4" aria-hidden />
            </Link>
            <Link
              to="/careers"
              className="inline-flex min-h-12 items-center justify-center rounded-[12px] border border-border px-6 text-base font-semibold hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#38b6ff] focus-visible:ring-offset-2"
            >
              Join the team
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
