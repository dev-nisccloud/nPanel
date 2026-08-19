import { useLocation, useParams, useSearchParams } from "react-router";

import { PhpMyAdminPage } from "@/components/hosting/databases/phpmyadmin-page";

export default function HostingPhpMyAdminRoute() {
  const { id, databaseId } = useParams();
  const { pathname } = useLocation();
  const [searchParams] = useSearchParams();

  const siteId = Number(id);
  const dbId = Number(databaseId);
  if (!Number.isInteger(siteId) || siteId <= 0 || !Number.isInteger(dbId) || dbId <= 0) {
    return null;
  }

  const teamSlug = pathname.split("/")[1] ?? "";
  const databaseName = searchParams.get("name") || undefined;

  return (
    <PhpMyAdminPage
      siteId={siteId}
      databaseId={dbId}
      databaseName={databaseName}
      backTo={`/${teamSlug}/hosting/${siteId}`}
    />
  );
}
