import { createFileRoute } from '@tanstack/react-router'
import { lazyPage } from '@/components/LazyPage'
import RequireAuth from '@/components/RequireAuth'

const DriverRegistrations = lazyPage(() => import('@/pages/DriverRegistrations'))

function ProtectedDriverRegistrations() {
  return (
    <RequireAuth adminOnly>
      <DriverRegistrations />
    </RequireAuth>
  )
}

export const Route = createFileRoute('/driver-registrations')({ component: ProtectedDriverRegistrations })
