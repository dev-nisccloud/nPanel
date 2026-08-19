import { useParams, useSearchParams } from "react-router";

import { PhpMyAdminPage } from "@/components/hosting/databases/phpmyadmin-page";

export default function AgencyHostingPhpMyAdminRoute() {
  const { id, databaseId } = useParams();
  const [searchParams] = useSearchParams();

  const siteId = Number(id);
  const dbId = Number(databaseId);
  if (!Number.isInteger(siteId) || siteId <= 0 || !Number.isInteger(dbId) || dbId <= 0) {
    return null;
  }

  return (
    <PhpMyAdminPage
      siteId={siteId}
      databaseId={dbId}
      databaseName={searchParams.get("name") || undefined}
      backTo={`/agency/hosting/${siteId}`}
    />
  );
}
