import { NiscServicesDataTable } from "./agency.nisc-services/_components/nisc-services-data-table";

export default function NiscServicesPage() {
    return (
        <div className="@container/main flex flex-col gap-4 md:gap-6 px-4 md:px-6 lg:px-8 py-4 md:py-6">
            <div className="w-full max-w-7xl mx-auto">
                <div className="flex flex-col gap-2">
                    <h1 className="text-base font-semibold tracking-tight">Nisc Cloud Services</h1>
                    <p className="text-xs text-muted-foreground">
                        Manage the services offered to clients. Create and organise
                        services across Cloud, Marketing, Consulting, and Custom categories.
                    </p>
                </div>

                <div className="mt-6">
                    <NiscServicesDataTable />
                </div>
            </div>
        </div>
    );
}
