import { Outlet, useLocation, Navigate } from "react-router";

export default function AgencyCrmLayout() {
  const location = useLocation();
  
  if (
    location.pathname === "/hq/crm" ||
    location.pathname === "/hq/crm/companies" ||
    location.pathname.startsWith("/hq/crm/companies/")
  ) {
    return <Navigate to="/hq/crm/contacts" replace />;
  }
  
  return <Outlet />;
}
