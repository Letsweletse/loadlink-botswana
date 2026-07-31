import { createFileRoute } from '@tanstack/react-router'
import { lazyPage } from '@/components/LazyPage'
import RequireAuth from '@/components/RequireAuth'

const Support = lazyPage(() => import('@/pages/Support'))

function ProtectedSupport() {
  return (
    <RequireAuth>
      <Support />
    </RequireAuth>
  )
}

export const Route = createFileRoute('/support')({ component: ProtectedSupport })
