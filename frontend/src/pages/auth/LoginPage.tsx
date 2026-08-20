import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { authService } from '../../services/authService';
import {
  Lock,
  Mail,
  Eye,
  EyeOff,
  ArrowRight,
  AlertCircle,
  Sprout,
  ShieldCheck,
} from 'lucide-react';

export const LoginPage: React.FC = () => {
  // Login Form States
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);

  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const res = await authService.login({ email: loginEmail, password: loginPassword });
      login(res.data.token, res.data.user);
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Login gagal. Periksa email dan password Anda.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full bg-slate-100 flex flex-col items-center justify-center p-4 sm:p-6 font-sans text-slate-900 relative bg-cover bg-center bg-no-repeat bg-[url('/bg-mobile.png')] md:bg-[url('/bg-desktop.png')]">
      {/* Background Soft Ambient Overlay */}
      <div className="absolute inset-0 bg-slate-900/5 backdrop-blur-[1px] pointer-events-none" />

      {/* Main Glassmorphic Semi-Transparent Card Container */}
      <div className="w-full max-w-[420px] bg-white/80 backdrop-blur-md rounded-[2.5rem] p-7 sm:p-9 shadow-2xl shadow-emerald-950/15 border border-white/60 space-y-6 relative z-10 my-auto">
        
        {/* Brand Header */}
        <div className="text-center space-y-2">
          {/* Logo Badge */}
          <div className="w-14 h-14 rounded-2xl bg-[#04593f] flex items-center justify-center mx-auto shadow-md p-2.5">
            <Sprout className="w-8 h-8 text-emerald-100" />
          </div>

          <h1 className="text-2xl sm:text-3xl font-serif font-bold text-[#04593f] tracking-tight">
            Antagloma Florist
          </h1>

          {/* Botanical Divider */}
          <div className="flex items-center justify-center gap-3 py-0.5">
            <div className="h-px w-14 bg-slate-300/80" />
            <Sprout className="w-4 h-4 text-[#04593f]" />
            <div className="h-px w-14 bg-slate-300/80" />
          </div>

          <p className="text-xs text-slate-600 font-medium">
            Spesialis Tanaman Hias Adenium Bunga Tumpuk
          </p>
        </div>

        {/* Feedback Alert Messages */}
        {error && (
          <div className="p-3.5 rounded-2xl bg-rose-50/90 border border-rose-200 text-rose-800 text-xs font-bold flex items-center gap-2 backdrop-blur-xs">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* LOGIN FORM */}
        <form onSubmit={handleLoginSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-800 mb-1.5">
              Email Akun Staff
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
              <input
                type="email"
                inputMode="email"
                autoComplete="email"
                required
                value={loginEmail}
                onChange={(e) => setLoginEmail(e.target.value)}
                placeholder="nama@antagloma.com"
                className="w-full pl-10 pr-4 py-3 bg-white/90 focus:bg-white border border-slate-200/90 rounded-2xl text-xs sm:text-sm font-medium text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#04593f] focus:border-[#04593f] shadow-2xs transition-all"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-800 mb-1.5">
              Password
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
              <input
                type={showLoginPassword ? 'text' : 'password'}
                autoComplete="current-password"
                required
                value={loginPassword}
                onChange={(e) => setLoginPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-10 pr-11 py-3 bg-white/90 focus:bg-white border border-slate-200/90 rounded-2xl text-xs sm:text-sm font-medium text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#04593f] focus:border-[#04593f] shadow-2xs transition-all"
              />
              <button
                type="button"
                onClick={() => setShowLoginPassword(!showLoginPassword)}
                className="absolute right-3.5 top-3.5 text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
                title={showLoginPassword ? 'Sembunyikan password' : 'Lihat password'}
              >
                {showLoginPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Remember Me & Forgot Password Row */}
          <div className="flex items-center justify-between text-xs pt-0.5">
            <label className="flex items-center gap-2 text-slate-600 font-medium cursor-pointer">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="w-4 h-4 rounded-md border-slate-300 text-[#04593f] focus:ring-[#04593f] cursor-pointer"
              />
              <span>Ingat saya</span>
            </label>

            <button
              type="button"
              onClick={() => alert('Untuk reset password akun, silakan hubungi Administrator atau Owner sistem.')}
              className="text-xs text-[#04593f] font-bold hover:underline cursor-pointer bg-transparent border-0 p-0"
            >
              Lupa password?
            </button>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3.5 bg-[#04593f] hover:bg-[#034631] text-white rounded-2xl font-bold text-sm shadow-md shadow-emerald-950/20 transition-all active:scale-[0.99] cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2 mt-2"
          >
            {isLoading ? (
              <span>Memproses Masuk...</span>
            ) : (
              <>
                <span>Masuk ke Sistem</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        {/* Security / Trust Card Badge */}
        <div className="pt-3 border-t border-slate-200/60 flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-emerald-50/90 text-[#04593f] flex items-center justify-center shrink-0">
            <ShieldCheck className="w-4 h-4" />
          </div>
          <p className="text-[11px] text-slate-600 font-medium leading-tight">
            Akses aman dan hanya untuk staff yang terdaftar oleh Owner.
          </p>
        </div>

      </div>

      {/* Outside Footer */}
      <div className="text-center text-[11px] text-slate-700 font-medium space-y-0.5 pt-4 relative z-10 drop-shadow-2xs">
        <p>© 2026 Antagloma Florist</p>
        <p>Sistem Manajemen Pesanan</p>
      </div>

    </div>
  );
};
