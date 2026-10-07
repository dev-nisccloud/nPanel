import { useParams } from "react-router";
import { ContactDetailPage } from "./agency.crm/_components/contacts/contact-detail-page";

export default function ContactDetailRoute() {
  const { id } = useParams();
  if (!id) return null;
  return <ContactDetailPage contactId={id} />;
}
