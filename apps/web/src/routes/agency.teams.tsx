import { Navigate } from "react-router";

/** Legacy path redirect: /agency/teams → /agency/organizations */
export default function AgencyTeamsRedirect() {
  return <Navigate to="/agency/organizations" replace />;
}
