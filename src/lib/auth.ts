import { isSupabaseConfigured, supabase } from "@/lib/supabase";

export async function signInWithGoogle(role: "client" | "driver") {
  if (!isSupabaseConfigured || !supabase) {
    throw new Error("Sign-in is not configured yet.");
  }

  const redirectTo =
    typeof window !== "undefined" ? `${window.location.origin}/signup?role=${role}` : undefined;

  const { error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: { redirectTo },
  });

  if (error) throw error;
}
