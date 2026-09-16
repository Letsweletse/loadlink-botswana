import { useEffect, useState } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { supabase } from '@/lib/supabase';
import { Loader2, AlertCircle, Check } from 'lucide-react';

export default function AuthCallback() {
  const navigate = useNavigate();
  const [status, setStatus] = useState('processing'); // processing, success, error
  const [message, setMessage] = useState('Processing login...');
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    handleCallback();
  }, []);

  async function handleCallback() {
    try {
      // Get the session from URL
      const { data, error } = await supabase.auth.getSession();

      if (error) {
        setStatus('error');
        setErrorMsg(error.message || 'Authentication failed');
        return;
      }

      if (!data.session) {
        setStatus('error');
        setErrorMsg('No active session found. Please try signing in again.');
        return;
      }

      // Check if user has confirmed email
      const user = data.session.user;
      if (user.email_confirmed_at || user.email === null) {
        // Email confirmed or OAuth user
        setStatus('success');
        setMessage('Welcome back! Redirecting...');

        // Redirect after 1 second
        setTimeout(() => {
          navigate({ to: '/' });
        }, 1000);
      } else {
        // Email not confirmed yet
        setStatus('error');
        setErrorMsg('Please confirm your email first. Check your inbox for the confirmation link.');
      }
    } catch (err) {
      console.error('Auth callback error:', err);
      setStatus('error');
      setErrorMsg(err.message || 'Something went wrong. Please try again.');
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#F9FAFB]">
      <div className="max-w-sm w-full mx-auto px-4">
        {status === 'processing' && (
          <div className="text-center">
            <Loader2 className="h-12 w-12 text-[#C9A05A] mx-auto animate-spin mb-4" />
            <p className="text-lg font-semibold text-[#3D2B0E]">{message}</p>
            <p className="text-sm text-[#6B7280] mt-2">Please wait...</p>
          </div>
        )}

        {status === 'success' && (
          <div className="bg-green-50 border border-green-200 rounded-2xl p-8 text-center">
            <Check className="h-12 w-12 text-green-600 mx-auto mb-4" />
            <p className="text-lg font-semibold text-green-900 mb-2">Welcome!</p>
            <p className="text-sm text-green-700">You're signed in successfully.</p>
          </div>
        )}

        {status === 'error' && (
          <div className="bg-red-50 border border-red-200 rounded-2xl p-8">
            <AlertCircle className="h-12 w-12 text-red-600 mx-auto mb-4" />
            <p className="text-sm font-semibold text-red-900 text-center mb-4">{errorMsg}</p>
            <button
              onClick={() => navigate({ to: '/login' })}
              className="w-full bg-red-600 hover:bg-red-700 text-white font-semibold py-2 rounded-xl transition-colors"
            >
              Back to Login
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
