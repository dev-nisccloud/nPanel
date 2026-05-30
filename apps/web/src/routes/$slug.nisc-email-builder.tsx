"use client";

import { Outlet } from "react-router";
import { CustomerNiscEmRouteShell } from "@/components/nisc-email-marketing/customer-nisc-em-route-shell";

export default function CustomerNiscEmailBuilderLayout() {
	return (
		<CustomerNiscEmRouteShell>
			<Outlet />
		</CustomerNiscEmRouteShell>
	);
}
