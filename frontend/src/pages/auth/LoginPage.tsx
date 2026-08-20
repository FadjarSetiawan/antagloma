import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { authService } from '../../services/authService';
import {
  Lock,
  Mail,
  User as UserIcon,
  UserCheck,
  Briefcase,
  Eye,
  EyeOff,
  CheckCircle2,
  ArrowRight,
  AlertCircle,
  Sprout,
  ShieldCheck,
} from 'lucide-react';

export const LoginPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'login' | 'register'>('login');

  // Login Form States
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);

  // Register Form States (Allowed Roles: Sales & Admin)
  const [regName, setRegName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [showRegPassword, setShowRegPassword] = useState(false);
  const [regRole, setRegRole] = useState<'sales' | 'admin'>('sales');

  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');
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

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');

    if (!regName.trim() || !regEmail.trim() || !regPassword) {
      setError('Harap lengkapi semua kolom pendaftaran.');
      return;
    }

    if (regPassword.length < 6) {
      setError('Password minimal harus 6 karakter.');
      return;
    }

    setIsLoading(true);

    try {
      const res = await authService.register({
        name: regName,
        email: regEmail,
        password: regPassword,
        role: regRole,
      });

      login(res.data.token, res.data.user);
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Pendaftaran akun gagal. Silakan coba email lain.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div
      className="min-h-screen w-full bg-slate-50 flex flex-col items-center justify-center p-4 sm:p-6 font-sans text-slate-900 relative bg-cover bg-center bg-no-repeat"
      style={{ backgroundImage: "url('/login-bg.jpg')" }}
    >
      {/* Background Soft Ambient Overlay */}
      <div className="absolute inset-0 bg-slate-900/5 backdrop-blur-[1px] pointer-events-none" />

      {/* Main Glassmorphic Card Container */}
      <div className="w-full max-w-[420px] bg-white/95 backdrop-blur-xl rounded-[2.5rem] p-7 sm:p-9 shadow-2xl shadow-slate-900/10 border border-white/80 space-y-6 relative z-10 my-auto">
        
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
            <div className="h-px w-14 bg-slate-200" />
            <Sprout className="w-4 h-4 text-[#04593f]" />
            <div className="h-px w-14 bg-slate-200" />
          </div>

          <p className="text-xs text-slate-500 font-medium">
            Spesialis Tanaman Hias Adenium Bunga Tumpuk
          </p>
        </div>

        {/* Tab Switcher (Underline Style) */}
        <div className="grid grid-cols-2 border-b border-slate-200 text-center font-bold text-xs sm:text-sm">
          <button
            type="button"
            onClick={() => {
              setActiveTab('login');
              setError('');
              setSuccessMsg('');
            }}
            className={`pb-3 transition-all cursor-pointer ${
              activeTab === 'login'
                ? 'text-[#04593f] border-b-2 border-[#04593f] font-extrabold'
                : 'text-slate-400 font-bold hover:text-slate-700'
            }`}
          >
            Masuk
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveTab('register');
              setError('');
              setSuccessMsg('');
            }}
            className={`pb-3 transition-all cursor-pointer ${
              activeTab === 'register'
                ? 'text-[#04593f] border-b-2 border-[#04593f] font-extrabold'
                : 'text-slate-400 font-bold hover:text-slate-700'
            }`}
          >
            Daftar Akun Baru
          </button>
        </div>

        {/* Feedback Alert Messages */}
        {error && (
          <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-bold flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {successMsg && (
          <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-[#04593f] text-xs font-bold flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-[#04593f] shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* FORM 1: LOGIN FORM */}
        {activeTab === 'login' ? (
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
                  className="w-full pl-10 pr-4 py-3 bg-white border border-slate-200 rounded-2xl text-xs sm:text-sm font-medium text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#04593f] focus:border-[#04593f] shadow-2xs transition-all"
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
                  className="w-full pl-10 pr-11 py-3 bg-white border border-slate-200 rounded-2xl text-xs sm:text-sm font-medium text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#04593f] focus:border-[#04593f] shadow-2xs transition-all"
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
                onClick={() => alert('Untuk reset password akun, silakan hubungi Administrator sistem.')}
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
        ) : (
          /* FORM 2: REGISTER FORM (Sales & Admin Role) */
          <form onSubmit={handleRegisterSubmit} className="space-y-3.5">
            <div>
              <label className="block text-xs font-bold text-slate-800 mb-1.5">
                Nama Lengkap Staff
              </label>
              <div className="relative">
                <UserIcon className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                <input
                  type="text"
                  required
                  value={regName}
                  onChange={(e) => setRegName(e.target.value)}
                  placeholder="Budi Santoso"
                  className="w-full pl-10 pr-4 py-3 bg-white border border-slate-200 rounded-2xl text-xs sm:text-sm font-medium text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#04593f] focus:border-[#04593f] shadow-2xs transition-all"
                />
              </div>
            </div>

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
                  value={regEmail}
                  onChange={(e) => setRegEmail(e.target.value)}
                  placeholder="budi@antagloma.com"
                  className="w-full pl-10 pr-4 py-3 bg-white border border-slate-200 rounded-2xl text-xs sm:text-sm font-medium text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#04593f] focus:border-[#04593f] shadow-2xs transition-all"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-800 mb-1.5">
                Password (Min. 6 Karakter)
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                <input
                  type={showRegPassword ? 'text' : 'password'}
                  required
                  value={regPassword}
                  onChange={(e) => setRegPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-11 py-3 bg-white border border-slate-200 rounded-2xl text-xs sm:text-sm font-medium text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#04593f] focus:border-[#04593f] shadow-2xs transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowRegPassword(!showRegPassword)}
                  className="absolute right-3.5 top-3.5 text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
                  title={showRegPassword ? 'Sembunyikan password' : 'Lihat password'}
                >
                  {showRegPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-800 mb-1.5">
                Pilihan Wewenang Role Staff
              </label>
              <div className="grid grid-cols-2 gap-2.5">
                <button
                  type="button"
                  onClick={() => setRegRole('sales')}
                  className={`p-3 rounded-2xl border text-left flex flex-col space-y-1 transition-all cursor-pointer ${
                    regRole === 'sales'
                      ? 'bg-emerald-50/80 border-[#04593f] text-[#04593f] shadow-xs'
                      : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-center gap-1.5 font-bold">
                    <UserCheck className="w-4 h-4 text-[#04593f]" />
                    <span className="text-xs font-extrabold text-slate-900">Sales Staff</span>
                  </div>
                  <span className="text-[10px] text-slate-500 font-normal">Buat & kelola order</span>
                </button>

                <button
                  type="button"
                  onClick={() => setRegRole('admin')}
                  className={`p-3 rounded-2xl border text-left flex flex-col space-y-1 transition-all cursor-pointer ${
                    regRole === 'admin'
                      ? 'bg-emerald-50/80 border-[#04593f] text-[#04593f] shadow-xs'
                      : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-center gap-1.5 font-bold">
                    <Briefcase className="w-4 h-4 text-[#04593f]" />
                    <span className="text-xs font-extrabold text-slate-900">Admin Staff</span>
                  </div>
                  <span className="text-[10px] text-slate-500 font-normal">Verifikasi & resi</span>
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3.5 bg-[#04593f] hover:bg-[#034631] text-white rounded-2xl font-bold text-sm shadow-md shadow-emerald-950/20 transition-all active:scale-[0.99] cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2 mt-2"
            >
              {isLoading ? (
                <span>Mendaftarkan Akun...</span>
              ) : (
                <>
                  <span>Daftar Akun Sekarang</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
        )}

        {/* Security / Trust Card Badge */}
        <div className="pt-3 border-t border-slate-100 flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-emerald-50 text-[#04593f] flex items-center justify-center shrink-0">
            <ShieldCheck className="w-4 h-4" />
          </div>
          <p className="text-[11px] text-slate-500 font-medium leading-tight">
            Akses aman dan hanya untuk staff yang terdaftar.
          </p>
        </div>

      </div>

      {/* Outside Footer */}
      <div className="text-center text-[11px] text-slate-600 font-medium space-y-0.5 pt-4 relative z-10">
        <p>© 2026 Antagloma Florist</p>
        <p>Sistem Manajemen Pesanan</p>
      </div>

    </div>
  );
};
