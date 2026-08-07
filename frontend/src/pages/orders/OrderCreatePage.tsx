import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { orderService, Region } from '../../services/orderService';
import { AddPlantModal } from '../../components/orders/AddPlantModal';
import { OrderItem } from '../../types/order';
import { CustomSelect } from '../../components/shared/CustomSelect';
import {
  ArrowLeft,
  Check,
  Plus,
  Trash2,
  Upload,
  Copy,
  ChevronDown,
  ChevronUp,
  FileText,
  User as UserIcon,
  CreditCard,
  Building2,
  QrCode,
  DollarSign,
  Sprout,
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

export const OrderCreatePage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  // Wizard Step State (1: Data Pesanan & Pengiriman, 2: Detail Tanaman, 3: Pembayaran & Konfirmasi)
  const [step, setStep] = useState<1 | 2 | 3>(1);

  // Accordion Section States inside Step 1 & 3
  const [isSection1Open, setIsSection1Open] = useState(true);
  const [isSection2Open, setIsSection2Open] = useState(true);

  // Form Fields - Step 1
  const [orderDate, setOrderDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [previewOrderNum, setPreviewOrderNum] = useState<string>('ORD-0001');
  const [customerName, setCustomerName] = useState('');
  const [phone, setPhone] = useState('');
  const [deliveryMethod, setDeliveryMethod] = useState<string>('Kirim Paket');
  const [fullAddress, setFullAddress] = useState('');
  const [notes, setNotes] = useState('');

  // Regions State
  const [provinces, setProvinces] = useState<Region[]>([]);
  const [regencies, setRegencies] = useState<Region[]>([]);
  const [districts, setDistricts] = useState<Region[]>([]);

  const [selectedProvince, setSelectedProvince] = useState<Region | null>(null);
  const [selectedRegency, setSelectedRegency] = useState<Region | null>(null);
  const [selectedDistrict, setSelectedDistrict] = useState<Region | null>(null);

  // Form Fields - Step 2: Items List
  const [items, setItems] = useState<OrderItem[]>([]);
  const [isAddPlantModalOpen, setIsAddPlantModalOpen] = useState(false);

  // Form Fields - Step 3: Payment
  const [paymentMethod, setPaymentMethod] = useState<string>('Transfer Bank');
  const [bankName, setBankName] = useState<string>('BCA');
  const [buyerShippingCost, setBuyerShippingCost] = useState<number | ''>(0);
  const [paymentProofFile, setPaymentProofFile] = useState<File | null>(null);
  const [paymentProofPreview, setPaymentProofPreview] = useState<string | null>(null);

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [copiedToast, setCopiedToast] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Auto-generate preview order number
  useEffect(() => {
    orderService.getOrders({ per_page: 1 }).then((res) => {
      const total = res.meta?.total || 0;
      const dateStr = orderDate.replace(/-/g, '');
      const seq = String(total + 1).padStart(4, '0');
      setPreviewOrderNum(`ORD-${dateStr}-${seq}`);
    }).catch(() => {
      const dateStr = orderDate.replace(/-/g, '');
      setPreviewOrderNum(`ORD-${dateStr}-0001`);
    });
  }, [orderDate]);

  // Load Provinces
  useEffect(() => {
    orderService.getProvinces().then((data) => {
      setProvinces(data);
    });
  }, []);

  // Cascading Regions
  const handleProvinceChange = (provId: string) => {
    const prov = provinces.find((p) => p.id === provId) || null;
    setSelectedProvince(prov);
    setSelectedRegency(null);
    setSelectedDistrict(null);
    setRegencies([]);
    setDistricts([]);

    if (provId) {
      orderService.getRegencies(provId).then((data) => {
        setRegencies(data);
      });
    }
  };

  const handleRegencyChange = (regId: string) => {
    const reg = regencies.find((r) => r.id === regId) || null;
    setSelectedRegency(reg);
    setSelectedDistrict(null);
    setDistricts([]);

    if (regId) {
      orderService.getDistricts(regId).then((data) => {
        setDistricts(data);
      });
    }
  };

  const handleDistrictChange = (distId: string) => {
    const dist = districts.find((d) => d.id === distId) || null;
    setSelectedDistrict(dist);
  };

  // Payment Proof Image Upload
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setPaymentProofFile(file);
      setPaymentProofPreview(URL.createObjectURL(file));
    }
  };

  const handleCopyOrderNum = () => {
    navigator.clipboard.writeText(previewOrderNum);
    setCopiedToast(true);
    setTimeout(() => setCopiedToast(false), 3000);
  };

  // Step Validation Rules
  const isStep1Valid = customerName.trim() !== '' && phone.trim() !== '' && fullAddress.trim() !== '';
  const isStep2Valid = items.length > 0;
  const isStep3Valid = paymentProofFile !== null;

  const handleAddPlant = (plant: OrderItem) => {
    setItems([...items, plant]);
    setIsAddPlantModalOpen(false);
    setToastMessage(`Berhasil menambahkan ${plant.product_name}!`);
    setTimeout(() => setToastMessage(null), 3500);
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

  const deliveryOptions = [
    { value: 'Kirim Paket', label: 'Kirim Paket' },
    { value: 'Packing Kayu', label: 'Packing Kayu' },
    { value: 'Ambil Sendiri', label: 'Ambil Sendiri' },
  ];

  const provinceOptions = provinces.map((p) => ({ value: p.id, label: p.name }));
  const regencyOptions = regencies.map((r) => ({ value: r.id, label: r.name }));
  const districtOptions = districts.map((d) => ({ value: d.id, label: d.name }));

  const bankOptions = [
    { value: 'BCA', label: 'Bank BCA (829-0123-456 a.n. Antagloma)' },
    { value: 'BRI', label: 'Bank BRI (0021-01-000123-50-1 a.n. Antagloma)' },
  ];

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
          className="text-xs font-extrabold text-emerald-800 hover:text-emerald-950 flex items-center gap-1 cursor-pointer mb-1"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> Kembali ke Daftar Order
        </button>
        <h1 className="text-xl sm:text-2xl font-black text-slate-900">Buat Pesanan Baru</h1>
        <p className="text-xs text-slate-500 font-medium">
          Langkah {step} dari 3: {step === 1 ? 'Lengkapi data pemesan dan pengiriman.' : step === 2 ? 'Pilih varian tanaman dan jumlah.' : 'Konfirmasi pembayaran & unggah bukti.'}
        </p>
      </div>

      {/* STEPPER PROGRESS BAR (Matches Screenshot 2 Exactly: Data Pesanan, Detail Tanaman, Pembayaran) */}
      <div className="bg-white border-2 border-slate-200 rounded-3xl p-5 shadow-xs">
        <div className="flex items-center justify-between max-w-lg mx-auto relative">
          {/* Connecting Lines */}
          <div className="absolute top-4 left-10 right-10 h-0.5 bg-slate-200 z-0" />
          <div
            className="absolute top-4 left-10 h-0.5 bg-emerald-800 z-0 transition-all duration-300"
            style={{ width: step === 1 ? '0%' : step === 2 ? '50%' : '100%' }}
          />

          {/* Step 1 Circle */}
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
            <span className="text-[10px] text-slate-400 font-medium">{isStep1Valid ? 'Wajib diisi' : 'Kosong'}</span>
          </div>

          {/* Step 2 Circle */}
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
            <span className="text-[10px] text-slate-400 font-medium">{isStep2Valid ? `${items.length} Item` : 'Kosong'}</span>
          </div>

          {/* Step 3 Circle */}
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
                <div className="w-10 h-10 rounded-2xl bg-emerald-800 text-white flex items-center justify-center flex-shrink-0 shadow-xs">
                  <FileText className="w-5 h-5 text-white" />
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
                <div className="w-10 h-10 rounded-2xl bg-emerald-800 text-white flex items-center justify-center flex-shrink-0 shadow-xs">
                  <UserIcon className="w-5 h-5 text-white" />
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
                  <CustomSelect
                    options={deliveryOptions}
                    value={deliveryMethod}
                    onChange={setDeliveryMethod}
                  />
                </div>

                <div>
                  <label className="block text-xs font-extrabold text-slate-900 mb-1">Provinsi</label>
                  <CustomSelect
                    options={provinceOptions}
                    value={selectedProvince?.id || ''}
                    onChange={handleProvinceChange}
                    placeholder="-- Pilih Provinsi --"
                    searchable
                  />
                </div>

                <div>
                  <label className="block text-xs font-extrabold text-slate-900 mb-1">Kota / Kabupaten</label>
                  <CustomSelect
                    options={regencyOptions}
                    value={selectedRegency?.id || ''}
                    onChange={handleRegencyChange}
                    placeholder="-- Pilih Kota / Kabupaten --"
                    disabled={!selectedProvince}
                    searchable
                  />
                </div>

                <div>
                  <label className="block text-xs font-extrabold text-slate-900 mb-1">Kecamatan</label>
                  <CustomSelect
                    options={districtOptions}
                    value={selectedDistrict?.id || ''}
                    onChange={handleDistrictChange}
                    placeholder="-- Pilih Kecamatan --"
                    disabled={!selectedRegency}
                    searchable
                  />
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

          <div className="pt-2">
            <button
              type="button"
              disabled={!isStep1Valid}
              onClick={() => setStep(2)}
              className="w-full py-4 bg-emerald-800 hover:bg-emerald-900 disabled:opacity-50 text-white rounded-2xl text-xs font-black shadow-md transition-all active:scale-95 cursor-pointer"
            >
              Lanjut ke Langkah 2 (Detail Tanaman) →
            </button>
          </div>
        </div>
      )}

      {/* STEP 2: Detail Tanaman */}
      {step === 2 && (
        <div className="space-y-4">
          <div className="bg-white border-2 border-slate-200 rounded-3xl p-5 space-y-4 shadow-xs">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-extrabold text-slate-900 uppercase tracking-wide">DETAIL TANAMAN ADENIUM</h3>
                <p className="text-xs text-slate-500 font-medium">Tambahkan item varian pohon yang dipesan.</p>
              </div>
              <button
                type="button"
                onClick={() => setIsAddPlantModalOpen(true)}
                className="px-4 py-2.5 bg-emerald-800 hover:bg-emerald-900 text-white rounded-2xl text-xs font-extrabold flex items-center gap-1.5 shadow-sm active:scale-95 transition-all cursor-pointer"
              >
                <Plus className="w-4 h-4 text-white" /> + Tambah Tanaman
              </button>
            </div>

            {items.length === 0 ? (
              <div className="p-8 text-center border-2 border-dashed border-slate-200 rounded-2xl space-y-2">
                <Sprout className="w-10 h-10 text-slate-300 mx-auto" />
                <p className="text-xs font-bold text-slate-500">Belum ada tanaman yang ditambahkan.</p>
                <button
                  type="button"
                  onClick={() => setIsAddPlantModalOpen(true)}
                  className="text-xs font-black text-emerald-800 hover:underline"
                >
                  Klik di sini untuk memilih varian pohon
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {items.map((item, idx) => (
                  <div key={idx} className="p-4 bg-slate-50 border border-slate-200 rounded-2xl flex items-center justify-between gap-3 text-xs">
                    <div>
                      <div className="font-extrabold text-slate-900 text-sm">
                        {item.product_name}
                      </div>
                      <div className="text-slate-500 font-medium mt-0.5">
                        {item.quantity} × Rp {Number(item.price).toLocaleString('id-ID')} = <span className="font-bold text-slate-900">Rp {(item.quantity * item.price).toLocaleString('id-ID')}</span>
                      </div>
                      {item.notes && <div className="text-[11px] text-slate-400 font-medium italic mt-0.5">Catatan: {item.notes}</div>}
                    </div>

                    <button
                      type="button"
                      onClick={() => handleRemoveItem(idx)}
                      className="p-2 text-rose-600 hover:bg-rose-50 rounded-xl"
                      title="Hapus tanaman"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}

                <div className="pt-2 border-t border-slate-200 flex justify-between items-center text-xs font-black text-slate-900">
                  <span>Total Item: {totalItemCount} Tanaman</span>
                  <span className="text-emerald-800 text-sm">Rp {totalPlantPrice.toLocaleString('id-ID')}</span>
                </div>
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3 pt-2">
            <button
              type="button"
              onClick={() => setStep(1)}
              className="py-3.5 bg-white border-2 border-slate-300 hover:bg-slate-100 text-slate-800 rounded-2xl text-xs font-black"
            >
              ← Kembali ke Langkah 1
            </button>
            <button
              type="button"
              disabled={!isStep2Valid}
              onClick={() => setStep(3)}
              className="py-3.5 bg-emerald-800 hover:bg-emerald-900 disabled:opacity-50 text-white rounded-2xl text-xs font-black shadow-md transition-all"
            >
              Lanjut ke Langkah 3 (Pembayaran) →
            </button>
          </div>
        </div>
      )}

      {/* STEP 3: Pembayaran & Konfirmasi */}
      {step === 3 && (
        <form onSubmit={handleSubmitFinal} className="space-y-4">
          <div className="bg-white border-2 border-slate-200 rounded-3xl p-5 space-y-4 shadow-xs">
            <h3 className="text-sm font-extrabold text-slate-900 uppercase tracking-wide">INFORMASI PEMBAYARAN & ONGIR</h3>

            {/* Delivery Method Shipping Cost */}
            {deliveryMethod === 'Kirim Paket' && (
              <div>
                <label className="block text-xs font-extrabold text-slate-900 mb-1">Biaya Ongkos Kirim Paket (Rp) *</label>
                <input
                  type="number"
                  min="0"
                  required
                  value={buyerShippingCost}
                  onFocus={(e) => e.target.select()}
                  onChange={(e) => setBuyerShippingCost(e.target.value === '' ? '' : Number(e.target.value))}
                  placeholder="Contoh: 25000"
                  className="w-full px-3.5 py-3 border border-slate-200 rounded-2xl text-xs font-extrabold focus:outline-none focus:ring-2 focus:ring-emerald-700"
                />
              </div>
            )}

            <div>
              <label className="block text-xs font-extrabold text-slate-900 mb-1">Metode Pembayaran *</label>
              <CustomSelect
                options={[
                  { value: 'Transfer Bank', label: 'Transfer Bank' },
                  { value: 'QRIS', label: 'QRIS' },
                  { value: 'Tunai', label: 'Tunai' },
                ]}
                value={paymentMethod}
                onChange={setPaymentMethod}
              />
            </div>

            {paymentMethod === 'Transfer Bank' && (
              <div>
                <label className="block text-xs font-extrabold text-slate-900 mb-1">Pilih Rekening Bank Tujuan *</label>
                <CustomSelect
                  options={bankOptions}
                  value={bankName}
                  onChange={setBankName}
                />
              </div>
            )}

            {/* Payment Proof File Upload */}
            <div>
              <label className="block text-xs font-extrabold text-slate-900 mb-1">Unggah Bukti Pembayaran / Transfer *</label>
              <div className="border-2 border-dashed border-slate-300 rounded-2xl p-5 text-center bg-slate-50/50 hover:bg-slate-100 transition-colors relative cursor-pointer">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                />
                {paymentProofPreview ? (
                  <div className="space-y-2">
                    <img src={paymentProofPreview} alt="Preview Bukti" className="max-h-40 mx-auto rounded-xl border border-slate-300 object-contain" />
                    <span className="text-xs font-bold text-emerald-800 block">✓ Foto Bukti Terpilih (Klik untuk mengganti)</span>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <Upload className="w-8 h-8 text-emerald-800 mx-auto" />
                    <div className="text-xs font-extrabold text-slate-800">Klik atau seret foto bukti transfer di sini</div>
                    <div className="text-[10px] text-slate-400 font-semibold">Format JPG, PNG, WEBP (Maks 5MB)</div>
                  </div>
                )}
              </div>
            </div>

            {/* Summary Total Financial Box */}
            <div className="p-4 bg-emerald-50/70 border-2 border-emerald-200 rounded-2xl space-y-2 text-xs font-extrabold text-slate-900">
              <div className="flex justify-between">
                <span className="text-slate-600 font-medium">Subtotal Harga Tanaman ({totalItemCount} item):</span>
                <span>Rp {totalPlantPrice.toLocaleString('id-ID')}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600 font-medium">Ongkos Kirim:</span>
                <span>Rp {actualShippingCost.toLocaleString('id-ID')}</span>
              </div>
              <div className="flex justify-between text-base font-black text-emerald-950 pt-2 border-t border-emerald-300">
                <span>TOTAL DITERIMA:</span>
                <span className="text-emerald-900">Rp {grandTotal.toLocaleString('id-ID')}</span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 pt-2">
            <button
              type="button"
              onClick={() => setStep(2)}
              className="py-3.5 bg-white border-2 border-slate-300 hover:bg-slate-100 text-slate-800 rounded-2xl text-xs font-black"
            >
              ← Kembali ke Langkah 2
            </button>

            <button
              type="submit"
              disabled={isLoading || !isStep3Valid}
              className="py-3.5 bg-emerald-800 hover:bg-emerald-900 disabled:opacity-50 text-white rounded-2xl text-xs font-black shadow-lg transition-all active:scale-95 cursor-pointer"
            >
              {isLoading ? 'Memproses Pesanan...' : '✓ Simpan & Prosed Pesanan'}
            </button>
          </div>
        </form>
      )}

      {/* Add Plant Modal */}
      <AddPlantModal
        isOpen={isAddPlantModalOpen}
        onClose={() => setIsAddPlantModalOpen(false)}
        onAddPlant={handleAddPlant}
      />
    </div>
  );
};
