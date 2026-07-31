import { createFileRoute } from '@tanstack/react-router'
import { lazyPage } from '@/components/LazyPage'
import RequireAuth from '@/components/RequireAuth'

const NewBooking = lazyPage(() => import('@/pages/NewBooking'))

function ProtectedNewBooking() {
  return (
    <RequireAuth>
      <NewBooking />
    </RequireAuth>
  )
}

export const Route = createFileRoute('/new-booking')({ component: ProtectedNewBooking })
