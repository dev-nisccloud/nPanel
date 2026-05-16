"use client";

import * as React from "react";
import { useFormContext } from "react-hook-form";
import { Search, UserCheck, X } from "lucide-react";
import CustomTextInput from "@/routes/agency.invoices/create/_components/ui/customTextInput";
import CustomNumberInput from "@/routes/agency.invoices/create/_components/ui/customNumberInput";
import { trpc } from "@/utils/trpc";
import { Spinner } from "@/components/ui/shadcn-io/spinner";

export const ManualCompanyDetailsForm = () => {
	const form = useFormContext();
	const [search, setSearch] = React.useState("");
	const [isOpen, setIsOpen] = React.useState(false);
	const [selectedClient, setSelectedClient] = React.useState<{ id: string; name: string; email: string } | null>(null);
	const inputRef = React.useRef<HTMLInputElement>(null);
	const dropdownRef = React.useRef<HTMLDivElement>(null);

	const { data: clients, isLoading } = trpc.clients.getAll.useQuery(
		{},
		{ staleTime: 60_000 },
	);

	// Fetch profile when a client is selected to pre-fill address fields
	const { data: profile } = trpc.clients.getProfile.useQuery(
		{ userId: selectedClient?.id ?? "" },
		{ enabled: !!selectedClient?.id },
	);

	// Pre-fill address fields when profile loads
	React.useEffect(() => {
		if (!profile || !selectedClient) return;
		if (profile.address) form.setValue("companyAddress", profile.address);
		if (profile.city) form.setValue("companyCity", profile.city);
		if (profile.state) form.setValue("companyState", profile.state);
		if (profile.country) form.setValue("companyCountry", profile.country);
		if (profile.postalCode) form.setValue("companyZip", profile.postalCode);
	}, [profile, selectedClient, form]);

	const filtered = React.useMemo(() => {
		if (!clients) return [];
		const q = search.toLowerCase().trim();
		if (!q) return clients.slice(0, 8);
		return clients
			.filter((c) => c.name.toLowerCase().includes(q) || c.email.toLowerCase().includes(q))
			.slice(0, 8);
	}, [clients, search]);

	const handleSelect = (client: { id: string; name: string; email: string }) => {
		setSelectedClient(client);
		form.setValue("companyName", client.name);
		form.setValue("email", client.email);
		form.setValue("linkedUserId", client.id);
		setSearch("");
		setIsOpen(false);
	};

	const handleClear = () => {
		setSelectedClient(null);
		form.setValue("linkedUserId", "");
	};

	// Close dropdown when clicking outside
	React.useEffect(() => {
		function handleClickOutside(e: MouseEvent) {
			if (
				dropdownRef.current &&
				!dropdownRef.current.contains(e.target as Node) &&
				inputRef.current &&
				!inputRef.current.contains(e.target as Node)
			) {
				setIsOpen(false);
			}
		}
		document.addEventListener("mousedown", handleClickOutside);
		return () => document.removeEventListener("mousedown", handleClickOutside);
	}, []);

	return (
		<div className="pt-24 space-y-6">
			<div>
				<p className="text-2xl font-semibold pb-3">Company Details (Quoted to)</p>
				<p className="pb-4 text-xs font-medium text-neutral-500">
					Select an existing client to auto-fill details, or enter them manually below.
				</p>
			</div>

			{/* ── Client selector ── */}
			<div className="space-y-2">
				<p className="text-sm font-medium">Link to existing client</p>

				{selectedClient ? (
					<div className="flex items-center justify-between p-3 border rounded-lg bg-muted/40">
						<div className="flex items-center gap-2">
							<UserCheck className="h-4 w-4 text-green-500 shrink-0" />
							<div>
								<p className="text-sm font-medium leading-none">{selectedClient.name}</p>
								<p className="text-xs text-muted-foreground mt-0.5">{selectedClient.email}</p>
							</div>
						</div>
						<button
							type="button"
							onClick={handleClear}
							className="p-1 rounded hover:bg-muted transition-colors"
							aria-label="Clear selected client"
						>
							<X className="h-4 w-4 text-muted-foreground" />
						</button>
					</div>
				) : (
					<div className="relative">
						<div className="relative">
							<Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
							<input
								ref={inputRef}
								type="text"
								placeholder="Search clients by name or email…"
								value={search}
								onChange={(e) => { setSearch(e.target.value); setIsOpen(true); }}
								onFocus={() => setIsOpen(true)}
								className="w-full h-10 pl-9 pr-3 border rounded-md text-sm bg-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
							/>
							{isLoading && (
								<div className="absolute right-3 top-1/2 -translate-y-1/2">
									<Spinner size={14} />
								</div>
							)}
						</div>

						{isOpen && (
							<div
								ref={dropdownRef}
								className="absolute z-50 w-full mt-1 bg-background border rounded-md shadow-lg max-h-56 overflow-y-auto"
							>
								{filtered.length === 0 ? (
									<div className="px-3 py-4 text-center text-sm text-muted-foreground">
										{isLoading ? "Loading clients…" : "No clients found"}
									</div>
								) : (
									filtered.map((client) => (
										<button
											key={client.id}
											type="button"
											className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-muted/60 text-left transition-colors"
											onMouseDown={(e) => { e.preventDefault(); handleSelect(client); }}
										>
											<div className="h-7 w-7 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
												<span className="text-xs font-semibold text-primary">
													{client.name.charAt(0).toUpperCase()}
												</span>
											</div>
											<div className="min-w-0">
												<p className="text-sm font-medium truncate">{client.name}</p>
												<p className="text-xs text-muted-foreground truncate">{client.email}</p>
											</div>
										</button>
									))
								)}
							</div>
						)}
					</div>
				)}
			</div>

			<div className="border-t pt-4 space-y-6">
				<p className="text-xs text-muted-foreground">
					{selectedClient ? "Fields pre-filled from client. You can still edit them below." : "Or enter company details manually:"}
				</p>

				<CustomTextInput
					label="Company / Customer Name"
					placeholder="Acme Ltd"
					variableName="companyName"
				/>
				<CustomTextInput
					label="Email"
					placeholder="billing@acme.com"
					variableName="email"
				/>
				<CustomTextInput
					label="Address"
					placeholder="Street, Building"
					variableName="companyAddress"
				/>
				<CustomTextInput label="City" placeholder="Nairobi" variableName="companyCity" />
				<CustomTextInput label="State" placeholder="County" variableName="companyState" />
				<CustomNumberInput label="Zip" placeholder="00100" variableName="companyZip" />
				<CustomTextInput label="Country" placeholder="Kenya" variableName="companyCountry" />
				<CustomTextInput label="Tax ID" placeholder="Optional" variableName="companyTaxId" />
			</div>
		</div>
	);
};
