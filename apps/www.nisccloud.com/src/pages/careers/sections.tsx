import { useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { Check, Coffee, Gauge, MessageSquareText, Minus, Plus, Target } from "lucide-react";
import { BentoSection, BentoTile, FactStrip, GlassCta, Highlight, HonestCards, TileText } from "@/components/signature/index.ts";
import { ProjectJourneyArt } from "@/components/artwork/build-art.tsx";
import { HostingFlagshipArt, SeoFlagshipArt } from "@/components/artwork/flagship-art.tsx";
import {
  CareersHeroScenes,
  FactCustomersArt,
  FactTeamArt,
  FactYearArt,
  HireScene,
  MentorChatArt,
  OpenApplicationArt,
  OwnershipArt,
  PaceArt,
  PlainTalkArt,
  SceneStage,
  TeamCelebrationArt,
  ValueScene,
} from "@/components/artwork/careers-art.tsx";
import { BENEFITS } from "./data.ts";

const focusRing =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#38b6ff] focus-visible:ring-offset-2 focus-visible:ring-offset-[#02070A]";
const lightFocus = "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#38b6ff] focus-visible:ring-offset-2";
const label = "type-label text-[#38b6ff] dark:text-[#38b6ff]";

export const SECTION_LINKS = [
  { id: "why-nisc", label: "Why Nisc Cloud" },
  { id: "the-work", label: "The work" },
  { id: "what-guides-us", label: "What guides us" },
  { id: "what-we-offer", label: "What we offer" },
  { id: "how-we-hire", label: "How we hire" },
] as const;

export function CareersHero({ openCount }: { openCount: number | null }) {
  return (
    <section
      id="hero"
      className="relative overflow-hidden bg-[#02070A] pt-28 text-white md:pt-32"
      style={{
        backgroundImage:
          "radial-gradient(55% 45% at 50% 0%, rgb(56 182 255 / 0.22), transparent 70%), radial-gradient(35% 40% at 92% 70%, rgb(56 182 255 / 0.18), transparent 70%)",
      }}
    >
      <div className="mx-auto max-w-7xl px-4 text-center md:px-8">
        <nav aria-label="Careers sections" className="mx-auto mb-10 hidden w-fit rounded-full border border-white/10 bg-white/5 p-1.5 md:block">
          <ul className="flex gap-1">
            {SECTION_LINKS.map((link) => (
              <li key={link.id}>
                <a href={`#${link.id}`} className={`inline-flex min-h-10 items-center whitespace-nowrap rounded-full px-4 text-sm font-medium text-white/85 hover:bg-white/10 hover:text-white ${focusRing}`}>
                  {link.label}
                </a>
              </li>
            ))}
            <li>
              <a href="#open-roles" className={`inline-flex min-h-10 items-center whitespace-nowrap rounded-full bg-[#38b6ff] px-4 text-sm font-semibold text-[#02070A] hover:bg-[#38b6ff]/85 ${focusRing}`}>
                Find my role
              </a>
            </li>
          </ul>
        </nav>
        <p className="type-label text-[#38b6ff]">Careers at Nisc Cloud</p>
        <h1 className="type-h1 mx-auto mt-4 max-w-4xl text-balance text-white">Do the best work of your career, for businesses that count on it</h1>
        <p className="mx-auto mt-5 max-w-2xl text-base leading-relaxed text-white/75 md:text-lg">
          Every website we launch and every server we keep running helps a business stay open. Join a team that owns the whole result, learns fast and grows together.
        </p>
        <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <a href="#open-roles" className={`inline-flex min-h-12 items-center rounded-[12px] bg-white px-7 text-base font-semibold text-[#02070A] hover:bg-[#38b6ff]/5 ${focusRing}`}>
            See open roles
          </a>
          {openCount !== null ? (
            <p className="text-sm text-white/70">
              {openCount === 0 ? "No roles open right now" : `${openCount} ${openCount === 1 ? "role" : "roles"} open now`}
            </p>
          ) : null}
        </div>
      </div>

      <div className="mt-12 md:mt-14">
        <CareersHeroScenes />
      </div>
    </section>
  );
}

const FACTS = [
  { value: "2019", label: "the year Nisc Cloud started, with one goal: reliable technology and a team that takes responsibility", Art: FactYearArt },
  { value: "Thousands", label: "of customers run their websites, email and servers with us", Art: FactCustomersArt },
  { value: "One team", label: "across Build, Run and Grow, so the person who builds it understands how it runs", Art: FactTeamArt },
] as const;

export function CareersFacts() {
  return <FactStrip id="why-nisc" eyebrow="Why Nisc Cloud" title="Your work goes live, and businesses feel it" facts={FACTS} />;
}

const WORK = [
  {
    id: "build",
    tab: "Build",
    title: "Make ideas real for the businesses that trust us",
    points: [
      "Shape brands, from the logo to the company profile.",
      "Design and launch websites and ecommerce stores that load fast.",
      "Build software around the way a business actually works.",
    ],
    Art: ProjectJourneyArt,
  },
  {
    id: "run",
    tab: "Run",
    title: "Keep the lights on, quietly and reliably",
    points: [
      "Look after domains, hosting, business email and servers.",
      "Manage accounts in nPanel, the platform our customers log in to.",
      "Answer the ticket, fix the cause and tell the customer in plain words.",
    ],
    Art: HostingFlagshipArt,
  },
  {
    id: "grow",
    tab: "Grow",
    title: "Turn a working website into a growing business",
    points: [
      "Plan and run marketing on the same account the customer already has.",
      "Set up automation so small teams get hours back each week.",
      "Measure what moved and keep only what works.",
    ],
    Art: SeoFlagshipArt,
  },
] as const;

export function CareersWork() {
  const [active, setActive] = useState<(typeof WORK)[number]["id"]>("build");
  const current = WORK.find((item) => item.id === active) ?? WORK[0];
  return (
    <section id="the-work" className="scroll-mt-24 bg-muted/50 px-4 py-24 md:px-8 md:py-28">
      <div className="mx-auto max-w-6xl">
        <div className="text-center">
          <p className={label}>The work</p>
          <h2 className="type-h2 mx-auto mt-3 max-w-3xl text-balance">Three kinds of work. Pick where you start.</h2>
        </div>
        <div role="tablist" aria-label="Areas of work" className="mx-auto mt-10 flex w-fit gap-2 rounded-full border border-border bg-background p-1.5">
          {WORK.map((item) => (
            <button
              key={item.id}
              type="button"
              role="tab"
              id={`work-tab-${item.id}`}
              aria-selected={active === item.id}
              aria-controls="work-panel"
              onClick={() => setActive(item.id)}
              className={`min-h-11 rounded-full px-6 text-sm font-semibold transition-colors ${lightFocus} ${
                active === item.id ? "bg-[#02070A] text-white dark:bg-white dark:text-[#02070A]" : "text-muted-foreground hover:bg-muted"
              }`}
            >
              {item.tab}
            </button>
          ))}
        </div>
        <motion.div
          key={current.id}
          id="work-panel"
          role="tabpanel"
          aria-labelledby={`work-tab-${current.id}`}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35 }}
          className="mt-8 grid overflow-hidden rounded-[28px] border border-border bg-card md:grid-cols-[1fr_1.1fr]"
        >
          <div className="flex flex-col justify-center p-7 md:p-10">
            <h3 className="text-2xl font-semibold leading-tight md:text-3xl">{current.title}</h3>
            <ul className="mt-6 grid gap-3">
              {current.points.map((point) => (
                <li key={point} className="flex gap-3 text-sm leading-relaxed text-muted-foreground md:text-base">
                  <Check className="mt-1 size-4 shrink-0 text-[#38b6ff] dark:text-[#38b6ff]" aria-hidden />
                  {point}
                </li>
              ))}
            </ul>
          </div>
          <div className="flex items-center bg-muted/40 p-4 md:p-6">
            <current.Art />
          </div>
        </motion.div>
      </div>
    </section>
  );
}

const VALUES = [
  {
    title: "Results first",
    text: "Every plan ties to a clear outcome. If it does not help a business get online, stay online or grow, we do not build it.",
    day: "Before a project starts, we agree what success looks like for the customer, like more enquiries or a faster site, and we check it when we finish.",
  },
  {
    title: "Speed matters",
    text: "Momentum compounds online. We ship what works, then improve it, instead of waiting for perfect.",
    day: "A small fix goes live today, not next sprint. The bigger improvement follows once we have seen how customers use it.",
  },
  {
    title: "Client-obsessed",
    text: "We treat every business like our own. Their wins are our wins, and we stay with them when things get hard.",
    day: "You follow a ticket to the end, explain the fix in plain words and check back to make sure it stayed fixed.",
  },
  {
    title: "Radical transparency",
    text: "No jargon, no vanity metrics, no hidden fees. Customers and teammates always know what we are doing and why.",
    day: "If a deadline is going to slip, you say so early, with a new date and the reason. Nobody is surprised.",
  },
  {
    title: "Always learning",
    text: "Hosting and marketing change fast. We keep learning so our customers do not have to chase every trend.",
    day: "When a platform or tool changes, someone tries it first and shows the team what it means for our customers.",
  },
  {
    title: "Built together",
    text: "The best outcomes come from working as one team with the customer. We are collaborators, not distant vendors.",
    day: "Designers, engineers and marketers work on the same accounts, so nothing gets lost in a hand-off.",
  },
] as const;

export function CareersValues() {
  const [active, setActive] = useState(0);
  const value = VALUES[active];
  return (
    <section id="what-guides-us" className="scroll-mt-24 bg-muted/50 px-4 py-24 md:px-8 md:py-32">
      <div className="mx-auto max-w-6xl">
        <p className={label}>What guides us</p>
        <h2 className="type-h2 mt-3 max-w-2xl">Six values, and what they look like on a normal day</h2>
        <p className="mt-4 max-w-2xl text-base leading-relaxed text-muted-foreground">
          Values only count if you can see them in the work. Pick one to see how it shows up at Nisc Cloud.
        </p>

        <div className="mt-12 grid gap-8 lg:grid-cols-[18rem_1fr] lg:gap-12">
          <div role="tablist" aria-label="Values" aria-orientation="vertical" className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-2 [scrollbar-width:none] lg:mx-0 lg:grid lg:overflow-visible lg:px-0">
            {VALUES.map((item, index) => {
              const selected = index === active;
              return (
                <button
                  key={item.title}
                  type="button"
                  role="tab"
                  id={`value-tab-${index}`}
                  aria-selected={selected}
                  aria-controls="value-panel"
                  onClick={() => setActive(index)}
                  className={`group flex min-h-12 shrink-0 items-center gap-3 rounded-2xl px-4 text-left text-sm font-semibold transition-colors lg:min-h-14 lg:text-base ${lightFocus} ${
                    selected ? "bg-[#02070A] text-white dark:bg-white dark:text-[#02070A]" : "bg-background text-foreground hover:bg-background/70 lg:bg-transparent"
                  }`}
                >
                  <span className={`tabular-nums text-xs ${selected ? "text-[#38b6ff] dark:text-[#38b6ff]" : "text-muted-foreground"}`}>{String(index + 1).padStart(2, "0")}</span>
                  <span className="whitespace-nowrap">{item.title}</span>
                </button>
              );
            })}
          </div>

          <div id="value-panel" role="tabpanel" aria-labelledby={`value-tab-${active}`} className="relative">
            <AnimatePresence mode="wait">
              <motion.div
                key={value.title}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -12 }}
                transition={{ duration: 0.3 }}
                className="grid overflow-hidden rounded-[28px] border border-border bg-card md:grid-cols-[1fr_0.9fr]"
              >
                <div className="flex flex-col p-7 md:p-10">
                  <span className="text-sm font-medium tabular-nums text-muted-foreground">
                    {String(active + 1).padStart(2, "0")} / {String(VALUES.length).padStart(2, "0")}
                  </span>
                  <h3 className="mt-4 text-3xl font-semibold tracking-tight md:text-4xl">{value.title}</h3>
                  <p className="mt-4 text-base leading-relaxed text-muted-foreground">{value.text}</p>
                  <div className="mt-auto pt-8">
                    <div className="rounded-2xl bg-[#38b6ff]/5 p-5 dark:bg-[#38b6ff]/10">
                      <p className="text-xs font-semibold uppercase tracking-wide text-[#38b6ff] dark:text-[#38b6ff]">On a normal day at Nisc</p>
                      <p className="mt-2 text-base leading-relaxed text-foreground">{value.day}</p>
                    </div>
                  </div>
                </div>
                <div className="p-3 md:p-4">
                  <ValueScene index={active} label={`Illustration: ${value.title.toLowerCase()} on a normal day at Nisc Cloud`} />
                </div>
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </div>
    </section>
  );
}

const benefit = (title: string) => {
  const found = BENEFITS.find((item) => item.title === title);
  if (!found) throw new Error(`Unknown benefit: ${title}`);
  return found;
};

function MoveAcrossVisual() {
  const reduce = useReducedMotion();
  const stops = ["Build", "Run", "Grow"];
  return (
    <div className="relative mt-8 flex items-center justify-between" aria-hidden>
      <span className="absolute inset-x-6 top-1/2 h-0.5 -translate-y-1/2 border-t-2 border-dashed border-[#02070A]/25" />
      <motion.span
        className="absolute top-1/2 size-3 -translate-y-1/2 rounded-full bg-[#fc734d] shadow-[0_0_0_6px_rgb(252_115_77_/_0.25)]"
        initial={{ left: "8%" }}
        animate={reduce ? { left: "8%" } : { left: ["8%", "48%", "88%", "48%", "8%"] }}
        transition={{ duration: 7, repeat: Infinity, ease: "easeInOut" }}
      />
      {stops.map((stop) => (
        <span key={stop} className="relative rounded-full bg-white px-4 py-2 text-sm font-semibold text-[#02070A] shadow-sm">
          {stop}
        </span>
      ))}
    </div>
  );
}

function LeaveVisual() {
  const highlighted = new Set([4, 11, 12]);
  return (
    <div className="mt-6 grid w-max shrink-0 grid-cols-7 gap-1.5" aria-hidden>
      {Array.from({ length: 14 }, (_, day) => (
        <span
          key={day}
          className={`grid size-7 place-items-center rounded-md text-[10px] font-semibold ${
            highlighted.has(day) ? "bg-[#fc734d] text-white" : "bg-[#38b6ff]/10 text-[#38b6ff]"
          }`}
        >
          {day + 1}
        </span>
      ))}
    </div>
  );
}

function TeaVisual() {
  const reduce = useReducedMotion();
  return (
    <div className="relative mt-6 h-20 w-16" aria-hidden>
      {[0, 1, 2].map((wisp) => (
        <motion.span
          key={wisp}
          className="absolute bottom-12 h-6 w-1 rounded-full bg-[#38b6ff]/50"
          style={{ left: 18 + wisp * 10 }}
          animate={reduce ? undefined : { y: [0, -14], opacity: [0, 1, 0] }}
          transition={{ duration: 2.2, repeat: Infinity, delay: wisp * 0.5, ease: "easeOut" }}
        />
      ))}
      <Coffee className="absolute bottom-0 left-0 size-14 text-[#38b6ff]" strokeWidth={1.6} />
    </div>
  );
}

function SetupVisual() {
  const reduce = useReducedMotion();
  const items = ["Laptop ready", "Accounts set up", "Tools for your role"];
  return (
    <ul className="mt-6 space-y-2" aria-hidden>
      {items.map((item, index) => (
        <motion.li
          key={item}
          initial={reduce ? false : { opacity: 0, x: -12 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.3 + index * 0.25 }}
          className="flex items-center gap-2.5 text-sm font-medium"
        >
          <span className="grid size-5 place-items-center rounded-full bg-[#38b6ff] text-[#02070A]">
            <Check className="size-3" strokeWidth={3} />
          </span>
          {item}
        </motion.li>
      ))}
    </ul>
  );
}

export function CareersOffer() {
  const mentors = benefit("Mentors who answer");
  const move = benefit("Move across teams");
  const leave = benefit("Time for life's big moments");
  const team = benefit("Team buildings and wins");
  const tea = benefit("Tea and meals at the office");
  const ready = benefit("Ready from day one");
  return (
    <BentoSection
      id="what-we-offer"
      eyebrow="What we offer"
      title={
        <>
          We are always looking for people who are ready to <Highlight>challenge the norm</Highlight>
        </>
      }
      intro="Bring the curiosity and the drive. Here is what you get back from us, from your first week onwards."
    >
          <BentoTile index={0} className="flex flex-col md:col-span-3 md:row-span-2">
            <div className="p-6 md:p-8">
              <span className="rounded-full bg-[#38b6ff]/10 px-3 py-1 text-xs font-semibold text-[#38b6ff]">Mentorship</span>
              <div className="mt-4">
                <TileText title={mentors.title} text={mentors.text} />
              </div>
            </div>
            <div className="mt-auto px-3 pb-3 md:px-4 md:pb-4">
              <SceneStage label="Illustration: a new team member asks a senior engineer a question and gets a pairing session" className="min-h-[220px]">
                <div className="mx-auto max-w-sm">
                  <MentorChatArt />
                </div>
              </SceneStage>
            </div>
          </BentoTile>
          <BentoTile index={1} tone="brand" className="p-6 md:col-span-3 md:p-8">
            <TileText title={move.title} text={move.text} tone="brand" />
            <MoveAcrossVisual />
          </BentoTile>
          <BentoTile index={2} className="flex flex-col justify-between p-6 md:col-span-3 md:p-8 xl:flex-row xl:items-end xl:gap-6">
            <div>
              <TileText title={leave.title} text={leave.text} />
            </div>
            <LeaveVisual />
          </BentoTile>
          <BentoTile index={3} className="p-6 md:col-span-2 md:p-8">
            <TileText title={tea.title} text={tea.text} />
            <TeaVisual />
          </BentoTile>
          <BentoTile index={4} tone="dark" className="p-6 md:col-span-2 md:p-8">
            <TileText title={team.title} text={team.text} tone="dark" />
            <div className="mt-6">
              <TeamCelebrationArt />
            </div>
          </BentoTile>
          <BentoTile index={5} tone="muted" className="p-6 md:col-span-2 md:p-8">
            <TileText title={ready.title} text={ready.text} />
            <SetupVisual />
          </BentoTile>
    </BentoSection>
  );
}

const STEPS = [
  { title: "Apply on this page", text: "Choose a role, add your CV and tell us what you want to work on. Your application goes straight to our hiring team." },
  { title: "HR reviews it", text: "Our HR team reviews every application. If your experience fits the role, we email you to set up a first conversation." },
  { title: "First conversation", text: "A conversation, not a test. We talk about what you have built, what you want next and whether this role is the right one for you." },
  { title: "Show us how you work", text: "For most roles we ask you to work through a real problem from that area with the people you would work with." },
  { title: "Decision and first day", text: "We tell you the outcome either way, and why. If it is a yes, we agree a start date and get your laptop and tools ready." },
] as const;

export function CareersHiring() {
  const [open, setOpen] = useState(0);
  const active = open < 0 ? 0 : open;
  return (
    <section id="how-we-hire" className="scroll-mt-24 bg-muted/50 px-4 py-24 md:px-8 md:py-32">
      <div className="mx-auto max-w-6xl">
        <p className={label}>How we hire</p>
        <h2 className="type-h2 mt-3 max-w-2xl">From application to first day</h2>
        <p className="mt-4 max-w-2xl text-base leading-relaxed text-muted-foreground">
          Every role is a little different, but most follow these stages. You will always know which stage you are at.
        </p>
        <div className="mt-12 grid items-center gap-12 md:grid-cols-[0.9fr_1.1fr]">
          <HireScene index={active} label={`Illustration of hiring step ${active + 1}: ${STEPS[active].title}`} />
          <ol className="divide-y divide-border border-y border-border">
            {STEPS.map((step, i) => {
              const expanded = open === i;
              return (
                <li key={step.title}>
                  <h3>
                    <button
                      type="button"
                      aria-expanded={expanded}
                      aria-controls={`hire-step-${i}`}
                      onClick={() => setOpen(expanded ? -1 : i)}
                      className="flex min-h-16 w-full items-center justify-between gap-4 py-4 text-left text-lg font-medium text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#38b6ff] md:text-xl"
                    >
                      <span>
                        <span className="mr-2 tabular-nums text-[#38b6ff] dark:text-[#38b6ff]">{i + 1}.</span>
                        {step.title}
                      </span>
                      {expanded ? <Minus className="size-5 shrink-0" aria-hidden /> : <Plus className="size-5 shrink-0" aria-hidden />}
                    </button>
                  </h3>
                  <div id={`hire-step-${i}`} hidden={!expanded} className="pb-5 pr-8 text-base leading-relaxed text-muted-foreground">
                    {step.text}
                  </div>
                </li>
              );
            })}
          </ol>
        </div>
      </div>
    </section>
  );
}

const NOT_FOR_YOU = [
  { icon: Gauge, Art: PaceArt, title: "We move quickly", text: "We ship what works and improve it. If you need every detail settled before you start, the pace may feel fast." },
  { icon: Target, Art: OwnershipArt, title: "You own the outcome", text: "One team is accountable for the whole account. You will follow work through to the result, not hand it off." },
  { icon: MessageSquareText, Art: PlainTalkArt, title: "We say it plainly", text: "Feedback is direct and goes both ways, with customers and with each other. We think honest beats comfortable." },
] as const;

export function CareersNotForEveryone() {
  return (
    <HonestCards
      eyebrow="Before you apply"
      title="Where we might not suit you"
      intro="We would rather tell you now than in your first month. This way of working is not for everyone."
      items={NOT_FOR_YOU}
    />
  );
}

export function CareersNothingFits() {
  return (
    <GlassCta
      title="Nothing fits yet?"
      body={
        <>
          <p>Tell us anyway. We hire for skills and attitude, not job descriptions, and the problem you would solve does not have to be posted yet.</p>
          <p>Say what you would own and what you have built. A real person will read it.</p>
        </>
      }
      action={{ label: "Send us a message", to: "/contact" }}
      art={<OpenApplicationArt />}
      artLabel="Illustration of an open application: a candidate describes what they would own and sends it to the team"
    />
  );
}
