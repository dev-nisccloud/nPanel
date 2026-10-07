import { Outlet, useLocation, Navigate } from "react-router";

export default function AgencyCrmLayout() {
  const location = useLocation();
  
  // Redirect /agency/crm to /agency/crm/companies
  if (location.pathname === "/agency/crm") {
    return <Navigate to="/agency/crm/companies" replace />;
  }
  
  return <Outlet />;
}
