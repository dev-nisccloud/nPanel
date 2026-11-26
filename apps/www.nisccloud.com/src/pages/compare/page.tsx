import { Link } from "react-router-dom";
import SitePage from "../_components/SitePage.tsx";

const comparisons = [
  {
    title: "Web hosting, WordPress and VPS",
    href: "/hosting/web-hosting#compare-hosting",
    text: "Which hosting type fits a site that is already described on the web hosting page.",
  },
  {
    title: "Business email, Microsoft 365 and Google Workspace",
    href: "/hosting/email#compare-email",
    text: "The email comparison already published on the business email page.",
  },
  {
    title: "VPS, VDS and dedicated servers",
    href: "/hosting/vps#compare-servers",
    text: "How the server products differ, from the comparison on the VPS page.",
  },
] as const;

export default function ComparePage() {
  return (
    <SitePage
      eyebrow="Explore"
      title="Compare"
      lede="These links open comparisons that are already on the product pages. This page does not add a separate scorecard."
    >
      <ul className="grid gap-4">
        {comparisons.map((item) => (
          <li key={item.href}>
            <Link
              to={item.href}
              className="block rounded-2xl border border-border bg-card p-5 transition-colors hover:border-primary/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#38b6ff] focus-visible:ring-offset-2"
            >
              <span className="block text-lg font-semibold text-foreground">{item.title}</span>
              <span className="mt-2 block text-sm leading-relaxed text-muted-foreground">{item.text}</span>
            </Link>
          </li>
        ))}
      </ul>
    </SitePage>
  );
}
