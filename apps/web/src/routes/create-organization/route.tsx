import CreateTeamLayout from "./layout";
import { CreateTeamForm } from "./_components/create-team-form";

export default function CreateTeamRouteLayout() {
  return (
    <CreateTeamLayout>
      <div className="min-h-screen flex flex-col md:flex-row">
        {/* Left panel: branding / illustration (visible on md+) */}
        <div className="hidden md:flex md:w-[45%] lg:w-[50%] bg-gradient-to-br from-primary/8 via-primary/5 to-transparent dark:from-primary/12 dark:via-primary/8 dark:to-transparent border-r border-border/50 flex-col px-12 xl:px-20">
          <div className="pt-10 xl:pt-12">
            <img
              src="/nisclogooriginal.png"
              alt="Nisc"
              width={180}
              height={60}
              className="h-15 w-auto max-w-full object-contain object-left"
            />
          </div>
          <div className="max-w-sm flex-1 flex flex-col justify-center">
            <h2 className="text-2xl font-semibold tracking-tight text-foreground">
              Why create an organization?
            </h2>
            <p className="text-muted-foreground mt-3 text-sm leading-relaxed">
              An organization is a private workspace for your business. Everything inside it  
              domains, hosting, subscriptions, and teammates   stays separate from your other
              organizations.
            </p>
            <ul className="mt-8 space-y-4 text-sm text-muted-foreground">
              <li className="flex items-start gap-3">
                <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/15 text-primary text-xs font-medium">
                  1
                </span>
                <span>Keep each organization’s resources and billing separate</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/15 text-primary text-xs font-medium">
                  2
                </span>
                <span>Invite teammates to only the organization they should access</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/15 text-primary text-xs font-medium">
                  3
                </span>
                <span>Each organization has its own subscriptions and dashboard</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Right: form */}
        <div className="flex-1 flex items-center justify-center p-6 sm:p-8 bg-background">
          <CreateTeamForm />
        </div>
      </div>
    </CreateTeamLayout>
  );
}
