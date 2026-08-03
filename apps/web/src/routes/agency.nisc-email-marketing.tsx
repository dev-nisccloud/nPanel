import { Outlet } from "react-router";
import {
	DEFAULT_NISC_EM_ROUTE,
	NiscEmailMarketingRouteProvider,
} from "@/components/nisc-email-marketing/nisc-email-marketing-route-context";
import { NiscEmailMarketingOnboarding } from "@/components/nisc-email-marketing/nisc-email-marketing-onboarding";

export default function EmailMarketingLayout() {
	return (
		<NiscEmailMarketingRouteProvider config={DEFAULT_NISC_EM_ROUTE}>
			<div className="@container/main flex flex-col gap-4 md:gap-6 px-4 md:px-6 lg:px-8 py-4 md:py-6">
				<div className="w-full max-w-7xl mx-auto">
					<NiscEmailMarketingOnboarding />
				</div>
			</div>
			<Outlet />
		</NiscEmailMarketingRouteProvider>
	);
}
