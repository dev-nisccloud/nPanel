import Image from "next/image";
import { CreateTeamForm } from "./_components/create-team-form";

export default function CreateTeamPage() {
  return (
    <div className="min-h-screen flex flex-col md:flex-row">
      {/* Left panel: branding / illustration (visible on md+) */}
      <div className="hidden md:flex md:w-[45%] lg:w-[50%] bg-gradient-to-br from-primary/8 via-primary/5 to-transparent dark:from-primary/12 dark:via-primary/8 dark:to-transparent border-r border-border/50 flex-col px-12 xl:px-20">
        <div className="pt-10 xl:pt-12">
          <Image
            src="/nisclogooriginal.png"
            alt="NISC"
            width={180}
            height={60}
            className="h-auto w-auto object-contain object-left"
            style={{ maxWidth: "100%" }}
            priority
          />
        </div>
        <div className="max-w-sm flex-1 flex flex-col justify-center">
          <h2 className="text-2xl font-semibold tracking-tight text-foreground">
            Set up your company in minutes
          </h2>
          <p className="text-muted-foreground mt-3 text-sm leading-relaxed">
            Create a workspace, add your company, and start managing domains, hosting, and
            billing in one place.
          </p>
          <ul className="mt-8 space-y-4 text-sm text-muted-foreground">
            <li className="flex items-center gap-3">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/15 text-primary text-xs font-medium">
                1
              </span>
              Company name and currency
            </li>
            <li className="flex items-center gap-3">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/15 text-primary text-xs font-medium">
                2
              </span>
              Optional: invite members by email
            </li>
            <li className="flex items-center gap-3">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/15 text-primary text-xs font-medium">
                3
              </span>
              You’re in — head to your dashboard
            </li>
          </ul>
        </div>
      </div>

      {/* Right: form */}
      <div className="flex-1 flex items-center justify-center p-6 sm:p-8 bg-background">
        <CreateTeamForm />
      </div>
    </div>
  );
}
