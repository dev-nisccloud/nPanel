import { Link } from "react-router";
import { Users } from "lucide-react";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { CrmActiveBadge, CrmEmptyLine, CrmInfoCard } from "../crm-detail";

interface CompanyContactRow {
  id: string;
  fullName: string;
  title: string | null;
  email: string | null;
  phone: string | null;
  isActive: boolean;
}

export function CompanyContactsTab({ contacts }: { contacts: CompanyContactRow[] }) {
  return (
    <CrmInfoCard
      icon={Users}
      title="Contacts"
      description={`${contacts.length} ${contacts.length === 1 ? "person" : "people"}`}
    >
      {contacts.length === 0 ? (
        <CrmEmptyLine>No contacts for this company.</CrmEmptyLine>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="px-4 text-xs">Name</TableHead>
              <TableHead className="text-xs">Title</TableHead>
              <TableHead className="text-xs">Email</TableHead>
              <TableHead className="text-xs">Phone</TableHead>
              <TableHead className="text-xs">Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {contacts.map((contact) => (
              <TableRow key={contact.id}>
                <TableCell className="px-4">
                  <Link
                    to={`/agency/crm/contacts/${contact.id}`}
                    className="text-sm font-medium text-primary hover:underline"
                  >
                    {contact.fullName}
                  </Link>
                </TableCell>
                <TableCell className="text-sm">{contact.title || "—"}</TableCell>
                <TableCell className="text-sm">{contact.email || "—"}</TableCell>
                <TableCell className="text-sm">{contact.phone || "—"}</TableCell>
                <TableCell>
                  <CrmActiveBadge active={contact.isActive} />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </CrmInfoCard>
  );
}
