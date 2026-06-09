import { useParams } from "react-router";
import { JetBackupAccountDetailPage } from "@/components/jetbackup/detail/jetbackup-account-detail-page";

export default function AgencyJetBackupAccountDetailRoute() {
  const { id } = useParams();

  if (!id) {
    return null;
  }

  return (
    <JetBackupAccountDetailPage
      accountId={id}
      backPath="/agency/backup-restore/jetbackup5"
    />
  );
}
