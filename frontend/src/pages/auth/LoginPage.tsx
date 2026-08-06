import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { authService } from '../../services/authService';
import { Lock, Mail, Sprout, ShieldCheck } from 'lucide-react';

export const LoginPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('password123');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();

  const handleLogin = async (loginEmail: string, loginPass: string) => {
    setError('');
    setIsLoading(true);

    try {
      const res = await authService.login({ email: loginEmail, password: loginPass });
      login(res.data.token, res.data.user);
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Login gagal. Periksa email dan password.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleLogin(email, password);
  };

  const demoAccounts = [
    { label: 'Owner Role', email: 'owner@antagloma.com', color: 'bg-slate-900 text-white border-slate-900 hover:bg-slate-800' },
    { label: 'Sales Role', email: 'sales@antagloma.com', color: 'bg-emerald-800 text-white border-emerald-800 hover:bg-emerald-900' },
    { label: 'Admin Role', email: 'admin@antagloma.com', color: 'bg-slate-800 text-white border-slate-800 hover:bg-slate-700' },
    { label: 'Packing Role', email: 'packing@antagloma.com', color: 'bg-slate-700 text-white border-slate-700 hover:bg-slate-600' },
  ];

  return (
    <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-2xl border-2 border-slate-200 p-8 shadow-md">
        <div className="text-center mb-8">
          <div className="w-14 h-14 bg-emerald-800 rounded-xl text-white font-bold text-xl flex items-center justify-center mx-auto mb-3 shadow-sm">
            <Sprout className="w-8 h-8 text-emerald-300" />
          </div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Antagloma Florist</h1>
          <p className="text-xs text-slate-600 mt-1 font-bold">Spesialis Tanaman Hias Adenium Bunga Tumpuk</p>
        </div>

        {error && (
          <div className="mb-4 p-3.5 rounded-xl bg-rose-100 border border-rose-300 text-rose-950 text-xs font-bold">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-800 mb-1">Email Akun</label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="nama@antagloma.com"
                className="w-full pl-10 pr-3 py-2.5 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-700 font-bold text-slate-900"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-800 mb-1">Password</label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-10 pr-3 py-2.5 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-700 font-bold text-slate-900"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3 bg-emerald-800 text-white rounded-xl font-bold text-sm hover:bg-emerald-900 transition-colors disabled:opacity-50 mt-2 shadow-md"
          >
            {isLoading ? 'Memproses...' : 'Masuk ke Sistem'}
          </button>
        </form>

        {/* Demo Quick Switcher */}
        <div className="mt-8 pt-6 border-t border-slate-200">
          <div className="flex items-center gap-1.5 text-xs text-slate-700 font-bold mb-3">
            <ShieldCheck className="w-4 h-4 text-emerald-800" />
            <span>Klik Akun Demo untuk Uji Coba Role:</span>
          </div>
          <div className="grid grid-cols-2 gap-2">
            {demoAccounts.map((acc) => (
              <button
                key={acc.email}
                type="button"
                onClick={() => {
                  setEmail(acc.email);
                  setPassword('password123');
                  handleLogin(acc.email, 'password123');
                }}
                className={`px-3.5 py-2.5 rounded-xl text-xs font-extrabold transition-all text-left flex flex-col justify-center shadow-xs border ${acc.color}`}
              >
                <span>{acc.label}</span>
                <span className="text-[10px] opacity-90 font-medium truncate">{acc.email}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
