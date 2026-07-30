import { createFileRoute } from '@tanstack/react-router'
import DriverLoads from '@/pages/DriverLoads'
import RequireAuth from '@/components/RequireAuth'

function ProtectedDriverLoads() {
  return (
    <RequireAuth>
      <DriverLoads />
    </RequireAuth>
  )
}

export const Route = createFileRoute('/driver-loads')({ component: ProtectedDriverLoads })
