import { Outlet } from "react-router";
import {
	DEFAULT_NISC_EM_ROUTE,
	NiscEmailMarketingRouteProvider,
} from "@/components/nisc-email-marketing/nisc-email-marketing-route-context";

export default function EmailMarketingLayout() {
	return (
		<NiscEmailMarketingRouteProvider config={DEFAULT_NISC_EM_ROUTE}>
			<Outlet />
		</NiscEmailMarketingRouteProvider>
	);
}
