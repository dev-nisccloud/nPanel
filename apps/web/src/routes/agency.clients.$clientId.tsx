import { useParams } from "react-router";
import { ClientDetailPage } from "./agency.clients/_components/client-detail-page";

export default function ClientDetailRoute() {
  const { clientId } = useParams();

  if (!clientId) {
    return (
      <div className="flex items-center justify-center h-full py-24">
        <p className="text-muted-foreground">Client ID is missing from URL</p>
      </div>
    );
  }

  return <ClientDetailPage clientId={clientId} />;
}
