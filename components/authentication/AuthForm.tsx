'use client';

import { useState } from 'react';
import Link from 'next/link';
import { createBrowserClient } from '@supabase/ssr';
import Toast from '../others/Toast';

const DEFAULT_ROLE = 'student';
const UNILAK_EMAIL_DOMAIN = '@unilak.com';

export default function AuthForm({ next }: { next: string }) {
  const [regNumber, setRegNumber] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookieOptions: {
        maxAge: rememberMe ? 60 * 60 * 24 * 30 : undefined,
      },
    }
  );

  const normalizeRegNumber = (value: string) => value.trim().replace(/\s+/g, '');

  const getAuthEmail = (value: string) => {
    const normalizedValue = normalizeRegNumber(value);

    if (!normalizedValue) {
      return '';
    }

    if (normalizedValue.includes('@')) {
      return normalizedValue;
    }

    return `${normalizedValue}${UNILAK_EMAIL_DOMAIN}`;
  };

  const isValid = normalizeRegNumber(regNumber) !== '' && password.trim() !== '';

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setToast(null);

    const normalizedRegNumber = normalizeRegNumber(regNumber);
    const authEmail = getAuthEmail(normalizedRegNumber);

    if (!authEmail || !normalizedRegNumber) {
      setToast({ message: 'Please enter a valid registration number.', type: 'error' });
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: authEmail,
        password,
      });

      if (!error) {
        let destination = next;

        if (data.user) {
          const { data: profile } = await supabase
            .from('profiles_table')
            .select('role')
            .eq('id', data.user.id)
            .single();

          if (profile?.role === 'moderator') {
            destination = '/moderator';
          }
        }

        setToast({ message: 'Signed in successfully!', type: 'success' });
        setTimeout(() => {
          window.location.href = destination;
        }, 1500);
        return;
      }

      const invalidCredentialsMessage = error.message?.toLowerCase() || '';
      if (!invalidCredentialsMessage.includes('invalid login credentials')) {
        setToast({ message: error.message, type: 'error' });
        return;
      }

      const { data: newUser, error: signUpError } = await supabase.auth.signUp({
        email: authEmail,
        password,
        options: {
          data: {
            username: normalizedRegNumber,
            role: DEFAULT_ROLE,
          },
        },
      });

      if (signUpError) {
        setToast({ message: signUpError.message, type: 'error' });
        return;
      }

      if (newUser.user) {
        setToast({ message: 'Account created successfully. You are now signed in.', type: 'success' });
        setTimeout(() => {
          window.location.href = next;
        }, 1500);
      }
    } catch (err) {
      const fallbackMessage = err instanceof Error ? err.message : 'Something went wrong. Please try again.';
      setToast({ message: fallbackMessage, type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
      <form onSubmit={handleAuth} className="space-y-4">
        <div>
          <label className="block text-lg font-bold text-white/80 uppercase mb-1">Registration Number</label>
          <input
            type="text"
            value={regNumber}
            onChange={(e) => setRegNumber(e.target.value)}
            className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-blue-500 transition-colors"
            placeholder="30505/2026"
            required
          />
        </div>
        <div>
          <label className="block text-lg font-bold text-white/80 uppercase mb-1">Password</label>
          <div className="relative">
            <input
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-blue-500 transition-colors pr-10"
              required
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white transition-colors"
            >
              {showPassword ? (
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 0 0 1.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.451 10.451 0 0 1 12 4.5c4.756 0 8.773 3.162 10.065 7.498a10.522 10.522 0 0 1-4.293 5.774M6.228 6.228 3 3m3.228 3.228 3.65 3.65m7.894 7.894L21 21m-3.228-3.228-3.65-3.65m0 0a3 3 0 1 0-4.243-4.243m4.242 4.242L9.88 9.88" />
                </svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 0 1 0-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178Z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
                </svg>
              )}
            </button>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id="rememberMe"
            checked={rememberMe}
            onChange={(e) => setRememberMe(e.target.checked)}
            className="w-4 h-4 rounded border-gray-700 bg-gray-800 text-blue-600 focus:ring-blue-500 focus:ring-offset-gray-900"
          />
          <label htmlFor="rememberMe" className="text-lg font-bold text-gray-400 select-none cursor-pointer">
            Remember me
          </label>
        </div>

        <button
          type="submit"
          disabled={loading || !isValid}
          className={`w-full font-bold py-3 rounded-lg transition-all transform ${
            isValid && !loading ? 'bg-blue-600 hover:bg-blue-500 text-white hover:scale-[1.02]' : 'bg-gray-700 text-gray-500 cursor-not-allowed'
          }`}
        >
          {loading ? 'PROCESSING...' : 'CONTINUE'}
        </button>

        <div className="text-center mt-8 pt-4 border-t border-white/80">
          <Link href="/" className="inline-flex items-center text-lg font-bold text-white/80 hover:text-white transition-colors group">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4 mr-2 group-hover:-translate-x-1 transition-transform">
              <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5 3 12m0 0 7.5-7.5M3 12h18" />
            </svg>
            Back Home
          </Link>
        </div>
      </form>
    </>
  );
}