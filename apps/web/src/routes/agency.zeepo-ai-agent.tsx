import { Outlet } from "react-router";
import {
	DEFAULT_ZEEPO_AGENT_ROUTE,
	ZeepoAgentRouteProvider,
} from "@/components/zeepo/zeepo-agent-route-context";
import { ZeepoTokenBillingProvider } from "@/components/zeepo/zeepo-token-billing-provider";

export default function ZeepoAiAgentLayout() {
  return (
    <ZeepoAgentRouteProvider config={DEFAULT_ZEEPO_AGENT_ROUTE}>
      <ZeepoTokenBillingProvider>
        <div className="zeepo-agent-layout flex h-full min-h-0 w-full flex-col overflow-hidden">
          <Outlet />
        </div>
      </ZeepoTokenBillingProvider>
    </ZeepoAgentRouteProvider>
  );
}
