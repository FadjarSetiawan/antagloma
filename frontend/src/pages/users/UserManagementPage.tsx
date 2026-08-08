import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { userService, UserAccount } from '../../services/userService';
import {
  Users,
  UserPlus,
  Search,
  KeyRound,
  Edit3,
  Trash2,
  X,
  Mail,
  CheckCircle2,
  Lock,
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

export const UserManagementPage: React.FC = () => {
  const queryClient = useQueryClient();
  const { user: currentUser } = useAuth();

  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');

  // Modal States
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<UserAccount | null>(null);
  const [deletingUser, setDeletingUser] = useState<UserAccount | null>(null);

  // Form States for Create
  const [addName, setAddName] = useState('');
  const [addEmail, setAddEmail] = useState('');
  const [addPassword, setAddPassword] = useState('');
  const [addRole, setAddRole] = useState<'owner' | 'admin' | 'sales'>('sales');

  // Form States for Edit & Reset Password
  const [editName, setEditName] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editPassword, setEditPassword] = useState('');
  const [editRole, setEditRole] = useState<'owner' | 'admin' | 'sales'>('sales');

  const [feedbackMsg, setFeedbackMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['users-list'],
    queryFn: () => userService.getUsers(),
  });

  const createMutation = useMutation({
    mutationFn: () =>
      userService.createUser({
        name: addName,
        email: addEmail,
        password: addPassword,
        role: addRole,
      }),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ['users-list'] });
      setIsAddModalOpen(false);
      setAddName('');
      setAddEmail('');
      setAddPassword('');
      setAddRole('sales');
      setFeedbackMsg({ type: 'success', text: res.message });
      setTimeout(() => setFeedbackMsg(null), 4000);
    },
    onError: (err: any) => {
      const msg = err?.response?.data?.message || 'Gagal membuat akun user.';
      setFeedbackMsg({ type: 'error', text: msg });
    },
  });

  const updateMutation = useMutation({
    mutationFn: () =>
      userService.updateUser(editingUser!.id, {
        name: editName,
        email: editEmail,
        role: editRole,
        password: editPassword.trim() !== '' ? editPassword : undefined,
      }),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ['users-list'] });
      setEditingUser(null);
      setEditPassword('');
      setFeedbackMsg({ type: 'success', text: res.message });
      setTimeout(() => setFeedbackMsg(null), 4000);
    },
    onError: (err: any) => {
      const msg = err?.response?.data?.message || 'Gagal memperbarui akun user.';
      setFeedbackMsg({ type: 'error', text: msg });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => userService.deleteUser(id),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ['users-list'] });
      setDeletingUser(null);
      setFeedbackMsg({ type: 'success', text: res.message });
      setTimeout(() => setFeedbackMsg(null), 4000);
    },
    onError: (err: any) => {
      const msg = err?.response?.data?.message || 'Gagal menghapus akun user.';
      setFeedbackMsg({ type: 'error', text: msg });
    },
  });

  const openEditModal = (u: UserAccount) => {
    setEditingUser(u);
    setEditName(u.name);
    setEditEmail(u.email);
    setEditRole(u.role as any);
    setEditPassword('');
  };

  const users: UserAccount[] = data?.data || [];

  const filteredUsers = users.filter((u: UserAccount) => {
    const matchSearch =
      u.name.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase());
    const matchRole = roleFilter === '' || u.role === roleFilter;
    return matchSearch && matchRole;
  });

  const getRoleBadge = (r: UserAccount['role']) => {
    switch (r) {
      case 'owner':
        return 'bg-purple-50 text-purple-900 border-purple-200';
      case 'admin':
        return 'bg-[#04593f] text-white border-[#04593f]';
      case 'sales':
        return 'bg-emerald-50 text-[#04593f] border-emerald-200';
      default:
        return 'bg-slate-100 text-slate-900 border-slate-300';
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-28 font-sans text-slate-900">
      {/* Top Banner Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 leading-tight flex items-center gap-2">
            <Users className="w-6 h-6 text-[#04593f]" />
            <span>Manajemen Akun User</span>
          </h1>
          <p className="text-xs text-slate-500 font-medium mt-0.5">
            Kelola email, password, dan wewenang akses akun staff toko
          </p>
        </div>

        <button
          onClick={() => setIsAddModalOpen(true)}
          className="w-full sm:w-auto px-5 py-3 bg-[#04593f] hover:bg-emerald-900 text-white rounded-2xl text-xs font-black flex items-center justify-center gap-2 shadow-md active:scale-95 transition-all cursor-pointer"
        >
          <UserPlus className="w-4 h-4 text-white" />
          <span>+ Buat Akun Baru</span>
        </button>
      </div>

      {/* Feedback Alert */}
      {feedbackMsg && (
        <div
          className={`p-4 rounded-3xl border-2 flex items-center justify-between text-xs font-bold ${
            feedbackMsg.type === 'success'
              ? 'bg-emerald-50 border-emerald-300 text-emerald-950'
              : 'bg-rose-50 border-rose-300 text-rose-950'
          }`}
        >
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
            <span>{feedbackMsg.text}</span>
          </div>
          <button onClick={() => setFeedbackMsg(null)} className="p-1">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Search & Filter Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-4 top-3.5" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari nama atau email user..."
            className="w-full pl-11 pr-4 py-3 bg-white border border-slate-200 rounded-2xl text-xs font-bold focus:outline-none focus:ring-2 focus:ring-emerald-700 text-slate-900 shadow-2xs"
          />
        </div>

        <select
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value)}
          className="w-full px-4 py-3 bg-white border border-slate-200 rounded-2xl text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-700 shadow-2xs appearance-none"
        >
          <option value="">Semua Peran / Role</option>
          <option value="owner">Owner (Pemilik Toko)</option>
          <option value="admin">Admin Operasional</option>
          <option value="sales">Sales Staff</option>
        </select>
      </div>

      {/* Users Grid List */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {isLoading ? (
          <div className="col-span-full p-12 text-center text-xs font-bold text-slate-500 bg-white rounded-3xl border border-slate-200">
            Memuat daftar user...
          </div>
        ) : filteredUsers.length === 0 ? (
          <div className="col-span-full py-12 text-center text-xs font-bold text-slate-500 bg-white rounded-3xl border border-slate-200">
            Tidak ada data user yang sesuai.
          </div>
        ) : (
          filteredUsers.map((u: UserAccount) => (
            <div
              key={u.id}
              className="bg-white border border-slate-200/90 rounded-3xl p-5 space-y-4 shadow-2xs relative flex flex-col justify-between"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-[#04593f] text-white font-black text-lg flex items-center justify-center shadow-2xs flex-shrink-0">
                    {u.name.charAt(0).toUpperCase()}
                  </div>

                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="text-sm font-bold text-slate-900">{u.name}</h3>
                      {u.id === currentUser?.id && (
                        <span className="px-2 py-0.5 bg-[#04593f] text-white rounded text-[10px] font-bold uppercase">
                          Anda
                        </span>
                      )}
                    </div>

                    <div className="text-xs text-slate-600 font-medium flex items-center gap-1.5">
                      <Mail className="w-3.5 h-3.5 text-slate-400" />
                      <span>{u.email}</span>
                    </div>

                    <div className="pt-1">
                      <span
                        className={`px-2.5 py-1 rounded-xl border text-[10px] font-bold uppercase inline-block ${getRoleBadge(
                          u.role
                        )}`}
                      >
                        {u.role}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Card Bottom Actions */}
              <div className="grid grid-cols-2 gap-2 pt-3 border-t border-slate-100">
                <button
                  onClick={() => openEditModal(u)}
                  className="py-2.5 px-3 bg-white border border-slate-200 hover:bg-slate-50 text-slate-800 rounded-2xl text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Edit3 className="w-3.5 h-3.5 text-[#04593f]" />
                  <span>Edit & Password</span>
                </button>

                <button
                  disabled={u.id === currentUser?.id}
                  onClick={() => setDeletingUser(u)}
                  className="py-2.5 px-3 bg-white border border-rose-200 hover:bg-rose-50 text-rose-800 disabled:opacity-40 rounded-2xl text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5 text-rose-600" />
                  <span>Hapus Akun</span>
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* MODAL 1: TAMBAH USER BARU */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4 sm:p-6 w-full h-full overflow-y-auto">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl w-[95%] max-w-md my-auto p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-2xl bg-[#04593f] text-white flex items-center justify-center">
                  <UserPlus className="w-5 h-5" />
                </div>
                <h3 className="text-base font-bold text-slate-900">Tambah Akun User Baru</h3>
              </div>
              <button onClick={() => setIsAddModalOpen(false)} className="p-1.5 text-slate-400 hover:text-slate-700 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            {feedbackMsg && feedbackMsg.type === 'error' && (
              <div className="p-3 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold flex items-center gap-2">
                <X className="w-4 h-4 flex-shrink-0 text-rose-600" />
                <span>{feedbackMsg.text}</span>
              </div>
            )}

            <form
              onSubmit={(e) => {
                e.preventDefault();
                createMutation.mutate();
              }}
              className="space-y-4 text-xs font-bold text-slate-800"
            >
              <div className="space-y-1">
                <label className="block text-slate-700">Nama Lengkap Staff *</label>
                <input
                  type="text"
                  required
                  value={addName}
                  onChange={(e) => setAddName(e.target.value)}
                  placeholder="Contoh: Budi Santoso"
                  className="w-full px-4 py-3 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-emerald-700 text-slate-900"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-slate-700">Alamat Email *</label>
                <input
                  type="email"
                  required
                  value={addEmail}
                  onChange={(e) => setAddEmail(e.target.value)}
                  placeholder="email@antagloma.com"
                  className="w-full px-4 py-3 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-emerald-700 text-slate-900"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-slate-700">Password Login *</label>
                <input
                  type="password"
                  required
                  minLength={6}
                  value={addPassword}
                  onChange={(e) => setAddPassword(e.target.value)}
                  placeholder="Minimal 6 karakter"
                  className="w-full px-4 py-3 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-emerald-700 text-slate-900"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-slate-700">Peran / Role *</label>
                <select
                  value={addRole}
                  onChange={(e) => setAddRole(e.target.value as any)}
                  className="w-full px-4 py-3 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-emerald-700 text-slate-900 font-bold appearance-none"
                >
                  <option value="sales">Sales Staff (Buat & Kelola Order Sales)</option>
                  <option value="admin">Admin Operational (Verifikasi & Cetak Dokumen)</option>
                  <option value="owner">Owner (Pemilik Toko)</option>
                </select>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={createMutation.isPending}
                  className="w-full py-3 bg-[#04593f] hover:bg-emerald-900 text-white rounded-2xl font-bold text-xs shadow-xs transition-colors cursor-pointer"
                >
                  {createMutation.isPending ? 'Menyimpan...' : 'Simpan Akun Baru'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: EDIT AKUN & RESET PASSWORD */}
      {editingUser && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4 sm:p-6 w-full h-full overflow-y-auto">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl w-[95%] max-w-md my-auto p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-2xl bg-emerald-50 text-[#04593f] flex items-center justify-center">
                  <Edit3 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">Edit Data User</h3>
                  <p className="text-[11px] text-slate-400 font-medium">#{editingUser.id} - {editingUser.name}</p>
                </div>
              </div>
              <button onClick={() => setEditingUser(null)} className="p-1.5 text-slate-400 hover:text-slate-700 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            {feedbackMsg && feedbackMsg.type === 'error' && (
              <div className="p-3 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold flex items-center gap-2">
                <X className="w-4 h-4 flex-shrink-0 text-rose-600" />
                <span>{feedbackMsg.text}</span>
              </div>
            )}

            <form
              onSubmit={(e) => {
                e.preventDefault();
                updateMutation.mutate();
              }}
              className="space-y-4 text-xs font-bold text-slate-800"
            >
              <div className="space-y-1">
                <label className="block text-slate-700">Nama Lengkap Staff *</label>
                <input
                  type="text"
                  required
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full px-4 py-3 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-emerald-700 text-slate-900"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-slate-700">Alamat Email *</label>
                <input
                  type="email"
                  required
                  value={editEmail}
                  onChange={(e) => setEditEmail(e.target.value)}
                  className="w-full px-4 py-3 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-emerald-700 text-slate-900"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-slate-700">Peran / Role *</label>
                <select
                  value={editRole}
                  onChange={(e) => setEditRole(e.target.value as any)}
                  className="w-full px-4 py-3 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-emerald-700 text-slate-900 font-bold appearance-none"
                >
                  <option value="sales">Sales Staff (Buat & Kelola Order Sales)</option>
                  <option value="admin">Admin Operational (Verifikasi & Cetak Dokumen)</option>
                  <option value="owner">Owner (Pemilik Toko)</option>
                </select>
              </div>

              <div className="space-y-1 pt-1 border-t border-slate-100">
                <label className="block text-slate-700 flex items-center justify-between">
                  <span>Password Baru (Opsional)</span>
                  <span className="text-[10px] text-slate-400 font-normal">Kosongkan jika tidak diganti</span>
                </label>
                <input
                  type="password"
                  minLength={6}
                  value={editPassword}
                  onChange={(e) => setEditPassword(e.target.value)}
                  placeholder="Isi hanya jika ingin ganti password"
                  className="w-full px-4 py-3 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-emerald-700 text-slate-900"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setEditingUser(null)}
                  className="px-4 py-2.5 bg-slate-100 text-slate-700 hover:bg-slate-200 font-bold rounded-2xl"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={updateMutation.isPending}
                  className="px-5 py-2.5 bg-[#04593f] hover:bg-emerald-900 text-white rounded-2xl font-bold shadow-xs transition-colors cursor-pointer"
                >
                  {updateMutation.isPending ? 'Menyimpan...' : 'Simpan Perubahan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: KONFIRMASI HAPUS USER */}
      {deletingUser && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4 sm:p-6 w-full h-full">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl w-[95%] max-w-sm my-auto p-6 space-y-4 text-center">
            <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto">
              <Trash2 className="w-6 h-6" />
            </div>

            <div>
              <h3 className="text-base font-bold text-slate-900">Hapus Akun User?</h3>
              <p className="text-xs text-slate-500 font-medium mt-1">
                Apakah Anda yakin ingin menghapus akun <span className="font-bold text-slate-900">{deletingUser.name}</span> ({deletingUser.email})?
              </p>
            </div>

            <div className="pt-2 grid grid-cols-2 gap-2 text-xs font-bold">
              <button
                type="button"
                onClick={() => setDeletingUser(null)}
                className="py-2.5 bg-slate-100 text-slate-700 hover:bg-slate-200 rounded-2xl"
              >
                Batal
              </button>
              <button
                type="button"
                disabled={deleteMutation.isPending}
                onClick={() => deleteMutation.mutate(deletingUser.id)}
                className="py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-2xl shadow-xs cursor-pointer"
              >
                {deleteMutation.isPending ? 'Menghapus...' : 'Ya, Hapus Akun'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
