import { Link } from "react-router-dom";
import SitePage from "../_components/SitePage.tsx";

export default function StatusPage() {
  return (
    <SitePage
      eyebrow="Explore"
      title="Status"
      lede="Nisc Cloud does not publish a live status board on this site."
    >
      <div className="max-w-2xl rounded-2xl border border-border bg-card p-6">
        <p className="text-sm leading-relaxed text-muted-foreground">
          If a service you use is unavailable, email{" "}
          <a className="font-medium text-[#38b6ff] hover:underline dark:text-[#38b6ff]" href="mailto:sales@nisccloud.com">
            sales@nisccloud.com
          </a>{" "}
          or call{" "}
          <a className="font-medium text-[#38b6ff] hover:underline dark:text-[#38b6ff]" href="tel:+254748777666">
            +254 748 777 666
          </a>
          . You can also{" "}
          <Link className="font-medium text-[#38b6ff] hover:underline dark:text-[#38b6ff]" to="/contact">
            send a message
          </Link>
          .
        </p>
      </div>
    </SitePage>
  );
}
