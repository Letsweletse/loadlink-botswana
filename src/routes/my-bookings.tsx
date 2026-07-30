import { createFileRoute } from '@tanstack/react-router'
import MyBookings from '@/pages/MyBookings'
import RequireAuth from '@/components/RequireAuth'

function ProtectedMyBookings() {
  return (
    <RequireAuth>
      <MyBookings />
    </RequireAuth>
  )
}

export const Route = createFileRoute('/my-bookings')({ component: ProtectedMyBookings })
