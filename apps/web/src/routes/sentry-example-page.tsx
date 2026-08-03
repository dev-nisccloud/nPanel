import * as Sentry from "@sentry/react-router";

export default function SentryExamplePage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-lg flex-col items-center justify-center gap-4 p-8">
      <h1 className="text-2xl font-semibold">Sentry Example</h1>
      <p className="text-center text-muted-foreground">
        Click the button below to throw a test error and verify it appears in the
        npanel-dashboard Sentry project.
      </p>
      <button
        type="button"
        className="rounded-md bg-red-600 px-4 py-2 text-white hover:bg-red-700"
        onClick={() => {
          Sentry.startSpan({ name: "Example Frontend Span", op: "test" }, () => {
            throw new Error("Sentry example error from nPanel dashboard");
          });
        }}
      >
        Throw sample error
      </button>
    </main>
  );
}
