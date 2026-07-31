import { createFileRoute } from '@tanstack/react-router'
import { lazyPage } from '@/components/LazyPage'
import RequireAuth from '@/components/RequireAuth'

const VehicleRegistration = lazyPage(() => import('@/pages/VehicleRegistration'))

function ProtectedVehicleRegistration() {
  return (
    <RequireAuth>
      <VehicleRegistration />
    </RequireAuth>
  )
}

export const Route = createFileRoute('/my-vehicle')({ component: ProtectedVehicleRegistration })
