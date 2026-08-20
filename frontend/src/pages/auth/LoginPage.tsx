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
  Sparkles,
  Printer,
  Barcode,
  TrendingUp,
  Sprout,
  CheckCircle2,
  ArrowRight,
  ShieldCheck,
  Package,
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
    <div className="min-h-screen w-full bg-gradient-to-br from-slate-900 via-[#032d20] to-[#011a13] flex items-center justify-center p-3 sm:p-6 lg:p-10 font-sans text-slate-100 relative overflow-hidden selection:bg-emerald-500 selection:text-white">
      {/* Ambient Botanical Glow Background Orbs */}
      <div className="absolute -top-32 -left-32 w-96 h-96 bg-emerald-500/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-32 -right-32 w-[32rem] h-[32rem] bg-emerald-700/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[40rem] h-[40rem] bg-emerald-950/40 rounded-full blur-[140px] pointer-events-none" />

      {/* Main Glassmorphic Container */}
      <div className="w-full max-w-5xl rounded-[2.5rem] bg-slate-900/80 border border-emerald-500/20 shadow-2xl shadow-emerald-950/60 backdrop-blur-xl overflow-hidden grid grid-cols-1 lg:grid-cols-12 relative z-10">

        {/* LEFT COLUMN: HERO SHOWCASE (Desktop & Tablet Large) */}
        <div className="lg:col-span-5 bg-gradient-to-b from-[#04593f]/90 to-[#022c22]/95 p-6 sm:p-8 lg:p-10 flex flex-col justify-between border-b lg:border-b-0 lg:border-r border-emerald-500/20 relative overflow-hidden">
          {/* Subtle Background Pattern */}
          <div className="absolute inset-0 opacity-10 pointer-events-none bg-[radial-gradient(#a7f3d0_1px,transparent_1px)] [background-size:16px_16px]" />

          {/* Top Brand Identity */}
          <div className="space-y-4 relative z-10">
            <div className="inline-flex items-center gap-2.5 px-3 py-1.5 rounded-full bg-emerald-950/60 border border-emerald-400/30 text-emerald-300 text-[11px] font-extrabold tracking-wide shadow-inner">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
              <span>Sistem Manajemen Penjualan & Packing</span>
            </div>

            <div className="flex items-center gap-3.5 pt-2">
              <div className="w-14 h-14 rounded-2xl bg-white p-1 shadow-lg shadow-emerald-950/40 border border-emerald-300/40 flex items-center justify-center shrink-0">
                <img
                  src="/logo.png"
                  alt="Antagloma Florist Logo"
                  className="w-full h-full object-cover rounded-xl"
                />
              </div>
              <div>
                <h1 className="text-xl sm:text-2xl font-black tracking-tight text-white leading-tight">
                  Antagloma Florist
                </h1>
                <p className="text-xs text-emerald-200/90 font-medium">
                  Spesialis Adenium Bunga Tumpuk
                </p>
              </div>
            </div>

            <p className="text-xs text-emerald-100/80 leading-relaxed font-normal pt-1">
              Platform terintegrasi untuk pengelolaan pesanan, pengaturan paket pengiriman, cetak nota & label thermal, hingga pelaporan komisi otomatis.
            </p>
          </div>

          {/* Middle Feature Cards */}
          <div className="space-y-2.5 py-6 relative z-10 hidden sm:block">
            <div className="p-3 rounded-2xl bg-emerald-950/40 border border-emerald-500/20 flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-300 flex items-center justify-center shrink-0">
                <Printer className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-bold text-white leading-tight">Cetak Thermal Isolated</p>
                <p className="text-[10px] text-emerald-300/80 truncate">Nota 80mm & Label XP-420B 4×6 High-DPI</p>
              </div>
            </div>

            <div className="p-3 rounded-2xl bg-emerald-950/40 border border-emerald-500/20 flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-300 flex items-center justify-center shrink-0">
                <Barcode className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-bold text-white leading-tight">Smart Scanner Resi</p>
                <p className="text-[10px] text-emerald-300/80 truncate">Membaca barcode resi & ongkir otomatis</p>
              </div>
            </div>

            <div className="p-3 rounded-2xl bg-emerald-950/40 border border-emerald-500/20 flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-300 flex items-center justify-center shrink-0">
                <TrendingUp className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-bold text-white leading-tight">Perhitungan Komisi Real-Time</p>
                <p className="text-[10px] text-emerald-300/80 truncate">Akurat 5% dari omzet harga tanaman</p>
              </div>
            </div>
          </div>

          {/* Bottom Security / Status Footer */}
          <div className="pt-2 border-t border-emerald-500/20 flex items-center justify-between text-[11px] text-emerald-300/90 relative z-10 font-semibold">
            <span className="flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              Akses Terenkripsi & Aman
            </span>
            <span>v2.4.0</span>
          </div>
        </div>

        {/* RIGHT COLUMN: AUTHENTICATION FORM CARD */}
        <div className="lg:col-span-7 bg-slate-900/90 p-6 sm:p-8 lg:p-10 flex flex-col justify-between">
          <div className="space-y-6">
            {/* Header Tabs: Masuk vs Daftar */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
              <div>
                <h2 className="text-lg sm:text-xl font-extrabold text-white">
                  {activeTab === 'login' ? 'Selamat Datang Kembali' : 'Pendaftaran Akun Baru'}
                </h2>
                <p className="text-xs text-slate-400 font-medium mt-0.5">
                  {activeTab === 'login'
                    ? 'Masukkan email dan password akun Anda untuk masuk'
                    : 'Lengkapi identitas untuk mendaftar akun Sales atau Admin'}
                </p>
              </div>

              {/* Segmented Tab Pill */}
              <div className="inline-flex p-1 rounded-2xl bg-slate-950/80 border border-slate-800 shrink-0 self-start sm:self-auto">
                <button
                  type="button"
                  onClick={() => {
                    setActiveTab('login');
                    setError('');
                    setSuccessMsg('');
                  }}
                  className={`px-4 py-2 rounded-xl text-xs font-extrabold transition-all cursor-pointer ${
                    activeTab === 'login'
                      ? 'bg-[#04593f] text-white shadow-md shadow-emerald-950/40'
                      : 'text-slate-400 hover:text-slate-200'
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
                  className={`px-4 py-2 rounded-xl text-xs font-extrabold transition-all cursor-pointer ${
                    activeTab === 'register'
                      ? 'bg-[#04593f] text-white shadow-md shadow-emerald-950/40'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Daftar
                </button>
              </div>
            </div>

            {/* Feedback Alerts */}
            {error && (
              <div className="p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs font-bold flex items-center gap-2 animate-shake">
                <span className="w-1.5 h-1.5 rounded-full bg-rose-400 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {successMsg && (
              <div className="p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs font-bold flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>{successMsg}</span>
              </div>
            )}

            {/* FORM 1: LOGIN */}
            {activeTab === 'login' ? (
              <form onSubmit={handleLoginSubmit} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-300">
                    Email Akun <span className="text-emerald-400">*</span>
                  </label>
                  <div className="relative group">
                    <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 top-3.5 group-focus-within:text-emerald-400 transition-colors" />
                    <input
                      type="email"
                      required
                      value={loginEmail}
                      onChange={(e) => setLoginEmail(e.target.value)}
                      placeholder="nama@antagloma.com"
                      className="w-full pl-10 pr-4 py-3 bg-slate-950/60 border border-slate-800 rounded-2xl text-xs font-semibold text-white placeholder:text-slate-600 focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-all"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="block text-xs font-bold text-slate-300">
                      Password <span className="text-emerald-400">*</span>
                    </label>
                  </div>
                  <div className="relative group">
                    <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-3.5 group-focus-within:text-emerald-400 transition-colors" />
                    <input
                      type={showLoginPassword ? 'text' : 'password'}
                      required
                      value={loginPassword}
                      onChange={(e) => setLoginPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full pl-10 pr-11 py-3 bg-slate-950/60 border border-slate-800 rounded-2xl text-xs font-semibold text-white placeholder:text-slate-600 focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-all"
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
                  className="w-full py-3.5 bg-gradient-to-r from-[#04593f] to-[#057a55] hover:from-[#034d36] hover:to-[#046c4b] text-white rounded-2xl font-extrabold text-xs tracking-wide shadow-lg shadow-emerald-950/50 hover:shadow-emerald-900/50 transition-all active:scale-[0.99] cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2 mt-2"
                >
                  {isLoading ? (
                    <span>Memproses Masuk...</span>
                  ) : (
                    <>
                      <span>Masuk ke Dashboard</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>

                {/* Quick Autofill Helper for Testing */}
                <div className="pt-3 border-t border-slate-800/80">
                  <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block mb-2">
                    Akun Demo Cepat (Klik untuk Mengisi):
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    <button
                      type="button"
                      onClick={() => fillQuickDemo('admin@antagloma.com')}
                      className="px-2.5 py-1 rounded-xl bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700 text-[10px] font-bold text-slate-300 transition-colors cursor-pointer"
                    >
                      👑 Admin Demo
                    </button>
                    <button
                      type="button"
                      onClick={() => fillQuickDemo('owner@antagloma.com')}
                      className="px-2.5 py-1 rounded-xl bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700 text-[10px] font-bold text-slate-300 transition-colors cursor-pointer"
                    >
                      📊 Owner Demo
                    </button>
                    <button
                      type="button"
                      onClick={() => fillQuickDemo('sales@antagloma.com')}
                      className="px-2.5 py-1 rounded-xl bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700 text-[10px] font-bold text-slate-300 transition-colors cursor-pointer"
                    >
                      🌿 Sales Demo
                    </button>
                    <button
                      type="button"
                      onClick={() => fillQuickDemo('packing@antagloma.com')}
                      className="px-2.5 py-1 rounded-xl bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700 text-[10px] font-bold text-slate-300 transition-colors cursor-pointer"
                    >
                      📦 Packing Demo
                    </button>
                  </div>
                </div>
              </form>
            ) : (
              /* FORM 2: REGISTER */
              <form onSubmit={handleRegisterSubmit} className="space-y-3.5">
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-300">
                    Nama Lengkap <span className="text-emerald-400">*</span>
                  </label>
                  <div className="relative group">
                    <UserIcon className="w-4 h-4 text-slate-500 absolute left-3.5 top-3.5 group-focus-within:text-emerald-400 transition-colors" />
                    <input
                      type="text"
                      required
                      value={regName}
                      onChange={(e) => setRegName(e.target.value)}
                      placeholder="Budi Santoso"
                      className="w-full pl-10 pr-4 py-3 bg-slate-950/60 border border-slate-800 rounded-2xl text-xs font-semibold text-white placeholder:text-slate-600 focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-all"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-300">
                    Email Akun <span className="text-emerald-400">*</span>
                  </label>
                  <div className="relative group">
                    <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 top-3.5 group-focus-within:text-emerald-400 transition-colors" />
                    <input
                      type="email"
                      required
                      value={regEmail}
                      onChange={(e) => setRegEmail(e.target.value)}
                      placeholder="budi@antagloma.com"
                      className="w-full pl-10 pr-4 py-3 bg-slate-950/60 border border-slate-800 rounded-2xl text-xs font-semibold text-white placeholder:text-slate-600 focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-all"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-300">
                    Password Baru (Min. 6 Karakter) <span className="text-emerald-400">*</span>
                  </label>
                  <div className="relative group">
                    <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-3.5 group-focus-within:text-emerald-400 transition-colors" />
                    <input
                      type={showRegPassword ? 'text' : 'password'}
                      required
                      value={regPassword}
                      onChange={(e) => setRegPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full pl-10 pr-11 py-3 bg-slate-950/60 border border-slate-800 rounded-2xl text-xs font-semibold text-white placeholder:text-slate-600 focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-all"
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

                <div className="space-y-1.5 pt-1">
                  <label className="block text-xs font-bold text-slate-300">
                    Pilih Posisi / Role Staff <span className="text-emerald-400">*</span>
                  </label>
                  <div className="grid grid-cols-2 gap-2.5">
                    <button
                      type="button"
                      onClick={() => setRegRole('sales')}
                      className={`p-3 rounded-2xl border text-left flex flex-col justify-between transition-all cursor-pointer ${
                        regRole === 'sales'
                          ? 'bg-emerald-950/60 border-emerald-400 text-white shadow-md shadow-emerald-950/30'
                          : 'bg-slate-950/40 border-slate-800 text-slate-400 hover:border-slate-700'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <UserCheck className={`w-4 h-4 ${regRole === 'sales' ? 'text-emerald-400' : 'text-slate-500'}`} />
                        {regRole === 'sales' && <span className="w-2 h-2 rounded-full bg-emerald-400" />}
                      </div>
                      <div className="pt-2">
                        <p className="text-xs font-bold text-white">Sales Staff</p>
                        <p className="text-[10px] text-slate-400 leading-tight mt-0.5">Input order & hitung komisi</p>
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={() => setRegRole('admin')}
                      className={`p-3 rounded-2xl border text-left flex flex-col justify-between transition-all cursor-pointer ${
                        regRole === 'admin'
                          ? 'bg-emerald-950/60 border-emerald-400 text-white shadow-md shadow-emerald-950/30'
                          : 'bg-slate-950/40 border-slate-800 text-slate-400 hover:border-slate-700'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <Briefcase className={`w-4 h-4 ${regRole === 'admin' ? 'text-emerald-400' : 'text-slate-500'}`} />
                        {regRole === 'admin' && <span className="w-2 h-2 rounded-full bg-emerald-400" />}
                      </div>
                      <div className="pt-2">
                        <p className="text-xs font-bold text-white">Admin Staff</p>
                        <p className="text-[10px] text-slate-400 leading-tight mt-0.5">Verifikasi, atur paket & resi</p>
                      </div>
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-3.5 bg-gradient-to-r from-[#04593f] to-[#057a55] hover:from-[#034d36] hover:to-[#046c4b] text-white rounded-2xl font-extrabold text-xs tracking-wide shadow-lg shadow-emerald-950/50 hover:shadow-emerald-900/50 transition-all active:scale-[0.99] cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2 mt-2"
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
          </div>

          {/* Card Footer */}
          <div className="pt-6 mt-4 border-t border-slate-800/80 text-center">
            <p className="text-[11px] text-slate-500 font-medium">
              © 2026 Antagloma Florist. Sistem Manajemen Pesanan & Logistik.
            </p>
          </div>
        </div>

      </div>
    </div>
  );
};
