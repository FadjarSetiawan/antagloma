import React, { useState, useEffect } from 'react';
import { masterService } from '../../services/masterService';
import { MasterTree, MasterGrade, OrderItem } from '../../types/order';
import { X, Plus, AlertCircle, Sprout } from 'lucide-react';
import { CustomSelect } from '../shared/CustomSelect';

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
  const [quantity, setQuantity] = useState<number | ''>(1);
  const [price, setPrice] = useState<number | ''>(0);
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
  const numQty = Number(quantity) || 1;

  // Auto calculate Harga Jual = Harga Standar x Jumlah (Qty) whenever Grade or Qty changes
  useEffect(() => {
    if (chosenGradeObj) {
      if (chosenGradeObj.grade !== 'J+') {
        setPrice(chosenGradeObj.standard_price * numQty);
      }
    }
  }, [selectedGrade, numQty]);

  const numPrice = Number(price) || 0;
  const totalStandardForQty = standardPrice * numQty;
  const discount = totalStandardForQty > numPrice && selectedGrade !== 'J+' ? totalStandardForQty - numPrice : 0;

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
    if (numQty < 1) {
      setError('Jumlah quantity minimal 1.');
      return;
    }
    if (numPrice < 0) {
      setError('Harga jual tidak boleh kurang dari 0.');
      return;
    }

    const newItem: OrderItem = {
      tree_code: chosenTree?.code,
      tree_name: chosenTree?.name,
      grade: selectedGrade,
      product_name: chosenTree ? `${chosenTree.name} (Grade ${selectedGrade})` : `Adenium Grade ${selectedGrade}`,
      variant: `Grade ${selectedGrade}`,
      quantity: numQty,
      price: numPrice,
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

  const treeOptions = trees.map((t) => ({
    value: String(t.id),
    label: `${t.code} - ${t.name}`,
  }));

  const gradeOptions = grades.map((g) => ({
    value: g.grade,
    label: `Grade ${g.grade} (${g.grade === 'J+' ? 'Custom Price' : `Rp ${g.standard_price.toLocaleString('id-ID')}`})`,
  }));

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
            <CustomSelect
              options={treeOptions}
              value={String(selectedTreeId)}
              onChange={(val) => setSelectedTreeId(Number(val))}
              placeholder="-- Pilih ID Pohon --"
              disabled={isLoadingMaster}
              searchable
            />
          </div>

          <div>
            <label className="block text-xs font-extrabold text-slate-900 mb-1">Grade Tanaman *</label>
            <CustomSelect
              options={gradeOptions}
              value={selectedGrade}
              onChange={(val) => setSelectedGrade(val)}
              placeholder="-- Pilih Grade --"
              disabled={isLoadingMaster}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-extrabold text-slate-900 mb-1">Jumlah (Qty) *</label>
              <input
                type="number"
                min="1"
                required
                value={quantity}
                onFocus={(e) => e.target.select()}
                onChange={(e) => {
                  const val = e.target.value;
                  setQuantity(val === '' ? '' : parseInt(val, 10));
                }}
                className="w-full px-3.5 py-3 bg-white border border-slate-300 rounded-xl text-xs sm:text-sm font-extrabold focus:outline-none focus:ring-2 focus:ring-emerald-700 text-slate-900"
              />
            </div>

            <div>
              <label className="block text-xs font-extrabold text-slate-900 mb-1">
                Harga Jual Satuan (Rp) *
              </label>
              <input
                type="number"
                min="0"
                required
                value={price}
                onFocus={(e) => e.target.select()}
                onChange={(e) => {
                  const val = e.target.value;
                  setPrice(val === '' ? '' : parseFloat(val));
                }}
                className="w-full px-3.5 py-3 bg-white border border-slate-300 rounded-xl text-xs sm:text-sm font-extrabold focus:outline-none focus:ring-2 focus:ring-emerald-700 text-slate-900"
              />
            </div>
          </div>

          {/* Automatic Calculation Summary Box */}
          {selectedGrade && (
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-2xl space-y-1 text-xs font-extrabold text-slate-800">
              <div className="flex justify-between">
                <span className="text-slate-500 font-semibold">Harga Standar Grade:</span>
                <span>Rp {standardPrice.toLocaleString('id-ID')}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 font-semibold">Total Harga Standar:</span>
                <span>Rp {totalStandardForQty.toLocaleString('id-ID')}</span>
              </div>
              <div className="flex justify-between text-emerald-800 pt-1 border-t border-slate-200 font-black">
                <span>Diskon Terhitung:</span>
                <span>Rp {discount.toLocaleString('id-ID')}</span>
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs font-extrabold text-slate-900 mb-1">Catatan Khusus (Opsional)</label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Contoh: Pilihkan bunga warna merah pekat"
              className="w-full px-3.5 py-3 bg-white border border-slate-300 rounded-xl text-xs sm:text-sm font-bold focus:outline-none focus:ring-2 focus:ring-emerald-700 text-slate-900"
            />
          </div>

          <div className="pt-2 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 bg-slate-200 hover:bg-slate-300 text-slate-800 font-extrabold rounded-2xl text-xs transition-colors cursor-pointer"
            >
              Batal
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 bg-emerald-800 hover:bg-emerald-900 text-white font-extrabold rounded-2xl text-xs flex items-center gap-1.5 shadow-md active:scale-95 transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Tambah ke Order</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
