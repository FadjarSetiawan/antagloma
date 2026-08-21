import React, { useState } from 'react';
import { KeyRound, Copy, Check, Database, ShieldCheck, ArrowRight } from 'lucide-react';
import { api } from '../../services/api';

export const PasswordHasherPage: React.FC = () => {
  const [email, setEmail] = useState('sales@antaglomaflorist.id');
  const [password, setPassword] = useState('7XyY)..GrfzkEx7O');
  const [hash, setHash] = useState('$2y$10$bTYu1Gd6RXw1xATklNCRnOVxg1eXoJslwtqJ2rBr25dcmZUskEKZa');
  const [copiedHash, setCopiedHash] = useState(false);
  const [copiedSql, setCopiedSql] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const sqlQuery = `UPDATE users SET password = '${hash}' WHERE email = '${email}';`;

  const handleGenerateHash = async () => {
    if (!password) return;
    setIsLoading(true);
    try {
      const res = await api.post('/tools/hash-password', { password, email });
      if (res.data?.hash) {
        setHash(res.data.hash);
      }
    } catch {
      // Fallback
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopy = (text: string, type: 'hash' | 'sql') => {
    navigator.clipboard.writeText(text);
    if (type === 'hash') {
      setCopiedHash(true);
      setTimeout(() => setCopiedHash(false), 2500);
    } else {
      setCopiedSql(true);
      setTimeout(() => setCopiedSql(false), 2500);
    }
  };

  const presetAccounts = [
    { email: 'sales@antaglomaflorist.id', pw: '7XyY)..GrfzkEx7O', label: 'Sales Staff' },
    { email: 'admin@antaglomaflorist.id', pw: 'dY!YWQmd2E+UeeM~', label: 'Admin Operasional' },
    { email: 'owner@antaglomaflorist.id', pw: 'hOyhxKx4wfNdf_0e', label: 'Owner' },
    { email: 'packing@antaglomaflorist.id', pw: 'dY!YWQmd2E+UeeM~', label: 'Packing Specialist' },
  ];

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex items-center justify-center p-4 sm:p-6 font-sans">
      <div className="w-full max-w-xl bg-slate-800 border border-slate-700 rounded-3xl p-6 sm:p-8 space-y-6 shadow-2xl">
        {/* Header */}
        <div className="flex items-center gap-3 border-b border-slate-700 pb-4">
          <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center border border-emerald-500/30">
            <KeyRound className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-heading font-black text-white">Laravel Password Hash Generator</h1>
            <p className="text-xs text-slate-400 font-medium">Buat Bcrypt Hash resmi Laravel untuk update langsung ke database.</p>
          </div>
        </div>

        {/* Quick Presets */}
        <div className="space-y-2">
          <label className="text-xs font-bold text-slate-300 block">Pilih Akun Preset:</label>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {presetAccounts.map((item) => (
              <button
                key={item.email}
                type="button"
                onClick={() => {
                  setEmail(item.email);
                  setPassword(item.pw);
                }}
                className={`px-3 py-2 rounded-xl text-xs font-bold text-left border transition-all cursor-pointer ${
                  email === item.email
                    ? 'bg-emerald-600 text-white border-emerald-500'
                    : 'bg-slate-750 text-slate-300 border-slate-700 hover:bg-slate-700'
                }`}
              >
                <span className="block text-[11px] opacity-80">{item.label}</span>
                <span className="truncate block font-mono text-[10px]">{item.email.split('@')[0]}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Form Inputs */}
        <div className="space-y-3">
          <div>
            <label className="text-xs font-bold text-slate-300 block mb-1">Email User:</label>
            <input
              type="text"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-xs font-mono text-white focus:outline-none focus:border-emerald-500"
              placeholder="user@antaglomaflorist.id"
            />
          </div>

          <div>
            <label className="text-xs font-bold text-slate-300 block mb-1">Password Plaintext:</label>
            <div className="flex gap-2">
              <input
                type="text"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="flex-1 px-3.5 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-xs font-mono text-white focus:outline-none focus:border-emerald-500"
                placeholder="Masukkan password..."
              />
              <button
                type="button"
                onClick={handleGenerateHash}
                disabled={isLoading}
                className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer shrink-0"
              >
                {isLoading ? 'Hashing...' : 'Generate Hash'}
              </button>
            </div>
          </div>
        </div>

        {/* Result Hash Box */}
        <div className="space-y-2 p-4 bg-slate-900/90 border border-slate-700 rounded-2xl">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-emerald-400 flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4" /> Hasil Bcrypt Hash:
            </span>
            <button
              type="button"
              onClick={() => handleCopy(hash, 'hash')}
              className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-600 rounded-lg text-xs font-bold flex items-center gap-1 cursor-pointer transition-colors"
            >
              {copiedHash ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedHash ? 'Tersalin!' : 'Salin Hash'}</span>
            </button>
          </div>
          <p className="font-mono text-xs text-amber-300 break-all select-all bg-slate-950 p-2.5 rounded-xl border border-slate-800">
            {hash}
          </p>
        </div>

        {/* SQL Query Box */}
        <div className="space-y-2 p-4 bg-slate-900/90 border border-slate-700 rounded-2xl">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-sky-400 flex items-center gap-1.5">
              <Database className="w-4 h-4" /> Query SQL (phpMyAdmin):
            </span>
            <button
              type="button"
              onClick={() => handleCopy(sqlQuery, 'sql')}
              className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-600 rounded-lg text-xs font-bold flex items-center gap-1 cursor-pointer transition-colors"
            >
              {copiedSql ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedSql ? 'Tersalin!' : 'Salin SQL'}</span>
            </button>
          </div>
          <p className="font-mono text-xs text-slate-300 break-all select-all bg-slate-950 p-2.5 rounded-xl border border-slate-800">
            {sqlQuery}
          </p>
        </div>

        {/* Back Link */}
        <div className="text-center pt-2">
          <a
            href="/login"
            className="inline-flex items-center gap-1 text-xs font-bold text-slate-400 hover:text-white transition-colors"
          >
            <span>Kembali ke Halaman Login</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </a>
        </div>
      </div>
    </div>
  );
};
