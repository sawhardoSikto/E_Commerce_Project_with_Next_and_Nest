'use client';

import { useState, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import api from '@/lib/api';

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // email query থেকে আনো
  const email = searchParams.get('email');

  const [otp, setOtp] = useState('');
  const [form, setForm] = useState({
    password: '',
    confirm: '',
  });

  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState('');
  const [showPass, setShowPass] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!email) {
      setError('Email not found.');
      return;
    }

    if (!otp) {
      setError('Please enter OTP.');
      return;
    }

    if (form.password !== form.confirm) {
      setError("Passwords don't match.");
      return;
    }

    if (form.password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      await api.post('/auth/reset-password', {
        email,
        otp,
        newPassword: form.password,
      });

      setDone(true);

      setTimeout(() => {
        router.push('/login');
      }, 2500);

    } catch (err) {
      setError(
        err.response?.data?.message ||
        'Failed to reset password.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="w-full max-w-sm">

        {/* Logo */}
        <div className="text-center mb-8">
          <Link
            href="/products"
            className="inline-flex items-center gap-2 mb-6"
          >
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-600 to-indigo-600 flex items-center justify-center shadow-sm">
              <svg
                className="w-5 h-5 text-white"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2.5}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M2.25 3h1.386c.51 0 .955.343 1.087.835l.383 1.437M7.5 14.25a3 3 0 00-3 3h15.75m-12.75-3h11.218c1.121-2.3 2.1-4.684 2.924-7.138a60.114 60.114 0 00-16.536-1.84M7.5 14.25L5.106 5.272M6 20.25a.75.75 0 11-1.5 0 .75.75 0 011.5 0zm12.75 0a.75.75 0 11-1.5 0 .75.75 0 011.5 0z"
                />
              </svg>
            </div>

            <span className="text-xl font-bold tracking-tight text-gray-900">
              Shop<span className="text-indigo-600">Nest</span>
            </span>
          </Link>

          {done ? (
            <>
              <div className="w-12 h-12 rounded-2xl bg-emerald-50 flex items-center justify-center mx-auto mb-4">
                <svg
                  className="w-6 h-6 text-emerald-600"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M4.5 12.75l6 6 9-13.5"
                  />
                </svg>
              </div>

              <h1 className="text-2xl font-extrabold text-gray-900">
                Password Reset Successful
              </h1>

              <p className="text-sm text-gray-500 mt-2">
                Redirecting to login...
              </p>
            </>
          ) : (
            <>
              <div className="w-12 h-12 rounded-2xl bg-indigo-50 flex items-center justify-center mx-auto mb-4">
                <svg
                  className="w-6 h-6 text-indigo-600"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={1.8}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M15.75 5.25a3 3 0 013 3m3 0a6 6 0 01-7.029 5.912c-.563-.097-1.159.026-1.563.43L10.5 17.25H8.25v2.25H6v2.25H2.25v-2.818c0-.597.237-1.17.659-1.591l6.499-6.499c.404-.404.527-1 .43-1.563A6 6 0 1121.75 8.25z"
                  />
                </svg>
              </div>

              <h1 className="text-2xl font-extrabold text-gray-900">
                Reset Password
              </h1>

              <p className="text-sm text-gray-500 mt-2">
                Enter the OTP sent to your email and choose a new password.
              </p>
            </>
          )}
        </div>

        {done ? (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 text-center">
            <Link
              href="/login"
              className="block w-full py-2.5 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-sm shadow-indigo-200 transition-colors text-center"
            >
              Go to Login
            </Link>
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">

            {/* Error */}
            {error && (
              <div className="flex items-center gap-2 px-3 py-2.5 bg-red-50 border border-red-100 rounded-xl mb-4 text-sm text-red-600">
                <svg
                  className="w-4 h-4 shrink-0"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z"
                  />
                </svg>

                {error}
              </div>
            )}

            <form
              onSubmit={handleSubmit}
              className="space-y-4"
            >

              {/* Email */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                  Email
                </label>

                <input
                  type="email"
                  value={email || ''}
                  disabled
                  className="w-full px-3 py-2.5 text-sm bg-gray-100 border border-gray-200 rounded-xl text-gray-500"
                />
              </div>

              {/* OTP */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                  OTP
                </label>

                <input
                  type="text"
                  value={otp}
                  onChange={(e) => {
                    setOtp(e.target.value);
                    setError('');
                  }}
                  placeholder="Enter 6-digit OTP"
                  required
                  className="w-full px-3 py-2.5 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 focus:bg-white transition-all placeholder:text-gray-400"
                />
              </div>

              {/* New Password */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                  New Password
                </label>

                <div className="relative">
                  <input
                    type={showPass ? 'text' : 'password'}
                    value={form.password}
                    onChange={(e) => {
                      setForm((f) => ({
                        ...f,
                        password: e.target.value,
                      }));
                      setError('');
                    }}
                    placeholder="Minimum 6 characters"
                    required
                    minLength={6}
                    className="w-full px-3 py-2.5 pr-10 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 focus:bg-white transition-all placeholder:text-gray-400"
                  />

                  <button
                    type="button"
                    onClick={() => setShowPass((v) => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    👁
                  </button>
                </div>
              </div>

              {/* Confirm Password */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                  Confirm Password
                </label>

                <input
                  type={showPass ? 'text' : 'password'}
                  value={form.confirm}
                  onChange={(e) => {
                    setForm((f) => ({
                      ...f,
                      confirm: e.target.value,
                    }));
                    setError('');
                  }}
                  placeholder="Confirm password"
                  required
                  className={`w-full px-3 py-2.5 text-sm bg-gray-50 border rounded-xl focus:outline-none focus:ring-2 focus:bg-white transition-all placeholder:text-gray-400 ${
                    form.confirm &&
                    form.password !== form.confirm
                      ? 'border-red-300 focus:border-red-400 focus:ring-red-100'
                      : 'border-gray-200 focus:border-indigo-400 focus:ring-indigo-100'
                  }`}
                />

                {form.confirm &&
                  form.password !== form.confirm && (
                    <p className="text-xs text-red-500 mt-1">
                      Passwords don&apos;t match
                    </p>
                  )}
              </div>

              {/* Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 py-2.5 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 rounded-xl shadow-sm shadow-indigo-200 transition-all active:scale-[0.98]"
              >
                {loading && (
                  <span className="loading loading-spinner loading-xs" />
                )}

                {loading
                  ? 'Resetting...'
                  : 'Reset Password'}
              </button>
            </form>
          </div>
        )}

        {/* Footer */}
        <p className="text-center text-sm text-gray-500 mt-5">
          <Link
            href="/login"
            className="text-indigo-600 font-semibold hover:text-indigo-700"
          >
            ← Back to Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <span className="loading loading-spinner loading-md text-indigo-600" />
        </div>
      }
    >
      <ResetPasswordForm />
    </Suspense>
  );
}