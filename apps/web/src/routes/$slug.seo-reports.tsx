"use client";

import { Outlet } from "react-router";
import { CustomerSeoReportsRouteShell } from "@/components/seo-reports/customer-seo-reports-route-shell";

export default function TeamSeoReportsLayout() {
	return (
		<CustomerSeoReportsRouteShell>
			<Outlet />
		</CustomerSeoReportsRouteShell>
	);
}
