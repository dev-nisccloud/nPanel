import { useParams } from "react-router";
import { CompanyDetailPage } from "./agency.crm/_components/companies/company-detail-page";

export default function CompanyDetailRoute() {
  const { id } = useParams();
  if (!id) return null;
  return <CompanyDetailPage companyId={id} />;
}
