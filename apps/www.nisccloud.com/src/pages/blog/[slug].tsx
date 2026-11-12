import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { motion } from "motion/react";
import { ArrowLeft, Clock, Calendar, ArrowRight, List } from "lucide-react";
import Navbar from "@/pages/_components/Navbar.tsx";
import Footer from "@/pages/_components/Footer.tsx";
import { breadcrumbJsonLd, SITE_ORIGIN, usePageMeta } from "@/lib/seo.ts";
import { NOT_FOUND_META } from "@/lib/route-meta.ts";
import { posts, type Section } from "./posts-data.ts";

function slugifyHeading(text: string) {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .slice(0, 64);
}

function getHeadings(content: Section[]) {
  return content
    .filter((s): s is Extract<Section, { type: "h2" }> => s.type === "h2")
    .map((s) => ({ id: slugifyHeading(s.text), text: s.text }));
}

function renderSection(section: Section, i: number) {
  switch (section.type) {
    case "intro":
      return (
        <p
          key={i}
          className="text-lg leading-relaxed text-foreground/85 border-l-2 border-primary/50 pl-4 mb-6"
        >
          {section.text}
        </p>
      );
    case "h2": {
      const id = slugifyHeading(section.text);
      return (
        <h2
          key={i}
          id={id}
          className="type-h3 scroll-mt-28 text-foreground mt-8 mb-3"
        >
          {section.text}
        </h2>
      );
    }
    case "p":
      return (
        <p key={i} className="text-[15px] leading-relaxed text-muted-foreground mb-4">
          {section.text}
        </p>
      );
    case "blockquote":
      return (
        <blockquote
          key={i}
          className="my-6 rounded-xl border border-border bg-muted/40 px-5 py-4 text-base font-medium text-foreground italic leading-snug"
        >
          {`"${section.text}"`}
        </blockquote>
      );
    case "ul":
      return (
        <ul key={i} className="space-y-2 mb-5 ml-0.5">
          {section.items.map((item, j) => (
            <li key={j} className="flex gap-2.5 text-[15px] text-muted-foreground leading-relaxed">
              <span className="mt-2 flex-shrink-0 w-1.5 h-1.5 rounded-full bg-primary" />
              {item}
            </li>
          ))}
        </ul>
      );
    case "ol":
      return (
        <ol key={i} className="space-y-2.5 mb-5 ml-0.5">
          {section.items.map((item, j) => (
            <li key={j} className="flex gap-3 text-[15px] text-muted-foreground leading-relaxed">
              <span className="flex-shrink-0 w-5 h-5 rounded-full bg-primary/10 text-primary text-[11px] font-bold flex items-center justify-center mt-0.5">
                {j + 1}
              </span>
              {item}
            </li>
          ))}
        </ol>
      );
    case "callout":
      return (
        <div key={i} className="my-6 rounded-xl border border-border bg-muted/40 p-5 flex gap-3">
          <span className="text-xl flex-shrink-0 leading-none">{section.icon}</span>
          <div>
            <p className="font-semibold text-foreground mb-1 text-sm">{section.title}</p>
            <p className="text-sm text-muted-foreground leading-relaxed">{section.text}</p>
          </div>
        </div>
      );
    case "stat-row":
      return (
        <div key={i} className="my-6 grid grid-cols-3 gap-3">
          {section.stats.map((stat, j) => (
            <div
              key={j}
              className="rounded-xl border border-border bg-background p-4 text-center"
            >
              <div className="text-xl font-extrabold text-primary mb-0.5">{stat.value}</div>
              <div className="text-[11px] text-muted-foreground leading-tight">{stat.label}</div>
            </div>
          ))}
        </div>
      );
    case "closing":
      return (
        <div
          key={i}
          className="mt-8 rounded-xl border border-border bg-muted/40 p-6 text-center"
        >
          <p className="text-[15px] text-foreground leading-relaxed mb-4">{section.text}</p>
          <a
            href="/contact"
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-primary text-primary-foreground rounded-xl font-semibold text-sm hover:opacity-90 transition cursor-pointer"
          >
            Get in Touch <ArrowRight size={14} />
          </a>
        </div>
      );
  }
}

function TableOfContents({
  headings,
  activeId,
}: {
  headings: { id: string; text: string }[];
  activeId: string;
}) {
  if (headings.length === 0) return null;

  return (
    <nav aria-label="On this page">
      <p className="text-xs font-semibold text-muted-foreground mb-3 flex items-center gap-1.5">
        <List size={12} />
        On this page
      </p>
      <ul className="space-y-1 border-l border-border">
        {headings.map((h) => {
          const active = activeId === h.id;
          return (
            <li key={h.id}>
              <a
                href={`#${h.id}`}
                onClick={(e) => {
                  e.preventDefault();
                  document.getElementById(h.id)?.scrollIntoView({ behavior: "smooth", block: "start" });
                }}
                className={`block border-l-2 -ml-px pl-3 py-1 text-[13px] leading-snug transition-colors ${
                  active
                    ? "border-primary text-foreground font-medium"
                    : "border-transparent text-muted-foreground hover:text-foreground"
                }`}
              >
                {h.text}
              </a>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

export default function BlogPostPage() {
  const { slug } = useParams<{ slug: string }>();
  const post = posts.find((p) => p.slug === slug);
  const [activeId, setActiveId] = useState("");

  const headings = useMemo(
    () => (post ? getHeadings(post.content) : []),
    [post],
  );

  usePageMeta(
    post
      ? {
          title: post.title,
          description: post.excerpt,
          canonicalPath: `/blog/${post.slug}`,
          ogType: "article",
          jsonLd: [
            breadcrumbJsonLd([["Home", "/"], ["Blog", "/blog"], [post.title, `/blog/${post.slug}`]]),
            {
              "@type": "Article",
              headline: post.title,
              description: post.excerpt,
              articleSection: post.category,
              ...(Number.isNaN(Date.parse(post.date))
                ? {}
                : { datePublished: new Date(post.date).toISOString().slice(0, 10) }),
              author: { "@type": "Person", name: post.author, jobTitle: post.authorRole },
              publisher: { "@type": "Organization", name: "Nisc Cloud", url: SITE_ORIGIN },
              mainEntityOfPage: `${SITE_ORIGIN}/blog/${post.slug}`,
            },
          ],
        }
      : NOT_FOUND_META,
  );

  useEffect(() => {
    if (headings.length === 0) return;

    const elements = headings
      .map((h) => document.getElementById(h.id))
      .filter((el): el is HTMLElement => Boolean(el));

    if (elements.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        if (visible[0]?.target.id) {
          setActiveId(visible[0].target.id);
        }
      },
      { rootMargin: "-20% 0px -65% 0px", threshold: [0, 1] },
    );

    for (const el of elements) observer.observe(el);
    setActiveId(headings[0]?.id ?? "");

    return () => observer.disconnect();
  }, [headings, slug]);

  if (!post) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="flex flex-col items-center justify-center py-32 text-center">
          <h1 className="text-xl mb-3 font-normal">Article not found</h1>
          <Link to="/blog" className="text-primary text-sm underline hover:opacity-80">
            Back to Blog
          </Link>
        </div>
        <Footer />
      </div>
    );
  }

  const related = posts
    .filter((p) => p.category === post.category && p.slug !== post.slug)
    .slice(0, 3);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navbar />

      <main id="main-content" className="max-w-6xl mx-auto px-4 md:px-8 pt-28 pb-16">
        <Link
          to="/blog"
          className="group inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition mb-6"
        >
          <ArrowLeft size={14} className="transition-transform group-hover:-translate-x-0.5" /> Back to Blog
        </Link>

        <div className="grid lg:grid-cols-[minmax(0,1fr)_240px] gap-10 xl:gap-14">
          {/* Main column */}
          <div className="min-w-0 max-w-3xl">
            <motion.header
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.45 }}
              className="mb-8"
            >
              <p className="text-xs font-medium text-primary mb-3">{post.category}</p>
              <h1 className="type-h1 text-foreground mb-4 text-balance">
                {post.title}
              </h1>
              <p className="text-base text-muted-foreground mb-5 leading-relaxed">
                {post.excerpt}
              </p>
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted-foreground">
                <span>
                  {post.author}
                  <span className="text-muted-foreground/70"> · {post.authorRole}</span>
                </span>
                <span className="text-border hidden sm:inline">·</span>
                <span className="flex items-center gap-1.5">
                  <Clock size={13} /> {post.readTime}
                </span>
                <span className="text-border hidden sm:inline">·</span>
                <span className="flex items-center gap-1.5">
                  <Calendar size={13} /> {post.date}
                </span>
              </div>
            </motion.header>

            {/* Mobile TOC */}
            {headings.length > 0 && (
              <details className="lg:hidden mb-8 rounded-xl border border-border bg-background group">
                <summary className="cursor-pointer list-none flex items-center justify-between gap-2 px-4 py-3 text-sm font-medium text-foreground">
                  <span className="flex items-center gap-1.5">
                    <List size={14} className="text-muted-foreground" />
                    On this page
                  </span>
                  <span className="text-xs text-muted-foreground group-open:hidden">Show</span>
                  <span className="text-xs text-muted-foreground hidden group-open:inline">Hide</span>
                </summary>
                <div className="px-4 pb-4">
                  <TableOfContents headings={headings} activeId={activeId} />
                </div>
              </details>
            )}

            <article>
              {post.content.map((section, i) => renderSection(section, i))}
            </article>

            <section aria-labelledby="post-next-step" className="mt-12 rounded-2xl border border-primary/20 bg-primary/5 p-6 md:p-8">
              <h2 id="post-next-step" className="type-h3 text-foreground mb-2">Want help putting this into practice?</h2>
              <p className="text-sm text-muted-foreground leading-relaxed mb-5 max-w-xl">
                Book a free strategy call and our Nairobi team will recommend a clear next step for your brand, website, hosting or marketing before you commit.
              </p>
              <Link
                to="/contact"
                className="group inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-bold text-primary-foreground shadow-lg shadow-primary/20 transition hover:-translate-y-0.5 hover:brightness-110 motion-reduce:hover:translate-y-0"
              >
                Book a Free Strategy Call <ArrowRight size={14} className="transition-transform group-hover:translate-x-0.5" aria-hidden />
              </Link>
            </section>

            {related.length > 0 && (
              <nav aria-label="Related articles" className="mt-10 lg:hidden">
                <p className="text-xs font-semibold text-muted-foreground mb-3">More in {post.category}</p>
                <ul className="grid gap-3 sm:grid-cols-2">
                  {related.map((r) => (
                    <li key={r.slug}>
                      <Link to={`/blog/${r.slug}`} className="group block h-full rounded-xl border border-border p-4 transition hover:border-primary/40 hover:bg-primary/5">
                        <span className="block text-sm font-medium text-foreground leading-snug group-hover:text-primary transition line-clamp-2">{r.title}</span>
                        <span className="mt-1 flex items-center gap-1 text-xs text-muted-foreground"><Clock size={10} /> {r.readTime}</span>
                      </Link>
                    </li>
                  ))}
                </ul>
              </nav>
            )}
          </div>

          {/* Sticky side rail  sticks while scrolling the article */}
          <aside className="hidden lg:block sticky top-28 self-start space-y-8">
            <TableOfContents headings={headings} activeId={activeId} />

            {related.length > 0 && (
              <div>
                <p className="text-xs font-semibold text-muted-foreground mb-3">
                  More in {post.category}
                </p>
                <ul className="space-y-3">
                  {related.map((r) => (
                    <li key={r.slug}>
                      <Link to={`/blog/${r.slug}`} className="block w-full text-left group">
                        <p className="text-sm font-medium text-foreground leading-snug group-hover:text-primary transition line-clamp-2">
                          {r.title}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                          <Clock size={10} /> {r.readTime}
                        </p>
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <div className="rounded-xl border border-border p-4">
              <p className="text-sm font-semibold text-foreground mb-1">Need a hand?</p>
              <p className="text-xs text-muted-foreground leading-relaxed mb-3">
                Talk through hosting, branding, or growth with our team.
              </p>
              <Link
                to="/contact"
                className="group inline-flex items-center gap-1.5 text-xs font-semibold text-primary hover:opacity-80"
              >
                Book a free strategy call <ArrowRight size={12} className="transition-transform group-hover:translate-x-0.5" />
              </Link>
            </div>
          </aside>
        </div>
      </main>

      <Footer />
    </div>
  );
}
