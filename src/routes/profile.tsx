import { createFileRoute } from '@tanstack/react-router'
import { lazyPage } from '@/components/LazyPage'
import RequireAuth from '@/components/RequireAuth'

const Profile = lazyPage(() => import('@/pages/Profile'))

function ProtectedProfile() {
  return (
    <RequireAuth>
      <Profile />
    </RequireAuth>
  )
}

export const Route = createFileRoute('/profile')({ component: ProtectedProfile })
