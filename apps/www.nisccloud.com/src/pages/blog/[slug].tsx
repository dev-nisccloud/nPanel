import { useParams, useNavigate } from "react-router-dom";
import { motion } from "motion/react";
import { ArrowLeft, Clock, Calendar, User, ArrowRight } from "lucide-react";
import Navbar from "@/pages/_components/Navbar.tsx";
import Footer from "@/pages/_components/Footer.tsx";
import { posts, categoryColors, type Section } from "./posts-data.ts";

function renderSection(section: Section, i: number) {
  switch (section.type) {
    case "intro":
      return (
        <p key={i} className="text-xl leading-relaxed text-foreground/80 font-medium border-l-4 border-primary/40 pl-5 py-1 mb-8">
          {section.text}
        </p>
      );
    case "h2":
      return (
        <h2 key={i} className="text-2xl font-bold text-foreground mt-10 mb-4">
          {section.text}
        </h2>
      );
    case "p":
      return (
        <p key={i} className="text-base leading-relaxed text-muted-foreground mb-5">
          {section.text}
        </p>
      );
    case "blockquote":
      return (
        <blockquote key={i} className="my-8 rounded-2xl bg-primary/5 border border-primary/20 px-7 py-5 text-lg font-semibold text-foreground italic leading-snug">
          {`"${section.text}"`}
        </blockquote>
      );
    case "ul":
      return (
        <ul key={i} className="space-y-2.5 mb-6 ml-1">
          {section.items.map((item, j) => (
            <li key={j} className="flex gap-3 text-muted-foreground text-sm leading-relaxed">
              <span className="mt-1.5 flex-shrink-0 w-1.5 h-1.5 rounded-full bg-primary" />
              {item}
            </li>
          ))}
        </ul>
      );
    case "ol":
      return (
        <ol key={i} className="space-y-3 mb-6 ml-1">
          {section.items.map((item, j) => (
            <li key={j} className="flex gap-3 text-muted-foreground text-sm leading-relaxed">
              <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/10 text-primary text-xs font-bold flex items-center justify-center mt-0.5">
                {j + 1}
              </span>
              {item}
            </li>
          ))}
        </ol>
      );
    case "callout":
      return (
        <div key={i} className="my-8 rounded-2xl bg-muted/60 border border-border p-6 flex gap-4">
          <span className="text-2xl flex-shrink-0">{section.icon}</span>
          <div>
            <p className="font-bold text-foreground mb-1">{section.title}</p>
            <p className="text-sm text-muted-foreground leading-relaxed">{section.text}</p>
          </div>
        </div>
      );
    case "stat-row":
      return (
        <div key={i} className="my-8 grid grid-cols-3 gap-4">
          {section.stats.map((stat, j) => (
            <div key={j} className="rounded-2xl bg-primary/5 border border-primary/15 p-5 text-center">
              <div className="text-2xl font-black text-primary mb-1">{stat.value}</div>
              <div className="text-xs text-muted-foreground leading-tight">{stat.label}</div>
            </div>
          ))}
        </div>
      );
    case "closing":
      return (
        <div key={i} className="mt-10 rounded-2xl bg-primary/5 border border-primary/20 p-8 text-center">
          <p className="text-base text-foreground leading-relaxed mb-5">{section.text}</p>
          <a
            href="/contact"
            className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-primary-foreground rounded-xl font-semibold text-sm hover:opacity-90 transition cursor-pointer"
          >
            Get in Touch <ArrowRight size={15} />
          </a>
        </div>
      );
  }
}

export default function BlogPostPage() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const post = posts.find((p) => p.slug === slug);

  if (!post) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="flex flex-col items-center justify-center py-40 text-center">
          <p className="text-2xl font-bold mb-3">Article not found</p>
          <button onClick={() => navigate("/blog")} className="text-primary text-sm underline cursor-pointer">
            Back to Blog
          </button>
        </div>
        <Footer />
      </div>
    );
  }

  const related = posts.filter((p) => p.category === post.category && p.slug !== post.slug).slice(0, 2);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      {/* Header */}
      <section className={`pt-32 pb-14 px-4 md:px-8 bg-gradient-to-br ${post.gradient}`}>
        <div className="max-w-3xl mx-auto">
          <button
            onClick={() => navigate("/blog")}
            className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition mb-8 cursor-pointer"
          >
            <ArrowLeft size={15} /> Back to Blog
          </button>
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
            <span className={`inline-block text-[11px] font-bold px-3 py-1 rounded-full mb-5 ${categoryColors[post.category] ?? "bg-muted text-muted-foreground"}`}>
              {post.category}
            </span>
            <h1 className="text-3xl md:text-5xl font-black tracking-tight text-foreground leading-tight mb-6 text-balance">
              {post.title}
            </h1>
            <p className="text-base text-muted-foreground mb-8 leading-relaxed">{post.excerpt}</p>
            <div className="flex flex-wrap items-center gap-5 text-sm text-muted-foreground border-t border-border/50 pt-6">
              <span className="flex items-center gap-1.5"><User size={14} /> {post.author}</span>
              <span className="text-border">·</span>
              <span className="text-xs text-muted-foreground/70">{post.authorRole}</span>
              <span className="text-border">·</span>
              <span className="flex items-center gap-1.5"><Clock size={14} /> {post.readTime}</span>
              <span className="text-border">·</span>
              <span className="flex items-center gap-1.5"><Calendar size={14} /> {post.date}</span>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Article body */}
      <article className="max-w-3xl mx-auto px-4 md:px-8 py-14">
        {post.content.map((section, i) => renderSection(section, i))}
      </article>

      {/* Related articles */}
      {related.length > 0 && (
        <section className="max-w-3xl mx-auto px-4 md:px-8 pb-20">
          <h3 className="text-lg font-bold mb-6 text-foreground">More in {post.category}</h3>
          <div className="grid md:grid-cols-2 gap-5">
            {related.map((r) => (
              <div
                key={r.slug}
                onClick={() => navigate(`/blog/${r.slug}`)}
                className={`cursor-pointer rounded-2xl border border-border bg-gradient-to-br ${r.gradient} p-6 hover:border-primary/40 transition group`}
              >
                <p className="font-bold text-sm text-foreground group-hover:text-primary transition line-clamp-2 mb-2">{r.title}</p>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Clock size={11} /> {r.readTime} · {r.date}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      <Footer />
    </div>
  );
}
