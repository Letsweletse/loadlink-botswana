import { createFileRoute } from '@tanstack/react-router'
import { lazyPage } from '@/components/LazyPage'
import RequireAuth from '@/components/RequireAuth'

const AdminDashboard = lazyPage(() => import('@/pages/AdminDashboard'))

function ProtectedAdminDashboard() {
  return (
    <RequireAuth adminOnly>
      <AdminDashboard />
    </RequireAuth>
  )
}

export const Route = createFileRoute('/admin')({ component: ProtectedAdminDashboard })
