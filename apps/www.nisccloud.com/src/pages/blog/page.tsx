import { useState } from "react";
import { motion } from "motion/react";
import { ArrowRight, Clock, Tag, Search } from "lucide-react";
import { useNavigate } from "react-router-dom";
import Navbar from "@/pages/_components/Navbar.tsx";
import Footer from "@/pages/_components/Footer.tsx";
import { posts, categoryColors } from "./posts-data.ts";

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

      <section className="pt-20 pb-16 px-4 md:px-8 max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center mb-12"
        >
          <h1 className="text-4xl md:text-6xl font-bold tracking-tight mb-5">
            Insights That{" "}
            <span className="text-primary">Move the Needle</span>
          </h1>
          <p className="text-lg text-muted-foreground max-w-xl mx-auto">
            Practical guides on branding, SEO, hosting, AI automation, and digital growth - written for Kenyan businesses.
          </p>
        </motion.div>

        <div className="relative max-w-md mx-auto mb-10">
          <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search articles..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-3 rounded-2xl border border-border bg-muted/30 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 transition"
          />
        </div>

        <div className="flex flex-wrap gap-2 justify-center mb-14">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer border ${
                activeCategory === cat
                  ? "bg-primary text-primary-foreground border-primary"
                  : "bg-muted/40 text-muted-foreground border-border hover:border-primary/40 hover:text-foreground"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {featured.length > 0 && (
          <div className="grid md:grid-cols-2 gap-6 mb-10">
            {featured.map((post, i) => (
              <motion.article
                key={post.slug}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: i * 0.1 }}
                onClick={() => navigate(`/blog/${post.slug}`)}
                className={`group relative rounded-3xl border border-border overflow-hidden cursor-pointer hover:border-primary/40 transition-all hover:shadow-xl bg-gradient-to-br ${post.gradient} p-8 flex flex-col justify-between min-h-[280px]`}
              >
                <div>
                  <div className="flex items-center gap-2 mb-4">
                    <span
                      className={`text-[11px] font-bold px-2.5 py-1 rounded-full ${
                        categoryColors[post.category] ?? "bg-muted text-muted-foreground"
                      }`}
                    >
                      {post.category}
                    </span>
                    <span className="text-xs text-muted-foreground font-mono">FEATURED</span>
                  </div>
                  <h2 className="text-xl font-bold text-foreground leading-snug mb-3 group-hover:text-primary transition-colors">
                    {post.title}
                  </h2>
                  <p className="text-sm text-muted-foreground leading-relaxed line-clamp-3">
                    {post.excerpt}
                  </p>
                </div>
                <div className="flex items-center justify-between mt-6 text-xs text-muted-foreground">
                  <div className="flex items-center gap-3">
                    <span className="flex items-center gap-1">
                      <Clock size={12} />
                      {post.readTime}
                    </span>
                    <span>{post.date}</span>
                  </div>
                  <span className="flex items-center gap-1 text-primary font-semibold group-hover:gap-2 transition-all">
                    Read <ArrowRight size={13} />
                  </span>
                </div>
              </motion.article>
            ))}
          </div>
        )}

        {rest.length > 0 && (
          <div className="grid md:grid-cols-3 gap-5">
            {rest.map((post, i) => (
              <motion.article
                key={post.slug}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: i * 0.07 }}
                onClick={() => navigate(`/blog/${post.slug}`)}
                className="group rounded-2xl border border-border bg-background hover:border-primary/40 transition-all hover:shadow-lg cursor-pointer overflow-hidden flex flex-col"
              >
                <div className={`h-2 w-full bg-gradient-to-r ${post.gradient}`} />
                <div className="p-6 flex flex-col flex-1">
                  <div className="flex items-center gap-2 mb-3">
                    <span
                      className={`text-[11px] font-bold px-2.5 py-1 rounded-full ${
                        categoryColors[post.category] ?? "bg-muted text-muted-foreground"
                      }`}
                    >
                      {post.category}
                    </span>
                  </div>
                  <h2 className="text-base font-bold text-foreground leading-snug mb-2 group-hover:text-primary transition-colors flex-1">
                    {post.title}
                  </h2>
                  <p className="text-xs text-muted-foreground leading-relaxed line-clamp-2 mb-4">
                    {post.excerpt}
                  </p>
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <div className="flex items-center gap-2">
                      <Clock size={11} />
                      <span>{post.readTime}</span>
                      <Tag size={11} />
                      <span>{post.date}</span>
                    </div>
                    <ArrowRight
                      size={13}
                      className="text-primary opacity-0 group-hover:opacity-100 transition-opacity"
                    />
                  </div>
                </div>
              </motion.article>
            ))}
          </div>
        )}

        {filtered.length === 0 && (
          <div className="text-center py-20 text-muted-foreground">
            <p className="text-lg font-semibold">No articles found.</p>
            <p className="text-sm mt-1">Try a different category or search term.</p>
          </div>
        )}

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="mt-20 rounded-3xl bg-primary/5 border border-primary/20 p-10 text-center"
        >
          <h3 className="text-2xl font-bold mb-2">Get the Best Articles in Your Inbox</h3>
          <p className="text-muted-foreground text-sm mb-6">
            Join 2,000+ Kenyan entrepreneurs getting weekly digital growth tips. No spam, ever.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
            <input
              type="email"
              placeholder="you@company.com"
              className="flex-1 px-4 py-2.5 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 transition"
            />
            <button className="px-5 py-2.5 bg-primary text-primary-foreground rounded-xl text-sm font-semibold hover:opacity-90 transition cursor-pointer whitespace-nowrap">
              Subscribe
            </button>
          </div>
        </motion.div>
      </section>

      <Footer />
    </div>
  );
}
