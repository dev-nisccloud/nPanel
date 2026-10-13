import { useState } from "react";
import { useNavigate } from "react-router";
import { Briefcase, CheckSquare, LayoutDashboard, Pencil, Phone, Plus, StickyNote, Target, Trash2, User } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList } from "@/components/ui/tabs";
import { DetailCardTabsTrigger, DETAIL_TABS_LIST_CLASS } from "@/components/ui/detail-card-tabs";
import { trpc } from "@/utils/trpc";
import {
  CrmActiveBadge,
  CrmDetailFrame,
  CrmDetailHeader,
  CrmDetailMissing,
  CrmDetailSkeleton,
  CrmEmptyLine,
  CrmField,
  CrmFieldGrid,
  CrmFieldRow,
  CrmInfoCard,
  displayText,
  formatCrmDate,
  formatCrmMoney,
} from "../crm-detail";
import { RecordActivities, RecordNotes, RecordTasks } from "../record-activity";
import { RecordCustomFields } from "../record-custom-fields";
import { RecordTags, tagRefsFromAssignments } from "../record-tags";
import { DealViewSheet } from "../deals/deal-view-sheet";
import { DealFormSheet } from "../deals/deal-form-sheet";
import { ContactFormSheet } from "./contact-form-sheet";
import { DeleteContactDialog } from "./delete-contact-dialog";

export function ContactDetailPage({ contactId }: { contactId: string }) {
  const navigate = useNavigate();
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [dealId, setDealId] = useState<string | null>(null);
  const [dealFormOpen, setDealFormOpen] = useState(false);

  const { data: contact, isLoading, refetch } = trpc.crm.contacts.get.useQuery({
    id: contactId,
  });

  if (isLoading) return <CrmDetailSkeleton />;

  if (!contact) {
    return (
      <CrmDetailMissing
        title="Contact not found"
        description="This contact does not exist or has been deleted."
        backTo="/agency/crm/contacts"
        backLabel="Back to contacts"
      />
    );
  }

  const contactName = contact.fullName || [contact.firstName, contact.lastName].filter(Boolean).join(" ");
  const description =
    [contact.title, contact.company?.name].filter(Boolean).join(" · ") || "Contact details";
  const deals = contact.deals ?? [];

  return (
    <CrmDetailFrame>
      <CrmDetailHeader
        backTo="/agency/crm/contacts"
        title={contactName}
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
                value="deals"
                icon={Briefcase}
                title="Deals"
                subtitle={String(deals.length)}
              />
              <DetailCardTabsTrigger value="source" icon={Target} title="Source" subtitle="Lead" />
              <DetailCardTabsTrigger value="notes" icon={StickyNote} title="Notes" subtitle="Saved" />
              <DetailCardTabsTrigger value="tasks" icon={CheckSquare} title="Tasks" subtitle="Work" />
              <DetailCardTabsTrigger value="activities" icon={Phone} title="Activities" subtitle="Log" />
            </TabsList>
            <ScrollBar orientation="horizontal" className="mt-0.5 flex" />
          </ScrollArea>

          <TabsContent value="overview" className="mt-10">
            <div className="grid grid-cols-1 items-stretch gap-6 lg:grid-cols-2">
              <CrmInfoCard icon={User} title="Contact" description="Person details">
                <CrmFieldGrid>
                  <CrmFieldRow>
                    <CrmField label="Job title">{displayText(contact.title)}</CrmField>
                    <CrmField label="Department">{displayText(contact.department)}</CrmField>
                  </CrmFieldRow>
                  <CrmFieldRow>
                    <CrmField label="Email">
                      {contact.email ? (
                        <a href={`mailto:${contact.email}`} className="hover:underline">
                          {contact.email}
                        </a>
                      ) : (
                        "—"
                      )}
                    </CrmField>
                    <CrmField label="Phone">
                      {contact.phone ? (
                        <a href={`tel:${contact.phone}`} className="hover:underline">
                          {contact.phone}
                        </a>
                      ) : (
                        "—"
                      )}
                    </CrmField>
                  </CrmFieldRow>
                  <CrmFieldRow>
                    <CrmField label="Mobile">{displayText(contact.mobilePhone)}</CrmField>
                    <CrmField label="WhatsApp">{displayText(contact.whatsapp)}</CrmField>
                  </CrmFieldRow>
                  <CrmFieldRow>
                    <CrmField label="Lead status">{displayText(contact.leadStatus)}</CrmField>
                    <CrmField label="Lead source">{displayText(contact.leadSource)}</CrmField>
                  </CrmFieldRow>
                  <CrmFieldRow>
                    <CrmField label="Seniority">{displayText(contact.seniority)}</CrmField>
                    <CrmField label="Status">
                      <CrmActiveBadge active={contact.isActive} />
                    </CrmField>
                  </CrmFieldRow>
                </CrmFieldGrid>
              </CrmInfoCard>

              <CrmInfoCard icon={Briefcase} title="Company" description="Account and location">
                <CrmFieldGrid>
                  <CrmFieldRow>
                    <CrmField label="Company">
                      {contact.company ? contact.company.name : "—"}
                    </CrmField>
                    <CrmField label="Owner">{displayText(contact.owner?.name)}</CrmField>
                  </CrmFieldRow>
                  <CrmFieldRow>
                    <CrmField label="Address">{displayText(contact.addressLine1)}</CrmField>
                    <CrmField label="City">{displayText(contact.city)}</CrmField>
                  </CrmFieldRow>
                  <CrmFieldRow>
                    <CrmField label="State">{displayText(contact.state)}</CrmField>
                    <CrmField label="Country">{displayText(contact.country)}</CrmField>
                  </CrmFieldRow>
                  <CrmFieldRow>
                    <CrmField label="Postal code">{displayText(contact.postalCode)}</CrmField>
                    <CrmField label="Created">{formatCrmDate(contact.createdAt)}</CrmField>
                  </CrmFieldRow>
                  <CrmFieldRow>
                    <CrmField label="Updated">{formatCrmDate(contact.updatedAt)}</CrmField>
                    <div className="px-4 py-3" aria-hidden />
                  </CrmFieldRow>
                </CrmFieldGrid>
              </CrmInfoCard>
            </div>
            <div className="mt-6 grid grid-cols-1 items-start gap-6 lg:grid-cols-2">
              <RecordTags
                kind="contact"
                recordId={contact.id}
                tags={tagRefsFromAssignments(contact.tags)}
              />
              <RecordCustomFields
                entityType="contact"
                recordId={contact.id}
                values={contact.customFields}
              />
            </div>
            <div className="mt-6">
              <CrmInfoCard
                icon={Briefcase}
                title="Deals"
                description={`${deals.length} ${deals.length === 1 ? "deal" : "deals"} on this contact`}
              >
                <div className="flex justify-end border-b px-4 py-2">
                  <Button size="sm" onClick={() => setDealFormOpen(true)}>
                    <Plus className="mr-2 h-4 w-4" />
                    Add deal
                  </Button>
                </div>
                {deals.length === 0 ? (
                  <CrmEmptyLine>No deals yet. Add one here without leaving this contact.</CrmEmptyLine>
                ) : (
                  <div className="divide-y">
                    {deals.map((deal) => (
                      <button
                        key={deal.id}
                        type="button"
                        className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left hover:bg-muted/40"
                        onClick={() => setDealId(deal.id)}
                      >
                        <span className="truncate text-sm font-semibold text-foreground">{deal.name}</span>
                        <span className="shrink-0 text-xs text-muted-foreground">
                          {deal.stage?.name || "No stage"} · {formatCrmMoney(deal.amount, deal.currency)}
                        </span>
                      </button>
                    ))}
                  </div>
                )}
              </CrmInfoCard>
            </div>
          </TabsContent>

          <TabsContent value="notes" className="mt-10">
            <RecordNotes scope={{ contactId }} />
          </TabsContent>
          <TabsContent value="tasks" className="mt-10">
            <RecordTasks scope={{ contactId }} />
          </TabsContent>
          <TabsContent value="activities" className="mt-10">
            <RecordActivities scope={{ contactId }} />
          </TabsContent>
          <TabsContent value="source" className="mt-10">
            <CrmInfoCard icon={Target} title="Source" description="Where this contact came from">
              <CrmFieldGrid>
                <CrmFieldRow>
                  <CrmField label="Lead source">{displayText(contact.leadSource)}</CrmField>
                  <CrmField label="Lead status">{displayText(contact.leadStatus)}</CrmField>
                </CrmFieldRow>
                <CrmFieldRow>
                  <CrmField label="Seniority">{displayText(contact.seniority)}</CrmField>
                  <CrmField label="Job title">{displayText(contact.title)}</CrmField>
                </CrmFieldRow>
              </CrmFieldGrid>
            </CrmInfoCard>
          </TabsContent>

          <TabsContent value="deals" className="mt-10">
            <div className="mb-3 flex justify-end">
              <Button size="sm" onClick={() => setDealFormOpen(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Add deal
              </Button>
            </div>
            <CrmInfoCard
              icon={Briefcase}
              title="Deals"
              description={`${deals.length} ${deals.length === 1 ? "deal" : "deals"} on this contact`}
            >
              {deals.length === 0 ? (
                <CrmEmptyLine>No deals for this contact.</CrmEmptyLine>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="px-4 text-xs">Name</TableHead>
                      <TableHead className="text-xs">Stage</TableHead>
                      <TableHead className="text-xs">Amount</TableHead>
                      <TableHead className="text-xs">Close date</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {deals.map((deal) => (
                      <TableRow key={deal.id}>
                        <TableCell className="px-4">
                          <button
                            type="button"
                            className="text-sm font-semibold text-foreground hover:underline"
                            onClick={() => setDealId(deal.id)}
                          >
                            {deal.name}
                          </button>
                        </TableCell>
                        <TableCell>
                          {deal.stage ? (
                            <Badge variant="outline" className="text-xs">
                              {deal.stage.name}
                            </Badge>
                          ) : (
                            "—"
                          )}
                        </TableCell>
                        <TableCell className="text-sm">
                          {formatCrmMoney(deal.amount, deal.currency)}
                        </TableCell>
                        <TableCell className="text-sm">
                          {formatCrmDate(deal.expectedCloseDate)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CrmInfoCard>
          </TabsContent>
        </Tabs>
      </div>

      <DealFormSheet
        open={dealFormOpen}
        onOpenChange={setDealFormOpen}
        fixedContact={{
          id: contact.id,
          name: contactName,
          companyId: contact.companyId,
        }}
        onSuccess={() => {
          setDealFormOpen(false);
          refetch();
        }}
      />
      <DealViewSheet
        dealId={dealId}
        open={!!dealId}
        onOpenChange={(open) => {
          if (!open) setDealId(null);
        }}
      />

      <ContactFormSheet
        open={editOpen}
        onOpenChange={setEditOpen}
        contact={contact}
        onSuccess={() => {
          setEditOpen(false);
          refetch();
        }}
      />
      <DeleteContactDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        contact={contact}
        onSuccess={() => {
          setDeleteOpen(false);
          navigate("/agency/crm/contacts");
        }}
      />
    </CrmDetailFrame>
  );
}
