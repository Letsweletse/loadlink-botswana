import { createFileRoute } from '@tanstack/react-router'
import DriverRegistrations from '@/pages/DriverRegistrations'
import RequireAuth from '@/components/RequireAuth'

function ProtectedDriverRegistrations() {
  return (
    <RequireAuth adminOnly>
      <DriverRegistrations />
    </RequireAuth>
  )
}

export const Route = createFileRoute('/driver-registrations')({ component: ProtectedDriverRegistrations })
