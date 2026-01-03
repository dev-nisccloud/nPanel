import { ReactNode } from "react";
import { redirect } from "next/navigation";

import { requireRole, verifyTeamAccess } from "@/lib/auth-server";
import { TeamContextProvider } from "./_components/team-context";

export const dynamic = "force-dynamic";

export default async function CustomerImageGenStudioLayout({
  children,
  params,
}: Readonly<{
  children: ReactNode;
  params: Promise<{ slug: string }>;
}>) {
  const { slug } = await params;

  // Server-side auth check
  await requireRole(["CUSTOMER"]);

  // Verify user has access to this team and get team data
  const team = await verifyTeamAccess(slug);

  if (!team) {
    redirect("/create-team");
  }

  return (
    <TeamContextProvider teamId={team.id} teamSlug={team.slug}>
      {children}
    </TeamContextProvider>
  );
}


