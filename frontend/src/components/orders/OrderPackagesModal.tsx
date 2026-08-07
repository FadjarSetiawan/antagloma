import React, { useState } from 'react';
import { Order } from '../../types/order';
import { X, Package, Plus, CheckCircle2, Trash2, AlertCircle, FileText, Check, Scale } from 'lucide-react';

export interface PackageAssignment {
  id: string;
  letter: string; // 'A', 'B', 'C', etc.
  subOrderNumber: string; // e.g. 'ORD-07082026-0001-A'
  packageType: 'Fullset' | 'Non-fullset';
  allocations: Record<number, number>; // itemIndex -> quantity allocated
  customWeight?: number; // Manual weight override in kg
}

interface OrderPackagesModalProps {
  order: Order | null;
  onClose: () => void;
  onSavePackages: (orderId: number, packageAssignments: PackageAssignment[]) => Promise<void>;
}

export const OrderPackagesModal: React.FC<OrderPackagesModalProps> = ({
  order,
  onClose,
  onSavePackages,
}) => {
  if (!order) return null;

  const totalOrderItems = order.items || [];

  // Helper to compute letter from index (0 -> 'A', 1 -> 'B', 2 -> 'C')
  const getLetter = (index: number) => String.fromCharCode(65 + index);

  // Initial packages state: Package A with first plant selected
  const [packages, setPackages] = useState<PackageAssignment[]>(() => {
    const initialAllocations: Record<number, number> = {};
    if (totalOrderItems.length > 0) {
      initialAllocations[0] = Math.min(1, totalOrderItems[0].quantity);
    }

    return [
      {
        id: 'pkg-0',
        letter: 'A',
        subOrderNumber: `${order.order_number}-A`,
        packageType: 'Fullset',
        allocations: initialAllocations,
      },
    ];
  });

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  // Calculate used quantity across all packages for each item index
  const getUsedQuantity = (itemIdx: number, excludePackageId?: string) => {
    return packages.reduce((sum, pkg) => {
      if (pkg.id === excludePackageId) return sum;
      return sum + (pkg.allocations[itemIdx] || 0);
    }, 0);
  };

  // Add new package (Paket B, Paket C, etc.)
  const handleAddPackage = () => {
    const nextIndex = packages.length;
    const letter = getLetter(nextIndex);

    // Initial allocations for new package: find 1st item with remaining unassigned quantity
    const newAllocations: Record<number, number> = {};
    for (let idx = 0; idx < totalOrderItems.length; idx++) {
      const used = getUsedQuantity(idx);
      const remaining = totalOrderItems[idx].quantity - used;
      if (remaining > 0) {
        newAllocations[idx] = remaining;
        break; // Default Fullset starts with 1 item selection
      }
    }

    setPackages([
      ...packages,
      {
        id: `pkg-${Date.now()}`,
        letter,
        subOrderNumber: `${order.order_number}-${letter}`,
        packageType: 'Fullset',
        allocations: newAllocations,
      },
    ]);
  };

  // Remove package
  const handleRemovePackage = (pkgId: string) => {
    if (packages.length <= 1) return;
    const filtered = packages.filter((p) => p.id !== pkgId);

    // Re-index letters A, B, C
    const updated = filtered.map((pkg, idx) => {
      const letter = getLetter(idx);
      return {
        ...pkg,
        letter,
        subOrderNumber: `${order.order_number}-${letter}`,
      };
    });
    setPackages(updated);
  };

  // Switch package type (Fullset enforces max 1 plant)
  const handleSetPackageType = (pkgId: string, type: 'Fullset' | 'Non-fullset') => {
    setPackages(
      packages.map((pkg) => {
        if (pkg.id !== pkgId) return pkg;

        let newAllocations = { ...pkg.allocations };
        if (type === 'Fullset') {
          // Keep only the first selected item when switching to Fullset
          const keys = Object.keys(newAllocations);
          if (keys.length > 1) {
            const firstKey = Number(keys[0]);
            newAllocations = { [firstKey]: 1 };
          } else if (keys.length === 1) {
            const firstKey = Number(keys[0]);
            newAllocations[firstKey] = 1;
          }
        }

        return { ...pkg, packageType: type, allocations: newAllocations };
      })
    );
  };

  // Toggle plant selection in a package
  const handleToggleItemInPackage = (pkgId: string, itemIdx: number) => {
    const targetItem = totalOrderItems[itemIdx];
    if (!targetItem) return;

    setPackages(
      packages.map((pkg) => {
        if (pkg.id !== pkgId) return pkg;

        const currentAllocated = pkg.allocations[itemIdx] || 0;
        let newAllocations: Record<number, number> = { ...pkg.allocations };

        if (currentAllocated > 0) {
          // Uncheck item from this package
          delete newAllocations[itemIdx];
        } else {
          // Check item
          if (pkg.packageType === 'Fullset') {
            // FULLSET RULE: ONLY 1 PLANT CAN BE CHECKED AT A TIME
            newAllocations = { [itemIdx]: 1 };
          } else {
            // NON-FULLSET RULE: UNLIMITED PLANTS CAN BE CHECKED
            const usedElsewhere = getUsedQuantity(itemIdx, pkgId);
            const maxAvailable = targetItem.quantity - usedElsewhere;
            if (maxAvailable > 0) {
              newAllocations[itemIdx] = maxAvailable;
            }
          }
        }

        return { ...pkg, allocations: newAllocations };
      })
    );
  };

  // Update manual weight override
  const handleSetCustomWeight = (pkgId: string, weight?: number) => {
    setPackages(packages.map((p) => (p.id === pkgId ? { ...p, customWeight: weight } : p)));
  };

  // Helper to calculate auto weight & breakdown text
  const computePackageWeightInfo = (pkg: PackageAssignment) => {
    const itemsAllocated = Object.entries(pkg.allocations).filter(([_, qty]) => qty > 0);

    if (itemsAllocated.length === 0) {
      return {
        autoWeight: 0.0,
        breakdownText: 'Belum ada tanaman yang dipilih',
      };
    }

    const ratePerPlant = pkg.packageType === 'Fullset' ? 4.0 : 2.0;
    let totalQty = 0;
    const names: string[] = [];

    itemsAllocated.forEach(([idxStr, qty]) => {
      const itemIdx = Number(idxStr);
      const item = totalOrderItems[itemIdx];
      if (item) {
        totalQty += qty;
        names.push(`${item.tree_name || item.product_name} x${qty}`);
      }
    });

    const autoWeight = totalQty * ratePerPlant;
    const breakdownText = `Terisi dari: ${names.join(', ')} (${pkg.packageType.toLowerCase()} → ${ratePerPlant} kg/pohon)`;

    return {
      autoWeight,
      breakdownText,
    };
  };

  // Handle Save Submit
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Verify at least 1 plant selected
    let hasAllocatedItem = false;
    packages.forEach((pkg) => {
      if (Object.keys(pkg.allocations).length > 0) {
        hasAllocatedItem = true;
      }
    });

    if (!hasAllocatedItem) {
      setError('Harap pilih minimal 1 tanaman untuk dimasukkan ke dalam paket.');
      return;
    }

    setIsLoading(true);

    try {
      await onSavePackages(order.id, packages);
      onClose();
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Gagal menyimpan pengaturan paket.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-3 sm:p-5 overflow-y-auto w-full h-full font-sans">
      <div className="bg-[#f8f9fa] rounded-3xl border border-slate-200 w-[95%] max-w-lg md:max-w-xl lg:max-w-2xl shadow-2xl overflow-hidden my-auto max-h-[92vh] flex flex-col">
        {/* Header Modal Bar */}
        <div className="p-4 sm:p-5 bg-white border-b border-slate-200/80 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="p-1.5 text-slate-700 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer text-sm font-extrabold"
            >
              ←
            </button>
            <div>
              <h3 className="text-base sm:text-lg font-black text-slate-900 leading-tight">
                Atur Pengiriman
              </h3>
              <p className="text-xs text-slate-500 font-medium mt-0.5">
                {order.order_number} • {order.customer_name}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <form onSubmit={handleSubmit} className="p-4 sm:p-5 overflow-y-auto space-y-4 text-xs font-sans">
          {error && (
            <div className="p-3 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold flex items-center gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Sales Shipping Notes Banner */}
          {order.notes && (
            <div className="p-4 bg-amber-50/90 border border-amber-200/80 rounded-2xl space-y-1 text-xs shadow-2xs">
              <span className="font-extrabold text-amber-900 uppercase text-[10px] tracking-wider block flex items-center gap-1.5">
                📝 CATATAN PENGIRIMAN DARI SALES
              </span>
              <p className="text-amber-950 font-bold leading-relaxed italic">
                "{order.notes}"
              </p>
            </div>
          )}

          {/* List of Created Package Cards */}
          <div className="space-y-4">
            {packages.map((pkg) => {
              const weightInfo = computePackageWeightInfo(pkg);
              const displayWeight = pkg.customWeight !== undefined ? pkg.customWeight : weightInfo.autoWeight;

              return (
                <div
                  key={pkg.id}
                  className="p-4 bg-white border border-slate-200/90 rounded-3xl space-y-3.5 shadow-xs relative"
                >
                  {/* Header Package Card: Title & Sub-Order Code */}
                  <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                    <div className="flex items-center gap-2">
                      <span className="text-base font-black text-slate-900 flex items-center gap-1.5">
                        📦 Paket {pkg.letter}
                      </span>
                      <span className="text-[11px] font-bold text-slate-400">
                        ({pkg.subOrderNumber})
                      </span>
                    </div>

                    {packages.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleRemovePackage(pkg.id)}
                        className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-xl transition-colors cursor-pointer"
                        title="Hapus Paket Ini"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>

                  {/* 2 Selectable Pills: Fullset vs Non-fullset */}
                  <div className="grid grid-cols-2 gap-2.5">
                    <button
                      type="button"
                      onClick={() => handleSetPackageType(pkg.id, 'Fullset')}
                      className={`py-2.5 px-3 rounded-2xl border-2 font-bold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                        pkg.packageType === 'Fullset'
                          ? 'bg-emerald-50/80 border-[#04593f] text-[#04593f] shadow-2xs'
                          : 'bg-white border-slate-200 text-slate-400 hover:border-slate-300'
                      }`}
                    >
                      {pkg.packageType === 'Fullset' && <Check className="w-4 h-4" />}
                      <span>Fullset</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleSetPackageType(pkg.id, 'Non-fullset')}
                      className={`py-2.5 px-3 rounded-2xl border-2 font-bold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                        pkg.packageType === 'Non-fullset'
                          ? 'bg-emerald-50/80 border-[#04593f] text-[#04593f] shadow-2xs'
                          : 'bg-white border-slate-200 text-slate-400 hover:border-slate-300'
                      }`}
                    >
                      {pkg.packageType === 'Non-fullset' && <Check className="w-4 h-4" />}
                      <span>Non-fullset</span>
                    </button>
                  </div>

                  {/* Plant Checkbox List inside Package Card */}
                  <div className="space-y-2 pt-1">
                    {totalOrderItems.map((item, itemIdx) => {
                      const allocatedQty = pkg.allocations[itemIdx] || 0;
                      const isChecked = allocatedQty > 0;
                      const usedElsewhere = getUsedQuantity(itemIdx, pkg.id);
                      const remainingAvailable = item.quantity - usedElsewhere;

                      // Disable checkbox if item is completely allocated in other packages and 0 allocated in this package
                      const isDisabled = remainingAvailable <= 0 && !isChecked;

                      return (
                        <div
                          key={itemIdx}
                          onClick={() => {
                            if (!isDisabled) handleToggleItemInPackage(pkg.id, itemIdx);
                          }}
                          className={`p-3 rounded-2xl border transition-all flex items-center justify-between cursor-pointer ${
                            isChecked
                              ? 'bg-white border-slate-200/90 shadow-2xs'
                              : isDisabled
                              ? 'bg-slate-50 border-slate-100 opacity-40 cursor-not-allowed'
                              : 'bg-white border-slate-100 hover:border-slate-200'
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            {/* Checkbox Icon Circle */}
                            <div
                              className={`w-6 h-6 rounded-lg flex items-center justify-center transition-colors ${
                                isChecked
                                  ? 'bg-[#04593f] text-white shadow-2xs'
                                  : 'border-2 border-slate-300 bg-white'
                              }`}
                            >
                              {isChecked && <Check className="w-4 h-4 text-white" />}
                            </div>

                            {/* Item Name & Grade Badge */}
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className={`font-extrabold text-xs sm:text-sm ${isChecked ? 'text-slate-900' : 'text-slate-400'}`}>
                                {item.tree_name || item.product_name}
                              </span>
                              <span className="px-2 py-0.5 bg-slate-100 text-slate-700 border border-slate-200 rounded-md text-[10px] font-bold">
                                Grade {item.grade || 'A'}
                              </span>
                            </div>
                          </div>

                          {/* Quantity Value Badge */}
                          <div className="w-12 py-1 bg-slate-100 border border-slate-200 rounded-xl text-center font-extrabold text-xs text-slate-800">
                            {allocatedQty}
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* ⚖️ BERAT PAKET BOX (Match screenshot) */}
                  <div className="p-3.5 bg-emerald-50/70 border border-emerald-200/80 rounded-2xl space-y-2 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="font-extrabold text-slate-800 flex items-center gap-1.5 text-xs">
                        <Scale className="w-4 h-4 text-[#04593f]" />
                        <span>Berat Paket</span>
                      </span>
                      <span className="px-2.5 py-0.5 bg-[#04593f] text-white text-[9px] font-black uppercase rounded-md tracking-wider">
                        OTOMATIS
                      </span>
                    </div>

                    <input
                      type="number"
                      step="0.1"
                      min="0"
                      value={displayWeight}
                      onChange={(e) => {
                        const val = e.target.value === '' ? 0 : parseFloat(e.target.value);
                        handleSetCustomWeight(pkg.id, val);
                      }}
                      className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl font-black text-base sm:text-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-700 shadow-2xs"
                    />

                    <div className="space-y-0.5 text-[10px] text-slate-500 font-medium leading-tight pt-0.5">
                      <p className="italic text-slate-700 font-semibold">{weightInfo.breakdownText}</p>
                      <p className="text-slate-400">Bisa diedit manual kalau berat aktual berbeda</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* "+ Buat Paket Lagi" Button at Bottom */}
          <div className="pt-2">
            <button
              type="button"
              onClick={handleAddPackage}
              className="w-full py-3.5 bg-white hover:bg-emerald-50 text-[#04593f] border-2 border-[#04593f] rounded-2xl text-xs font-black flex items-center justify-center gap-2 transition-all cursor-pointer shadow-2xs"
            >
              <Plus className="w-4 h-4 text-[#04593f]" />
              <span>+ Buat Paket Lagi</span>
            </button>
          </div>

          {/* Modal Action Buttons Footer */}
          <div className="pt-3 border-t border-slate-200 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 bg-slate-200 hover:bg-slate-300 text-slate-800 rounded-xl text-xs font-black transition-colors cursor-pointer"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="px-5 py-2.5 bg-[#04593f] hover:bg-emerald-900 text-white rounded-xl text-xs font-black flex items-center gap-1.5 shadow-md active:scale-95 transition-all cursor-pointer"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>{isLoading ? 'Menyimpan Paket...' : 'Selesaikan & Buat Nota'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
