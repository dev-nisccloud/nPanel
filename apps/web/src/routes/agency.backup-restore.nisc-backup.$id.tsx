import { useParams } from "react-router";
import { NiscBackupAccountDetailPage } from "@/components/nisc-backup/detail/nisc-backup-account-detail-page";

export default function AgencyNiscBackupAccountDetailRoute() {
  const { id } = useParams();

  if (!id) {
    return null;
  }

  return (
    <NiscBackupAccountDetailPage
      accountId={id}
      backPath="/agency/backup-restore/nisc-backup"
    />
  );
}
