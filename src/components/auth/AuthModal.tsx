import React, { useState } from 'react';
import { useAuth } from '../../auth/AuthContext';
import { Button } from '../ui/Button';

export const AuthModal: React.FC = () => {
  const {
    isAuthModalOpen,
    closeAuthModal,
    login,
    register,
    loginWithMagicLink,
    isSupabaseConfigured,
    isLoading,
  } = useAuth();

  const [mode, setMode] = useState<'signin' | 'signup' | 'magic'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  if (!isAuthModalOpen) {
    return null;
  }

  const handleFillDemo = () => {
    setEmail('demo@financedashboard.app');
    setPassword('demo123456');
    setName('Akun Demo');
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMessage(null);

    if (mode === 'signin') {
      const res = await login(email, password);
      if (res.success) {
        closeAuthModal();
      } else {
        setError(res.error || 'Gagal masuk akun');
      }
    } else if (mode === 'signup') {
      const res = await register(email, password, name);
      if (res.success) {
        if (res.message) {
          setSuccessMessage(res.message);
        } else {
          closeAuthModal();
        }
      } else {
        setError(res.error || 'Gagal mendaftarkan akun');
      }
    } else if (mode === 'magic') {
      const res = await loginWithMagicLink(email);
      if (res.success) {
        setSuccessMessage(res.message || 'Tautan masuk telah dikirim ke email Anda.');
      } else {
        setError(res.error || 'Gagal mengirim magic link');
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
      <div
        className="w-full max-w-md rounded-2xl bg-white dark:bg-slate-900 p-6 shadow-2xl border border-gray-100 dark:border-slate-800 animate-in fade-in zoom-in-95 duration-200 transition-colors"
        role="dialog"
        aria-modal="true"
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-gray-100 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-600 text-white font-bold shadow-md shadow-indigo-500/20">
              <span className="text-base tracking-tighter">FD</span>
            </div>
            <div>
              <h2 className="text-base font-bold text-gray-900 dark:text-white">Finance Dashboard</h2>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span
                  className={`inline-block h-2 w-2 rounded-full ${
                    isSupabaseConfigured ? 'bg-emerald-500 animate-pulse' : 'bg-amber-400'
                  }`}
                />
                <span className="text-[11px] font-medium text-gray-500 dark:text-slate-400">
                  {isSupabaseConfigured ? 'Live Supabase Terhubung' : 'Mode Akun Demo (Siap .env)'}
                </span>
              </div>
            </div>
          </div>
          <button
            type="button"
            onClick={closeAuthModal}
            className="rounded-lg p-1.5 text-gray-400 dark:text-slate-400 hover:bg-gray-100 dark:hover:bg-slate-800 hover:text-gray-700 dark:hover:text-gray-200 transition"
            aria-label="Tutup"
          >
            ✕
          </button>
        </div>

        {/* Tab switch */}
        <div className="mt-4 flex rounded-xl bg-gray-100/80 dark:bg-slate-800 p-1 text-xs font-semibold text-gray-600 dark:text-gray-300">
          <button
            type="button"
            onClick={() => { setMode('signin'); setError(null); setSuccessMessage(null); }}
            className={`flex-1 rounded-lg py-2 transition ${
              mode === 'signin' ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-xs' : 'hover:text-gray-900 dark:hover:text-white'
            }`}
          >
            Masuk
          </button>
          <button
            type="button"
            onClick={() => { setMode('signup'); setError(null); setSuccessMessage(null); }}
            className={`flex-1 rounded-lg py-2 transition ${
              mode === 'signup' ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-xs' : 'hover:text-gray-900 dark:hover:text-white'
            }`}
          >
            Daftar Akun
          </button>
          <button
            type="button"
            onClick={() => { setMode('magic'); setError(null); setSuccessMessage(null); }}
            className={`flex-1 rounded-lg py-2 transition ${
              mode === 'magic' ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-xs' : 'hover:text-gray-900 dark:hover:text-white'
            }`}
          >
            Magic Link
          </button>
        </div>

        {/* Feedback alerts */}
        {error && (
          <div className="mt-4 rounded-xl bg-rose-50 dark:bg-rose-950/40 p-3 text-xs text-rose-600 dark:text-rose-300 border border-rose-100 dark:border-rose-900">
            {error}
          </div>
        )}
        {successMessage && (
          <div className="mt-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 p-3 text-xs text-emerald-700 dark:text-emerald-300 border border-emerald-100 dark:border-emerald-900">
            {successMessage}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="mt-4 space-y-3.5">
          {mode === 'signup' && (
            <div>
              <label className="block text-xs font-semibold text-gray-700 dark:text-slate-300 mb-1">
                Nama Lengkap
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Nama Pengguna"
                className="w-full rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3.5 py-2 text-sm text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-slate-500 focus:border-indigo-500 focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20"
              />
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-gray-700 dark:text-slate-300 mb-1">
              Alamat Email
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="nama@email.com"
              className="w-full rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3.5 py-2 text-sm text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-slate-500 focus:border-indigo-500 focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20"
            />
          </div>

          {mode !== 'magic' && (
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-semibold text-gray-700 dark:text-slate-300">
                  Kata Sandi
                </label>
                {mode === 'signin' && (
                  <button
                    type="button"
                    onClick={() => setMode('magic')}
                    className="text-[11px] font-medium text-indigo-600 dark:text-indigo-400 hover:underline"
                  >
                    Lupa sandi?
                  </button>
                )}
              </div>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3.5 py-2 text-sm text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-slate-500 focus:border-indigo-500 focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20"
              />
            </div>
          )}

          <Button
            type="submit"
            disabled={isLoading}
            className="w-full rounded-xl bg-indigo-600 py-2.5 text-sm font-semibold text-white shadow-md shadow-indigo-500/25 hover:bg-indigo-700 transition"
          >
            {isLoading
              ? 'Memproses...'
              : mode === 'signin'
              ? 'Masuk ke Dashboard'
              : mode === 'signup'
              ? 'Daftar Akun Baru'
              : 'Kirim Magic Link'}
          </Button>

          {/* Quick Demo Credentials */}
          <div className="pt-2 border-t border-gray-100 dark:border-slate-800 flex items-center justify-between">
            <span className="text-[11px] text-gray-400 dark:text-slate-500">Sedang uji coba?</span>
            <button
              type="button"
              onClick={handleFillDemo}
              className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 hover:underline"
            >
              Gunakan Akun Demo
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
