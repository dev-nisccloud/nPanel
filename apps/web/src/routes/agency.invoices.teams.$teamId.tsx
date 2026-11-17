import { Navigate, useParams } from "react-router";

/** Legacy path redirect: /agency/invoices/teams/:teamId → /agency/invoices/organizations/:teamId */
export default function InvoiceTeamsRedirect() {
  const { teamId } = useParams();
  return <Navigate to={`/hq/invoices/organizations/${teamId ?? ""}`} replace />;
}
