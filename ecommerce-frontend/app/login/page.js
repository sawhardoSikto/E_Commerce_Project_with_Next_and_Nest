'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import Link from 'next/link';

export default function LoginPage() {
  const router = useRouter();
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await api.post('/auth/login', form);
      localStorage.setItem('token', res.data.token);
      localStorage.setItem('user', JSON.stringify(res.data.data));

      if (res.data.data.role === 'admin') {
        router.push('/admin');
      } else {
        router.push('/products');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-base-200">
      <div className="card w-96 bg-base-100 shadow-xl">
        <div className="card-body">
          <h2 className="card-title text-2xl font-bold justify-center mb-4">
            🛒 E-Commerce
          </h2>

          {error && (
            <div className="alert alert-error mb-4">
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="form-control mb-3">
              <label className="label">
                <span className="label-text">Email</span>
              </label>
              <input
                type="email"
                name="email"
                placeholder="email@example.com"
                className="input input-bordered w-full"
                value={form.email}
                onChange={handleChange}
                required
              />
            </div>

            <div className="form-control mb-2">
              <label className="label">
                <span className="label-text">Password</span>
              </label>
              <input
                type="password"
                name="password"
                placeholder="••••••"
                className="input input-bordered w-full"
                value={form.password}
                onChange={handleChange}
                required
              />
              <label className="label">
                <Link href="/forgot-password" className="label-text-alt link link-hover">
                  Forgot password?
                </Link>
              </label>
            </div>

            <button
              type="submit"
              className="btn btn-primary w-full mt-2"
              disabled={loading}
            >
              {loading ? <span className="loading loading-spinner"></span> : 'Login'}
            </button>
          </form>

          <div className="divider">OR</div>

          <p className="text-center text-sm">
            Don't have an account?{' '}
            <Link href="/register" className="link link-primary">
              Register
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}