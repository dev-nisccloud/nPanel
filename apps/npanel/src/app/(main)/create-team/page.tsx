import { CreateTeamForm } from "./_components/create-team-form";

export default function CreateTeamPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/30 p-4">
      <div className="w-full max-w-md">
        <CreateTeamForm />
      </div>
    </div>
  );
}
