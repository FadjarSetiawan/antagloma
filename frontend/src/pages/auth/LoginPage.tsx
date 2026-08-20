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
  Printer,
  Barcode,
  TrendingUp,
  CheckCircle2,
  ArrowRight,
  ShieldCheck,
  Sparkles,
} from 'lucide-react';

export const LoginPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'login' | 'register'>('login');

  // Login Form States
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('password123');
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

  const fillQuickDemo = (email: string) => {
    setLoginEmail(email);
    setLoginPassword('password123');
    setError('');
  };

  return (
    <div className="min-h-screen w-full bg-gradient-to-b from-[#021f16] via-[#043324] to-[#01140e] flex items-center justify-center p-3 sm:p-6 lg:p-8 font-sans text-slate-100 relative overflow-x-hidden selection:bg-emerald-500 selection:text-white">
      {/* Ambient Mobile Botanical Glow Background */}
      <div className="absolute -top-20 -left-20 w-72 h-72 sm:w-96 sm:h-96 bg-emerald-500/25 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-20 -right-20 w-80 h-80 sm:w-[28rem] sm:h-[28rem] bg-emerald-700/25 rounded-full blur-3xl pointer-events-none" />

      {/* Main Container: Mobile Card First, Desktop Split Screen */}
      <div className="w-full max-w-md lg:max-w-4xl rounded-3xl sm:rounded-[2.5rem] bg-slate-900/90 border border-emerald-500/25 shadow-2xl shadow-emerald-950/80 backdrop-blur-xl overflow-hidden grid grid-cols-1 lg:grid-cols-12 relative z-10 my-auto">

        {/* DESKTOP-ONLY SHOWCASE COLUMN (Hidden on Mobile for Fast Direct Access) */}
        <div className="hidden lg:flex lg:col-span-5 bg-gradient-to-b from-[#04593f]/95 to-[#022c22]/95 p-8 lg:p-10 flex-col justify-between border-r border-emerald-500/20 relative">
          <div className="space-y-4">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-950/60 border border-emerald-400/30 text-emerald-300 text-[11px] font-extrabold">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>Sistem Operasional Aktif</span>
            </div>

            <div className="flex items-center gap-3 pt-2">
              <img
                src="/logo.png"
                alt="Antagloma Florist"
                className="w-12 h-12 rounded-xl object-cover shadow-md border border-white/20 bg-white p-0.5"
              />
              <div>
                <h1 className="text-xl font-black text-white leading-tight">Antagloma Florist</h1>
                <p className="text-xs text-emerald-200">Adenium Bunga Tumpuk</p>
              </div>
            </div>

            <p className="text-xs text-emerald-100/80 leading-relaxed pt-1">
              Solusi digital lengkap untuk manajemen order, packing multi-paket, scanner resi, dan komisi sales.
            </p>

            <div className="space-y-2.5 pt-4">
              <div className="p-3 rounded-2xl bg-emerald-950/40 border border-emerald-500/20 flex items-center gap-3">
                <div className="w-7 h-7 rounded-lg bg-emerald-500/20 text-emerald-300 flex items-center justify-center shrink-0">
                  <Printer className="w-3.5 h-3.5" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-bold text-white leading-none">Cetak Nota & Label</p>
                  <p className="text-[10px] text-emerald-300/80 mt-0.5">80mm Thermal & 4×6 XP-420B</p>
                </div>
              </div>

              <div className="p-3 rounded-2xl bg-emerald-950/40 border border-emerald-500/20 flex items-center gap-3">
                <div className="w-7 h-7 rounded-lg bg-emerald-500/20 text-emerald-300 flex items-center justify-center shrink-0">
                  <Barcode className="w-3.5 h-3.5" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-bold text-white leading-none">Smart Scanner Resi</p>
                  <p className="text-[10px] text-emerald-300/80 mt-0.5">OCR tracking & ongkir ekspedisi</p>
                </div>
              </div>

              <div className="p-3 rounded-2xl bg-emerald-950/40 border border-emerald-500/20 flex items-center gap-3">
                <div className="w-7 h-7 rounded-lg bg-emerald-500/20 text-emerald-300 flex items-center justify-center shrink-0">
                  <TrendingUp className="w-3.5 h-3.5" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-bold text-white leading-none">Komisi Sales 5%</p>
                  <p className="text-[10px] text-emerald-300/80 mt-0.5">Perhitungan otomatis & transparan</p>
                </div>
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-emerald-500/20 flex items-center justify-between text-[11px] text-emerald-300/80 font-medium">
            <span className="flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              Sistem Terenkripsi
            </span>
            <span>v2.4</span>
          </div>
        </div>

        {/* PRIMARY AUTHENTICATION FORM (100% Mobile Optimized) */}
        <div className="lg:col-span-7 p-5 sm:p-7 lg:p-8 flex flex-col justify-between space-y-5">

          {/* MOBILE BRAND HEADER (Compact & Beautiful on Smartphones) */}
          <div className="flex items-center gap-3 pb-1 lg:hidden">
            <img
              src="/logo.png"
              alt="Antagloma Florist Logo"
              className="w-11 h-11 rounded-xl object-cover shadow-md border border-emerald-400/30 bg-white p-0.5 shrink-0"
            />
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <h1 className="text-base font-black tracking-tight text-white truncate">
                  Antagloma Florist
                </h1>
                <span className="px-1.5 py-0.5 rounded-md bg-emerald-500/20 border border-emerald-400/30 text-[9px] font-extrabold text-emerald-300">
                  v2.4
                </span>
              </div>
              <p className="text-[11px] text-emerald-300/90 font-medium truncate">
                Adenium Bunga Tumpuk
              </p>
            </div>
          </div>

          {/* Segmented Tab Pill: Masuk vs Daftar (Big Thumb Friendly Touch Targets) */}
          <div className="grid grid-cols-2 p-1 rounded-2xl bg-slate-950/80 border border-slate-800">
            <button
              type="button"
              onClick={() => {
                setActiveTab('login');
                setError('');
                setSuccessMsg('');
              }}
              className={`py-2.5 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                activeTab === 'login'
                  ? 'bg-emerald-800 text-white shadow-md shadow-emerald-950/60'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <span>Masuk (Login)</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setActiveTab('register');
                setError('');
                setSuccessMsg('');
              }}
              className={`py-2.5 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                activeTab === 'register'
                  ? 'bg-emerald-800 text-white shadow-md shadow-emerald-950/60'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <span>Daftar Akun</span>
            </button>
          </div>

          {/* Feedback Alerts */}
          {error && (
            <div className="p-3 rounded-2xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs font-bold flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-rose-400 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {successMsg && (
            <div className="p-3 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs font-bold flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* FORM 1: LOGIN */}
          {activeTab === 'login' ? (
            <form onSubmit={handleLoginSubmit} className="space-y-3.5">
              <div className="space-y-1">
                <label className="block text-[11px] font-extrabold text-slate-300 uppercase tracking-wide">
                  Email Akun Staff
                </label>
                <div className="relative group">
                  <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 top-3.5 group-focus-within:text-emerald-400 transition-colors" />
                  <input
                    type="email"
                    inputMode="email"
                    autoComplete="email"
                    required
                    value={loginEmail}
                    onChange={(e) => setLoginEmail(e.target.value)}
                    placeholder="nama@antagloma.com"
                    className="w-full pl-10 pr-4 py-3 bg-slate-950/70 border border-slate-800 rounded-2xl text-xs sm:text-sm font-semibold text-white placeholder:text-slate-600 focus:outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-500/25 transition-all"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="block text-[11px] font-extrabold text-slate-300 uppercase tracking-wide">
                  Password
                </label>
                <div className="relative group">
                  <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-3.5 group-focus-within:text-emerald-400 transition-colors" />
                  <input
                    type={showLoginPassword ? 'text' : 'password'}
                    autoComplete="current-password"
                    required
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-10 pr-11 py-3 bg-slate-950/70 border border-slate-800 rounded-2xl text-xs sm:text-sm font-semibold text-white placeholder:text-slate-600 focus:outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-500/25 transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowLoginPassword(!showLoginPassword)}
                    className="absolute right-3 top-3 p-1 text-slate-500 hover:text-slate-300 transition-colors cursor-pointer"
                    title={showLoginPassword ? 'Sembunyikan password' : 'Lihat password'}
                  >
                    {showLoginPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3.5 bg-gradient-to-r from-emerald-800 to-emerald-700 hover:from-emerald-900 hover:to-emerald-800 active:scale-[0.98] text-white rounded-2xl font-black text-xs sm:text-sm tracking-wide shadow-lg shadow-emerald-950/60 transition-all cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2 mt-1"
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

              {/* Mobile Quick Autofill Chips */}
              <div className="pt-3 border-t border-slate-800/80">
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-2">
                  Akun Demo (Klik untuk Isi):
                </p>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
                  <button
                    type="button"
                    onClick={() => fillQuickDemo('admin@antagloma.com')}
                    className="px-2 py-1.5 rounded-xl bg-slate-950/60 hover:bg-slate-800 border border-slate-800 text-[10px] font-bold text-slate-300 transition-colors text-center cursor-pointer"
                  >
                    👑 Admin
                  </button>
                  <button
                    type="button"
                    onClick={() => fillQuickDemo('owner@antagloma.com')}
                    className="px-2 py-1.5 rounded-xl bg-slate-950/60 hover:bg-slate-800 border border-slate-800 text-[10px] font-bold text-slate-300 transition-colors text-center cursor-pointer"
                  >
                    📊 Owner
                  </button>
                  <button
                    type="button"
                    onClick={() => fillQuickDemo('sales@antagloma.com')}
                    className="px-2 py-1.5 rounded-xl bg-slate-950/60 hover:bg-slate-800 border border-slate-800 text-[10px] font-bold text-slate-300 transition-colors text-center cursor-pointer"
                  >
                    🌿 Sales
                  </button>
                  <button
                    type="button"
                    onClick={() => fillQuickDemo('packing@antagloma.com')}
                    className="px-2 py-1.5 rounded-xl bg-slate-950/60 hover:bg-slate-800 border border-slate-800 text-[10px] font-bold text-slate-300 transition-colors text-center cursor-pointer"
                  >
                    📦 Packing
                  </button>
                </div>
              </div>
            </form>
          ) : (
            /* FORM 2: REGISTER */
            <form onSubmit={handleRegisterSubmit} className="space-y-3">
              <div className="space-y-1">
                <label className="block text-[11px] font-extrabold text-slate-300 uppercase tracking-wide">
                  Nama Lengkap Staff
                </label>
                <div className="relative group">
                  <UserIcon className="w-4 h-4 text-slate-500 absolute left-3.5 top-3.5 group-focus-within:text-emerald-400 transition-colors" />
                  <input
                    type="text"
                    required
                    value={regName}
                    onChange={(e) => setRegName(e.target.value)}
                    placeholder="Budi Santoso"
                    className="w-full pl-10 pr-4 py-3 bg-slate-950/70 border border-slate-800 rounded-2xl text-xs sm:text-sm font-semibold text-white placeholder:text-slate-600 focus:outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-500/25 transition-all"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="block text-[11px] font-extrabold text-slate-300 uppercase tracking-wide">
                  Email Akun
                </label>
                <div className="relative group">
                  <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 top-3.5 group-focus-within:text-emerald-400 transition-colors" />
                  <input
                    type="email"
                    inputMode="email"
                    autoComplete="email"
                    required
                    value={regEmail}
                    onChange={(e) => setRegEmail(e.target.value)}
                    placeholder="budi@antagloma.com"
                    className="w-full pl-10 pr-4 py-3 bg-slate-950/70 border border-slate-800 rounded-2xl text-xs sm:text-sm font-semibold text-white placeholder:text-slate-600 focus:outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-500/25 transition-all"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="block text-[11px] font-extrabold text-slate-300 uppercase tracking-wide">
                  Password (Min. 6 Karakter)
                </label>
                <div className="relative group">
                  <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-3.5 group-focus-within:text-emerald-400 transition-colors" />
                  <input
                    type={showRegPassword ? 'text' : 'password'}
                    required
                    value={regPassword}
                    onChange={(e) => setRegPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-10 pr-11 py-3 bg-slate-950/70 border border-slate-800 rounded-2xl text-xs sm:text-sm font-semibold text-white placeholder:text-slate-600 focus:outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-500/25 transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowRegPassword(!showRegPassword)}
                    className="absolute right-3 top-3 p-1 text-slate-500 hover:text-slate-300 transition-colors cursor-pointer"
                    title={showRegPassword ? 'Sembunyikan password' : 'Lihat password'}
                  >
                    {showRegPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="space-y-1 pt-1">
                <label className="block text-[11px] font-extrabold text-slate-300 uppercase tracking-wide">
                  Pilih Posisi Role Staff
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setRegRole('sales')}
                    className={`p-2.5 sm:p-3 rounded-2xl border text-left flex flex-col justify-between transition-all cursor-pointer ${
                      regRole === 'sales'
                        ? 'bg-emerald-950/80 border-emerald-400 text-white shadow-md shadow-emerald-950/40'
                        : 'bg-slate-950/40 border-slate-800 text-slate-400 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <UserCheck className={`w-4 h-4 ${regRole === 'sales' ? 'text-emerald-400' : 'text-slate-500'}`} />
                      {regRole === 'sales' && <span className="w-2 h-2 rounded-full bg-emerald-400" />}
                    </div>
                    <div className="pt-1.5">
                      <p className="text-xs font-bold text-white">Sales Staff</p>
                      <p className="text-[10px] text-slate-400 leading-tight mt-0.5">Input order & komisi</p>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setRegRole('admin')}
                    className={`p-2.5 sm:p-3 rounded-2xl border text-left flex flex-col justify-between transition-all cursor-pointer ${
                      regRole === 'admin'
                        ? 'bg-emerald-950/80 border-emerald-400 text-white shadow-md shadow-emerald-950/40'
                        : 'bg-slate-950/40 border-slate-800 text-slate-400 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <Briefcase className={`w-4 h-4 ${regRole === 'admin' ? 'text-emerald-400' : 'text-slate-500'}`} />
                      {regRole === 'admin' && <span className="w-2 h-2 rounded-full bg-emerald-400" />}
                    </div>
                    <div className="pt-1.5">
                      <p className="text-xs font-bold text-white">Admin Staff</p>
                      <p className="text-[10px] text-slate-400 leading-tight mt-0.5">Verifikasi & resi</p>
                    </div>
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3.5 bg-gradient-to-r from-emerald-800 to-emerald-700 hover:from-emerald-900 hover:to-emerald-800 active:scale-[0.98] text-white rounded-2xl font-black text-xs sm:text-sm tracking-wide shadow-lg shadow-emerald-950/60 transition-all cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2 mt-1"
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

          {/* Footer */}
          <div className="pt-2 text-center">
            <p className="text-[10px] text-slate-500 font-medium">
              © 2026 Antagloma Florist. Hak Cipta Dilindungi.
            </p>
          </div>

        </div>

      </div>
    </div>
  );
};
