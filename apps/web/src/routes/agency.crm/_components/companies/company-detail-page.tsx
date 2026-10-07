import { useState } from "react";
import { useNavigate } from "react-router";
import { Activity, Briefcase, CheckSquare, LayoutDashboard, Pencil, Phone, StickyNote, Trash2, Users } from "lucide-react";

import { Button } from "@/components/ui/button";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList } from "@/components/ui/tabs";
import { DetailCardTabsTrigger, DETAIL_TABS_LIST_CLASS } from "@/components/ui/detail-card-tabs";
import { trpc } from "@/utils/trpc";
import {
  CrmDetailFrame,
  CrmDetailHeader,
  CrmDetailMissing,
  CrmDetailSkeleton,
} from "../crm-detail";
import { CompanyFormSheet } from "./company-form-sheet";
import { DeleteCompanyDialog } from "./delete-company-dialog";
import { CompanyOverviewTab } from "./company-overview-tab";
import { CompanyContactsTab } from "./company-contacts-tab";
import { CompanyDealsTab } from "./company-deals-tab";
import { CompanyActivityTab } from "./company-activity-tab";
import { RecordActivities, RecordNotes, RecordTasks } from "../record-activity";

export function CompanyDetailPage({ companyId }: { companyId: string }) {
  const navigate = useNavigate();
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);

  const { data: company, isLoading, refetch } = trpc.crm.companies.get.useQuery({
    id: companyId,
  });

  if (isLoading) return <CrmDetailSkeleton />;

  if (!company) {
    return (
      <CrmDetailMissing
        title="Company not found"
        description="This company does not exist or has been deleted."
        backTo="/agency/crm/companies"
        backLabel="Back to companies"
      />
    );
  }

  const description = [company.industry, company.city].filter(Boolean).join(" · ") || "Company details";

  return (
    <CrmDetailFrame>
      <CrmDetailHeader
        backTo="/agency/crm/companies"
        title={company.name}
        description={description}
        actions={
          <>
            <Button variant="outline" size="sm" onClick={() => setEditOpen(true)}>
              <Pencil className="mr-2 h-4 w-4" />
              Edit
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="text-destructive hover:text-destructive"
              onClick={() => setDeleteOpen(true)}
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Delete
            </Button>
          </>
        }
      />

      <div className="mt-8">
        <Tabs defaultValue="overview" className="w-full">
          <ScrollArea className="w-full -mx-4 px-4 md:mx-0 md:px-0 scrollbar-default">
            <TabsList className={DETAIL_TABS_LIST_CLASS}>
              <DetailCardTabsTrigger
                value="overview"
                icon={LayoutDashboard}
                title="Overview"
                subtitle="Details"
              />
              <DetailCardTabsTrigger
                value="contacts"
                icon={Users}
                title="Contacts"
                subtitle={String(company.contacts?.length ?? 0)}
              />
              <DetailCardTabsTrigger
                value="deals"
                icon={Briefcase}
                title="Deals"
                subtitle={String(company.deals?.length ?? 0)}
              />
              <DetailCardTabsTrigger value="notes" icon={StickyNote} title="Notes" subtitle="Saved" />
              <DetailCardTabsTrigger value="tasks" icon={CheckSquare} title="Tasks" subtitle="Work" />
              <DetailCardTabsTrigger value="activities" icon={Phone} title="Activities" subtitle="Log" />
              <DetailCardTabsTrigger
                value="activity"
                icon={Activity}
                title="History"
                subtitle="Changes"
              />
            </TabsList>
            <ScrollBar orientation="horizontal" className="mt-0.5 flex" />
          </ScrollArea>

          <TabsContent value="overview" className="mt-10">
            <CompanyOverviewTab company={company} />
          </TabsContent>
          <TabsContent value="contacts" className="mt-10">
            <CompanyContactsTab contacts={company.contacts ?? []} />
          </TabsContent>
          <TabsContent value="deals" className="mt-10">
            <CompanyDealsTab deals={company.deals ?? []} />
          </TabsContent>
          <TabsContent value="notes" className="mt-10">
            <RecordNotes scope={{ companyId }} />
          </TabsContent>
          <TabsContent value="tasks" className="mt-10">
            <RecordTasks scope={{ companyId }} />
          </TabsContent>
          <TabsContent value="activities" className="mt-10">
            <RecordActivities scope={{ companyId }} />
          </TabsContent>
          <TabsContent value="activity" className="mt-10">
            <CompanyActivityTab companyId={companyId} />
          </TabsContent>
        </Tabs>
      </div>

      <CompanyFormSheet
        open={editOpen}
        onOpenChange={setEditOpen}
        company={company}
        onSuccess={() => {
          setEditOpen(false);
          refetch();
        }}
      />
      <DeleteCompanyDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        company={company}
        onSuccess={() => {
          setDeleteOpen(false);
          navigate("/agency/crm/companies");
        }}
      />
    </CrmDetailFrame>
  );
}
