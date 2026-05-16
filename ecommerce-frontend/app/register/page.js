'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';

export default function RegisterPage() {

  const router = useRouter();

  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    confirm: '',
  });

  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPass, setShowPass] = useState(false);

  const handleChange = (e) => {
    setForm((f) => ({
      ...f,
      [e.target.name]: e.target.value,
    }));

    setError('');
  };

  const handleSubmit = async (e) => {

    e.preventDefault();

    if (form.password !== form.confirm) {
      setError('Passwords do not match.');
      return;
    }

    setLoading(true);
    setError('');

    try {

      const res = await api.post('/auth/register', {
        name: form.name,
        email: form.email,
        phone: form.phone,
        password: form.password,
      });

      const { token, user } = res.data;

      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));

      router.push('/products');

    } catch (err) {

      setError(
        err.response?.data?.message ||
        'Registration failed. Try again.',
      );

    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">

      <div className="w-full max-w-xs">

        {/* Logo */}
        <div className="text-center mb-5">

          <Link
            href="/products"
            className="inline-flex items-center gap-2 mb-4"
          >

            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-violet-600 to-indigo-600 flex items-center justify-center">

              <svg
                className="w-4 h-4 text-white"
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

            <span className="text-[17px] font-bold tracking-tight text-gray-900">
              আমার
              <span className="text-indigo-600">
                -শপ
              </span>
            </span>

          </Link>

          <h1 className="text-lg font-extrabold text-gray-900">
            Create account
          </h1>

          <p className="text-xs text-gray-400 mt-0.5">
            Start shopping in seconds
          </p>

        </div>

        {/* Card */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">

          {error && (

            <div className="flex items-center gap-2 px-3 py-2 bg-red-50 border border-red-100 rounded-lg mb-3 text-xs text-red-600">

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
            className="space-y-3"
          >

            {/* Name */}
            <div>

              <label className="block text-xs font-medium text-gray-600 mb-1">
                Full Name
              </label>

              <input
                type="text"
                name="name"
                value={form.name}
                onChange={handleChange}
                placeholder="John Doe"
                required
                className="w-full px-3 py-2 text-xs bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 focus:bg-white transition-all placeholder:text-gray-400"
              />

            </div>

            {/* Email */}
            <div>

              <label className="block text-xs font-medium text-gray-600 mb-1">
                Email
              </label>

              <input
                type="email"
                name="email"
                value={form.email}
                onChange={handleChange}
                placeholder="you@example.com"
                required
                className="w-full px-3 py-2 text-xs bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 focus:bg-white transition-all placeholder:text-gray-400"
              />

            </div>

            {/* Phone */}
            <div>

              <label className="block text-xs font-medium text-gray-600 mb-1">
                Phone Number
              </label>

              <input
                type="text"
                name="phone"
                value={form.phone}
                onChange={handleChange}
                placeholder="01XXXXXXXXX"
                required
                className="w-full px-3 py-2 text-xs bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 focus:bg-white transition-all placeholder:text-gray-400"
              />

            </div>

            {/* Password */}
            <div>

              <label className="block text-xs font-medium text-gray-600 mb-1">
                Password
              </label>

              <div className="relative">

                <input
                  type={showPass ? 'text' : 'password'}
                  name="password"
                  value={form.password}
                  onChange={handleChange}
                  placeholder="Min. 6 characters"
                  required
                  minLength={6}
                  className="w-full px-3 py-2 pr-9 text-xs bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 focus:bg-white transition-all placeholder:text-gray-400"
                />

                <button
                  type="button"
                  onClick={() => setShowPass((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >

                  {showPass ? (

                    <svg
                      className="w-4 h-4"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={2}
                    >

                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88"
                      />

                    </svg>

                  ) : (

                    <svg
                      className="w-4 h-4"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={2}
                    >

                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z"
                      />

                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                      />

                    </svg>

                  )}

                </button>

              </div>

            </div>

            {/* Confirm Password */}
            <div>

              <label className="block text-xs font-medium text-gray-600 mb-1">
                Confirm Password
              </label>

              <input
                type={showPass ? 'text' : 'password'}
                name="confirm"
                value={form.confirm}
                onChange={handleChange}
                placeholder="••••••••"
                required
                className={`w-full px-3 py-2 text-xs bg-gray-50 border rounded-lg focus:outline-none focus:ring-2 focus:bg-white transition-all placeholder:text-gray-400 ${
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

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 rounded-lg shadow-sm shadow-indigo-200 transition-all active:scale-[0.98]"
            >

              {loading ? (
                <span className="loading loading-spinner loading-xs" />
              ) : null}

              {loading
                ? 'Creating account...'
                : 'Create account'}

            </button>

          </form>

        </div>

        <p className="text-center text-xs text-gray-400 mt-4">

          Already have an account?{' '}

          <Link
            href="/login"
            className="text-indigo-600 font-semibold hover:text-indigo-700"
          >
            Sign in
          </Link>

        </p>

      </div>

    </div>
  );
}