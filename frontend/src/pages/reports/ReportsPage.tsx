import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { orderService } from '../../services/orderService';
import { StatCard } from '../../components/shared/StatCard';
import { OrderStatusBadge } from '../../components/shared/OrderStatusBadge';
import { ShoppingBag, CheckCircle, Calendar, Download, Wallet, FileText, Phone, Truck } from 'lucide-react';

const RupiahIcon: React.FC<{ className?: string }> = ({ className }) => (
  <span className={`font-black text-sm tracking-tighter text-slate-900 select-none flex items-center justify-center ${className || 'w-6 h-6'}`}>
    Rp
  </span>
);

export const ReportsPage: React.FC = () => {
  const { data, isLoading } = useQuery({
    queryKey: ['reports-orders-list'],
    queryFn: () => orderService.getOrders({ per_page: 200 }),
  });

  const orders = data?.data || [];

  // Financial Calculations
  const currentMonthStr = new Date().toISOString().slice(0, 7); // YYYY-MM

  const totalOrdersCount = orders.length;
  const completedOrdersCount = orders.filter((o) => o.status === 'COMPLETED' || o.status === 'PACKING_COMPLETED').length;

  const calculateOrderGrandTotal = (order: any) => {
    const itemsTotal = (order.items || []).reduce(
      (sum: number, item: any) => sum + (Number(item.quantity) || 0) * (Number(item.price) || 0),
      0
    );
    const shipping = order.delivery_method === 'Kirim Paket' ? Number(order.buyer_shipping_cost) || 0 : 0;
    return itemsTotal + shipping;
  };

  const calculateOrderItemsTotal = (order: any) => {
    return (order.items || []).reduce(
      (sum: number, item: any) => sum + (Number(item.quantity) || 0) * (Number(item.price) || 0),
      0
    );
  };

  const totalOmzet = orders.reduce((sum, order) => sum + calculateOrderGrandTotal(order), 0);
  const monthlyOmzet = orders
    .filter((o) => o.order_date && o.order_date.startsWith(currentMonthStr))
    .reduce((sum, order) => sum + calculateOrderGrandTotal(order), 0);

  // CSV Export Function
  const handleExportCSV = () => {
    if (orders.length === 0) {
      alert('Tidak ada data transaksi order untuk diexport.');
      return;
    }

    const headers = [
      'No Order',
      'Tanggal Order',
      'Nama Customer',
      'No Telepon',
      'Metode Pengiriman',
      'Total Harga Tanaman (Rp)',
      'Ongkir Pembeli (Rp)',
      'Grand Total (Rp)',
      'Metode Pembayaran',
      'Bank Tujuan',
      'Status Order',
      'Sales Pembuat',
    ];

    const rows = orders.map((o) => {
      const itemsTotal = calculateOrderItemsTotal(o);
      const shipping = o.delivery_method === 'Kirim Paket' ? Number(o.buyer_shipping_cost) || 0 : 0;
      const grandTotal = itemsTotal + shipping;
      const statusLabel =
        o.status === 'WAITING_PROCESS'
          ? 'Menunggu Diproses'
          : o.status === 'WAITING_PACKING'
          ? 'Menunggu Packing'
          : o.status === 'PACKING_COMPLETED'
          ? 'Packing Selesai'
          : o.status === 'COMPLETED'
          ? 'Selesai'
          : 'Dibatalkan';

      return [
        `"${o.order_number}"`,
        `"${o.order_date || ''}"`,
        `"${(o.customer_name || '').replace(/"/g, '""')}"`,
        `"${(o.phone || '').replace(/"/g, '""')}"`,
        `"${o.delivery_method || ''}"`,
        itemsTotal,
        shipping,
        grandTotal,
        `"${o.payment_method || ''}"`,
        `"${o.bank_name || ''}"`,
        `"${statusLabel}"`,
        `"${(o.creator?.name || 'Sales Staff').replace(/"/g, '""')}"`,
      ].join(',');
    });

    const csvContent = '\uFEFF' + [headers.join(','), ...rows].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const dateToday = new Date().toISOString().split('T')[0];

    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `Laporan_Penjualan_Antagloma_Florist_${dateToday}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6 max-w-7xl pb-12">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900">Laporan Penjualan</h1>
          <p className="text-xs text-slate-500 font-medium mt-0.5">
            Ringkasan performa omzet dan laporan transaksi Antagloma Florist secara real-time.
          </p>
        </div>
        <button
          onClick={handleExportCSV}
          className="w-full sm:w-auto px-5 py-3 bg-emerald-800 hover:bg-emerald-900 text-white rounded-2xl text-xs font-extrabold flex items-center justify-center gap-2 transition-all shadow-md hover:shadow-lg active:scale-95 cursor-pointer"
        >
          <Download className="w-4 h-4" /> Export CSV Laporan
        </button>
      </div>

      {/* 4 Financial Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="TOTAL OMZET PENJUALAN"
          value={isLoading ? '...' : `Rp ${totalOmzet.toLocaleString('id-ID')}`}
          icon={RupiahIcon as any}
        />
        <StatCard
          title="TOTAL KESELURUHAN ORDER"
          value={isLoading ? '...' : totalOrdersCount}
          icon={ShoppingBag}
        />
        <StatCard
          title="ORDER SELESAI TERKIRIM"
          value={isLoading ? '...' : completedOrdersCount}
          icon={CheckCircle}
        />
        <StatCard
          title="OMZET BULAN INI"
          value={isLoading ? '...' : `Rp ${monthlyOmzet.toLocaleString('id-ID')}`}
          icon={Calendar}
        />
      </div>

      {/* Sales Transactions Table List */}
      <div className="bg-white border-2 border-slate-200 rounded-3xl p-5 space-y-4 shadow-xs">
        <div className="flex items-center justify-between border-b border-slate-200 pb-3">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-emerald-800 text-white flex items-center justify-center font-bold">
              <FileText className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-extrabold text-slate-900">Rincian Transaksi Penjualan</h2>
              <p className="text-xs text-slate-500 font-medium">Daftar transaksi order beserta perincian keuangan</p>
            </div>
          </div>
          <span className="px-3 py-1 bg-emerald-100 border border-emerald-300 text-emerald-950 text-xs font-extrabold rounded-xl">
            {orders.length} Transaksi
          </span>
        </div>

        {isLoading ? (
          <div className="py-12 text-center text-xs font-bold text-slate-500">Memuat laporan transaksi...</div>
        ) : orders.length === 0 ? (
          <div className="py-12 text-center text-xs font-bold text-slate-500">Belum ada transaksi order penjualan.</div>
        ) : (
          <>
            {/* Mobile Stacked View */}
            <div className="md:hidden space-y-3">
              {orders.map((order) => {
                const itemsTotal = calculateOrderItemsTotal(order);
                const shipping = order.delivery_method === 'Kirim Paket' ? Number(order.buyer_shipping_cost) || 0 : 0;
                const grandTotal = itemsTotal + shipping;

                return (
                  <div key={order.id} className="p-4 bg-slate-50 border-2 border-slate-200 rounded-2xl space-y-2 text-xs">
                    <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                      <span className="font-extrabold text-slate-900">{order.order_number}</span>
                      <OrderStatusBadge status={order.status} />
                    </div>

                    <div className="space-y-1 font-medium">
                      <div className="flex justify-between">
                        <span className="text-slate-500">Customer:</span>
                        <span className="font-bold text-slate-900">{order.customer_name} ({order.phone})</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">Metode Kirim:</span>
                        <span className="font-bold text-slate-800">{order.delivery_method}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">Pembayaran:</span>
                        <span className="font-bold text-slate-800">{order.payment_method} {order.bank_name ? `(${order.bank_name})` : ''}</span>
                      </div>
                    </div>

                    <div className="pt-2 border-t border-slate-200 flex justify-between items-center text-xs font-extrabold">
                      <span className="text-slate-700">Grand Total Omzet</span>
                      <span className="text-emerald-800 text-sm font-black">Rp {grandTotal.toLocaleString('id-ID')}</span>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Desktop Table View */}
            <div className="hidden md:block overflow-x-auto rounded-2xl border border-slate-200">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-100 border-b border-slate-200 text-slate-700 font-extrabold uppercase text-[10px]">
                  <tr>
                    <th className="py-3 px-3">No Order</th>
                    <th className="py-3 px-3">Tanggal</th>
                    <th className="py-3 px-3">Customer</th>
                    <th className="py-3 px-3">Metode Kirim</th>
                    <th className="py-3 px-3">Pembayaran</th>
                    <th className="py-3 px-3 text-right">Total Tanaman</th>
                    <th className="py-3 px-3 text-right">Ongkir Pembeli</th>
                    <th className="py-3 px-3 text-right">Grand Total</th>
                    <th className="py-3 px-3 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 font-bold text-slate-900">
                  {orders.map((order) => {
                    const itemsTotal = calculateOrderItemsTotal(order);
                    const shipping = order.delivery_method === 'Kirim Paket' ? Number(order.buyer_shipping_cost) || 0 : 0;
                    const grandTotal = itemsTotal + shipping;

                    return (
                      <tr key={order.id} className="hover:bg-slate-50 transition-colors">
                        <td className="py-3 px-3 font-black text-slate-900">{order.order_number}</td>
                        <td className="py-3 px-3 text-slate-600 font-semibold whitespace-nowrap">
                          {order.order_date ? new Date(order.order_date).toLocaleDateString('id-ID') : '-'}
                        </td>
                        <td className="py-3 px-3">
                          <span className="block font-bold">{order.customer_name}</span>
                          <span className="text-[10px] text-slate-500 font-medium">{order.phone}</span>
                        </td>
                        <td className="py-3 px-3 font-semibold text-slate-800">{order.delivery_method}</td>
                        <td className="py-3 px-3 font-semibold text-slate-800">
                          {order.payment_method} {order.bank_name ? `(${order.bank_name})` : ''}
                        </td>
                        <td className="py-3 px-3 text-right font-bold text-slate-700">
                          Rp {itemsTotal.toLocaleString('id-ID')}
                        </td>
                        <td className="py-3 px-3 text-right font-bold text-slate-700">
                          Rp {shipping.toLocaleString('id-ID')}
                        </td>
                        <td className="py-3 px-3 text-right font-black text-emerald-800 text-sm">
                          Rp {grandTotal.toLocaleString('id-ID')}
                        </td>
                        <td className="py-3 px-3 text-center">
                          <OrderStatusBadge status={order.status} />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
                <tfoot className="bg-slate-100 border-t-2 border-slate-300 font-black text-slate-900 text-xs">
                  <tr>
                    <td colSpan={5} className="py-3.5 px-3 uppercase text-right tracking-wider">
                      TOTAL OMZET REKAPITULASI:
                    </td>
                    <td className="py-3.5 px-3 text-right font-black">
                      Rp {orders.reduce((s, o) => s + calculateOrderItemsTotal(o), 0).toLocaleString('id-ID')}
                    </td>
                    <td className="py-3.5 px-3 text-right font-black">
                      Rp {orders.reduce((s, o) => s + (o.delivery_method === 'Kirim Paket' ? Number(o.buyer_shipping_cost) || 0 : 0), 0).toLocaleString('id-ID')}
                    </td>
                    <td className="py-3.5 px-3 text-right font-black text-emerald-900 text-sm">
                      Rp {totalOmzet.toLocaleString('id-ID')}
                    </td>
                    <td className="py-3.5 px-3"></td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </>
        )}
      </div>
    </div>
  );
};
