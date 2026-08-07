import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { orderService, Region } from '../../services/orderService';
import { OrderItem } from '../../types/order';
import { AddPlantModal } from '../../components/orders/AddPlantModal';
import {
  Plus,
  Trash2,
  ArrowLeft,
  Check,
  FileText,
  User as UserIcon,
  MapPin,
  Sprout,
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
  const previewOrderNum = `ORD-${dateFormatted}-0001`;

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

      {/* Back Link & Header Title */}
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

      {/* Stepper Progress Bar */}
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
            <span className={`text-xs mt-2 ${step === 1 ? 'font-extrabold text-emerald-800' : 'font-bold text-slate-700'}`}>Data Pesanan</span>
            <span className="text-[10px] text-slate-400 font-medium">{isStep1Valid ? 'Lengkap' : 'Wajib diisi'}</span>
          </div>

          {/* Step 2 */}
          <div
            onClick={() => isStep1Valid && setStep(2)}
            className={`flex flex-col items-center z-10 text-center ${isStep1Valid ? 'cursor-pointer' : 'cursor-not-allowed opacity-60'}`}
          >
            <div className={`w-9 h-9 rounded-full flex items-center justify-center font-black text-sm shadow-xs ${
              step === 2 || isStep2Valid ? 'bg-emerald-800 text-white' : 'bg-slate-200 text-slate-600'
            }`}>
              {isStep2Valid ? <Check className="w-5 h-5" /> : '2'}
            </div>
            <span className={`text-xs mt-2 ${step === 2 ? 'font-extrabold text-emerald-800' : 'font-bold text-slate-700'}`}>Detail Tanaman</span>
            <span className="text-[10px] text-slate-400 font-medium">{isStep2Valid ? `${items.length} tanaman` : 'Kosong'}</span>
          </div>

          {/* Step 3 */}
          <div
            onClick={() => isStep1Valid && isStep2Valid && setStep(3)}
            className={`flex flex-col items-center z-10 text-center ${isStep1Valid && isStep2Valid ? 'cursor-pointer' : 'cursor-not-allowed opacity-60'}`}
          >
            <div className={`w-9 h-9 rounded-full flex items-center justify-center font-black text-sm shadow-xs ${
              step === 3 || isStep3Valid ? 'bg-emerald-800 text-white' : 'bg-slate-200 text-slate-600'
            }`}>
              {isStep3Valid ? <Check className="w-5 h-5" /> : '3'}
            </div>
            <span className={`text-xs mt-2 ${step === 3 ? 'font-extrabold text-emerald-800' : 'font-bold text-slate-700'}`}>Pembayaran</span>
            <span className="text-[10px] text-slate-400 font-medium">{isStep3Valid ? 'Siap Proses' : 'Konfirmasi'}</span>
          </div>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-rose-100 border border-rose-300 text-rose-950 rounded-2xl text-xs font-bold">
          {error}
        </div>
      )}

      {/* FORM WIZARD STEPS */}

      {/* STEP 1: Data Pesanan & Pengiriman */}
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
                  <div className="flex items-center gap-2 p-3 bg-slate-100 border border-slate-200 rounded-2xl text-xs font-bold text-slate-800">
                    <UserIcon className="w-4 h-4 text-slate-500" />
                    <span>{user?.name || 'Sales Staff'}</span>
                  </div>
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
                    className="w-full px-3 py-3 border border-slate-200 rounded-2xl text-xs font-bold focus:outline-none focus:ring-2 focus:ring-emerald-700"
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
                    className="w-full px-3 py-3 border border-slate-200 rounded-2xl text-xs font-bold focus:outline-none focus:ring-2 focus:ring-emerald-700"
                  />
                </div>

                <div>
                  <label className="block text-xs font-extrabold text-slate-900 mb-1">Metode Pengiriman *</label>
                  <select
                    value={deliveryMethod}
                    onChange={(e) => setDeliveryMethod(e.target.value)}
                    className="w-full px-3 py-3 border border-slate-200 rounded-2xl text-xs font-bold focus:outline-none focus:ring-2 focus:ring-emerald-700 bg-white"
                  >
                    <option value="Kirim Paket">Kirim Paket</option>
                    <option value="Packing Kayu">Packing Kayu</option>
                    <option value="Ambil Sendiri">Ambil Sendiri</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-extrabold text-slate-900 mb-1">Provinsi</label>
                  <select
                    value={selectedProvince?.id || ''}
                    onChange={handleProvinceChange}
                    className="w-full px-3 py-3 border border-slate-200 rounded-2xl text-xs font-bold focus:outline-none focus:ring-2 focus:ring-emerald-700 bg-white"
                  >
                    <option value="">-- Pilih Provinsi --</option>
                    {provinces.map((prov) => (
                      <option key={prov.id} value={prov.id}>
                        {prov.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-extrabold text-slate-900 mb-1">Kota / Kabupaten</label>
                  <select
                    disabled={!selectedProvince}
                    value={selectedRegency?.id || ''}
                    onChange={handleRegencyChange}
                    className="w-full px-3 py-3 border border-slate-200 rounded-2xl text-xs font-bold focus:outline-none focus:ring-2 focus:ring-emerald-700 bg-white disabled:opacity-50"
                  >
                    <option value="">-- Pilih Kota / Kabupaten --</option>
                    {regencies.map((reg) => (
                      <option key={reg.id} value={reg.id}>
                        {reg.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-extrabold text-slate-900 mb-1">Kecamatan</label>
                  <select
                    disabled={!selectedRegency}
                    value={selectedDistrict?.id || ''}
                    onChange={handleDistrictChange}
                    className="w-full px-3 py-3 border border-slate-200 rounded-2xl text-xs font-bold focus:outline-none focus:ring-2 focus:ring-emerald-700 bg-white disabled:opacity-50"
                  >
                    <option value="">-- Pilih Kecamatan --</option>
                    {districts.map((dist) => (
                      <option key={dist.id} value={dist.id}>
                        {dist.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-extrabold text-slate-900 mb-1">Alamat Lengkap *</label>
                  <textarea
                    rows={3}
                    required
                    value={fullAddress}
                    onChange={(e) => setFullAddress(e.target.value)}
                    placeholder="Jl. Merdeka No. 123, RT 01/RW 02..."
                    className="w-full p-3 border border-slate-200 rounded-2xl text-xs font-bold focus:outline-none focus:ring-2 focus:ring-emerald-700"
                  />
                </div>

                <div>
                  <label className="block text-xs font-extrabold text-slate-900 mb-1">Catatan Pesanan (Opsional)</label>
                  <input
                    type="text"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Contoh: Titip di satpam jika rumah kosong..."
                    className="w-full px-3 py-3 border border-slate-200 rounded-2xl text-xs font-bold focus:outline-none focus:ring-2 focus:ring-emerald-700"
                  />
                </div>
              </div>
            )}
          </div>

          <div className="flex justify-end pt-2">
            <button
              type="button"
              disabled={!isStep1Valid}
              onClick={() => setStep(2)}
              className="w-full sm:w-auto px-6 py-3 bg-emerald-800 hover:bg-emerald-900 text-white rounded-2xl text-xs font-extrabold shadow-md hover:shadow-lg disabled:opacity-50 transition-all cursor-pointer"
            >
              Lanjut ke Langkah 2 →
            </button>
          </div>
        </div>
      )}

      {/* STEP 2: Detail Tanaman Adenium */}
      {step === 2 && (
        <div className="space-y-4">
          <div className="bg-white border-2 border-slate-200 rounded-3xl p-5 space-y-4 shadow-xs">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-extrabold text-slate-900 uppercase tracking-wide flex items-center gap-2">
                  <Sprout className="w-4 h-4 text-emerald-800" /> DAFTAR TANAMAN ADENIUM
                </h3>
                <p className="text-xs text-slate-500 font-medium mt-0.5">Tambahkan varian pohon dan grade yang dipesan.</p>
              </div>

              <button
                type="button"
                onClick={() => setIsAddModalOpen(true)}
                className="px-4 py-2.5 bg-emerald-800 hover:bg-emerald-900 text-white rounded-2xl text-xs font-extrabold flex items-center gap-1.5 shadow-md active:scale-95 transition-all cursor-pointer"
              >
                <Plus className="w-4 h-4" /> Tambah Tanaman
              </button>
            </div>

            {items.length === 0 ? (
              <div className="border-2 border-dashed border-slate-200 rounded-2xl p-8 text-center space-y-2">
                <Sprout className="w-8 h-8 text-slate-300 mx-auto" />
                <p className="text-xs font-bold text-slate-500">Belum ada tanaman yang ditambahkan.</p>
                <p className="text-[11px] text-slate-400">Klik tombol "Tambah Tanaman" di atas untuk memilih varian adenium.</p>
              </div>
            ) : (
              <div className="overflow-x-auto rounded-2xl border border-slate-200">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-100 border-b border-slate-200 text-slate-700 font-extrabold uppercase text-[10px]">
                    <tr>
                      <th className="py-3 px-4">Tanaman / Varian</th>
                      <th className="py-3 px-4 w-20 text-center">Grade</th>
                      <th className="py-3 px-4 w-20 text-center">Qty</th>
                      <th className="py-3 px-4 text-right">Harga (Rp)</th>
                      <th className="py-3 px-4 text-right">Subtotal</th>
                      <th className="py-3 px-4 w-16 text-center">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 font-bold text-slate-900">
                    {items.map((item, idx) => {
                      const subtotal = (Number(item.quantity) || 0) * (Number(item.price) || 0);
                      return (
                        <tr key={idx} className="hover:bg-slate-50 transition-colors">
                          <td className="py-3 px-4">
                            <span className="font-extrabold text-slate-900 block">{item.tree_code} - {item.tree_name || item.product_name}</span>
                            {item.notes && <span className="text-[10px] text-slate-400 block">{item.notes}</span>}
                          </td>
                          <td className="py-3 px-4 text-center">
                            <span className="px-2 py-0.5 bg-emerald-100 text-emerald-900 rounded font-black text-[10px]">
                              {item.grade}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-center">{item.quantity}</td>
                          <td className="py-3 px-4 text-right font-black">Rp {Number(item.price).toLocaleString('id-ID')}</td>
                          <td className="py-3 px-4 text-right font-black text-emerald-900">Rp {subtotal.toLocaleString('id-ID')}</td>
                          <td className="py-3 px-4 text-center">
                            <button
                              type="button"
                              onClick={() => handleRemoveItem(idx)}
                              className="p-1.5 text-rose-600 hover:bg-rose-100 rounded-lg transition-colors"
                              title="Hapus"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          <div className="flex items-center justify-between pt-2">
            <button
              type="button"
              onClick={() => setStep(1)}
              className="px-5 py-3 bg-slate-200 hover:bg-slate-300 text-slate-800 rounded-2xl text-xs font-extrabold transition-colors cursor-pointer"
            >
              ← Kembali ke Langkah 1
            </button>
            <button
              type="button"
              disabled={!isStep2Valid}
              onClick={() => setStep(3)}
              className="px-6 py-3 bg-emerald-800 hover:bg-emerald-900 text-white rounded-2xl text-xs font-extrabold shadow-md hover:shadow-lg disabled:opacity-50 transition-all cursor-pointer"
            >
              Lanjut ke Langkah 3 →
            </button>
          </div>
        </div>
      )}

      {/* STEP 3: Pembayaran & Konfirmasi Final */}
      {step === 3 && (
        <form onSubmit={handleSubmitFinal} className="space-y-4">
          <div className="bg-white border-2 border-slate-200 rounded-3xl p-5 space-y-4 shadow-xs">
            <h3 className="text-sm font-extrabold text-slate-900 uppercase tracking-wide flex items-center gap-2">
              <Wallet className="w-4 h-4 text-emerald-800" /> 3. RINCIAN PEMBAYARAN & KONFIRMASI
            </h3>

            {/* Metode Pembayaran Card Selector */}
            <div>
              <label className="block text-xs font-extrabold text-slate-900 mb-2">Metode Pembayaran *</label>
              <div className="grid grid-cols-3 gap-2.5">
                {(['Transfer Bank', 'QRIS', 'Tunai'] as const).map((method) => (
                  <button
                    key={method}
                    type="button"
                    onClick={() => setPaymentMethod(method)}
                    className={`py-3 px-3 rounded-2xl text-xs font-extrabold border flex flex-col items-center gap-1.5 transition-all ${
                      paymentMethod === method
                        ? 'bg-emerald-800 text-white border-emerald-900 shadow-md scale-105'
                        : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    {method === 'Transfer Bank' && <Building2 className="w-5 h-5" />}
                    {method === 'QRIS' && <Wallet className="w-5 h-5" />}
                    {method === 'Tunai' && <Truck className="w-5 h-5" />}
                    <span>{method}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Sub-pilihan Bank jika Transfer Bank */}
            {paymentMethod === 'Transfer Bank' && (
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-2">
                <label className="block text-xs font-extrabold text-slate-900 mb-1">Pilih Bank Tujuan *</label>
                <div className="flex items-center gap-4">
                  <label className="flex items-center gap-2 text-xs font-extrabold text-slate-800 cursor-pointer">
                    <input
                      type="radio"
                      name="bank"
                      value="BCA"
                      checked={bankName === 'BCA'}
                      onChange={() => setBankName('BCA')}
                      className="w-4 h-4 text-emerald-800 focus:ring-emerald-700"
                    />
                    <span>Bank BCA</span>
                  </label>

                  <label className="flex items-center gap-2 text-xs font-extrabold text-slate-800 cursor-pointer">
                    <input
                      type="radio"
                      name="bank"
                      value="BRI"
                      checked={bankName === 'BRI'}
                      onChange={() => setBankName('BRI')}
                      className="w-4 h-4 text-emerald-800 focus:ring-emerald-700"
                    />
                    <span>Bank BRI</span>
                  </label>
                </div>
              </div>
            )}

            {/* Input Ongkos Kirim Pembeli */}
            {deliveryMethod === 'Kirim Paket' && (
              <div>
                <label className="block text-xs font-extrabold text-slate-900 mb-1">Ongkos Kirim Pembeli (Rp)</label>
                <input
                  type="number"
                  min={0}
                  value={buyerShippingCost || ''}
                  onChange={(e) => setBuyerShippingCost(Number(e.target.value) || 0)}
                  placeholder="Contoh: 25000"
                  className="w-full px-3.5 py-3 border border-slate-200 rounded-2xl text-xs font-extrabold focus:outline-none focus:ring-2 focus:ring-emerald-700"
                />
              </div>
            )}

            {/* Upload Bukti Pembayaran */}
            <div>
              <label className="block text-xs font-extrabold text-slate-900 mb-1">Upload Bukti Pembayaran *</label>
              <div className="border-2 border-dashed border-slate-300 rounded-2xl p-4 text-center hover:bg-slate-50 transition-colors relative">
                <input
                  type="file"
                  accept="image/png,image/jpeg,image/jpg,image/webp"
                  required
                  onChange={handlePaymentProofChange}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                />
                <div className="flex flex-col items-center gap-1.5">
                  <ImageIcon className="w-6 h-6 text-slate-400" />
                  <span className="text-xs font-extrabold text-emerald-800">
                    {paymentProofFile ? paymentProofFile.name : 'Klik atau drag foto bukti transfer/pembayaran di sini'}
                  </span>
                  <span className="text-[10px] text-slate-400">Format: JPG, PNG, WEBP (Maksimal 5MB)</span>
                </div>
              </div>

              {paymentProofPreview && (
                <div className="mt-3 flex items-center gap-3 p-2 bg-slate-100 rounded-2xl border border-slate-200 w-fit">
                  <img src={paymentProofPreview} alt="Preview Bukti" className="w-16 h-16 object-cover rounded-xl border" />
                  <div className="text-xs">
                    <span className="font-bold text-slate-800 block">Preview Bukti Bayar</span>
                    <span className="text-[10px] text-emerald-700 font-extrabold">Siap diunggah</span>
                  </div>
                </div>
              )}
            </div>

            {/* Ringkasan Biaya Final */}
            <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl space-y-2 text-xs">
              <div className="flex justify-between font-bold text-slate-700">
                <span>Total Tanaman ({totalItemCount} pcs)</span>
                <span>Rp {totalPlantPrice.toLocaleString('id-ID')}</span>
              </div>
              {deliveryMethod === 'Kirim Paket' && (
                <div className="flex justify-between font-bold text-slate-700">
                  <span>Ongkos Kirim Pembeli</span>
                  <span>Rp {actualShippingCost.toLocaleString('id-ID')}</span>
                </div>
              )}
              <div className="flex justify-between font-black text-sm text-slate-900 border-t border-emerald-200 pt-2">
                <span>GRAND TOTAL</span>
                <span className="text-emerald-900">Rp {grandTotal.toLocaleString('id-ID')}</span>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between pt-2">
            <button
              type="button"
              onClick={() => setStep(2)}
              className="px-5 py-3 bg-slate-200 hover:bg-slate-300 text-slate-800 rounded-2xl text-xs font-extrabold transition-colors cursor-pointer"
            >
              ← Kembali ke Langkah 2
            </button>
            <button
              type="submit"
              disabled={isLoading || !isStep3Valid}
              className="px-8 py-3 bg-emerald-800 hover:bg-emerald-900 text-white rounded-2xl text-xs font-black shadow-lg hover:shadow-xl active:scale-95 disabled:opacity-50 transition-all cursor-pointer flex items-center gap-2"
            >
              {isLoading ? 'Memproses Pesanan...' : 'Proses & Simpan Pesanan ✓'}
            </button>
          </div>
        </form>
      )}

      {/* Modal Tambah Tanaman */}
      {isAddModalOpen && (
        <AddPlantModal
          isOpen={isAddModalOpen}
          onClose={() => setIsAddModalOpen(false)}
          onAddPlant={handleAddPlant}
        />
      )}
    </div>
  );
};
