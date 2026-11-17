import { Navigate } from "react-router";

export default function NiscPaymentsReportRedirect() {
  return <Navigate to="/hq/nisc-reports#payments" replace />;
}
