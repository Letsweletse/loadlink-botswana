import { createFileRoute } from '@tanstack/react-router'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { base44 } from '@/api/base44Client'
import { useNavigate } from '@tanstack/react-router'
import { AlertCircle, Check, Truck } from 'lucide-react'

function ResetPassword() {
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const navigate = useNavigate()

  async function handleSubmit(e: any) {
    e.preventDefault()
    setError('')

    if (password.length < 8) {
      setError('Password must be at least 8 characters')
      return
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match')
      return
    }

    setLoading(true)

    try {
      // This is handled by Supabase auth after the reset email link is clicked
      const { error } = await base44.auth.refreshSession()
      if (error) throw error
      setSuccess(true)
      setTimeout(() => navigate({ to: '/' }), 2000)
    } catch (err: any) {
      setError(err.message || 'Failed to reset password')
      setLoading(false)
    }
  }

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F9FAFB]">
        <div className="max-w-sm w-full mx-auto px-4">
          <div className="bg-green-50 border border-green-200 rounded-2xl p-8 text-center">
            <Check className="h-12 w-12 text-green-600 mx-auto mb-4" />
            <p className="text-lg font-semibold text-green-900 mb-2">Password reset!</p>
            <p className="text-sm text-green-700">Redirecting to home...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#F9FAFB]">
      <div className="bg-[#3D2B0E] px-5 pt-12 pb-10">
        <div className="flex items-center gap-3 mb-6">
          <div className="h-10 w-10 rounded-xl bg-[#C9A05A] flex items-center justify-center">
            <Truck className="h-5 w-5 text-white" />
          </div>
          <div>
            <p className="font-extrabold text-white tracking-tight text-lg leading-none">Van-Link</p>
            <p className="text-[11px] text-white/50 mt-0.5">Goods transport across Botswana</p>
          </div>
        </div>
        <h1 className="text-2xl font-extrabold text-white tracking-tight">Reset password</h1>
        <p className="text-sm text-white/50 mt-1">Create a new password</p>
      </div>

      <div className="flex-1 px-5 pt-8 pb-10 max-w-sm w-full mx-auto">
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
              <p className="text-sm font-semibold text-red-900">{error}</p>
            </div>
          )}

          <div>
            <Label className="text-xs font-semibold uppercase tracking-wide text-[#6B7280]">New Password</Label>
            <Input
              className="mt-1.5 h-12 rounded-xl border-[#E5E7EB] bg-white text-[#3D2B0E]"
              type="password"
              placeholder="Min 8 characters"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              disabled={loading}
            />
          </div>

          <div>
            <Label className="text-xs font-semibold uppercase tracking-wide text-[#6B7280]">Confirm Password</Label>
            <Input
              className="mt-1.5 h-12 rounded-xl border-[#E5E7EB] bg-white text-[#3D2B0E]"
              type="password"
              placeholder="Confirm new password"
              value={confirmPassword}
              onChange={e => setConfirmPassword(e.target.value)}
              required
              disabled={loading}
            />
          </div>

          <Button
            type="submit"
            className="w-full h-12 rounded-xl bg-[#C9A05A] hover:bg-[#B08A45] text-white font-bold text-base mt-6"
            disabled={loading}
          >
            {loading ? 'Resetting...' : 'Reset Password'}
          </Button>
        </form>
      </div>
    </div>
  )
}

export const Route = createFileRoute('/auth/reset-password')({
  component: ResetPassword,
})
