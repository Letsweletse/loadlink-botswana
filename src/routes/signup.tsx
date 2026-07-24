import { createFileRoute } from "@tanstack/react-router";
import { SignupMagic } from "@/components/SignupMagic";
import { GoogleSignInButton } from "@/components/GoogleSignInButton";

export const Route = createFileRoute("/signup")({
  validateSearch: (s: Record<string, unknown>) => ({
    role: s.role === "driver" ? "driver" : "client",
  }),
  component: SignUp,
});

// SignupMagic renders its own full AppShell (header + bottom nav), so this
// block intentionally stays outside that shell rather than wrapping it in a
// second one, which would duplicate the header/nav. It reuses AppShell's own
// container width/padding tokens so it still lines up with the content below.
function SignUp() {
  const search = Route.useSearch();
  return (
    <>
      <div className="mx-auto max-w-[820px] bg-background px-4 pt-5 sm:px-6">
        <div className="space-y-3 pb-3">
          <GoogleSignInButton role={search.role} />
          <div className="flex items-center gap-3 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
            <span className="h-px flex-1 bg-border" />
            or
            <span className="h-px flex-1 bg-border" />
          </div>
        </div>
      </div>
      <SignupMagic role={search.role} />
    </>
  );
}
