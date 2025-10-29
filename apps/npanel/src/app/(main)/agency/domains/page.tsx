import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { OpenProviderTldsTable } from "./_components/openprovider-tlds-table";
import { DomainSearch } from "./_components/domain-search";
import { TldSettings } from "./_components/tld-settings";

export default function DomainsPage() {
  return (
    <div className="@container/main flex flex-col gap-4 md:gap-6">
      <Tabs defaultValue="domain-search" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="domain-search">Domain Search</TabsTrigger>
          <TabsTrigger value="openprovider-tlds">Openprovider TLDs</TabsTrigger>
          <TabsTrigger value="supported-domains">Supported Domains</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>

        <TabsContent value="domain-search" className="mt-6">
          <DomainSearch />
        </TabsContent>

        <TabsContent value="openprovider-tlds" className="mt-6">
          <OpenProviderTldsTable />
        </TabsContent>

        <TabsContent value="supported-domains" className="mt-6">
          <div className="flex items-center justify-center h-64 border border-dashed rounded-lg">
            <p className="text-muted-foreground">Supported Domains section coming soon...</p>
          </div>
        </TabsContent>

        <TabsContent value="settings" className="mt-6">
          <TldSettings />
        </TabsContent>
      </Tabs>
    </div>
  );
}
