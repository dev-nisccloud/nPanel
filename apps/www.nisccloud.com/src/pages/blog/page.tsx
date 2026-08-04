import { useState } from "react";
import { motion } from "motion/react";
import { ArrowRight, Clock, Search } from "lucide-react";
import { useNavigate } from "react-router-dom";
import Navbar from "@/pages/_components/Navbar.tsx";
import Footer from "@/pages/_components/Footer.tsx";
import { posts } from "./posts-data.ts";

const categories = [
  "All",
  "Brand Strategy",
  "SEO / AEO / GEO",
  "E-commerce",
  "AI Automation",
  "Cloud Hosting",
  "Paid Advertising",
  "Social Media",
  "Email Marketing",
];

export default function BlogPage() {
  const [activeCategory, setActiveCategory] = useState("All");
  const [search, setSearch] = useState("");
  const navigate = useNavigate();

  const filtered = posts.filter((p) => {
    const matchCat = activeCategory === "All" || p.category === activeCategory;
    const matchSearch =
      search === "" ||
      p.title.toLowerCase().includes(search.toLowerCase()) ||
      p.excerpt.toLowerCase().includes(search.toLowerCase());
    return matchCat && matchSearch;
  });

  const featured = filtered.filter((p) => p.featured);
  const rest = filtered.filter((p) => !p.featured);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navbar />

      <section className="pt-28 pb-16 px-4 md:px-8 max-w-6xl mx-auto">
        {/* Compact hero */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45 }}
          className="mb-8"
        >
          <h1 className="text-[36px] font-extrabold leading-[1.15] mb-3 text-balance">
            Insights That <span className="text-primary">Move the Needle</span>
          </h1>
          <p className="text-base text-muted-foreground max-w-2xl leading-relaxed">
            Practical guides on branding, SEO, hosting, AI automation, and digital growth  written for Kenyan businesses.
          </p>
        </motion.div>

        {/* Toolbar: search + filters */}
        <div className="mb-8 space-y-3">
          <div className="relative max-w-md">
            <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search articles..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-border bg-background text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 transition"
            />
          </div>
          <div className="flex flex-wrap gap-1.5">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`px-3 py-1 rounded-lg text-xs font-medium transition-all cursor-pointer border ${
                  activeCategory === cat
                    ? "bg-primary text-primary-foreground border-primary"
                    : "bg-background text-muted-foreground border-border hover:border-primary/40 hover:text-foreground"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Featured  editorial rows */}
        {featured.length > 0 && (
          <div className="mb-6 space-y-3">
            {featured.map((post, i) => (
              <motion.article
                key={post.slug}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.35, delay: i * 0.06 }}
                onClick={() => navigate(`/blog/${post.slug}`)}
                className="group cursor-pointer rounded-xl border border-border bg-background p-5 md:p-6 hover:border-primary/40 transition-colors"
              >
                <p className="text-xs font-medium text-primary mb-2">{post.category}</p>
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <h2 className="text-lg md:text-xl font-bold text-foreground leading-snug mb-2 group-hover:text-primary transition-colors">
                      {post.title}
                    </h2>
                    <p className="text-sm text-muted-foreground leading-relaxed line-clamp-2 mb-3">
                      {post.excerpt}
                    </p>
                    <div className="flex items-center gap-3 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Clock size={12} />
                        {post.readTime}
                      </span>
                      <span>{post.date}</span>
                    </div>
                  </div>
                  <span className="shrink-0 inline-flex items-center gap-1 text-sm font-semibold text-primary group-hover:gap-2 transition-all self-start sm:mt-1">
                    Read <ArrowRight size={14} />
                  </span>
                </div>
              </motion.article>
            ))}
          </div>
        )}

        {/* Rest  dense 2-col grid */}
        {rest.length > 0 && (
          <div className="grid sm:grid-cols-2 gap-3">
            {rest.map((post, i) => (
              <motion.article
                key={post.slug}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.35, delay: i * 0.04 }}
                onClick={() => navigate(`/blog/${post.slug}`)}
                className="group cursor-pointer rounded-xl border border-border bg-background p-5 hover:border-primary/40 transition-colors flex flex-col"
              >
                <p className="text-xs font-medium text-primary mb-1.5">{post.category}</p>
                <h2 className="text-base font-bold text-foreground leading-snug mb-2 group-hover:text-primary transition-colors">
                  {post.title}
                </h2>
                <p className="text-sm text-muted-foreground leading-relaxed line-clamp-2 mb-3 flex-1">
                  {post.excerpt}
                </p>
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <span className="flex items-center gap-1">
                      <Clock size={11} />
                      {post.readTime}
                    </span>
                    <span>{post.date}</span>
                  </div>
                  <ArrowRight
                    size={13}
                    className="text-primary opacity-0 group-hover:opacity-100 transition-opacity"
                  />
                </div>
              </motion.article>
            ))}
          </div>
        )}

        {filtered.length === 0 && (
          <div className="text-center py-14 text-muted-foreground">
            <p className="text-base font-semibold">No articles found.</p>
            <p className="text-sm mt-1">Try a different category or search term.</p>
          </div>
        )}

        {/* Slim newsletter */}
        <div className="mt-12 rounded-xl border border-border bg-background p-5 md:p-6">
          <div className="flex flex-col md:flex-row md:items-center gap-4 md:gap-6">
            <div className="min-w-0 flex-1">
              <h3 className="text-base font-bold mb-1">Get the best articles in your inbox</h3>
              <p className="text-sm text-muted-foreground">
                Weekly digital growth tips for Kenyan businesses. No spam.
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-2 w-full md:w-auto md:min-w-[320px]">
              <input
                type="email"
                placeholder="you@company.com"
                className="flex-1 px-3.5 py-2 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 transition"
              />
              <button className="px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-semibold hover:opacity-90 transition cursor-pointer whitespace-nowrap">
                Subscribe
              </button>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
