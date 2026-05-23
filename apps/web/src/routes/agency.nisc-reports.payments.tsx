import { Navigate } from "react-router";

export default function NiscPaymentsReportRedirect() {
  return <Navigate to="/agency/nisc-reports#payments" replace />;
}
