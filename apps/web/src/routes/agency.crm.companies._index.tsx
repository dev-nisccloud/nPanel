import { useState } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CompaniesDataTable } from "./agency.crm/_components/companies/companies-data-table";
import { CompanyFormSheet } from "./agency.crm/_components/companies/company-form-sheet";
import { trpc } from "@/utils/trpc";

export default function CompaniesListRoute() {
  const [createOpen, setCreateOpen] = useState(false);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [industry, setIndustry] = useState<string>();
  const [size, setSize] = useState<string>();

  const { data, isLoading, refetch } = trpc.crm.companies.list.useQuery({
    page,
    limit: 20,
    search: search || undefined,
    industry,
    size,
  });

  return (
    <div className="@container/main flex flex-col gap-4 md:gap-6 px-4 md:px-6 lg:px-8 py-4 md:py-6">
      <div className="w-full max-w-7xl mx-auto">
        <div className="flex items-center justify-between">
          <div className="flex flex-col gap-2">
            <h1 className="text-base font-semibold tracking-tight">Companies</h1>
            <p className="text-xs text-muted-foreground">
              Manage company records and business relationships
            </p>
          </div>
          <Button onClick={() => setCreateOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Add Company
          </Button>
        </div>

        <div className="mt-6">
          <CompaniesDataTable
            data={data?.data ?? []}
            pagination={data?.pagination}
            isLoading={isLoading}
            search={search}
            onSearch={setSearch}
            industry={industry}
            onIndustryChange={setIndustry}
            size={size}
            onSizeChange={setSize}
            onPageChange={setPage}
            onRefetch={refetch}
          />
        </div>

        <CompanyFormSheet
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
