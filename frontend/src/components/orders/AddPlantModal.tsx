import React, { useState, useEffect } from 'react';
import { masterService } from '../../services/masterService';
import { MasterTree, MasterGrade, OrderItem } from '../../types/order';
import { X, Plus, AlertCircle, Sprout } from 'lucide-react';

interface AddPlantModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddPlant: (plant: OrderItem) => void;
}

export const AddPlantModal: React.FC<AddPlantModalProps> = ({ isOpen, onClose, onAddPlant }) => {
  const [trees, setTrees] = useState<MasterTree[]>([]);
  const [grades, setGrades] = useState<MasterGrade[]>([]);
  const [isLoadingMaster, setIsLoadingMaster] = useState(false);

  const [selectedTreeId, setSelectedTreeId] = useState<number | ''>('');
  const [selectedGrade, setSelectedGrade] = useState<string>('');
  const [quantity, setQuantity] = useState<number>(1);
  const [price, setPrice] = useState<number>(0);
  const [notes, setNotes] = useState<string>('');
  const [error, setError] = useState<string>('');

  useEffect(() => {
    if (isOpen) {
      setIsLoadingMaster(true);
      Promise.all([masterService.getTrees(), masterService.getGrades()])
        .then(([treeData, gradeData]) => {
          setTrees(treeData);
          setGrades(gradeData);
        })
        .catch(() => {
          setError('Gagal memuat data master pohon dan grade.');
        })
        .finally(() => {
          setIsLoadingMaster(false);
        });
    }
  }, [isOpen]);

  const chosenTree = trees.find((t) => t.id === Number(selectedTreeId)) || null;
  const chosenGradeObj = grades.find((g) => g.grade === selectedGrade) || null;

  const standardPrice = chosenGradeObj ? chosenGradeObj.standard_price : 0;

  useEffect(() => {
    if (chosenGradeObj) {
      if (chosenGradeObj.grade !== 'J+') {
        setPrice(chosenGradeObj.standard_price);
      }
    }
  }, [selectedGrade]);

  const discount = standardPrice > price && selectedGrade !== 'J+' ? standardPrice - price : 0;

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!selectedTreeId) {
      setError('Harap pilih ID Pohon / Varian Adenium.');
      return;
    }
    if (!selectedGrade) {
      setError('Harap pilih Grade Adenium.');
      return;
    }
    if (quantity < 1) {
      setError('Jumlah quantity minimal 1.');
      return;
    }
    if (price < 0) {
      setError('Harga jual tidak boleh kurang dari 0.');
      return;
    }

    const newItem: OrderItem = {
      tree_code: chosenTree?.code,
      tree_name: chosenTree?.name,
      grade: selectedGrade,
      product_name: chosenTree ? `${chosenTree.name} (Grade ${selectedGrade})` : `Adenium Grade ${selectedGrade}`,
      variant: `Grade ${selectedGrade}`,
      quantity: Number(quantity),
      price: Number(price),
      standard_price: standardPrice,
      discount: discount,
      notes: notes,
    };

    onAddPlant(newItem);
    setSelectedTreeId('');
    setSelectedGrade('');
    setQuantity(1);
    setPrice(0);
    setNotes('');
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-900/40 backdrop-blur-md p-4 sm:p-6 w-full h-full overflow-y-auto">
      <div className="bg-white rounded-3xl border-2 border-slate-200 shadow-2xl w-[95%] max-w-md md:max-w-xl overflow-hidden my-auto flex flex-col">
        {/* Modal Header */}
        <div className="p-4 sm:p-5 bg-slate-50 border-b border-slate-200 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-800 text-white flex items-center justify-center font-bold">
              <Sprout className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-black text-slate-900 leading-tight">Tambah Detail Tanaman</h3>
              <p className="text-xs text-slate-500 font-medium">Pilih jenis adenium & grade harga</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-xl transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Form */}
        <form onSubmit={handleSubmit} className="p-5 sm:p-6 space-y-4 text-xs sm:text-sm font-sans">
          {error && (
            <div className="p-3 rounded-2xl bg-rose-100 border border-rose-300 text-rose-950 text-xs font-bold flex items-center gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-extrabold text-slate-900 mb-1">ID Pohon / Varian Adenium *</label>
            <select
              required
              disabled={isLoadingMaster}
              value={selectedTreeId}
              onChange={(e) => setSelectedTreeId(Number(e.target.value))}
              className="w-full px-3.5 py-3 bg-white border border-slate-300 rounded-xl text-xs sm:text-sm font-bold focus:outline-none focus:ring-2 focus:ring-emerald-700 text-slate-900"
            >
              <option value="">-- Pilih ID Pohon --</option>
              {trees.map((tree) => (
                <option key={tree.id} value={tree.id}>
                  {tree.code} - {tree.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-extrabold text-slate-900 mb-1">Grade Tanaman *</label>
            <select
              required
              disabled={isLoadingMaster}
              value={selectedGrade}
              onChange={(e) => setSelectedGrade(e.target.value)}
              className="w-full px-3.5 py-3 bg-white border border-slate-300 rounded-xl text-xs sm:text-sm font-bold focus:outline-none focus:ring-2 focus:ring-emerald-700 text-slate-900 uppercase"
            >
              <option value="">-- Pilih Grade --</option>
              {grades.map((grade) => (
                <option key={grade.id} value={grade.grade}>
                  Grade {grade.grade} ({grade.grade === 'J+' ? 'Custom Price' : `Rp ${grade.standard_price.toLocaleString('id-ID')}`})
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-extrabold text-slate-900 mb-1">Jumlah (Qty) *</label>
              <input
                type="number"
                min={1}
                required
                value={quantity}
                onChange={(e) => setQuantity(Math.max(1, Number(e.target.value) || 1))}
                className="w-full px-3.5 py-3 border border-slate-300 rounded-xl text-xs sm:text-sm font-extrabold focus:outline-none focus:ring-2 focus:ring-emerald-700"
              />
            </div>

            <div>
              <label className="block text-xs font-extrabold text-slate-900 mb-1">Harga Standar (Readonly)</label>
              <input
                type="text"
                readOnly
                value={selectedGrade === 'J+' ? 'Custom' : `Rp ${standardPrice.toLocaleString('id-ID')}`}
                className="w-full px-3.5 py-3 bg-slate-100 border border-slate-300 rounded-xl text-xs sm:text-sm font-bold text-slate-700 cursor-not-allowed"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-extrabold text-slate-900 mb-1">Harga Jual (Rp) *</label>
              <input
                type="number"
                min={0}
                required
                value={price}
                onChange={(e) => setPrice(Number(e.target.value) || 0)}
                className="w-full px-3.5 py-3 border border-slate-300 rounded-xl text-xs sm:text-sm font-black text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-700"
              />
            </div>

            <div>
              <label className="block text-xs font-extrabold text-slate-900 mb-1">Diskon (Readonly)</label>
              <input
                type="text"
                readOnly
                value={`Rp ${discount.toLocaleString('id-ID')}`}
                className="w-full px-3.5 py-3 bg-slate-100 border border-slate-300 rounded-xl text-xs sm:text-sm font-extrabold text-amber-900 cursor-not-allowed"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-extrabold text-slate-900 mb-1">Catatan Tanaman (Opsional)</label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Misal: Karakter meliuk, cabutan..."
              className="w-full px-3.5 py-3 border border-slate-300 rounded-xl text-xs sm:text-sm font-medium focus:outline-none focus:ring-2 focus:ring-emerald-700"
            />
          </div>

          {/* Subtotal Calculation Box */}
          <div className="p-3.5 bg-emerald-50 rounded-2xl border border-emerald-200 flex items-center justify-between text-xs sm:text-sm font-extrabold">
            <span className="text-slate-700">Subtotal Item</span>
            <span className="text-emerald-800 text-sm sm:text-base font-black">
              Rp {((Number(quantity) || 1) * (Number(price) || 0)).toLocaleString('id-ID')}
            </span>
          </div>

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-300 rounded-xl text-xs font-bold transition-colors"
            >
              Batal
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 bg-emerald-800 hover:bg-emerald-900 text-white rounded-xl text-xs sm:text-sm font-extrabold flex items-center gap-1.5 shadow-md active:scale-95 transition-all"
            >
              <Plus className="w-4 h-4" /> Tambahkan
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
