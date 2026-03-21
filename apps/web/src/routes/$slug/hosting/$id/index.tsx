import { HostingDetailPage } from "../_components/hosting-detail-page";

interface HostingDetailProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function HostingDetail({ params }: HostingDetailProps) {
  const { id } = await params;
  return <HostingDetailPage subscriptionId={id} />;
}
