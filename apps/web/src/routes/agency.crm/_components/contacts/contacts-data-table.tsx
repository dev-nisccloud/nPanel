import { Fragment, useState } from "react";
import { Link } from "react-router";
import {
  User,
  Mail,
  Phone,
  Building2,
  MoreHorizontal,
  Eye,
  Pencil,
  Trash2,
} from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ComboboxDropdown } from "@npanel/ui/components/combobox-dropdown";
import { trpc } from "@/utils/trpc";
import { TagChips, tagRefsFromAssignments } from "../record-tags";
import { ContactFormSheet } from "./contact-form-sheet";
import { DeleteContactDialog } from "./delete-contact-dialog";

const ALL = "__all__";
const NONE = "__none__";

const LEAD_STATUSES = ["New", "Contacted", "Qualified", "Unqualified"];
const LEAD_SOURCES = ["Website", "Referral", "Inbound", "Outbound", "Event"];

export type ContactGroupBy = "none" | "company" | "leadStatus";

interface ContactsDataTableProps {
  data: any[];
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasMore: boolean;
  };
  isLoading: boolean;
  search: string;
  onSearch: (search: string) => void;
  companyId?: string;
  withoutCompany: boolean;
  onCompanyFilter: (filter: { companyId?: string; withoutCompany: boolean }) => void;
  leadStatus?: string;
  onLeadStatusChange: (leadStatus?: string) => void;
  leadSource?: string;
  onLeadSourceChange: (leadSource?: string) => void;
  activeFilter: "all" | "active" | "inactive";
  onActiveFilterChange: (value: "all" | "active" | "inactive") => void;
  tagId?: string;
  onTagIdChange: (tagId?: string) => void;
  groupBy: ContactGroupBy;
  onGroupByChange: (groupBy: ContactGroupBy) => void;
  onPageChange: (page: number) => void;
  onRefetch: () => void;
}

function initials(firstName?: string, lastName?: string) {
  return `${firstName?.[0] ?? ""}${lastName?.[0] ?? ""}`.toUpperCase() || "?";
}

function groupContacts(data: any[], groupBy: Exclude<ContactGroupBy, "none">) {
  const groups = new Map<string, { id: string; label: string; contacts: any[] }>();
  for (const contact of data) {
    const id =
      groupBy === "company" ? contact.company?.id ?? NONE : contact.leadStatus || NONE;
    const label =
      groupBy === "company"
        ? contact.company?.name ?? "No company"
        : contact.leadStatus || "No lead status";
    const group = groups.get(id) ?? { id, label, contacts: [] };
    group.contacts.push(contact);
    groups.set(id, group);
  }
  return [...groups.values()].sort((a, b) => a.label.localeCompare(b.label));
}

export function ContactsDataTable({
  data,
  pagination,
  isLoading,
  search,
  onSearch,
  companyId,
  withoutCompany,
  onCompanyFilter,
  leadStatus,
  onLeadStatusChange,
  leadSource,
  onLeadSourceChange,
  activeFilter,
  onActiveFilterChange,
  tagId,
  onTagIdChange,
  groupBy,
  onGroupByChange,
  onPageChange,
  onRefetch,
}: ContactsDataTableProps) {
  const [editingContact, setEditingContact] = useState<any>(null);
  const [deletingContact, setDeletingContact] = useState<any>(null);
  const companiesQuery = trpc.crm.companies.list.useQuery({ page: 1, limit: 100, isActive: true });
  const tagsQuery = trpc.crm.tags.list.useQuery({ page: 1, limit: 100 });

  const companyItems = [
    { id: ALL, label: "All companies" },
    { id: NONE, label: "No company" },
    ...(companiesQuery.data?.data ?? []).map((company) => ({ id: company.id, label: company.name })),
  ];
  const selectedCompanyId = withoutCompany ? NONE : companyId ?? ALL;
  const tagItems = [
    { id: ALL, label: "All tags" },
    ...(tagsQuery.data?.data ?? []).map((tag) => ({ id: tag.id, label: tag.name })),
  ];

  const showCompany = groupBy !== "company";
  const columnCount = showCompany ? 6 : 5;
  const groups = groupBy === "none" ? null : groupContacts(data, groupBy);

  const renderContact = (contact: any) => (
    <TableRow key={contact.id}>
      <TableCell>
        <div className="flex items-center gap-3">
          <Avatar className="h-8 w-8">
            <AvatarFallback>{initials(contact.firstName, contact.lastName)}</AvatarFallback>
          </Avatar>
          <div>
            <Link
              to={`/agency/crm/contacts/${contact.id}`}
              className="font-semibold text-foreground hover:underline"
            >
              {[contact.firstName, contact.lastName].filter(Boolean).join(" ") || "Unnamed Contact"}
            </Link>
            <TagChips tags={tagRefsFromAssignments(contact.tags)} />
          </div>
        </div>
      </TableCell>
      <TableCell>
        {contact.email ? (
          <a
            href={`mailto:${contact.email}`}
            className="flex items-center gap-1 text-sm font-semibold text-foreground hover:underline"
          >
            <Mail className="h-3 w-3" />
            {contact.email}
          </a>
        ) : (
          <span className="text-muted-foreground">—</span>
        )}
      </TableCell>
      <TableCell>
        {contact.phone ? (
          <a
            href={`tel:${contact.phone}`}
            className="flex items-center gap-1 text-sm font-semibold text-foreground hover:underline"
          >
            <Phone className="h-3 w-3" />
            {contact.phone}
          </a>
        ) : (
          <span className="text-muted-foreground">—</span>
        )}
      </TableCell>
      {showCompany ? (
        <TableCell>
          {contact.company ? (
            <button
              type="button"
              className="flex items-center gap-1 text-sm font-semibold text-foreground hover:underline"
              onClick={() => onCompanyFilter({ companyId: contact.company.id, withoutCompany: false })}
            >
              <Building2 className="h-3 w-3" />
              {contact.company.name}
            </button>
          ) : (
            <span className="text-muted-foreground">—</span>
          )}
        </TableCell>
      ) : null}
      <TableCell>
        <Badge variant="outline">{contact.deals?.length || 0}</Badge>
      </TableCell>
      <TableCell>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon">
              <MoreHorizontal className="h-4 w-4" />
              <span className="sr-only">Actions</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Actions</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link to={`/agency/crm/contacts/${contact.id}`}>
                <Eye className="mr-2 h-4 w-4" />
                View Details
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setEditingContact(contact)}>
              <Pencil className="mr-2 h-4 w-4" />
              Edit
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={() => setDeletingContact(contact)}
              className="text-destructive"
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </TableCell>
    </TableRow>
  );

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-2 lg:flex-row lg:flex-wrap lg:items-center">
        <Input
          placeholder="Search contacts..."
          value={search}
          onChange={(event) => onSearch(event.target.value)}
          className="w-full lg:max-w-xs"
        />
        <div className="w-full lg:w-56">
          <ComboboxDropdown
            placeholder="Company"
            searchPlaceholder="Search companies..."
            items={companyItems}
            selectedItem={companyItems.find((item) => item.id === selectedCompanyId)}
            onSelect={(item) => {
              if (item.id === ALL) onCompanyFilter({ withoutCompany: false });
              else if (item.id === NONE) onCompanyFilter({ withoutCompany: true });
              else onCompanyFilter({ companyId: item.id, withoutCompany: false });
            }}
            emptyResults="No companies found"
            disabled={companiesQuery.isLoading}
            className="w-full"
          />
        </div>
        <Select
          value={leadStatus ?? ALL}
          onValueChange={(value) => onLeadStatusChange(value === ALL ? undefined : value)}
        >
          <SelectTrigger className="w-full lg:w-40">
            <SelectValue placeholder="Lead status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>All statuses</SelectItem>
            {LEAD_STATUSES.map((status) => (
              <SelectItem key={status} value={status}>
                {status}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select
          value={leadSource ?? ALL}
          onValueChange={(value) => onLeadSourceChange(value === ALL ? undefined : value)}
        >
          <SelectTrigger className="w-full lg:w-40">
            <SelectValue placeholder="Lead source" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>All sources</SelectItem>
            {LEAD_SOURCES.map((source) => (
              <SelectItem key={source} value={source}>
                {source}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={activeFilter} onValueChange={(value) => onActiveFilterChange(value as "all" | "active" | "inactive")}>
          <SelectTrigger className="w-full lg:w-36">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All contacts</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="inactive">Inactive</SelectItem>
          </SelectContent>
        </Select>
        <div className="w-full lg:w-48">
          <ComboboxDropdown
            placeholder="Tag"
            searchPlaceholder="Search tags..."
            items={tagItems}
            selectedItem={tagItems.find((item) => item.id === (tagId ?? ALL))}
            onSelect={(item) => onTagIdChange(item.id === ALL ? undefined : item.id)}
            emptyResults="No tags found"
            disabled={tagsQuery.isLoading}
            className="w-full"
          />
        </div>
        <Select value={groupBy} onValueChange={(value) => onGroupByChange(value as ContactGroupBy)}>
          <SelectTrigger className="w-full lg:w-44">
            <SelectValue placeholder="Group by" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="none">No grouping</SelectItem>
            <SelectItem value="company">Group by company</SelectItem>
            <SelectItem value="leadStatus">Group by lead status</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Contact</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Phone</TableHead>
              {showCompany ? <TableHead>Company</TableHead> : null}
              <TableHead>Deals</TableHead>
              <TableHead className="w-[70px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              [...Array(5)].map((_, index) => (
                <TableRow key={index}>
                  {Array.from({ length: columnCount }).map((__, cell) => (
                    <TableCell key={cell}>
                      <Skeleton className="h-4 w-24" />
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : data.length === 0 ? (
              <TableRow>
                <TableCell colSpan={columnCount} className="h-24 text-center">
                  <div className="flex flex-col items-center justify-center gap-2">
                    <User className="h-8 w-8 text-muted-foreground" />
                    <p className="text-sm text-muted-foreground">No contacts found.</p>
                  </div>
                </TableCell>
              </TableRow>
            ) : groups ? (
              groups.map((group) => (
                <Fragment key={group.id}>
                  <TableRow className="bg-muted/40 hover:bg-muted/40">
                    <TableCell colSpan={columnCount} className="py-2">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-sm font-semibold text-foreground">{group.label}</span>
                        <span className="text-xs text-muted-foreground">{group.contacts.length}</span>
                      </div>
                    </TableCell>
                  </TableRow>
                  {group.contacts.map(renderContact)}
                </Fragment>
              ))
            ) : (
              data.map(renderContact)
            )}
          </TableBody>
        </Table>
      </div>

      {groupBy !== "none" && pagination && pagination.total > data.length ? (
        <p className="text-xs text-muted-foreground">
          Showing the first {data.length} of {pagination.total} contacts in groups.
        </p>
      ) : null}

      {groupBy === "none" && pagination && pagination.totalPages > 1 && (
        <div className="flex items-center justify-between">
          <div className="text-sm text-muted-foreground">
            Showing {(pagination.page - 1) * pagination.limit + 1} to{" "}
            {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total} results
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onPageChange(pagination.page - 1)}
              disabled={pagination.page === 1}
            >
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onPageChange(pagination.page + 1)}
              disabled={!pagination.hasMore}
            >
              Next
            </Button>
          </div>
        </div>
      )}

      {editingContact && (
        <ContactFormSheet
          open={!!editingContact}
          onOpenChange={(open) => !open && setEditingContact(null)}
          contact={editingContact}
          onSuccess={() => {
            setEditingContact(null);
            onRefetch();
          }}
        />
      )}

      {deletingContact && (
        <DeleteContactDialog
          open={!!deletingContact}
          onOpenChange={(open) => !open && setDeletingContact(null)}
          contact={deletingContact}
          onSuccess={() => {
            setDeletingContact(null);
            onRefetch();
          }}
        />
      )}
    </div>
  );
}
