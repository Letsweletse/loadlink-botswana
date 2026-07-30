import { createFileRoute } from '@tanstack/react-router'
import NewBooking from '@/pages/NewBooking'
import RequireAuth from '@/components/RequireAuth'

function ProtectedNewBooking() {
  return (
    <RequireAuth>
      <NewBooking />
    </RequireAuth>
  )
}

export const Route = createFileRoute('/new-booking')({ component: ProtectedNewBooking })
