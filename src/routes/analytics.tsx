import { createFileRoute } from '@tanstack/react-router'
import { lazyPage } from '@/components/LazyPage'
import RequireAuth from '@/components/RequireAuth'

const Analytics = lazyPage(() => import('@/pages/Analytics'))

function ProtectedAnalytics() {
  return (
    <RequireAuth>
      <Analytics />
    </RequireAuth>
  )
}

export const Route = createFileRoute('/analytics')({ component: ProtectedAnalytics })
