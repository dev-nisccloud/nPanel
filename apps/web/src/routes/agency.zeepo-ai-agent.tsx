import { Outlet } from "react-router";

export default function ZeepoAiAgentLayout() {
  return (
    <div className="zeepo-agent-layout flex h-full min-h-0 w-full flex-col overflow-hidden">
      <Outlet />
    </div>
  );
}
