import { createFileRoute } from '@tanstack/react-router'
import { lazyPage } from '@/components/LazyPage'
import RequireAuth from '@/components/RequireAuth'

const WalletPage = lazyPage(() => import('@/pages/WalletPage'))

function ProtectedWalletPage() {
  return (
    <RequireAuth>
      <WalletPage />
    </RequireAuth>
  )
}

export const Route = createFileRoute('/wallet')({ component: ProtectedWalletPage })
