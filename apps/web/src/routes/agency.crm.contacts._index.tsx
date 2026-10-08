import { useState } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  ContactsDataTable,
  type ContactGroupBy,
} from "./agency.crm/_components/contacts/contacts-data-table";
import { ContactFormSheet } from "./agency.crm/_components/contacts/contact-form-sheet";
import { trpc } from "@/utils/trpc";

export default function ContactsListRoute() {
  const [createOpen, setCreateOpen] = useState(false);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [companyId, setCompanyId] = useState<string>();
  const [withoutCompany, setWithoutCompany] = useState(false);
  const [leadStatus, setLeadStatus] = useState<string>();
  const [leadSource, setLeadSource] = useState<string>();
  const [activeFilter, setActiveFilter] = useState<"all" | "active" | "inactive">("all");
  const [tagId, setTagId] = useState<string>();
  const [groupBy, setGroupBy] = useState<ContactGroupBy>("none");

  const grouped = groupBy !== "none";
  const { data, isLoading, refetch } = trpc.crm.contacts.list.useQuery({
    page: grouped ? 1 : page,
    limit: grouped ? 100 : 20,
    search: search || undefined,
    companyId: withoutCompany ? undefined : companyId,
    withoutCompany: withoutCompany || undefined,
    leadStatus,
    leadSource,
    isActive: activeFilter === "all" ? undefined : activeFilter === "active",
    tags: tagId ? [tagId] : undefined,
  });

  return (
    <div className="@container/main flex flex-col gap-4 px-4 py-4 md:gap-6 md:px-6 md:py-6 lg:px-8">
      <div className="mx-auto w-full max-w-7xl">
        <div className="flex items-center justify-between">
          <div className="flex flex-col gap-2">
            <h1 className="text-base font-semibold tracking-tight">Contacts</h1>
            <p className="text-xs text-muted-foreground">
              Manage contact records and relationships with key stakeholders
            </p>
          </div>
          <Button onClick={() => setCreateOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Add Contact
          </Button>
        </div>

        <div className="mt-6">
          <ContactsDataTable
            data={data?.data ?? []}
            pagination={data?.pagination}
            isLoading={isLoading}
            search={search}
            onSearch={(value) => {
              setSearch(value);
              setPage(1);
            }}
            companyId={companyId}
            withoutCompany={withoutCompany}
            onCompanyFilter={(filter) => {
              setCompanyId(filter.companyId);
              setWithoutCompany(filter.withoutCompany);
              setPage(1);
            }}
            leadStatus={leadStatus}
            onLeadStatusChange={(value) => {
              setLeadStatus(value);
              setPage(1);
            }}
            leadSource={leadSource}
            onLeadSourceChange={(value) => {
              setLeadSource(value);
              setPage(1);
            }}
            activeFilter={activeFilter}
            onActiveFilterChange={(value) => {
              setActiveFilter(value);
              setPage(1);
            }}
            tagId={tagId}
            onTagIdChange={(value) => {
              setTagId(value);
              setPage(1);
            }}
            groupBy={groupBy}
            onGroupByChange={setGroupBy}
            onPageChange={setPage}
            onRefetch={refetch}
          />
        </div>

        <ContactFormSheet
          open={createOpen}
          onOpenChange={setCreateOpen}
          onSuccess={() => {
            setCreateOpen(false);
            refetch();
          }}
        />
      </div>
    </div>
  );
}
