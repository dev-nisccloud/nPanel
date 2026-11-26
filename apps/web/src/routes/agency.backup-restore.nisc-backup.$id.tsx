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
      backPath="/hq/backup-restore/nisc-backup"
    />
  );
}
