import { redirect } from "next/navigation";
export const dynamic = "force-dynamic";
import { redirectIfAuthenticated } from "@/lib/auth-server";

export default async function Home() {
  console.log("[Root Page] Root page executing");
  // Check if user is authenticated and redirect to appropriate dashboard
  await redirectIfAuthenticated();
  
  console.log("[Root Page] redirectIfAuthenticated() returned, redirecting to /auth/login");
  // If we reach here, user is not authenticated - redirect to login
  redirect("/auth/login");
}
