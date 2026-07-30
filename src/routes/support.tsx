import { createFileRoute } from '@tanstack/react-router'
import Support from '@/pages/Support'
import RequireAuth from '@/components/RequireAuth'

function ProtectedSupport() {
  return (
    <RequireAuth>
      <Support />
    </RequireAuth>
  )
}

export const Route = createFileRoute('/support')({ component: ProtectedSupport })
