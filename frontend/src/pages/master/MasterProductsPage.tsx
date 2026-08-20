import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { masterService } from '../../services/masterService';
import { MasterTree, MasterGrade } from '../../types/order';
import { Sprout, Plus, Search, Edit3, Trash2, Save, X, Tag, AlertCircle } from 'lucide-react';

export const MasterProductsPage: React.FC = () => {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<'trees' | 'grades'>('trees');
  const [searchQuery, setSearchQuery] = useState('');

  // Modal State
  const [isTreeModalOpen, setIsTreeModalOpen] = useState(false);
  const [editingTree, setEditingTree] = useState<MasterTree | null>(null);
  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [modalError, setModalError] = useState('');

  // Grade Edit Inline State
  const [editingGradeId, setEditingGradeId] = useState<number | null>(null);
  const [gradePrice, setGradePrice] = useState<number>(0);

  // Queries
  const { data: trees = [], isLoading: isLoadingTrees } = useQuery<MasterTree[]>({
    queryKey: ['master-trees'],
    queryFn: () => masterService.getTrees(),
  });

  const { data: grades = [], isLoading: isLoadingGrades } = useQuery<MasterGrade[]>({
    queryKey: ['master-grades'],
    queryFn: () => masterService.getGrades(),
  });

  // Tree Mutations
  const createTreeMutation = useMutation({
    mutationFn: (payload: { code: string; name: string }) => masterService.createTree(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['master-trees'] });
      closeTreeModal();
    },
    onError: (err: any) => {
      setModalError(err.response?.data?.message || 'Gagal menambahkan varian pohon.');
    },
  });

  const updateTreeMutation = useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: { code: string; name: string } }) =>
      masterService.updateTree(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['master-trees'] });
      closeTreeModal();
    },
    onError: (err: any) => {
      setModalError(err.response?.data?.message || 'Gagal memperbarui varian pohon.');
    },
  });

  const deleteTreeMutation = useMutation({
    mutationFn: (id: number) => masterService.deleteTree(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['master-trees'] });
    },
    onError: (err: any) => {
      alert(err.response?.data?.message || 'Gagal menghapus varian pohon.');
    },
  });

  // Grade Mutation
  const updateGradeMutation = useMutation({
    mutationFn: ({ id, price }: { id: number; price: number }) => masterService.updateGrade(id, price),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['master-grades'] });
      setEditingGradeId(null);
    },
    onError: (err: any) => {
      alert(err.response?.data?.message || 'Gagal memperbarui harga grade.');
    },
  });

  const openAddTreeModal = () => {
    setEditingTree(null);
    setCode('');
    setName('');
    setModalError('');
    setIsTreeModalOpen(true);
  };

  const openEditTreeModal = (tree: MasterTree) => {
    setEditingTree(tree);
    setCode(tree.code);
    setName(tree.name);
    setModalError('');
    setIsTreeModalOpen(true);
  };

  const closeTreeModal = () => {
    setIsTreeModalOpen(false);
    setEditingTree(null);
    setCode('');
    setName('');
    setModalError('');
  };

  const handleTreeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim() || !name.trim()) {
      setModalError('Kode dan Nama varian pohon wajib diisi.');
      return;
    }

    if (editingTree) {
      updateTreeMutation.mutate({ id: editingTree.id, payload: { code: code.trim(), name: name.trim() } });
    } else {
      createTreeMutation.mutate({ code: code.trim(), name: name.trim() });
    }
  };

  const handleDeleteTree = (tree: MasterTree) => {
    if (window.confirm(`Apakah Anda yakin ingin menghapus varian "${tree.code} - ${tree.name}"?`)) {
      deleteTreeMutation.mutate(tree.id);
    }
  };

  const filteredTrees = trees.filter(
    (t: MasterTree) =>
      t.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-5 max-w-7xl pb-12 font-sans text-slate-900">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-heading font-extrabold text-slate-900">Kelola Master Produk & Grade</h1>
          <p className="text-xs sm:text-sm text-slate-500 font-medium mt-0.5">
            Manajemen katalog varian pohon Adenium & standar harga grade untuk transaksi Sales.
          </p>
        </div>

        {activeTab === 'trees' && (
          <button
            onClick={openAddTreeModal}
            className="w-full sm:w-auto px-4 py-2.5 bg-[#04593f] hover:bg-emerald-950 text-white rounded-xl text-xs font-heading font-bold flex items-center justify-center gap-1.5 shadow-2xs active:scale-95 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" /> Tambah Varian Adenium
          </button>
        )}
      </div>

      {/* Responsive Tabs Switcher */}
      <div className="grid grid-cols-2 gap-2 border-b border-slate-200 pb-2 sm:flex sm:items-center font-heading">
        <button
          onClick={() => setActiveTab('trees')}
          className={`px-3 py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer ${
            activeTab === 'trees'
              ? 'bg-[#04593f] text-white shadow-2xs'
              : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
          }`}
        >
          <Sprout className="w-3.5 h-3.5" /> Varian Pohon ({trees.length})
        </button>

        <button
          onClick={() => setActiveTab('grades')}
          className={`px-3 py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer ${
            activeTab === 'grades'
              ? 'bg-[#04593f] text-white shadow-2xs'
              : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
          }`}
        >
          <Tag className="w-3.5 h-3.5" /> Harga Grade ({grades.length})
        </button>
      </div>

      {/* TAB 1: Master Trees */}
      {activeTab === 'trees' && (
        <div className="space-y-3.5">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="relative w-full sm:w-80">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Cari kode atau nama adenium..."
                className="w-full pl-10 pr-3 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-emerald-700 text-slate-900 shadow-2xs"
              />
            </div>
            <span className="text-xs text-slate-500 font-medium self-end sm:self-center">
              Menampilkan {filteredTrees.length} dari {trees.length} varian
            </span>
          </div>

          {isLoadingTrees ? (
            <div className="py-12 text-center text-xs font-medium text-slate-500 bg-white rounded-2xl border border-slate-200">
              Memuat katalog varian pohon...
            </div>
          ) : filteredTrees.length === 0 ? (
            <div className="py-12 text-center text-xs font-medium text-slate-500 bg-white rounded-2xl border border-slate-200">
              Tidak ada varian adenium yang ditemukan.
            </div>
          ) : (
            <>
              {/* Mobile Stacked Card View */}
              <div className="md:hidden space-y-2.5">
                {filteredTrees.map((tree: MasterTree) => (
                  <div
                    key={tree.id}
                    className="p-3 bg-white border border-slate-200 rounded-2xl flex items-center justify-between gap-2 shadow-2xs"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span className="px-2.5 py-1 bg-emerald-50 text-[#04593f] border border-emerald-200 rounded-lg text-xs font-heading font-black flex-shrink-0">
                        {tree.code}
                      </span>
                      <span className="font-heading font-bold text-slate-900 text-sm truncate">{tree.name}</span>
                    </div>

                    <div className="flex items-center gap-1.5 flex-shrink-0 font-heading">
                      <button
                        onClick={() => openEditTreeModal(tree)}
                        className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-bold flex items-center gap-1 cursor-pointer"
                      >
                        <Edit3 className="w-3.5 h-3.5 text-slate-600" /> Edit
                      </button>
                      <button
                        onClick={() => handleDeleteTree(tree)}
                        className="px-2.5 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-xl text-xs font-bold flex items-center gap-1 cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Desktop Table View */}
              <div className="hidden md:block overflow-hidden rounded-2xl border border-slate-200/90 bg-white shadow-2xs">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 border-b border-slate-200 text-slate-700 font-heading font-extrabold text-xs">
                    <tr>
                      <th className="py-3 px-4 w-16 text-center">No</th>
                      <th className="py-3 px-4 w-32">Kode Pohon</th>
                      <th className="py-3 px-4">Nama Varian Adenium</th>
                      <th className="py-3 px-4 text-center w-36">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-900">
                    {filteredTrees.map((tree: MasterTree, idx: number) => (
                      <tr key={tree.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-3 px-4 text-center text-slate-500 font-medium">{idx + 1}</td>
                        <td className="py-3 px-4">
                          <span className="px-2.5 py-1 bg-emerald-50 text-[#04593f] border border-emerald-100 rounded-lg text-xs font-heading font-black">
                            {tree.code}
                          </span>
                        </td>
                        <td className="py-3 px-4 font-heading font-bold text-slate-900 text-sm">{tree.name}</td>
                        <td className="py-3 px-4 text-center">
                          <div className="flex items-center justify-center gap-1.5 font-heading">
                            <button
                              onClick={() => openEditTreeModal(tree)}
                              className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-bold flex items-center gap-1 cursor-pointer"
                            >
                              <Edit3 className="w-3.5 h-3.5 text-slate-600" /> Edit
                            </button>
                            <button
                              onClick={() => handleDeleteTree(tree)}
                              className="px-2.5 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-xl text-xs font-bold flex items-center gap-1 cursor-pointer"
                            >
                              <Trash2 className="w-3.5 h-3.5" /> Hapus
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>
      )}

      {/* TAB 2: Master Grades */}
      {activeTab === 'grades' && (
        <div className="space-y-3.5">
          <div>
            <h2 className="text-base font-heading font-extrabold text-slate-900">Standar Harga Per Grade</h2>
            <p className="text-xs text-slate-500 font-medium">
              Harga standar otomatis terisi di form order saat Sales memilih Grade Adenium.
            </p>
          </div>

          {isLoadingGrades ? (
            <div className="py-12 text-center text-xs font-medium text-slate-500 bg-white rounded-2xl border border-slate-200">Memuat daftar grade...</div>
          ) : (
            <>
              {/* Mobile Stacked Card View */}
              <div className="md:hidden space-y-2.5">
                {grades.map((g: MasterGrade) => (
                  <div
                    key={g.id}
                    className="p-3 bg-white border border-slate-200 rounded-2xl flex items-center justify-between gap-2 text-xs shadow-2xs"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="px-2.5 py-1 bg-emerald-50 text-[#04593f] border border-emerald-200 rounded-lg font-heading font-black text-xs flex-shrink-0">
                        Grade {g.grade}
                      </span>
                      {editingGradeId === g.id ? (
                        <input
                          type="number"
                          min={0}
                          value={gradePrice}
                          onChange={(e) => setGradePrice(Number(e.target.value) || 0)}
                          className="w-28 px-2 py-1 border border-slate-300 rounded-lg text-xs font-bold"
                        />
                      ) : g.grade === 'J+' ? (
                        <span className="text-amber-800 italic font-bold text-xs">Custom Price</span>
                      ) : (
                        <span className="text-slate-900 font-heading font-black text-xs">Rp {g.standard_price.toLocaleString('id-ID')}</span>
                      )}
                    </div>

                    <div className="flex-shrink-0 font-heading">
                      {editingGradeId === g.id ? (
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => updateGradeMutation.mutate({ id: g.id, price: gradePrice })}
                            className="px-2.5 py-1.5 bg-[#04593f] text-white rounded-xl text-xs font-bold shadow-xs cursor-pointer"
                          >
                            <Save className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => setEditingGradeId(null)}
                            className="px-2.5 py-1.5 bg-slate-200 text-slate-700 rounded-xl text-xs font-bold cursor-pointer"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => {
                            setEditingGradeId(g.id);
                            setGradePrice(g.standard_price);
                          }}
                          className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-bold flex items-center gap-1 cursor-pointer"
                        >
                          <Edit3 className="w-3.5 h-3.5 text-slate-600" /> Ubah
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {/* Desktop Table View */}
              <div className="hidden md:block overflow-hidden rounded-2xl border border-slate-200/90 bg-white shadow-2xs">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 border-b border-slate-200 text-slate-700 font-heading font-extrabold text-xs">
                    <tr>
                      <th className="py-3 px-4 w-32">Grade</th>
                      <th className="py-3 px-4">Harga Standar (Rp)</th>
                      <th className="py-3 px-4 text-center w-40">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-medium text-slate-900">
                    {grades.map((g: MasterGrade) => (
                      <tr key={g.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-3 px-4">
                          <span className="px-3 py-1 bg-emerald-50 text-[#04593f] border border-emerald-100 rounded-lg text-xs font-heading font-black">
                            Grade {g.grade}
                          </span>
                        </td>
                        <td className="py-3 px-4 font-heading font-black text-sm">
                          {editingGradeId === g.id ? (
                            <input
                              type="number"
                              min={0}
                              value={gradePrice}
                              onChange={(e) => setGradePrice(Number(e.target.value) || 0)}
                              className="w-48 px-3 py-1.5 border border-slate-300 rounded-xl text-xs font-bold focus:outline-none focus:ring-2 focus:ring-emerald-700"
                            />
                          ) : g.grade === 'J+' ? (
                            <span className="text-amber-700 italic font-medium">Custom Price (Flexible)</span>
                          ) : (
                            <span>Rp {g.standard_price.toLocaleString('id-ID')}</span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-center">
                          {editingGradeId === g.id ? (
                            <div className="flex items-center justify-center gap-1 font-heading">
                              <button
                                onClick={() => updateGradeMutation.mutate({ id: g.id, price: gradePrice })}
                                className="px-3 py-1.5 bg-[#04593f] text-white rounded-xl text-xs font-bold flex items-center gap-1 shadow-xs cursor-pointer"
                              >
                                <Save className="w-3.5 h-3.5" /> Simpan
                              </button>
                              <button
                                onClick={() => setEditingGradeId(null)}
                                className="px-3 py-1.5 bg-slate-200 text-slate-700 rounded-xl text-xs font-bold cursor-pointer"
                              >
                                <X className="w-3.5 h-3.5" /> Batal
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={() => {
                                setEditingGradeId(g.id);
                                setGradePrice(g.standard_price);
                              }}
                              className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-heading font-bold flex items-center gap-1 mx-auto cursor-pointer"
                            >
                              <Edit3 className="w-3.5 h-3.5 text-slate-600" /> Ubah Harga
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>
      )}

      {/* Tree Modal Dialog */}
      {isTreeModalOpen && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-900/40 backdrop-blur-md p-4 sm:p-6 w-full h-full overflow-y-auto">
          <div className="bg-white rounded-3xl border-2 border-slate-200 shadow-2xl w-[95%] max-w-md overflow-hidden my-auto flex flex-col">
            <div className="p-4 sm:p-5 bg-slate-50 border-b border-slate-200 flex items-center justify-between flex-shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-emerald-800 text-white flex items-center justify-center font-bold">
                  <Sprout className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm sm:text-base font-black text-slate-900 leading-tight">
                    {editingTree ? 'Edit Varian Adenium' : 'Tambah Varian Adenium'}
                  </h3>
                  <p className="text-xs text-slate-500 font-medium">Master data varian produk tanaman</p>
                </div>
              </div>
              <button
                onClick={closeTreeModal}
                className="p-2 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-xl transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleTreeSubmit} className="p-5 sm:p-6 space-y-4 text-xs sm:text-sm font-sans">
              {modalError && (
                <div className="p-3 rounded-2xl bg-rose-100 border border-rose-300 text-rose-950 text-xs font-bold flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  <span>{modalError}</span>
                </div>
              )}

              <div>
                <label className="block text-xs font-extrabold text-slate-900 mb-1">Kode Pohon (Singkatan) *</label>
                <input
                  type="text"
                  required
                  value={code}
                  onChange={(e) => setCode(e.target.value.toUpperCase())}
                  placeholder="Contoh: BA, GA, TW, RL..."
                  className="w-full px-3.5 py-3 border border-slate-300 rounded-xl text-xs sm:text-sm font-black focus:outline-none focus:ring-2 focus:ring-emerald-700 uppercase"
                />
              </div>

              <div>
                <label className="block text-xs font-extrabold text-slate-900 mb-1">Nama Varian Adenium *</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Contoh: Black Amarylis, Golden Age..."
                  className="w-full px-3.5 py-3 border border-slate-300 rounded-xl text-xs sm:text-sm font-bold focus:outline-none focus:ring-2 focus:ring-emerald-700"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={closeTreeModal}
                  className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-300 rounded-xl text-xs font-bold transition-colors"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={createTreeMutation.isPending || updateTreeMutation.isPending}
                  className="px-5 py-2.5 bg-emerald-800 hover:bg-emerald-900 text-white rounded-xl text-xs sm:text-sm font-extrabold flex items-center gap-1.5 shadow-md active:scale-95 transition-all disabled:opacity-50"
                >
                  <Save className="w-4 h-4" />
                  <span>
                    {createTreeMutation.isPending || updateTreeMutation.isPending ? 'Menyimpan...' : 'Simpan Varian'}
                  </span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
