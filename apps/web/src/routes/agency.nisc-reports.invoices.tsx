import { Navigate } from "react-router";

export default function NiscInvoicesReportRedirect() {
  return <Navigate to="/hq/nisc-reports#invoices" replace />;
}
