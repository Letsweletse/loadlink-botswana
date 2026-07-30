import { createFileRoute } from '@tanstack/react-router'
import Profile from '@/pages/Profile'
import RequireAuth from '@/components/RequireAuth'

function ProtectedProfile() {
  return (
    <RequireAuth>
      <Profile />
    </RequireAuth>
  )
}

export const Route = createFileRoute('/profile')({ component: ProtectedProfile })
