import TeamLayout from "./$slug.team-layout";

import { Outlet } from "react-router";

export default function SlugRouteLayout() {
  return (
    <TeamLayout>
      <Outlet />
    </TeamLayout>
  );
}
