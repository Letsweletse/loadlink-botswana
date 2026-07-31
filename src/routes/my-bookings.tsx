import { createFileRoute } from '@tanstack/react-router'
import { lazyPage } from '@/components/LazyPage'
import RequireAuth from '@/components/RequireAuth'

const MyBookings = lazyPage(() => import('@/pages/MyBookings'))

function ProtectedMyBookings() {
  return (
    <RequireAuth>
      <MyBookings />
    </RequireAuth>
  )
}

export const Route = createFileRoute('/my-bookings')({ component: ProtectedMyBookings })
