import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { orderService } from '../../services/orderService';
import { useAuth } from '../../contexts/AuthContext';
import { Region, OrderItem } from '../../types/order';
import { AddPlantModal } from '../../components/orders/AddPlantModal';
import {
  Plus,
  Trash2,
  ArrowLeft,
  ArrowRight,
  Send,
  CheckCircle2,
  AlertCircle,
  FileText,
  Sprout,
  User as UserIcon,
  Check,
  Copy,
  ChevronDown,
  ChevronUp,
  Building2,
  ImageIcon,
  Truck,
  Wallet,
} from 'lucide-react';

export const OrderCreatePage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  // Wizard Step State (1: Data Pesanan, 2: Detail Tanaman, 3: Pembayaran)
  const [step, setStep] = useState<1 | 2 | 3>(1);

  const todayStr = new Date().toISOString().split('T')[0];
  const dateFormatted = new Date()
    .toLocaleDateString('id-ID', { day: '2-digit', month: '2-digit', year: 'numeric' })
    .replace(/\//g, '');
  const previewOrderNum = `ORD-${dateFormatted}-XXXX`;

  // Accordion Expand/Collapse States
  const [isSection1Open, setIsSection1Open] = useState(true);
  const [isSection2Open, setIsSection2Open] = useState(true);

  // Step 1 State: Data Pesanan
  const [orderDate, setOrderDate] = useState(todayStr);
  const [customerName, setCustomerName] = useState('');
  const [phone, setPhone] = useState('');
  const [deliveryMethod, setDeliveryMethod] = useState('Kirim Paket');
  const [fullAddress, setFullAddress] = useState('');
  const [notes, setNotes] = useState('');

  // Regions
  const [provinces, setProvinces] = useState<Region[]>([]);
  const [regencies, setRegencies] = useState<Region[]>([]);
  const [districts, setDistricts] = useState<Region[]>([]);

  const [selectedProvince, setSelectedProvince] = useState<Region | null>(null);
  const [selectedRegency, setSelectedRegency] = useState<Region | null>(null);
  const [selectedDistrict, setSelectedDistrict] = useState<Region | null>(null);

  // Step 2 State: Detail Tanaman
  const [items, setItems] = useState<OrderItem[]>([]);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState('');

  // Step 3 State: Pembayaran
  const [paymentMethod, setPaymentMethod] = useState<'Transfer Bank' | 'QRIS' | 'Tunai'>('Transfer Bank');
  const [bankName, setBankName] = useState<'BCA' | 'BRI' | ''>('BCA');
  const [buyerShippingCost, setBuyerShippingCost] = useState<number>(0);
  const [paymentProofFile, setPaymentProofFile] = useState<File | null>(null);
  const [paymentProofPreview, setPaymentProofPreview] = useState<string | null>(null);

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [copiedToast, setCopiedToast] = useState(false);

  // Fetch Provinces
  useEffect(() => {
    orderService.getProvinces().then((data) => setProvinces(data)).catch(() => {});
  }, []);

  const handleProvinceChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const provId = e.target.value;
    const found = provinces.find((p) => p.id === provId) || null;
    setSelectedProvince(found);
    setSelectedRegency(null);
    setSelectedDistrict(null);
    setRegencies([]);
    setDistricts([]);

    if (provId) {
      orderService.getRegencies(provId).then((data) => setRegencies(data));
    }
  };

  const handleRegencyChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const regId = e.target.value;
    const found = regencies.find((r) => r.id === regId) || null;
    setSelectedRegency(found);
    setSelectedDistrict(null);
    setDistricts([]);

    if (regId) {
      orderService.getDistricts(regId).then((data) => setDistricts(data));
    }
  };

  const handleDistrictChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const distId = e.target.value;
    const found = districts.find((d) => d.id === distId) || null;
    setSelectedDistrict(found);
  };

  const handlePaymentProofChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selected = e.target.files[0];
      if (selected.size > 5 * 1024 * 1024) {
        setError('Ukuran file bukti pembayaran maksimal 5 MB.');
        return;
      }
      setPaymentProofFile(selected);
      setPaymentProofPreview(URL.createObjectURL(selected));
      setError('');
    }
  };

  const handleCopyOrderNum = () => {
    navigator.clipboard.writeText(previewOrderNum);
    setCopiedToast(true);
    setTimeout(() => setCopiedToast(false), 2000);
  };

  // Condition Locks
  const isStep1Valid = Boolean(customerName.trim() && phone.trim() && fullAddress.trim());
  const isStep2Valid = items.length > 0;
  const isStep3Valid = Boolean(
    paymentMethod &&
    (paymentMethod !== 'Transfer Bank' || Boolean(bankName)) &&
    paymentProofFile !== null &&
    orderDate
  );

  const handleAddPlant = (newItem: OrderItem) => {
    setItems((prev) => [...prev, newItem]);
    setIsAddModalOpen(false);

    setToastMessage('✅ Tanaman berhasil ditambahkan');
    setTimeout(() => {
      setToastMessage('');
    }, 2000);
  };

  const handleRemoveItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  // Financial Computations
  const totalItemCount = items.reduce((acc, curr) => acc + (Number(curr.quantity) || 0), 0);
  const totalPlantPrice = items.reduce((acc, curr) => acc + (Number(curr.quantity) || 0) * (Number(curr.price) || 0), 0);
  const actualShippingCost = deliveryMethod === 'Kirim Paket' ? Number(buyerShippingCost) || 0 : 0;
  const grandTotal = totalPlantPrice + actualShippingCost;

  const handleSubmitFinal = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!isStep1Valid || !isStep2Valid || !isStep3Valid) {
      setError('Harap lengkapi semua bidang wajib pembayaran dan unggah foto bukti pembayaran.');
      return;
    }

    setIsLoading(true);

    try {
      await orderService.createOrder({
        order_date: orderDate,
        customer_name: customerName,
        phone,
        delivery_method: deliveryMethod,
        province_id: selectedProvince?.id,
        province_name: selectedProvince?.name,
        regency_id: selectedRegency?.id,
        regency_name: selectedRegency?.name,
        district_id: selectedDistrict?.id,
        district_name: selectedDistrict?.name,
        full_address: fullAddress,
        notes,
        payment_method: paymentMethod,
        bank_name: paymentMethod === 'Transfer Bank' ? bankName : undefined,
        buyer_shipping_cost: actualShippingCost,
        payment_proof: paymentProofFile,
        items,
      });

      navigate('/orders');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Gagal membuat pesanan baru.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-5 pb-28">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-20 right-6 z-50 bg-emerald-900 text-white border-2 border-emerald-400 px-5 py-3 rounded-2xl shadow-2xl flex items-center gap-2 text-xs font-extrabold animate-bounce">
          <Check className="w-4 h-4 text-emerald-300" />
          <span>{toastMessage}</span>
        </div>
      )}

      {copiedToast && (
        <div className="fixed top-20 right-6 z-50 bg-slate-900 text-white px-4 py-2.5 rounded-xl text-xs font-bold shadow-xl">
          Nomor order disalin!
        </div>
      )}

      {/* Back Link & Header Title (Matches Screenshot 3 Exactly) */}
      <div className="space-y-1">
        <button
          onClick={() => navigate('/orders')}
          className="text-xs font-extrabold text-emerald-800 hover:text-emerald-950 flex items-center gap-1 mb-1"
        >
          <ArrowLeft className="w-4 h-4" /> Kembali ke Daftar Order
        </button>
        <h1 className="text-2xl font-black text-slate-900">Buat Pesanan Baru</h1>
        <p className="text-xs text-slate-500 font-medium">
          {step === 1 && 'Langkah 1: Lengkapi data pemesan dan pengiriman.'}
          {step === 2 && 'Langkah 2: Tambahkan varian tanaman Adenium.'}
          {step === 3 && 'Langkah 3: Konfirmasi metode pembayaran dan proses transaksi.'}
        </p>
      </div>

      {/* Stepper Progress Bar (Matches Screenshot 3 Exactly) */}
      <div className="bg-white border-2 border-slate-200 rounded-3xl p-5 shadow-xs">
        <div className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500 mb-4">PROGRESS PESANAN</div>
        
        <div className="flex items-center justify-between relative px-2">
          {/* Connector Line */}
          <div className="absolute top-4 left-10 right-10 h-0.5 border-t-2 border-dashed border-slate-300 -z-0" />

          {/* Step 1 */}
          <div
            onClick={() => setStep(1)}
            className="flex flex-col items-center z-10 cursor-pointer text-center"
          >
            <div className={`w-9 h-9 rounded-full flex items-center justify-center font-black text-sm shadow-xs ${
              step === 1 || isStep1Valid ? 'bg-emerald-800 text-white' : 'bg-slate-200 text-slate-600'
            }`}>
              {isStep1Valid ? <Check className="w-5 h-5" /> : '1'}
            </div>
            <span className={`text-xs mt-2 ${step === 1 ? 'font-extrabold text-emerald-800' : 'font-bold text-slate-700'}`}>Data Pes</span>
            <span className="text-[10px] text-slate-400 font-medium">{isStep1Valid ? 'Lengkap' : 'Wajib diisi'}</span>
          </div>

          {/* Step 2 */}
          <div
            onClick={() => isStep1Valid && setStep(2)}
            className={`flex flex-col items-center z-10 text-center ${!isStep1Valid ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}`}
          >
            <div className={`w-9 h-9 rounded-full flex items-center justify-center font-black text-sm shadow-xs ${
              step === 2 || isStep2Valid ? 'bg-emerald-800 text-white' : 'bg-slate-200 text-slate-600'
            }`}>
              {isStep2Valid ? <Check className="w-5 h-5" /> : '2'}
            </div>
            <span className={`text-xs mt-2 ${step === 2 ? 'font-extrabold text-emerald-800' : 'font-bold text-slate-700'}`}>Detail Tambahan</span>
            <span className="text-[10px] text-slate-400 font-medium">{isStep2Valid ? `${items.length} Tanaman` : 'Kosong'}</span>
          </div>

          {/* Step 3 */}
          <div
            onClick={() => isStep1Valid && isStep2Valid && setStep(3)}
            className={`flex flex-col items-center z-10 text-center ${!isStep1Valid || !isStep2Valid ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}`}
          >
            <div className={`w-9 h-9 rounded-full flex items-center justify-center font-black text-sm shadow-xs ${
              step === 3 ? 'bg-emerald-800 text-white' : 'bg-slate-200 text-slate-600'
            }`}>
              3
            </div>
            <span className={`text-xs mt-2 ${step === 3 ? 'font-extrabold text-emerald-800' : 'font-bold text-slate-700'}`}>Pembayaran</span>
            <span className="text-[10px] text-slate-400 font-medium">Konfirmasi</span>
          </div>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-2xl bg-rose-100 border border-rose-300 text-rose-950 text-xs font-bold flex items-center gap-2">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* STEP 1: DATA PESANAN (Accordion Cards matching Screenshot 3) */}
      {step === 1 && (
        <div className="space-y-4">
          {/* Section 1: Informasi Transaksi & Sales */}
          <div className="bg-white border-2 border-slate-200 rounded-3xl overflow-hidden shadow-xs">
            <div
              onClick={() => setIsSection1Open(!isSection1Open)}
              className="p-5 flex items-center justify-between cursor-pointer hover:bg-slate-50 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 flex items-center justify-center flex-shrink-0">
                  <FileText className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-extrabold text-slate-900 uppercase tracking-wide">1. INFORMASI TRANSAKSI & SALES</h3>
                  <p className="text-xs text-slate-500 font-medium">Informasi terkait transaksi dan petugas.</p>
                </div>
              </div>
              {isSection1Open ? <ChevronUp className="w-5 h-5 text-slate-400" /> : <ChevronDown className="w-5 h-5 text-slate-400" />}
            </div>

            {isSection1Open && (
              <div className="p-5 pt-0 space-y-4 border-t border-slate-100">
                <div>
                  <label className="block text-xs font-extrabold text-slate-900 mb-1">Nomor Order (Otomatis)</label>
                  <div className="relative">
                    <input
                      type="text"
                      readOnly
                      value={previewOrderNum}
                      className="w-full pl-3 pr-10 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold text-slate-700 cursor-not-allowed"
                    />
                    <button
                      type="button"
                      onClick={handleCopyOrderNum}
                      className="absolute right-3 top-3 text-slate-400 hover:text-slate-700"
                      title="Salin nomor order"
                    >
                      <Copy className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-extrabold text-slate-900 mb-1">Tanggal Transaksi *</label>
                  <input
                    type="date"
                    required
                    value={orderDate}
                    onChange={(e) => setOrderDate(e.target.value)}
                    className="w-full px-3 py-3 border border-slate-200 rounded-2xl text-xs focus:outline-none focus:ring-2 focus:ring-emerald-700 font-bold"
                  />
                </div>

                <div>
                  <label className="block text-xs font-extrabold text-slate-900 mb-1">Petugas Sales</label>
                  <input
                    type="text"
                    readOnly
                    value={user?.name || 'Sales Staff'}
                    className="w-full px-3 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold text-slate-800 cursor-not-allowed"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Section 2: Data Pemesan & Pengiriman */}
          <div className="bg-white border-2 border-slate-200 rounded-3xl overflow-hidden shadow-xs">
            <div
              onClick={() => setIsSection2Open(!isSection2Open)}
              className="p-5 flex items-center justify-between cursor-pointer hover:bg-slate-50 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 flex items-center justify-center flex-shrink-0">
                  <UserIcon className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-extrabold text-slate-900 uppercase tracking-wide">2. DATA PEMESAN & PENGIRIMAN</h3>
                  <p className="text-xs text-slate-500 font-medium">Data pelanggan dan detail pengiriman.</p>
                </div>
              </div>
              {isSection2Open ? <ChevronUp className="w-5 h-5 text-slate-400" /> : <ChevronDown className="w-5 h-5 text-slate-400" />}
            </div>

            {isSection2Open && (
              <div className="p-5 pt-0 space-y-4 border-t border-slate-100">
                <div>
                  <label className="block text-xs font-extrabold text-slate-900 mb-1">Nama Customer *</label>
                  <input
                    type="text"
                    required
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    placeholder="Contoh: Budi Santoso"
                    className="w-full px-3.5 py-3 border border-slate-200 rounded-2xl text-xs focus:outline-none focus:ring-2 focus:ring-emerald-700 font-bold"
                  />
                </div>

                <div>
                  <label className="block text-xs font-extrabold text-slate-900 mb-1">No WhatsApp / Telepon *</label>
                  <input
                    type="text"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="081234567890"
                    className="w-full px-3.5 py-3 border border-slate-200 rounded-2xl text-xs focus:outline-none focus:ring-2 focus:ring-emerald-700 font-bold"
                  />
                </div>

                <div>
                  <label className="block text-xs font-extrabold text-slate-900 mb-1">Metode Pengiriman *</label>
                  <select
                    value={deliveryMethod}
                    onChange={(e) => setDeliveryMethod(e.target.value)}
                    className="w-full px-3.5 py-3 border border-slate-200 rounded-2xl text-xs focus:outline-none focus:ring-2 focus:ring-emerald-700 bg-white font-bold"
                  >
                    <option value="Kirim Paket">Kirim Paket</option>
                    <option value="Packing Kayu">Packing Kayu</option>
                    <option value="Ambil di Tempat">Ambil di Tempat</option>
                    <option value="Antar ke Rumah">Antar ke Rumah</option>
                  </select>
                </div>

                {/* Cascading Regions */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">Provinsi</label>
                    <select
                      value={selectedProvince?.id || ''}
                      onChange={handleProvinceChange}
                      className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-emerald-700 bg-white font-semibold"
                    >
                      <option value="">-- Pilih Provinsi --</option>
                      {provinces.map((p) => (
                        <option key={p.id} value={p.id}>{p.name}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">Kabupaten / Kota</label>
                    <select
                      disabled={!selectedProvince}
                      value={selectedRegency?.id || ''}
                      onChange={handleRegencyChange}
                      className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-emerald-700 bg-white disabled:opacity-50 font-semibold"
                    >
                      <option value="">-- Pilih Kota / Kab --</option>
                      {regencies.map((r) => (
                        <option key={r.id} value={r.id}>{r.name}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">Kecamatan</label>
                    <select
                      disabled={!selectedRegency}
                      value={selectedDistrict?.id || ''}
                      onChange={handleDistrictChange}
                      className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-emerald-700 bg-white disabled:opacity-50 font-semibold"
                    >
                      <option value="">-- Pilih Kecamatan --</option>
                      {districts.map((d) => (
                        <option key={d.id} value={d.id}>{d.name}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-extrabold text-slate-900 mb-1">Alamat Lengkap Pengiriman *</label>
                  <textarea
                    required
                    rows={2}
                    value={fullAddress}
                    onChange={(e) => setFullAddress(e.target.value)}
                    placeholder="Jalan, No. Rumah, RT/RW, Patokan..."
                    className="w-full px-3.5 py-3 border border-slate-200 rounded-2xl text-xs focus:outline-none focus:ring-2 focus:ring-emerald-700 font-bold"
                  />
                </div>

                <div>
                  <label className="block text-xs font-extrabold text-slate-900 mb-1">Catatan Tambahan (Karakter Tanaman)</label>
                  <input
                    type="text"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Misal: Pilihkan bonggol karakter meliuk..."
                    className="w-full px-3.5 py-3 border border-slate-200 rounded-2xl text-xs focus:outline-none focus:ring-2 focus:ring-emerald-700 font-medium"
                  />
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* STEP 2: DETAIL TANAMAN */}
      {step === 2 && (
        <div className="space-y-5">
          <div className="bg-slate-100 border-2 border-slate-200 rounded-3xl p-4 flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-emerald-800 text-white flex items-center justify-center flex-shrink-0 font-bold">
              <FileText className="w-6 h-6" />
            </div>
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500 block">Informasi Pesanan</span>
              <p className="font-extrabold text-sm text-slate-900">{previewOrderNum}</p>
              <p className="text-xs text-slate-700 font-bold mt-0.5">
                {customerName || 'Customer'} — {orderDate ? new Date(orderDate).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }) : ''}
              </p>
            </div>
          </div>

          <div className="bg-white border-2 border-slate-200 rounded-3xl p-5 space-y-4 shadow-xs">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-extrabold text-slate-900">Daftar Tanaman</h2>
              <button
                type="button"
                onClick={() => setIsAddModalOpen(true)}
                className="px-4 py-2.5 bg-emerald-800 hover:bg-emerald-900 text-white rounded-2xl text-xs font-bold flex items-center gap-1.5 shadow-md hover:shadow-lg transition-all"
              >
                <Plus className="w-4 h-4" /> Tambah Tanaman
              </button>
            </div>

            {items.length === 0 ? (
              <div className="py-12 flex flex-col items-center justify-center text-center space-y-3 bg-slate-50 rounded-3xl border-2 border-dashed border-slate-200">
                <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center border border-emerald-300 text-emerald-800 shadow-xs">
                  <Sprout className="w-10 h-10" />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-slate-900">Belum ada tanaman</h3>
                  <p className="text-xs text-slate-500 mt-1 font-medium">Tambahkan tanaman agar pesanan dapat diproses</p>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                {items.map((item, index) => {
                  const seqNum = String(index + 1).padStart(3, '0');
                  const itemCode = `${item.tree_code || 'TN'}-${seqNum}`;
                  const itemStdPrice = item.standard_price ?? 0;
                  const itemPrice = item.price ?? 0;
                  const itemDiscount = item.discount ?? 0;
                  const itemTotal = (item.quantity || 1) * itemPrice;

                  return (
                    <div key={index} className="p-4 bg-white border-2 border-slate-200 rounded-3xl space-y-2.5 shadow-xs relative">
                      <div className="flex items-center justify-between border-b border-slate-200 pb-2.5">
                        <div className="flex items-center gap-2">
                          <span className="px-2.5 py-1 bg-slate-900 text-white font-extrabold text-xs rounded-lg">
                            {itemCode}
                          </span>
                          <span className="font-extrabold text-slate-900 text-xs">{item.tree_name || item.product_name}</span>
                          <span className="px-2 py-0.5 bg-emerald-800 text-white text-[10px] font-extrabold rounded-md uppercase">
                            Grade {item.grade || 'A'}
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleRemoveItem(index)}
                          className="px-2.5 py-1 bg-rose-100 hover:bg-rose-200 border border-rose-300 text-rose-900 rounded-lg text-xs font-bold flex items-center gap-1 transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" /> Hapus
                        </button>
                      </div>

                      <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-xs">
                        <div>
                          <span className="text-slate-500 font-semibold block text-[10px]">Harga Standar</span>
                          <span className="font-bold text-slate-700 block">
                            {item.grade === 'J+' ? '-' : itemStdPrice > 0 ? `Rp ${itemStdPrice.toLocaleString('id-ID')}` : '-'}
                          </span>
                        </div>

                        <div>
                          <span className="text-slate-500 font-semibold block text-[10px]">Harga Jual</span>
                          <span className="font-extrabold text-slate-900 block">Rp {itemPrice.toLocaleString('id-ID')}</span>
                        </div>

                        <div>
                          <span className="text-slate-500 font-semibold block text-[10px]">Diskon</span>
                          <span className="font-extrabold text-amber-900 block">{itemDiscount > 0 ? `Rp ${itemDiscount.toLocaleString('id-ID')}` : '-'}</span>
                        </div>

                        <div>
                          <span className="text-slate-500 font-semibold block text-[10px]">Qty</span>
                          <span className="font-extrabold text-slate-900 block">{item.quantity}</span>
                        </div>

                        <div className="col-span-2 sm:col-span-1 text-left sm:text-right">
                          <span className="text-slate-500 font-semibold block text-[10px]">Subtotal</span>
                          <span className="font-extrabold text-emerald-800 text-xs block">Rp {itemTotal.toLocaleString('id-ID')}</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            <div className="p-4 bg-slate-100 rounded-2xl border border-slate-300 space-y-2 text-xs">
              <div className="flex justify-between items-center text-slate-700 font-bold">
                <span>Total Item</span>
                <span className="font-extrabold text-slate-900">{totalItemCount}</span>
              </div>
              <div className="flex justify-between items-center text-slate-900 border-t border-slate-300 pt-2 font-extrabold text-sm">
                <span>Total Harga Tanaman</span>
                <span className="text-emerald-800">Rp {totalPlantPrice.toLocaleString('id-ID')}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* STEP 3: MODUL PEMBAYARAN */}
      {step === 3 && (
        <form onSubmit={handleSubmitFinal} className="space-y-5">
          <div className="bg-white border-2 border-slate-200 rounded-3xl p-5 space-y-4 shadow-xs">
            <h2 className="text-xs font-extrabold text-slate-900 uppercase tracking-wider flex items-center gap-2">
              <Wallet className="w-4 h-4 text-emerald-800" /> Metode Pembayaran *
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {[
                { id: 'Transfer Bank', label: '🏦 Transfer Bank', desc: 'BCA / BRI' },
                { id: 'QRIS', label: '📱 QRIS', desc: 'Scan QR Code' },
                { id: 'Tunai', label: '💵 Tunai', desc: 'Bayar di Kebun' },
              ].map((pm) => {
                const isSelected = paymentMethod === pm.id;
                return (
                  <div
                    key={pm.id}
                    onClick={() => {
                      setPaymentMethod(pm.id as any);
                      if (pm.id === 'Transfer Bank' && !bankName) setBankName('BCA');
                    }}
                    className={`p-4 rounded-2xl border-2 cursor-pointer transition-all ${
                      isSelected
                        ? 'bg-emerald-800 text-white border-emerald-900 shadow-md font-bold'
                        : 'bg-white border-slate-300 text-slate-800 hover:bg-slate-50'
                    }`}
                  >
                    <span className="block text-xs font-extrabold">{pm.label}</span>
                    <span className={`block text-[10px] mt-0.5 ${isSelected ? 'text-emerald-100' : 'text-slate-500'}`}>{pm.desc}</span>
                  </div>
                );
              })}
            </div>

            {paymentMethod === 'Transfer Bank' && (
              <div className="p-4 bg-slate-50 border border-slate-300 rounded-2xl space-y-2">
                <label className="block text-xs font-bold text-slate-900 mb-1 flex items-center gap-1">
                  <Building2 className="w-4 h-4 text-emerald-800" /> Bank Tujuan *
                </label>
                <select
                  required
                  value={bankName}
                  onChange={(e) => setBankName(e.target.value as any)}
                  className="w-full px-3 py-2.5 bg-white border border-slate-300 rounded-xl text-xs font-extrabold focus:outline-none focus:ring-2 focus:ring-emerald-700 text-slate-900"
                >
                  <option value="BCA">BCA (Bank Central Asia)</option>
                  <option value="BRI">BRI (Bank Rakyat Indonesia)</option>
                </select>
              </div>
            )}

            {deliveryMethod === 'Kirim Paket' && (
              <div className="p-4 bg-slate-50 border border-slate-300 rounded-2xl space-y-2">
                <label className="block text-xs font-bold text-slate-900 mb-1 flex items-center gap-1">
                  <Truck className="w-4 h-4 text-emerald-800" /> Ongkir Pembeli (Rp) *
                </label>
                <input
                  type="number"
                  min={0}
                  required
                  value={buyerShippingCost}
                  onChange={(e) => setBuyerShippingCost(Number(e.target.value) || 0)}
                  placeholder="Misal: 45000"
                  className="w-full px-3 py-2.5 bg-white border border-slate-300 rounded-xl text-xs font-extrabold focus:outline-none focus:ring-2 focus:ring-emerald-700 text-slate-900"
                />
              </div>
            )}

            <div className="space-y-2 pt-2">
              <label className="block text-xs font-bold text-slate-900 mb-1 flex items-center gap-1">
                <ImageIcon className="w-4 h-4 text-emerald-800" /> Bukti Pembayaran (JPG/PNG/WEBP, Max 5MB) *
              </label>
              <div className="border-2 border-dashed border-slate-300 rounded-2xl p-4 text-center hover:border-emerald-700 transition-colors bg-slate-50 relative">
                <input
                  type="file"
                  required
                  accept="image/jpeg,image/jpg,image/png,image/webp"
                  onChange={handlePaymentProofChange}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                />
                {paymentProofPreview ? (
                  <div className="space-y-2">
                    <img src={paymentProofPreview} alt="Preview Bukti Bayar" className="max-h-48 mx-auto rounded-xl object-cover border border-slate-300 shadow-sm" />
                    <p className="text-xs text-emerald-800 font-bold">✅ Foto terpilih. Klik untuk mengganti file.</p>
                  </div>
                ) : (
                  <div className="py-4 space-y-2">
                    <div className="w-10 h-10 bg-slate-200 rounded-full flex items-center justify-center mx-auto text-slate-700">
                      <ImageIcon className="w-5 h-5" />
                    </div>
                    <p className="text-xs font-bold text-slate-800">Klik atau seret foto bukti transfer/bayar ke sini</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="bg-white border-2 border-slate-200 rounded-3xl p-5 space-y-3 shadow-xs">
            <h2 className="text-xs font-extrabold text-slate-900 uppercase tracking-wider border-b border-slate-200 pb-2.5">
              Ringkasan Tagihan & Grand Total
            </h2>
            <div className="space-y-2 text-xs">
              <div className="flex justify-between items-center text-slate-700 font-bold">
                <span>Total Harga Tanaman</span>
                <span className="font-extrabold text-slate-900">Rp {totalPlantPrice.toLocaleString('id-ID')}</span>
              </div>

              {deliveryMethod === 'Kirim Paket' && (
                <div className="flex justify-between items-center text-slate-700 font-bold">
                  <span>Ongkir Pembeli</span>
                  <span className="font-extrabold text-slate-900">Rp {actualShippingCost.toLocaleString('id-ID')}</span>
                </div>
              )}

              <div className="border-t-2 border-slate-300 pt-3 flex justify-between items-center text-base font-black text-slate-900">
                <span>Grand Total</span>
                <span className="text-emerald-800 text-lg font-black">Rp {grandTotal.toLocaleString('id-ID')}</span>
              </div>
            </div>
          </div>
        </form>
      )}

      {/* FIXED FULL-WIDTH MOBILE BOTTOM ACTION BAR (Matches Screenshot 3 Exactly) */}
      <div className="fixed bottom-14 md:bottom-4 left-0 right-0 z-30 px-4 max-w-4xl mx-auto">
        {step === 1 && (
          <button
            type="button"
            disabled={!isStep1Valid}
            onClick={() => setStep(2)}
            className={`w-full py-4 rounded-2xl text-xs font-extrabold transition-all duration-200 flex items-center justify-center gap-2 shadow-xl ${
              isStep1Valid
                ? 'bg-emerald-800 hover:bg-emerald-900 text-white shadow-emerald-900/30 cursor-pointer active:scale-98'
                : 'bg-slate-200 text-slate-400 cursor-not-allowed opacity-60'
            }`}
          >
            <span>Lanjut ke Langkah 2</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        )}

        {step === 2 && (
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setStep(1)}
              className="px-5 py-4 bg-white border-2 border-slate-300 text-slate-800 font-extrabold rounded-2xl text-xs shadow-md"
            >
              Kembali
            </button>
            <button
              type="button"
              disabled={!isStep2Valid}
              onClick={() => setStep(3)}
              className={`flex-1 py-4 rounded-2xl text-xs font-extrabold transition-all duration-200 flex items-center justify-center gap-2 shadow-xl ${
                isStep2Valid
                  ? 'bg-emerald-800 hover:bg-emerald-900 text-white shadow-emerald-900/30 cursor-pointer active:scale-98'
                  : 'bg-slate-200 text-slate-400 cursor-not-allowed opacity-60'
              }`}
            >
              <span>Lanjut Pembayaran</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        )}

        {step === 3 && (
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setStep(2)}
              className="px-5 py-4 bg-white border-2 border-slate-300 text-slate-800 font-extrabold rounded-2xl text-xs shadow-md"
            >
              Kembali
            </button>
            <button
              type="button"
              disabled={!isStep3Valid || isLoading}
              onClick={handleSubmitFinal}
              className={`flex-1 py-4 rounded-2xl text-xs font-extrabold transition-all duration-200 flex items-center justify-center gap-2 shadow-xl ${
                isStep3Valid && !isLoading
                  ? 'bg-emerald-800 hover:bg-emerald-900 text-white shadow-emerald-900/30 cursor-pointer active:scale-98'
                  : 'bg-slate-200 text-slate-400 cursor-not-allowed opacity-60'
              }`}
            >
              <Send className="w-4 h-4" />
              <span>{isLoading ? 'Menyimpan Transaksi...' : 'Simpan & Process Order'}</span>
            </button>
          </div>
        )}
      </div>

      {/* Add Plant Modal */}
      <AddPlantModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onAddPlant={handleAddPlant}
      />
    </div>
  );
};
