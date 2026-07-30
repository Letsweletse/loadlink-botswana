import { createFileRoute } from '@tanstack/react-router'
import WalletPage from '@/pages/WalletPage'
import RequireAuth from '@/components/RequireAuth'

function ProtectedWalletPage() {
  return (
    <RequireAuth>
      <WalletPage />
    </RequireAuth>
  )
}

export const Route = createFileRoute('/wallet')({ component: ProtectedWalletPage })
