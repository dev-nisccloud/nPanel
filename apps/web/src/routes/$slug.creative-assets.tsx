"use client";

import { Outlet } from "react-router";
import { CustomerCreativeAssetsRouteShell } from "@/components/creative-assets/customer-creative-assets-route-shell";

export default function SlugCreativeAssetsLayout() {
	return (
		<CustomerCreativeAssetsRouteShell>
			<Outlet />
		</CustomerCreativeAssetsRouteShell>
	);
}
