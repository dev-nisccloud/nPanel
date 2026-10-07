import { useState } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ContactsDataTable } from "./agency.crm/_components/contacts/contacts-data-table";
import { ContactFormSheet } from "./agency.crm/_components/contacts/contact-form-sheet";
import { trpc } from "@/utils/trpc";

export default function ContactsListRoute() {
  const [createOpen, setCreateOpen] = useState(false);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [companyId, setCompanyId] = useState<string>();

  const { data, isLoading, refetch } = trpc.crm.contacts.list.useQuery({
    page,
    limit: 20,
    search: search || undefined,
    companyId,
  });

  return (
    <div className="@container/main flex flex-col gap-4 md:gap-6 px-4 md:px-6 lg:px-8 py-4 md:py-6">
      <div className="w-full max-w-7xl mx-auto">
        <div className="flex items-center justify-between">
          <div className="flex flex-col gap-2">
            <h1 className="text-base font-semibold tracking-tight">Contacts</h1>
            <p className="text-xs text-muted-foreground">
              Manage contact records and relationships with key stakeholders
            </p>
          </div>
          <Button onClick={() => setCreateOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Add Contact
          </Button>
        </div>

        <div className="mt-6">
          <ContactsDataTable
            data={data?.data ?? []}
            pagination={data?.pagination}
            isLoading={isLoading}
            search={search}
            onSearch={setSearch}
            companyId={companyId}
            onCompanyIdChange={setCompanyId}
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
