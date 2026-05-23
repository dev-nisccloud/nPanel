import { Navigate } from "react-router";

export default function NiscInvoicesReportRedirect() {
  return <Navigate to="/agency/nisc-reports#invoices" replace />;
}
