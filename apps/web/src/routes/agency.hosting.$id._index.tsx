import { useParams } from "react-router";

import { HostingDetailPage } from "./agency.hosting/_components/hosting-detail-page";

export default function AgencyHostingDetailRoute() {
  const { id } = useParams();
  if (!id) return null;
  return <HostingDetailPage subscriptionId={id} />;
}
