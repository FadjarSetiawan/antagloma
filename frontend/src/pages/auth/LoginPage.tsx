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
} from 'lucide-react';

export const LoginPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'login' | 'register'>('login');

  // Login Form States
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [showLoginPassword, setShowLoginPassword] = useState(false);

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
    <div className="min-h-screen w-full bg-slate-100 flex items-center justify-center p-3 sm:p-6 font-sans text-slate-900">
      <div className="w-full max-w-md bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-xl space-y-5 my-auto">
        
        {/* Brand Header */}
        <div className="text-center space-y-1.5">
          <img
            src="/logo.png"
            alt="Antagloma Florist Logo"
            className="w-14 h-14 rounded-2xl object-cover mx-auto shadow-md border border-slate-200"
          />
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight pt-1">
            Antagloma Florist
          </h1>
          <p className="text-xs text-slate-500 font-semibold">
            Spesialis Tanaman Hias Adenium Bunga Tumpuk
          </p>
        </div>

        {/* Tab Switcher: Masuk vs Daftar Akun Baru */}
        <div className="grid grid-cols-2 bg-slate-100 rounded-2xl p-1 font-bold text-xs">
          <button
            type="button"
            onClick={() => {
              setActiveTab('login');
              setError('');
              setSuccessMsg('');
            }}
            className={`py-2.5 rounded-xl transition-all cursor-pointer font-extrabold ${
              activeTab === 'login'
                ? 'bg-[#04593f] text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Masuk (Login)
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveTab('register');
              setError('');
              setSuccessMsg('');
            }}
            className={`py-2.5 rounded-xl transition-all cursor-pointer font-extrabold ${
              activeTab === 'register'
                ? 'bg-[#04593f] text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
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

        {/* Form 1: LOGIN FORM */}
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
                  className="w-full pl-10 pr-4 py-3 border border-slate-300 rounded-2xl text-xs sm:text-sm font-medium text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#04593f] focus:border-[#04593f] bg-white transition-all"
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
                  className="w-full pl-10 pr-11 py-3 border border-slate-300 rounded-2xl text-xs sm:text-sm font-medium text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#04593f] focus:border-[#04593f] bg-white transition-all"
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

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3.5 bg-[#04593f] hover:bg-[#034631] text-white rounded-2xl font-extrabold text-xs sm:text-sm shadow-md transition-all active:scale-[0.99] cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2 mt-2"
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
          /* Form 2: REGISTER FORM (Sales & Admin Role) */
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
                  className="w-full pl-10 pr-4 py-3 border border-slate-300 rounded-2xl text-xs sm:text-sm font-medium text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#04593f] focus:border-[#04593f] bg-white transition-all"
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
                  className="w-full pl-10 pr-4 py-3 border border-slate-300 rounded-2xl text-xs sm:text-sm font-medium text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#04593f] focus:border-[#04593f] bg-white transition-all"
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
                  className="w-full pl-10 pr-11 py-3 border border-slate-300 rounded-2xl text-xs sm:text-sm font-medium text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#04593f] focus:border-[#04593f] bg-white transition-all"
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
              className="w-full py-3.5 bg-[#04593f] hover:bg-[#034631] text-white rounded-2xl font-extrabold text-xs sm:text-sm shadow-md transition-all active:scale-[0.99] cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2 mt-2"
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

        {/* Card Footer */}
        <div className="pt-2 text-center border-t border-slate-100">
          <p className="text-[11px] text-slate-400 font-medium">
            © 2026 Antagloma Florist. Sistem Manajemen Pesanan.
          </p>
        </div>

      </div>
    </div>
  );
};
