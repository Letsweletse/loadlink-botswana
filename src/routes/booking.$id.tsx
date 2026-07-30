import { createFileRoute } from '@tanstack/react-router'
import BookingDetail from '@/pages/BookingDetail'
import RequireAuth from '@/components/RequireAuth'

function ProtectedBookingDetail() {
  return (
    <RequireAuth>
      <BookingDetail />
    </RequireAuth>
  )
}

export const Route = createFileRoute('/booking/$id')({ component: ProtectedBookingDetail })
