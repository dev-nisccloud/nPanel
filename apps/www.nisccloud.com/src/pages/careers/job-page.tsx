import { useEffect, useRef, useState, type ReactNode } from "react";
import { Link, useParams } from "react-router-dom";
import { ArrowLeft, Banknote, Briefcase, CalendarClock, Check, Link2, MapPin } from "lucide-react";
import Navbar from "../_components/Navbar.tsx";
import Footer from "../_components/Footer.tsx";
import { trpcQuery } from "@/lib/domain-search/api.ts";
import { usePageMeta } from "@/lib/seo.ts";
import CareerApplyForm from "./apply-form.tsx";
import { BENEFITS, formatDay, toBullets, type Opening } from "./data.ts";

const ABOUT_NISC =
  "Nisc Cloud helps businesses get online, stay online and grow. Since 2019 we have brought cloud hosting, software and digital growth together under one accountable team in Nairobi, trusted by thousands of customers. We are looking for people who want to own real work and see it make a difference.";

const linkClass =
  "font-semibold text-[#38b6ff] hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#38b6ff] dark:text-[#38b6ff]";

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="border-t border-border pt-8">
      <h2 className="text-xl font-semibold text-foreground md:text-2xl">{title}</h2>
      <div className="mt-5">{children}</div>
    </section>
  );
}

function Bullets({ items }: { items: string[] }) {
  return (
    <ul className="grid gap-3">
      {items.map((item) => (
        <li key={item} className="flex gap-3 text-base leading-relaxed text-muted-foreground">
          <Check className="mt-1 size-4 shrink-0 text-[#38b6ff] dark:text-[#38b6ff]" aria-hidden />
          <span>{item}</span>
        </li>
      ))}
    </ul>
  );
}

export default function CareerJobPage() {
  const { slug = "" } = useParams();
  const [role, setRole] = useState<Opening | null | undefined>(undefined);
  const [failed, setFailed] = useState(false);
  const [copied, setCopied] = useState(false);
  const [showBar, setShowBar] = useState(false);
  const headerRef = useRef<HTMLDivElement>(null);
  const applyRef = useRef<HTMLElement>(null);

  useEffect(() => {
    let cancelled = false;
    setRole(undefined);
    setFailed(false);
    trpcQuery<Opening | null>("careers.bySlug", { slug })
      .then((row) => {
        if (!cancelled) setRole(row);
      })
      .catch(() => {
        if (!cancelled) setFailed(true);
      });
    return () => {
      cancelled = true;
    };
  }, [slug]);

  useEffect(() => {
    const header = headerRef.current;
    const apply = applyRef.current;
    if (!header || !apply) return;
    let pastHeader = false;
    let atApply = false;
    const update = () => setShowBar(pastHeader && !atApply);
    const headerObserver = new IntersectionObserver(([entry]) => {
      pastHeader = !entry.isIntersecting && entry.boundingClientRect.top < 0;
      update();
    });
    const applyObserver = new IntersectionObserver(([entry]) => {
      atApply = entry.isIntersecting;
      update();
    });
    headerObserver.observe(header);
    applyObserver.observe(apply);
    return () => {
      headerObserver.disconnect();
      applyObserver.disconnect();
    };
  }, [role]);

  usePageMeta(
    role
      ? {
          title: `${role.title} · Careers`,
          description: role.summary,
          canonicalPath: `/careers/${role.slug}`,
          jsonLd: {
            "@context": "https://schema.org",
            "@type": "JobPosting",
            title: role.title,
            description: role.description,
            datePosted: role.opensOn ?? undefined,
            validThrough: role.closesOn ?? undefined,
            employmentType: role.employmentType,
            hiringOrganization: { "@type": "Organization", name: "Nisc Cloud", sameAs: "https://nisccloud.com" },
            jobLocation: { "@type": "Place", address: { "@type": "PostalAddress", addressLocality: role.location } },
          },
        }
      : {
          title: "Careers",
          description: "Open roles at Nisc Cloud.",
          canonicalPath: "/careers",
          noindex: role === null,
        },
  );

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  }

  const descriptionLines = toBullets(role?.description ?? null);
  const responsibilities = toBullets(role?.responsibilities ?? null);
  const requirements = toBullets(role?.requirements ?? null);
  const niceToHave = toBullets(role?.niceToHave ?? null);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navbar />
      <main id="main-content" className="pt-16">
        {failed ? (
          <div className="mx-auto max-w-3xl px-4 py-24 text-center md:px-8">
            <h1 className="type-h2">This role could not be loaded</h1>
            <p className="mt-4 text-muted-foreground">
              Check your connection and try again, or <Link className={linkClass} to="/careers">see all open roles</Link>.
            </p>
          </div>
        ) : role === undefined ? (
          <p className="mx-auto max-w-3xl px-4 py-24 text-center text-muted-foreground md:px-8">Loading role…</p>
        ) : role === null ? (
          <div className="mx-auto grid max-w-3xl justify-items-center px-4 py-24 text-center md:px-8">
            <img loading="lazy" decoding="async" src="/artwork/support-original.png" alt="" className="h-36 w-auto" />
            <h1 className="type-h2 mt-6">This role is no longer open</h1>
            <p className="mt-4 max-w-lg text-muted-foreground">
              It may have been filled or closed. The roles we are hiring for now are on the careers page.
            </p>
            <Link
              to="/careers#open-roles"
              className="mt-8 inline-flex min-h-12 items-center rounded-[12px] bg-primary px-6 font-semibold text-primary-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#38b6ff] focus-visible:ring-offset-2"
            >
              See open roles
            </Link>
          </div>
        ) : (
          <>
            <div ref={headerRef} className="border-b border-border bg-muted/40">
              <div className="mx-auto max-w-6xl px-4 py-12 md:px-8 md:py-16">
                <Link to="/careers#open-roles" className={`inline-flex min-h-11 items-center gap-2 text-sm ${linkClass}`}>
                  <ArrowLeft className="size-4" aria-hidden />
                  All open roles
                </Link>
                <p className="type-label mt-6 text-[#38b6ff] dark:text-[#38b6ff]">Nisc Cloud careers</p>
                <h1 className="type-h1 mt-3 max-w-4xl text-balance">{role.title}</h1>
                <ul className="mt-6 flex flex-wrap gap-x-6 gap-y-3 text-sm text-muted-foreground">
                  <li className="flex items-center gap-2">
                    <MapPin className="size-4 text-[#38b6ff] dark:text-[#38b6ff]" aria-hidden />
                    {role.location}
                  </li>
                  <li className="flex items-center gap-2">
                    <Briefcase className="size-4 text-[#38b6ff] dark:text-[#38b6ff]" aria-hidden />
                    {role.employmentType}
                  </li>
                  {role.closesOn ? (
                    <li className="flex items-center gap-2">
                      <CalendarClock className="size-4 text-[#38b6ff] dark:text-[#38b6ff]" aria-hidden />
                      Applications close {formatDay(role.closesOn)}
                    </li>
                  ) : null}
                  {role.salaryRange ? (
                    <li className="flex items-center gap-2">
                      <Banknote className="size-4 text-[#38b6ff] dark:text-[#38b6ff]" aria-hidden />
                      {role.salaryRange}
                    </li>
                  ) : null}
                </ul>
                <div className="mt-8 flex flex-wrap gap-3">
                  <a
                    href="#apply"
                    className="inline-flex min-h-12 items-center rounded-[12px] bg-primary px-6 font-semibold text-primary-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#38b6ff] focus-visible:ring-offset-2"
                  >
                    Apply now
                  </a>
                  <button
                    type="button"
                    onClick={copyLink}
                    className="inline-flex min-h-12 items-center gap-2 rounded-[12px] border border-border bg-background px-5 text-sm font-medium hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#38b6ff]"
                  >
                    <Link2 className="size-4" aria-hidden />
                    {copied ? "Link copied" : "Copy link to share"}
                  </button>
                </div>
              </div>
            </div>

            <div className="mx-auto grid max-w-6xl gap-12 px-4 py-14 md:px-8 lg:grid-cols-[minmax(0,1fr)_20rem]">
              <article className="grid gap-10">
                <div>
                  <p className="text-lg leading-relaxed text-foreground">{ABOUT_NISC}</p>
                  <p className="mt-5 text-lg leading-relaxed text-foreground">{role.summary}</p>
                </div>
                <Section title="About the role">
                  {descriptionLines.length >= 3 ? (
                    <Bullets items={descriptionLines} />
                  ) : (
                    <div className="whitespace-pre-wrap text-base leading-relaxed text-muted-foreground">{role.description}</div>
                  )}
                </Section>
                {responsibilities.length > 0 ? (
                  <Section title="What you will do">
                    <Bullets items={responsibilities} />
                  </Section>
                ) : null}
                {requirements.length > 0 ? (
                  <Section title="What you bring">
                    <Bullets items={requirements} />
                  </Section>
                ) : null}
                {niceToHave.length > 0 ? (
                  <Section title="Nice to have">
                    <Bullets items={niceToHave} />
                  </Section>
                ) : null}
                {role.salaryRange ? (
                  <Section title="Salary range">
                    <p className="text-base leading-relaxed text-muted-foreground">
                      {role.salaryRange}. The final offer depends on your experience.
                    </p>
                  </Section>
                ) : null}
                <Section title="What we offer">
                  <ul className="grid gap-4 sm:grid-cols-2">
                    {BENEFITS.map((benefit) => (
                      <li key={benefit.title} className="flex gap-3">
                        <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-[#38b6ff]/10 text-[#38b6ff] dark:bg-[#38b6ff]/10 dark:text-[#38b6ff]">
                          <benefit.icon className="size-5" aria-hidden />
                        </span>
                        <span>
                          <span className="block font-semibold text-foreground">{benefit.title}</span>
                          <span className="mt-1 block text-sm leading-relaxed text-muted-foreground">{benefit.text}</span>
                        </span>
                      </li>
                    ))}
                  </ul>
                </Section>
              </article>

              <aside className="hidden lg:block">
                <div className="sticky top-24 rounded-[24px] border border-border bg-card p-6">
                  <p className="text-sm font-semibold text-foreground">{role.title}</p>
                  <dl className="mt-4 grid gap-3 text-sm">
                    <div>
                      <dt className="text-muted-foreground">Location</dt>
                      <dd className="font-medium">{role.location}</dd>
                    </div>
                    <div>
                      <dt className="text-muted-foreground">Type</dt>
                      <dd className="font-medium">{role.employmentType}</dd>
                    </div>
                    {role.salaryRange ? (
                      <div>
                        <dt className="text-muted-foreground">Salary</dt>
                        <dd className="font-medium">{role.salaryRange}</dd>
                      </div>
                    ) : null}
                    {role.closesOn ? (
                      <div>
                        <dt className="text-muted-foreground">Closes</dt>
                        <dd className="font-medium">{formatDay(role.closesOn)}</dd>
                      </div>
                    ) : null}
                  </dl>
                  <a
                    href="#apply"
                    className="mt-6 flex min-h-12 items-center justify-center rounded-[12px] bg-primary font-semibold text-primary-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#38b6ff] focus-visible:ring-offset-2"
                  >
                    Apply now
                  </a>
                </div>
              </aside>
            </div>

            <section
              ref={applyRef}
              id="apply"
              className="scroll-mt-20 border-t border-border bg-muted/50 px-4 py-16 md:px-8 md:py-24"
              style={{
                backgroundImage:
                  "linear-gradient(to right, rgb(56 182 255 / 0.08) 1px, transparent 1px), linear-gradient(to bottom, rgb(56 182 255 / 0.08) 1px, transparent 1px)",
                backgroundSize: "120px 120px",
              }}
            >
              <div className="mx-auto max-w-3xl">
                <div className="text-center">
                  <h2 className="type-h2">Apply for this job</h2>
                  <p className="mt-3 text-muted-foreground">
                    {role.title} · {role.location}
                  </p>
                </div>
                <div className="mt-10">
                  <CareerApplyForm slug={role.slug} roleTitle={role.title} />
                </div>
                <p className="mx-auto mt-6 max-w-2xl text-center text-xs leading-relaxed text-muted-foreground">
                  We welcome applications from everyone. You do not need to include a photo, your age or your marital status on your CV. See our{" "}
                  <Link className={linkClass} to="/privacy">
                    privacy policy
                  </Link>{" "}
                  for how we handle your application.
                </p>
              </div>
            </section>
          </>
        )}
      </main>
      <Footer />

      {role ? (
        <div
          className={`fixed inset-x-0 bottom-0 z-40 pb-3 pl-3 pr-24 xl:pr-3 transition-transform duration-300 motion-reduce:transition-none ${
            showBar ? "translate-y-0" : "pointer-events-none translate-y-[120%]"
          }`}
          aria-hidden={!showBar}
        >
          <div className="mx-auto flex max-w-4xl items-center justify-between gap-4 rounded-[20px] bg-[#38b6ff] px-5 py-3 text-[#02070A] shadow-2xl">
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold">{role.title}</p>
              <p className="truncate text-xs text-[#02070A]/75">{role.salaryRange ?? `${role.location} · ${role.employmentType}`}</p>
            </div>
            <a
              href="#apply"
              tabIndex={showBar ? 0 : -1}
              className="inline-flex min-h-11 shrink-0 items-center rounded-[12px] bg-[#02070A] px-5 text-sm font-semibold text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#02070A] focus-visible:ring-offset-2 focus-visible:ring-offset-[#38b6ff]"
            >
              Apply now
            </a>
          </div>
        </div>
      ) : null}
    </div>
  );
}
