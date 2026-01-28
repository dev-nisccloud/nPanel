import { DomainDetailPage } from "../_components/domain-detail-page";

interface DomainDetailProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function DomainDetail({ params }: DomainDetailProps) {
  const { id } = await params;
  return <DomainDetailPage domainId={id} />;
}
