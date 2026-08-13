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
  const isWoodPacking = order.delivery_method === 'Packing Kayu';

  // Helper to compute letter from index (0 -> 'A', 1 -> 'B', 2 -> 'C')
  const getLetter = (index: number) => String.fromCharCode(65 + index);

  // Helper to check if grade is D or higher
  const isGradeDOrHigher = (grade?: string) => {
    if (!grade) return false;
    const upper = grade.toUpperCase();
    return upper.startsWith('D') || upper.startsWith('E') || upper.startsWith('F') || upper.startsWith('J');
  };

  // Initial packages state: Load existing saved packages if present, otherwise start Package A
  const [packages, setPackages] = useState<PackageAssignment[]>(() => {
    if (order.packages && order.packages.length > 0) {
      const existingAssignments: PackageAssignment[] = order.packages.map((savedPkg, idx) => {
        const allocations: Record<number, number> = {};
        if (savedPkg.items) {
          savedPkg.items.forEach((pi) => {
            const itemIdx = totalOrderItems.findIndex((item, i) => (item.id ? item.id === pi.order_item_id : i === idx));
            if (itemIdx !== -1) {
              allocations[itemIdx] = pi.quantity;
            }
          });
        }

        const letter = savedPkg.letter || getLetter(idx);
        return {
          id: `saved-pkg-${savedPkg.id || idx}`,
          letter,
          subOrderNumber: `${order.order_number}-${letter}`,
          packageType: (savedPkg.package_type as 'Fullset' | 'Non-fullset') || (isWoodPacking ? 'Non-fullset' : 'Fullset'),
          allocations,
          customWeight: savedPkg.weight,
        };
      });

      const usedPerItemIdx = (itemIdx: number) => {
        return existingAssignments.reduce((sum, pkg) => sum + (pkg.allocations[itemIdx] || 0), 0);
      };

      const hasUnallocatedItems = totalOrderItems.some((item, idx) => item.quantity > usedPerItemIdx(idx));

      if (hasUnallocatedItems) {
        const nextIndex = existingAssignments.length;
        const letter = getLetter(nextIndex);
        const newAllocations: Record<number, number> = {};

        for (let idx = 0; idx < totalOrderItems.length; idx++) {
          const remaining = totalOrderItems[idx].quantity - usedPerItemIdx(idx);
          if (remaining > 0) {
            newAllocations[idx] = remaining;
            break;
          }
        }

        existingAssignments.push({
          id: `pkg-${Date.now()}`,
          letter,
          subOrderNumber: `${order.order_number}-${letter}`,
          packageType: isWoodPacking ? 'Non-fullset' : 'Fullset',
          allocations: newAllocations,
        });
      }

      return existingAssignments;
    }

    const initialAllocations: Record<number, number> = {};
    if (totalOrderItems.length > 0) {
      initialAllocations[0] = Math.min(1, totalOrderItems[0].quantity);
    }

    return [
      {
        id: 'pkg-0',
        letter: 'A',
        subOrderNumber: `${order.order_number}-A`,
        packageType: isWoodPacking ? 'Non-fullset' : 'Fullset',
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
        packageType: isWoodPacking ? 'Non-fullset' : 'Fullset',
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
        if (type === 'Non-fullset') {
          // A selected Non Fullset item starts at the maximum quantity still available.
          newAllocations = Object.fromEntries(Object.keys(newAllocations).map((key) => {
            const itemIdx = Number(key);
            const targetItem = totalOrderItems[itemIdx];
            return [itemIdx, targetItem ? Math.max(0, targetItem.quantity - getUsedQuantity(itemIdx, pkg.id)) : 0];
          }).filter(([, quantity]) => quantity > 0));
        } else if (type === 'Fullset') {
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
          if (pkg.packageType === 'Fullset' && !isWoodPacking) {
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

  // Helper to get standard plant weight in kg based on Grade & Fullset/Non-Fullset
  const getPlantWeightInKg = (grade?: string, isFullset: boolean = false): number => {
    if (!grade) return isFullset ? 4.0 : 2.0;
    const g = grade.trim().toUpperCase();

    if (g === 'A') return isFullset ? 0.0 : 0.2;     // 200 gr
    if (g === 'B') return isFullset ? 0.0 : 0.4;     // 400 gr
    if (g === 'B+') return isFullset ? 0.0 : 0.5;    // 500 gr
    if (g === 'C') return isFullset ? 0.0 : 0.6;     // 600 gr
    if (g === 'C+') return isFullset ? 0.0 : 1.0;    // 1 kg
    if (g === 'D') return isFullset ? 6.0 : 2.0;     // 2 kg / 6 kg
    if (g === 'D+') return isFullset ? 6.0 : 2.0;    // 2 kg / 6 kg
    if (g === 'J') return isFullset ? 8.0 : 4.0;     // 4 kg / 8 kg
    if (g === 'J+') return isFullset ? 10.0 : 5.0;   // 5 kg / 10 kg

    return isFullset ? 4.0 : 2.0;
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

    const isFullset = pkg.packageType === 'Fullset';
    let calculatedWeight = 0;
    const itemDetails: string[] = [];

    itemsAllocated.forEach(([idxStr, qty]) => {
      const itemIdx = Number(idxStr);
      const item = totalOrderItems[itemIdx];
      if (item) {
        const itemWeightPerUnit = getPlantWeightInKg(item.grade, isFullset);
        calculatedWeight += itemWeightPerUnit * qty;
        itemDetails.push(`${item.tree_name || item.product_name} (Grade ${item.grade || 'A'}) x${qty}`);
      }
    });

    const breakdownText = `Terisi dari: ${itemDetails.join(', ')}`;

    return {
      autoWeight: Number(calculatedWeight.toFixed(2)),
      breakdownText,
    };
  };

  // Weight visibility check rule:
  // - Non-fullset: ALWAYS VISIBLE for any grade
  // - Fullset: ONLY VISIBLE if allocated plant grade is Grade D or higher (D, D+, J, J+)
  const shouldShowWeightBox = (pkg: PackageAssignment) => {
    if (pkg.packageType === 'Non-fullset') return true;

    // For Fullset: check allocated item grade
    const itemsAllocated = Object.entries(pkg.allocations).filter(([_, qty]) => qty > 0);
    if (itemsAllocated.length === 0) return false;

    const firstItemIdx = Number(itemsAllocated[0][0]);
    const selectedItem = totalOrderItems[firstItemIdx];
    return isGradeDOrHigher(selectedItem?.grade);
  };

  // Handle Save Submit
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Calculate total allocated plants across all packages
    const totalAllocatedQty = totalOrderItems.reduce((sum, _, idx) => sum + getUsedQuantity(idx), 0);

    if (totalAllocatedQty === 0) {
      setError('Pilih minimal 1 tanaman untuk dimasukkan ke paket.');
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
      <div className="bg-[#f8f9fa] rounded-2xl border border-slate-200 w-[95%] max-w-lg md:max-w-xl shadow-xl overflow-hidden my-auto max-h-[92vh] flex flex-col">
        {/* Header Modal Bar */}
        <div className="p-3.5 sm:p-4 bg-white border-b border-slate-200/80 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-emerald-50 text-[#04593f] flex items-center justify-center font-bold">
              <Package className="w-4.5 h-4.5 text-[#04593f]" />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-bold text-slate-900 leading-tight">
                Atur Pengiriman
              </h3>
              <p className="text-[11px] text-slate-400 font-normal mt-0.5">
                {order.order_number} • {order.customer_name}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <form onSubmit={handleSubmit} className="p-3.5 sm:p-4 overflow-y-auto space-y-3.5 text-xs font-sans">
          {error && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold flex items-center gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* PLANT ALLOCATION PROGRESS INDICATOR BANNER */}
          {(() => {
            const totalRequiredQty = totalOrderItems.reduce((sum, item) => sum + (item.quantity || 1), 0);
            const totalAllocatedQty = totalOrderItems.reduce((sum, _, idx) => sum + getUsedQuantity(idx), 0);
            const isComplete = totalAllocatedQty >= totalRequiredQty;
            const remainingQty = Math.max(0, totalRequiredQty - totalAllocatedQty);

            return (
              <div className={`p-3 rounded-xl border flex items-center justify-between text-xs font-bold transition-colors ${
                isComplete
                  ? 'bg-emerald-50 text-[#04593f] border-emerald-300'
                  : 'bg-amber-50 text-amber-900 border-amber-300'
              }`}>
                <div className="flex items-center gap-2">
                  <Package className="w-4 h-4 flex-shrink-0 text-[#04593f]" />
                  <span>Status Pemilihan Tanaman:</span>
                </div>
                <span className={`px-2.5 py-0.5 rounded-lg text-[11px] font-black ${
                  isComplete ? 'bg-emerald-200 text-emerald-950' : 'bg-amber-200 text-amber-950'
                }`}>
                  {totalAllocatedQty} / {totalRequiredQty} Pohon {isComplete ? '✓ Lengkap' : `(Sisa ${remainingQty} Belum Diatur)`}
                </span>
              </div>
            );
          })()}

          {/* Sales Shipping Notes Banner */}
          {order.notes && (
            <div className="p-3 bg-amber-50/90 border border-amber-200/80 rounded-xl space-y-1 text-xs shadow-2xs">
              <span className="font-bold text-amber-900 uppercase text-[10px] tracking-wider block flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5 text-amber-700" />
                <span>CATATAN PENGIRIMAN DARI SALES</span>
              </span>
              <p className="text-amber-950 font-medium leading-relaxed italic mt-0.5">
                "{order.notes}"
              </p>
            </div>
          )}

          {/* List of Created Package Cards */}
          <div className="space-y-3.5">
            {packages.map((pkg) => {
              const weightInfo = computePackageWeightInfo(pkg);
              const displayWeight = pkg.customWeight !== undefined ? pkg.customWeight : weightInfo.autoWeight;
              const isWeightVisible = shouldShowWeightBox(pkg);

              return (
                <div
                  key={pkg.id}
                  className="p-3.5 bg-white border border-slate-200/90 rounded-2xl space-y-3 shadow-2xs relative"
                >
                  {/* Header Package Card */}
                  <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
                    <div className="flex items-center gap-2">
                      <Package className="w-4 h-4 text-[#04593f]" />
                      <span className="text-sm font-bold text-slate-900">
                        Paket {pkg.letter}
                      </span>
                      <span className="text-[11px] font-semibold text-slate-400 bg-slate-100 px-2 py-0.5 rounded-md border border-slate-200">
                        {pkg.subOrderNumber}
                      </span>
                    </div>

                    {packages.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleRemovePackage(pkg.id)}
                        className="p-1 text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                        title="Hapus Paket Ini"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>

                  {/* Package type is intentionally omitted for Packing Kayu. */}
                  {order.delivery_method !== 'Packing Kayu' && <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => handleSetPackageType(pkg.id, 'Fullset')}
                      className={`py-2 px-3 rounded-xl border font-bold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                        pkg.packageType === 'Fullset'
                          ? 'bg-emerald-50 text-[#04593f] border-[#04593f] shadow-2xs'
                          : 'bg-white border-slate-200 text-slate-400 hover:border-slate-300'
                      }`}
                    >
                      {pkg.packageType === 'Fullset' && <Check className="w-3.5 h-3.5" />}
                      <span>Fullset</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleSetPackageType(pkg.id, 'Non-fullset')}
                      className={`py-2 px-3 rounded-xl border font-bold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                        pkg.packageType === 'Non-fullset'
                          ? 'bg-emerald-50 text-[#04593f] border-[#04593f] shadow-2xs'
                          : 'bg-white border-slate-200 text-slate-400 hover:border-slate-300'
                      }`}
                    >
                      {pkg.packageType === 'Non-fullset' && <Check className="w-3.5 h-3.5" />}
                      <span>Non-fullset</span>
                    </button>
                  </div>}

                  {/* Plant Checkbox List inside Package Card */}
                  <div className="space-y-1.5 pt-0.5">
                    {totalOrderItems.map((item, itemIdx) => {
                      const allocatedQty = pkg.allocations[itemIdx] || 0;
                      const isChecked = allocatedQty > 0;
                      const usedElsewhere = getUsedQuantity(itemIdx, pkg.id);
                      const remainingAvailable = item.quantity - usedElsewhere;

                      const isFullyPackedElsewhere = usedElsewhere >= item.quantity && !isChecked;
                      const isDisabled = isFullyPackedElsewhere;
                      const showCheckedIcon = isChecked || isFullyPackedElsewhere;

                      return (
                        <div
                          key={itemIdx}
                          onClick={() => {
                            if (!isDisabled) handleToggleItemInPackage(pkg.id, itemIdx);
                          }}
                          className={`p-2.5 rounded-xl border transition-all flex items-center justify-between ${
                            isChecked
                              ? 'bg-white border-slate-300 shadow-2xs cursor-pointer'
                              : isFullyPackedElsewhere
                              ? 'bg-emerald-50/60 border-emerald-200/90 cursor-not-allowed opacity-85'
                              : 'bg-white border-slate-100 hover:border-slate-200 cursor-pointer'
                          }`}
                        >
                          <div className="flex items-center gap-2.5">
                            {/* Checkbox Icon Circle */}
                            <div
                              className={`w-5 h-5 rounded-md flex items-center justify-center transition-colors ${
                                showCheckedIcon
                                  ? 'bg-[#04593f] text-white shadow-2xs'
                                  : 'border-2 border-slate-300 bg-white'
                              }`}
                            >
                              {showCheckedIcon && <Check className="w-3.5 h-3.5 text-white" />}
                            </div>

                            {/* Item Name & Grade Badge */}
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className={`font-bold text-xs ${showCheckedIcon ? 'text-slate-900' : 'text-slate-400'}`}>
                                {item.tree_name || item.product_name}
                              </span>
                              <span className="px-1.5 py-0.5 bg-slate-100 text-slate-700 border border-slate-200 rounded text-[10px] font-bold">
                                Grade {item.grade || 'A'}
                              </span>
                              {isFullyPackedElsewhere ? (
                                <span className="w-full text-[10px] text-emerald-800 font-semibold italic flex items-center gap-1">
                                  ✓ Sudah dikemas & diatur di paket sebelumnya (tidak dapat dipilih lagi)
                                </span>
                              ) : pkg.packageType === 'Fullset' && (
                                <span className="w-full text-[10px] text-slate-500 font-medium">
                                  Tersedia {remainingAvailable} pohon · {allocatedQty > 0 ? `${allocatedQty} pohon di Paket ${pkg.letter}` : 'belum dialokasikan ke paket ini'}
                                </span>
                              )}
                            </div>
                          </div>

                          {(isWoodPacking || pkg.packageType === 'Non-fullset') ? (
                            <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                              <button type="button" disabled={!allocatedQty || isDisabled} onClick={() => setPackages(packages.map(p => p.id === pkg.id ? { ...p, allocations: { ...p.allocations, [itemIdx]: Math.max(0, allocatedQty - 1) } } : p))} className="h-8 w-8 rounded-lg border border-slate-200 font-black disabled:opacity-40">−</button>
                              <span className="w-8 text-center font-black text-xs">{isFullyPackedElsewhere ? usedElsewhere : allocatedQty}</span>
                              <button type="button" disabled={allocatedQty >= remainingAvailable || isDisabled} onClick={() => setPackages(packages.map(p => p.id === pkg.id ? { ...p, allocations: { ...p.allocations, [itemIdx]: Math.min(remainingAvailable, allocatedQty + 1) } } : p))} className="h-8 w-8 rounded-lg bg-[#04593f] text-white font-black disabled:opacity-40">+</button>
                            </div>
                          ) : (
                            <div className="w-10 py-0.5 bg-slate-100 border border-slate-200 rounded-lg text-center font-bold text-xs text-slate-800">
                              {isFullyPackedElsewhere ? usedElsewhere : allocatedQty}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  {/* BERAT PAKET BOX (Only if condition met) */}
                  {isWeightVisible && (
                    <div className="p-3 bg-emerald-50/70 border border-emerald-200/80 rounded-xl space-y-1.5 text-xs">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-slate-800 flex items-center gap-1.5 text-xs">
                          <Scale className="w-3.5 h-3.5 text-[#04593f]" />
                          <span>Berat Paket</span>
                        </span>
                        <span className="px-2 py-0.5 bg-[#04593f] text-white text-[9px] font-bold uppercase rounded tracking-wider">
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
                        className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg font-bold text-sm text-slate-900 focus:outline-none focus:ring-1 focus:ring-[#04593f] shadow-2xs"
                      />

                      <div className="space-y-0.5 text-[10px] text-slate-500 font-medium leading-tight pt-0.5">
                        <p className="italic text-slate-700 font-semibold">{weightInfo.breakdownText}</p>
                        <p className="text-slate-400">Bisa diedit manual kalau berat aktual berbeda</p>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* "+ Buat Paket Lagi" Button (Auto-disabled when 100% plants allocated) */}
          {(() => {
            const totalRequiredQty = totalOrderItems.reduce((sum, item) => sum + (item.quantity || 1), 0);
            const totalAllocatedQty = totalOrderItems.reduce((sum, _, idx) => sum + getUsedQuantity(idx), 0);
            const isAllAllocated = totalAllocatedQty >= totalRequiredQty;

            return (
              <div className="pt-1">
                <button
                  type="button"
                  disabled={isAllAllocated}
                  onClick={handleAddPackage}
                  className="w-full py-2.5 bg-white hover:bg-emerald-50 text-[#04593f] border border-[#04593f] rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-2xs disabled:bg-slate-100 disabled:text-slate-400 disabled:border-slate-300 disabled:cursor-not-allowed disabled:shadow-none"
                >
                  <Plus className={`w-4 h-4 ${isAllAllocated ? 'text-slate-400' : 'text-[#04593f]'}`} />
                  <span>{isAllAllocated ? 'Semua Tanaman Sudah Diatur Paketnya' : 'Tambah Paket Lagi'}</span>
                </button>
              </div>
            );
          })()}

          {/* Modal Action Buttons Footer */}
          <div className="pt-2 border-t border-slate-200 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition-colors cursor-pointer"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="px-4 py-2 bg-[#04593f] hover:bg-emerald-900 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-2xs active:scale-95 transition-all cursor-pointer disabled:opacity-50"
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
