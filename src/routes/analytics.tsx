import { createFileRoute } from '@tanstack/react-router'
import Analytics from '@/pages/Analytics'
import RequireAuth from '@/components/RequireAuth'

function ProtectedAnalytics() {
  return (
    <RequireAuth>
      <Analytics />
    </RequireAuth>
  )
}

export const Route = createFileRoute('/analytics')({ component: ProtectedAnalytics })
