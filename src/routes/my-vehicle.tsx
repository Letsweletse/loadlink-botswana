import { createFileRoute } from '@tanstack/react-router'
import VehicleRegistration from '@/pages/VehicleRegistration'
import RequireAuth from '@/components/RequireAuth'

function ProtectedVehicleRegistration() {
  return (
    <RequireAuth>
      <VehicleRegistration />
    </RequireAuth>
  )
}

export const Route = createFileRoute('/my-vehicle')({ component: ProtectedVehicleRegistration })
