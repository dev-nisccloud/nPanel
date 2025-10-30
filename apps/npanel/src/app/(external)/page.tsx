import { redirect } from "next/navigation";
export const dynamic = "force-dynamic";
import { redirectIfAuthenticated } from "@/lib/auth-server";

export default async function Home() {
  // Check if user is authenticated and redirect to appropriate dashboard
  await redirectIfAuthenticated();
  
  // If we reach here, user is not authenticated - redirect to login
  redirect("/auth/login");
}
