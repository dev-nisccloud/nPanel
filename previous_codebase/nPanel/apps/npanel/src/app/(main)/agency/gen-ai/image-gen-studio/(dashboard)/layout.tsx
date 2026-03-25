import { ReactNode } from "react";
import { redirect } from "next/navigation";

import { getCurrentUser } from "@/lib/auth-server";

export const dynamic = "force-dynamic";

export default async function ImageGenStudioDashboardLayout({
  children,
}: Readonly<{ children: ReactNode }>) {
  // Parent /agency layout already ensures user is not a CUSTOMER and provides the sidebar
  // Just verify user is authenticated
  const user = await getCurrentUser();
  if (!user) {
    redirect("/auth/login");
  }

  // Parent layout already handles sidebar, header, etc.
  // Just render children
  return <>{children}</>;
}
