import { useParams } from "react-router";

import { HostingDetailPage } from "./$slug.hosting/_components/hosting-detail-page";

export default function HostingDetailRoute() {
  const { id } = useParams();
  if (!id) return null;
  return <HostingDetailPage subscriptionId={id} />;
}
