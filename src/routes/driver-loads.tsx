import { createFileRoute } from '@tanstack/react-router'
import { lazyPage } from '@/components/LazyPage'
import RequireAuth from '@/components/RequireAuth'

const DriverLoads = lazyPage(() => import('@/pages/DriverLoads'))

function ProtectedDriverLoads() {
  return (
    <RequireAuth>
      <DriverLoads />
    </RequireAuth>
  )
}

export const Route = createFileRoute('/driver-loads')({ component: ProtectedDriverLoads })
