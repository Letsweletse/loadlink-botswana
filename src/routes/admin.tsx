import { createFileRoute } from "@tanstack/react-router";
import AdminDashboard from "@/pages/AdminDashboard";
import RequireAuth from "@/components/RequireAuth";

function ProtectedAdminDashboard() {
  return (
    <RequireAuth adminOnly>
      <AdminDashboard />
    </RequireAuth>
  );
}

export const Route = createFileRoute("/admin")({
  component: ProtectedAdminDashboard,
});
