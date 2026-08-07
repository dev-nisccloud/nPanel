import { Navigate } from "react-router";

/** Legacy path redirect: /create-team → /create-organization */
export default function CreateTeamRedirect() {
  return <Navigate to="/create-organization" replace />;
}
