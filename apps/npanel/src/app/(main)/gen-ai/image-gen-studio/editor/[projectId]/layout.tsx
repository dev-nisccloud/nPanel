import { ReactNode } from "react";
import { requireAuth } from "@/lib/auth-server";

export const dynamic = "force-dynamic";

export default async function EditorLayout({
  children,
}: Readonly<{ children: ReactNode }>) {
  await requireAuth();

  return <div className="h-screen w-screen overflow-hidden">{children}</div>;
}








