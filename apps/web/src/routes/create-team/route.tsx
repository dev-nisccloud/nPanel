import type { ReactNode } from "react";

import { requireAuth, getCurrentUser, getCustomerTeamRedirectPath } from "@/lib/auth-server";
import { redirect } from "next/navigation";

export default async function CreateTeamLayout({
  children,
}: Readonly<{ children: ReactNode }>) {
  const user = await requireAuth();
  const role = (user as { role?: string }).role;

  // If customer already has a team, send them to their dashboard (stops redirect loop)
  if (role === "CUSTOMER") {
    const target = await getCustomerTeamRedirectPath(user as { id: string; lastAccessedTeamId?: string | null });
    if (target !== "/create-team") {
      redirect(target);
    }
  }

  return <div className="min-h-screen bg-background">{children}</div>;
}
