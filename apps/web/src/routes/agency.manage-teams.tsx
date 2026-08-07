import { Navigate } from "react-router";

/** Legacy path redirect: /agency/manage-teams → /agency/manage-organizations */
export default function ManageTeamsRedirect() {
  return <Navigate to="/agency/manage-organizations" replace />;
}
