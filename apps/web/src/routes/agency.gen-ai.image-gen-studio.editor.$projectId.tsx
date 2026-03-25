"use client";

import { Navigate, Outlet } from "react-router";
 
import { authClient } from "@/lib/auth-client";
import { Spinner } from "@/components/ui/shadcn-io/spinner";
import { EditorBodyScrollLock } from "./_agency.gen-ai/image-gen-studio/_components/editor-body-scroll-lock";
 
export default function EditorLayout() {
  const { data: session, isPending } = authClient.useSession();
 
  if (isPending) {
    return (
      <div className="flex items-center justify-center py-24">
        <Spinner size={32} />
      </div>
    );
  }
 
  if (!session?.user) {
    return <Navigate to="/auth/login" replace />;
  }
 
  return (
    <div className="flex h-full min-h-0 min-w-0 w-full flex-col overflow-hidden">
      <EditorBodyScrollLock />
      <Outlet />
    </div>
  );
}
