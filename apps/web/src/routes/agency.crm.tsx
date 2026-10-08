import { Outlet, useLocation, Navigate } from "react-router";

export default function AgencyCrmLayout() {
  const location = useLocation();
  
  if (
    location.pathname === "/agency/crm" ||
    location.pathname === "/agency/crm/companies" ||
    location.pathname.startsWith("/agency/crm/companies/")
  ) {
    return <Navigate to="/agency/crm/contacts" replace />;
  }
  
  return <Outlet />;
}
