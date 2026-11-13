import { useEffect, useMemo, useState, type ReactNode } from "react";
import { Link, Navigate, useSearchParams } from "react-router-dom";
import { ArrowRight, MapPin, Search } from "lucide-react";
import Navbar from "../_components/Navbar.tsx";
import Footer from "../_components/Footer.tsx";
import { trpcQuery } from "@/lib/domain-search/api.ts";
import { formatDay, type Opening } from "./data.ts";
import {
  CareersFacts,
  CareersHero,
  CareersHiring,
  CareersNotForEveryone,
  CareersNothingFits,
  CareersOffer,
  CareersValues,
  CareersWork,
} from "./sections.tsx";

const selectClass =
  "min-h-12 w-full rounded-[12px] border border-border bg-background px-4 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#38b6ff]";

function Tag({ children }: { children: ReactNode }) {
  return <span className="inline-flex items-center gap-1 rounded-md bg-muted px-2 py-1 text-xs font-medium text-foreground">{children}</span>;
}

export default function CareersPage() {
  const [params] = useSearchParams();
  const legacyRole = params.get("role");
  const [openings, setOpenings] = useState<Opening[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [location, setLocation] = useState("All");
  const [employmentType, setEmploymentType] = useState("All");
  const [keyword, setKeyword] = useState("");

  useEffect(() => {
    let cancelled = false;
    const load = () => {
      trpcQuery<Opening[]>("careers.list")
        .then((rows) => {
          if (!cancelled) {
            setOpenings(rows);
            setError(null);
          }
        })
        .catch(() => {
          if (!cancelled) setError("Open roles could not be loaded. Email careers@nisccloud.com if you want to ask about working here.");
        });
    };
    load();
    window.addEventListener("focus", load);
    return () => {
      cancelled = true;
      window.removeEventListener("focus", load);
    };
  }, []);

  const locations = useMemo(() => ["All", ...new Set((openings ?? []).map((role) => role.location))], [openings]);
  const types = useMemo(() => ["All", ...new Set((openings ?? []).map((role) => role.employmentType))], [openings]);
  const needle = keyword.trim().toLowerCase();
  const visible = (openings ?? []).filter((role) => {
    if (location !== "All" && role.location !== location) return false;
    if (employmentType !== "All" && role.employmentType !== employmentType) return false;
    if (needle && !`${role.title} ${role.summary}`.toLowerCase().includes(needle)) return false;
    return true;
  });

  if (legacyRole) return <Navigate to={`/careers/${encodeURIComponent(legacyRole)}`} replace />;

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navbar />
      <main id="main-content">
        <CareersHero openCount={openings ? openings.length : null} />
        <CareersFacts />
        <CareersWork />

        <section id="open-roles" className="scroll-mt-20 bg-background px-4 py-24 md:px-8 md:py-28">
          <div className="mx-auto max-w-5xl">
            <div className="text-center">
              <p className="type-label text-[#38b6ff] dark:text-[#38b6ff]">Open roles</p>
              <h2 className="type-h2 mt-3">Find a problem worth solving</h2>
              <p className="mx-auto mt-4 max-w-2xl text-base leading-relaxed text-muted-foreground">
                Every role here is a problem to solve, not a seat to fill. If you want to own your work and see it help real businesses, start here.
              </p>
            </div>

            {error ? <p className="mt-10 text-center text-sm text-muted-foreground">{error}</p> : null}
            {!error && openings === null ? <p className="mt-10 text-center text-sm text-muted-foreground">Loading open roles…</p> : null}

            {!error && openings && openings.length === 0 ? (
              <div className="mt-12 grid items-center gap-6 rounded-[28px] border border-border bg-card p-8 md:grid-cols-[12rem_1fr]">
                <img src="/artwork/support-original.png" alt="" className="mx-auto h-36 w-auto" />
                <div>
                  <h3 className="text-xl font-semibold">No roles are open right now</h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                    New roles appear here as soon as they are published.{" "}
                    <Link className="font-semibold text-[#38b6ff] hover:underline dark:text-[#38b6ff]" to="/contact">
                      Send us a message
                    </Link>{" "}
                    if you want us to keep you in mind.
                  </p>
                </div>
              </div>
            ) : null}

            {!error && openings && openings.length > 0 ? (
              <>
                <div className="mt-12 grid gap-4 md:grid-cols-3">
                  <label className="grid gap-2 text-sm font-semibold text-foreground">
                    Type
                    <select className={selectClass} value={employmentType} onChange={(event) => setEmploymentType(event.target.value)}>
                      {types.map((item) => (
                        <option key={item}>{item}</option>
                      ))}
                    </select>
                  </label>
                  <label className="grid gap-2 text-sm font-semibold text-foreground">
                    Location
                    <select className={selectClass} value={location} onChange={(event) => setLocation(event.target.value)}>
                      {locations.map((item) => (
                        <option key={item}>{item}</option>
                      ))}
                    </select>
                  </label>
                  <label className="grid gap-2 text-sm font-semibold text-foreground">
                    Keyword
                    <span className="relative">
                      <Search className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
                      <input
                        type="search"
                        value={keyword}
                        onChange={(event) => setKeyword(event.target.value)}
                        placeholder="Search by keyword"
                        className={`${selectClass} pl-11 font-normal`}
                      />
                    </span>
                  </label>
                </div>

                {visible.length === 0 ? (
                  <p className="mt-10 text-center text-sm text-muted-foreground">No open roles match those filters.</p>
                ) : (
                  <ul className="mt-8 divide-y divide-border overflow-hidden rounded-[24px] border border-border bg-card">
                    {visible.map((item) => (
                      <li key={item.id}>
                        <Link
                          to={`/careers/${encodeURIComponent(item.slug)}`}
                          className="group grid gap-3 px-6 py-6 transition-colors hover:bg-muted/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#38b6ff] md:grid-cols-[1fr_auto] md:items-center md:px-8"
                        >
                          <span>
                            <span className="block text-xl font-medium text-foreground">{item.title}</span>
                            <span className="mt-3 flex flex-wrap gap-2">
                              <Tag>
                                <MapPin className="size-3.5" aria-hidden />
                                {item.location}
                              </Tag>
                              <Tag>{item.employmentType}</Tag>
                              {item.salaryRange ? <Tag>{item.salaryRange}</Tag> : null}
                              {item.closesOn ? <Tag>Closes {formatDay(item.closesOn)}</Tag> : null}
                            </span>
                            {item.summary ? <span className="mt-3 block max-w-2xl text-sm leading-relaxed text-muted-foreground">{item.summary}</span> : null}
                          </span>
                          <span className="inline-flex items-center gap-1 text-sm font-semibold text-[#38b6ff] dark:text-[#38b6ff]">
                            View role
                            <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" aria-hidden />
                          </span>
                        </Link>
                      </li>
                    ))}
                  </ul>
                )}
              </>
            ) : null}
          </div>
        </section>

        <CareersValues />
        <CareersOffer />
        <CareersHiring />
        <CareersNotForEveryone />
        <CareersNothingFits />
      </main>
      <Footer />
    </div>
  );
}
