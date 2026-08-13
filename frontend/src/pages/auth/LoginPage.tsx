import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { authService } from '../../services/authService';
import { Lock, Mail, Sprout, ShieldCheck, User as UserIcon, UserCheck, Briefcase } from 'lucide-react';

export const LoginPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'login' | 'register'>('login');

  // Login Form States
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('password123');

  // Register Form States (Allowed Roles: Sales & Admin)
  const [regName, setRegName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
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

      // Automatically log user in upon successful registration
      login(res.data.token, res.data.user);
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Pendaftaran akun gagal. Silakan coba email lain.');
    } finally {
      setIsLoading(false);
    }
  };

  const demoAccounts = [
    { label: 'Owner Role', email: 'owner@antagloma.com', color: 'bg-slate-900 text-white border-slate-900 hover:bg-slate-800' },
    { label: 'Admin Role', email: 'admin@antagloma.com', color: 'bg-[#04593f] text-white border-[#04593f] hover:bg-emerald-900' },
    { label: 'Sales Role', email: 'sales@antagloma.com', color: 'bg-emerald-800 text-white border-emerald-800 hover:bg-emerald-900' },
  ];

  return (
    <div className="min-h-screen bg-slate-100 flex items-center justify-center p-3 sm:p-4 font-sans text-slate-900">
      <div className="w-full max-w-md bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-xl space-y-5">
        {/* Brand Header */}
        <div className="text-center">
          <img
            src="/logo.png"
            alt="Antagloma Florist Logo"
            className="w-14 h-14 rounded-2xl object-cover mx-auto mb-3 shadow-md border border-emerald-950/20"
          />
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">Antagloma Florist</h1>
          <p className="text-xs text-slate-500 mt-0.5 font-semibold">Spesialis Tanaman Hias Adenium Bunga Tumpuk</p>
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
            className={`py-2.5 rounded-xl transition-all cursor-pointer ${
              activeTab === 'login'
                ? 'bg-white text-[#04593f] shadow-2xs'
                : 'text-slate-500 hover:text-slate-800'
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
            className={`py-2.5 rounded-xl transition-all cursor-pointer ${
              activeTab === 'register'
                ? 'bg-white text-[#04593f] shadow-2xs'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            Daftar Akun Baru
          </button>
        </div>

        {/* Feedback Alert Messages */}
        {error && (
          <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-bold shadow-2xs">
            {error}
          </div>
        )}

        {successMsg && (
          <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-[#04593f] text-xs font-bold shadow-2xs">
            {successMsg}
          </div>
        )}

        {/* Form 1: LOGIN FORM */}
        {activeTab === 'login' ? (
          <form onSubmit={handleLoginSubmit} className="space-y-3.5">
            <div>
              <label className="block text-xs font-bold text-slate-800 mb-1">Email Akun Staff</label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                <input
                  type="email"
                  required
                  value={loginEmail}
                  onChange={(e) => setLoginEmail(e.target.value)}
                  placeholder="nama@antagloma.com"
                  className="w-full pl-10 pr-3 py-2.5 border border-slate-300 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-700 text-slate-900"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-800 mb-1">Password</label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                <input
                  type="password"
                  required
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-3 py-2.5 border border-slate-300 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-700 text-slate-900"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 bg-[#04593f] hover:bg-emerald-900 text-white rounded-xl font-bold text-xs shadow-md transition-colors cursor-pointer disabled:opacity-50 mt-1"
            >
              {isLoading ? 'Memproses Login...' : 'Masuk ke Sistem'}
            </button>
          </form>
        ) : (
          /* Form 2: REGISTER FORM (Sales & Admin Role Only) */
          <form onSubmit={handleRegisterSubmit} className="space-y-3">
            <div>
              <label className="block text-xs font-bold text-slate-800 mb-1">Nama Lengkap Staff</label>
              <div className="relative">
                <UserIcon className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                <input
                  type="text"
                  required
                  value={regName}
                  onChange={(e) => setRegName(e.target.value)}
                  placeholder="Budi Santoso"
                  className="w-full pl-10 pr-3 py-2.5 border border-slate-300 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-700 text-slate-900"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-800 mb-1">Email Akun Staff</label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                <input
                  type="email"
                  required
                  value={regEmail}
                  onChange={(e) => setRegEmail(e.target.value)}
                  placeholder="budi@antagloma.com"
                  className="w-full pl-10 pr-3 py-2.5 border border-slate-300 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-700 text-slate-900"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-800 mb-1">Password (Min. 6 Karakter)</label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                <input
                  type="password"
                  required
                  value={regPassword}
                  onChange={(e) => setRegPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-3 py-2.5 border border-slate-300 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-700 text-slate-900"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-800 mb-1">Pilihan Wewenang Role Staff</label>
              <div className="grid grid-cols-2 gap-2 text-xs font-bold pt-0.5">
                <button
                  type="button"
                  onClick={() => setRegRole('sales')}
                  className={`p-2.5 rounded-xl border text-left flex flex-col space-y-0.5 transition-all cursor-pointer ${
                    regRole === 'sales'
                      ? 'bg-emerald-50 border-[#04593f] text-[#04593f] shadow-2xs'
                      : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-center gap-1.5 font-bold">
                    <UserCheck className="w-3.5 h-3.5 text-[#04593f]" />
                    <span>Sales Staff</span>
                  </div>
                  <span className="text-[10px] text-slate-400 font-normal">Buat & kelola order</span>
                </button>

                <button
                  type="button"
                  onClick={() => setRegRole('admin')}
                  className={`p-2.5 rounded-xl border text-left flex flex-col space-y-0.5 transition-all cursor-pointer ${
                    regRole === 'admin'
                      ? 'bg-emerald-50 border-[#04593f] text-[#04593f] shadow-2xs'
                      : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-center gap-1.5 font-bold">
                    <Briefcase className="w-3.5 h-3.5 text-[#04593f]" />
                    <span>Admin Staff</span>
                  </div>
                  <span className="text-[10px] text-slate-400 font-normal">Verifikasi & dokumen</span>
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 bg-[#04593f] hover:bg-emerald-900 text-white rounded-xl font-bold text-xs shadow-md transition-colors cursor-pointer disabled:opacity-50 mt-2"
            >
              {isLoading ? 'Mendaftarkan Akun...' : 'Daftar Akun Sekarang'}
            </button>
          </form>
        )}

        {/* Demo Quick Switcher */}
        <div className="pt-4 border-t border-slate-200/80">
          <div className="flex items-center gap-1.5 text-[11px] text-slate-500 font-bold mb-2.5">
            <ShieldCheck className="w-4 h-4 text-[#04593f]" />
            <span>Klik Akun Demo untuk Uji Coba Role:</span>
          </div>
          <div className="grid grid-cols-3 gap-2">
            {demoAccounts.map((acc) => (
              <button
                key={acc.email}
                type="button"
                onClick={() => {
                  setActiveTab('login');
                  setLoginEmail(acc.email);
                  setLoginPassword('password123');
                  authService.login({ email: acc.email, password: 'password123' }).then((res) => {
                    login(res.data.token, res.data.user);
                    navigate('/dashboard');
                  });
                }}
                className={`p-2 rounded-xl text-[10px] font-extrabold transition-all text-left flex flex-col justify-center shadow-2xs border ${acc.color} cursor-pointer`}
              >
                <span>{acc.label}</span>
                <span className="text-[9px] opacity-80 font-normal truncate">{acc.email}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
