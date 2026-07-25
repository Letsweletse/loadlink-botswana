import { createFileRoute } from "@tanstack/react-router";
import { SignupMagic } from "@/components/SignupMagic";

export const Route = createFileRoute("/signup")({
  validateSearch: (s: Record<string, unknown>) => ({
    role: s.role === "driver" ? "driver" : "client",
  }),
  component: SignUp,
});

function SignUp() {
  const search = Route.useSearch();
  return <SignupMagic role={search.role} />;
}
