import { createFileRoute } from '@tanstack/react-router'
import { lazyPage } from '@/components/LazyPage'
import RequireAuth from '@/components/RequireAuth'

const BookingDetail = lazyPage(() => import('@/pages/BookingDetail'))

function ProtectedBookingDetail() {
  return (
    <RequireAuth>
      <BookingDetail />
    </RequireAuth>
  )
}

export const Route = createFileRoute('/booking/$id')({ component: ProtectedBookingDetail })
