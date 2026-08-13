"use client";

import { Outlet } from "react-router";
import {
  DEFAULT_ZEEPO_AI_ROUTE,
  ZeepoAiRouteProvider,
} from "@/components/zeepo/zeepo-ai-route-context";

/** Agency mount  shared UI lives in components; swap provider config for customer later. */
export default function ZeepoAiLayout() {
  return (
    <ZeepoAiRouteProvider config={DEFAULT_ZEEPO_AI_ROUTE}>
      <div className="@container/main flex h-full min-h-0 w-full flex-1 flex-col overflow-hidden">
        <Outlet />
      </div>
    </ZeepoAiRouteProvider>
  );
}
