import { useState, useEffect } from 'react';
import {
  Eye, Clock, CheckCircle, XCircle, Truck, Package,
  User, Calendar, MapPin, Download, RefreshCw,
  ChevronLeft, ChevronRight, Search, X, Printer,
  ShoppingBag,
} from 'lucide-react';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import { API_URL } from '../config';

/* ─── Types ─────────────────────────────────────────────────── */
interface Order {
  id: number;
  user_id: string;
  total_amount: number | string;
  status: string;
  created_at: string;
  shipping_address?: string;
  user_name?: string;
  user_email?: string;
  user_phone?: string;
}

interface OrderItem {
  id: number;
  product_id: number;
  name: string;
  quantity: number;
  price: number;
  image: string;
}

/* ─── Helpers ────────────────────────────────────────────────── */
const formatCurrency = (amount: number) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(amount);

const formatDate = (dateString: string) =>
  new Date(dateString).toLocaleDateString('en-IN', {
    year: 'numeric', month: 'short', day: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });

const formatShort = (dateString: string) =>
  new Date(dateString).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' });

/* ─── Status config ──────────────────────────────────────────── */
const STATUS: Record<string, { bg: string; text: string; dot: string; icon: React.ElementType }> = {
  pending:    { bg: 'bg-amber-50',   text: 'text-amber-700',   dot: 'bg-amber-400',   icon: Clock },
  processing: { bg: 'bg-sky-50',     text: 'text-sky-700',     dot: 'bg-sky-400',     icon: Truck },
  shipped:    { bg: 'bg-violet-50',  text: 'text-violet-700',  dot: 'bg-violet-400',  icon: Truck },
  delivered:  { bg: 'bg-emerald-50', text: 'text-emerald-700', dot: 'bg-emerald-400', icon: CheckCircle },
  cancelled:  { bg: 'bg-red-50',     text: 'text-red-600',     dot: 'bg-red-400',     icon: XCircle },
};

const STATUS_OPTIONS = ['pending', 'processing', 'shipped', 'delivered', 'cancelled'] as const;
type StatusOption = typeof STATUS_OPTIONS[number];

/* ─── Sub-components ────────────────────────────────────────── */
function StatusPill({ status, size = 'sm' }: { status: string; size?: 'sm' | 'md' }) {
  const s = STATUS[status.toLowerCase()] ?? { bg: 'bg-stone-100', text: 'text-stone-500', dot: 'bg-stone-400', icon: Clock };
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full font-semibold
      ${size === 'sm' ? 'px-2.5 py-0.5 text-xs' : 'px-3 py-1 text-xs'}
      ${s.bg} ${s.text}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${s.dot}`} />
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  );
}

function InfoRow({ label, value }: { label: string; value?: string | null }) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-[10px] font-bold uppercase tracking-widest text-stone-400">{label}</span>
      <span className="text-sm text-stone-800">{value || '—'}</span>
    </div>
  );
}

function StatCard({ label, value, color = 'text-stone-900' }: { label: string; value: string | number; color?: string }) {
  return (
    <div className="bg-white rounded-2xl border border-stone-100 p-4">
      <p className="text-[10px] font-bold uppercase tracking-widest text-stone-400 mb-1.5">{label}</p>
      <p className={`text-2xl font-bold tabular-nums ${color}`}>{value}</p>
    </div>
  );
}

/* ─── Main ───────────────────────────────────────────────────── */
export default function Orders() {
  const [orders, setOrders]               = useState<Order[]>([]);
  const [loading, setLoading]             = useState(true);
  const [refreshing, setRefreshing]       = useState(false);
  const [statusFilter, setStatusFilter]   = useState('all');
  const [searchTerm, setSearchTerm]       = useState('');
  const [currentPage, setCurrentPage]     = useState(1);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [orderItems, setOrderItems]       = useState<OrderItem[]>([]);
  const [showDialog, setShowDialog]       = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [loadingItems, setLoadingItems]   = useState(false);

  const ITEMS_PER_PAGE = 10;

  useEffect(() => { fetchOrders(); }, [statusFilter]);

  const fetchOrders = async (soft = false) => {
    soft ? setRefreshing(true) : setLoading(true);
    try {
      const token = localStorage.getItem('adminToken');
      if (!token) { toast.error('Please login again'); return; }
      const params: Record<string, string> = {};
      if (statusFilter !== 'all') params.status = statusFilter;
      const { data } = await axios.get(`${API_URL}/api/admin/orders`, {
        headers: { Authorization: `Bearer ${token}` }, params,
       });
    setOrders(data.orders?.map((o: any) => ({ ...o, total_amount: Number(o.total_amount) })) ?? []);
    } catch (err) {
      if (axios.isAxiosError(err)) {
        toast.error(err.response?.status === 401 ? 'Session expired.' : err.response?.data?.message ?? 'Failed to fetch orders');
      } else {
        toast.error('An unexpected error occurred');
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const fetchOrderDetails = async (orderId: number) => {
    setLoadingItems(true);
    try {
      const token = localStorage.getItem('adminToken');
      const { data } = await axios.get(`${API_URL}/api/admin/orders/${orderId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setOrderItems(data.items ?? []);
    } catch {
      toast.error('Failed to load order details');
    } finally {
      setLoadingItems(false);
    }
  };

  const updateOrderStatus = async (orderId: number, newStatus: string) => {
    setUpdatingStatus(true);
    try {
      const token = localStorage.getItem('adminToken');
      await axios.put(`${API_URL}/api/admin/orders/${orderId}`,
        { status: newStatus },
        { headers: { Authorization: `Bearer ${token}` } },
      );
      toast.success(`Status updated to ${newStatus}`);
      setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: newStatus } : o));
      if (selectedOrder?.id === orderId) setSelectedOrder(prev => prev ? { ...prev, status: newStatus } : prev);
    } catch {
      toast.error('Failed to update status');
    } finally {
      setUpdatingStatus(false);
    }
  };

  const handleViewOrder = async (order: Order) => {
    setSelectedOrder(order);
    setOrderItems([]);
    setShowDialog(true);
    await fetchOrderDetails(order.id);
  };

  const exportOrders = () => {
    const csv = [
      ['Order ID', 'Date', 'Customer', 'Amount', 'Status'],
      ...orders.map(o => [o.id, new Date(o.created_at).toLocaleDateString(), o.user_name ?? o.user_id, o.total_amount, o.status]),
    ].map(r => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href = url; a.download = `orders-${new Date().toISOString().split('T')[0]}.csv`; a.click();
    URL.revokeObjectURL(url);
    toast.success('Exported successfully');
  };

  /* ── Filter + paginate ── */
  const filtered = orders.filter(o => {
    const q = searchTerm.toLowerCase();
    return !q || o.id.toString().includes(q) ||
      o.user_name?.toLowerCase().includes(q) ||
      o.user_id.toLowerCase().includes(q);
  });
  const totalPages   = Math.ceil(filtered.length / ITEMS_PER_PAGE);
  const startIndex   = (currentPage - 1) * ITEMS_PER_PAGE;
  const pageOrders   = filtered.slice(startIndex, startIndex + ITEMS_PER_PAGE);

  /* ─── Render ─────────────────────────────────────────────── */
  return (
    <>
      <div className="space-y-5 p-6" style={{ fontFamily: "'DM Sans', sans-serif" }}>

        {/* ── Header ── */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-stone-900 tracking-tight">Orders</h1>
            <p className="text-xs text-stone-400 mt-0.5">Track and manage customer orders</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={exportOrders}
              className="flex items-center gap-2 px-4 py-2.5 border border-stone-200 rounded-xl text-sm text-stone-600 hover:bg-stone-50 transition-colors"
            >
              <Download size={14} /> Export CSV
            </button>
            <button
              onClick={() => fetchOrders(true)}
              className="flex items-center gap-2 px-4 py-2.5 bg-[#3F51B5] text-white text-sm font-medium rounded-xl hover:bg-stone-700 transition-colors"
            >
              <RefreshCw size={14} className={refreshing ? 'animate-spin' : ''} /> Refresh
            </button>
          </div>
        </div>

        {/* ── Stats ── */}
        {!loading && orders.length > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
            <StatCard label="Total" value={orders.length} />
            <StatCard label="Pending"    value={orders.filter(o => o.status === 'pending').length}    color="text-amber-600" />
            <StatCard label="Processing" value={orders.filter(o => o.status === 'processing').length} color="text-sky-600" />
            <StatCard label="Delivered"  value={orders.filter(o => o.status === 'delivered').length}  color="text-emerald-600" />
            <StatCard label="Revenue"    value={formatCurrency(orders.reduce((s, o) => s + Number(o.total_amount), 0))} color="text-violet-600" />
          </div>
        )}

        {/* ── Filters ── */}
        <div className="bg-white rounded-2xl border border-stone-100 p-4 space-y-3">
          <div className="flex flex-col lg:flex-row gap-3">
            {/* Search */}
            <div className="relative flex-1">
              <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400" />
              <input
                type="text"
                placeholder="Search order ID or customer…"
                value={searchTerm}
                onChange={e => { setSearchTerm(e.target.value); setCurrentPage(1); }}
                className="w-full pl-9 pr-9 py-2.5 border border-stone-200 rounded-xl text-sm text-stone-800 placeholder:text-stone-300 focus:outline-none focus:border-stone-900 focus:ring-2 focus:ring-stone-900/8 transition-all"
              />
              {searchTerm && (
                <button onClick={() => setSearchTerm('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-300 hover:text-stone-500">
                  <X size={13} />
                </button>
              )}
            </div>

            {/* Status pills */}
            <div className="flex gap-1.5 overflow-x-auto pb-0.5">
              {(['all', ...STATUS_OPTIONS] as const).map(s => (
                <button
                  key={s}
                  onClick={() => { setStatusFilter(s); setCurrentPage(1); }}
                  className={`shrink-0 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all
                    ${statusFilter === s
                      ? 'bg-[#3F51B5] text-white'
                      : 'border border-stone-200 text-stone-500 hover:border-stone-400 hover:text-stone-700'
                    }`}
                >
                  {s === 'all' ? 'All orders' : s.charAt(0).toUpperCase() + s.slice(1)}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* ── Table ── */}
        <div className="bg-white rounded-2xl border border-stone-100 overflow-hidden">
          {loading ? (
            <div className="flex flex-col items-center justify-center h-80 gap-3">
              <div className="w-8 h-8 border-2 border-stone-900 border-t-transparent rounded-full animate-spin" />
              <p className="text-sm text-stone-400">Loading orders…</p>
            </div>
          ) : pageOrders.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 gap-3">
              <div className="w-14 h-14 rounded-2xl bg-stone-100 flex items-center justify-center">
                <ShoppingBag size={24} className="text-stone-400" />
              </div>
              <p className="text-sm font-medium text-stone-500">No orders found</p>
              {(searchTerm || statusFilter !== 'all') && (
                <button
                  onClick={() => { setSearchTerm(''); setStatusFilter('all'); }}
                  className="text-xs text-stone-400 hover:text-stone-700 underline underline-offset-2 transition-colors"
                >
                  Clear filters
                </button>
              )}
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-stone-100">
                      {['Order', 'Customer', 'Date', 'Amount', 'Status', ''].map((h, i) => (
                        <th key={i} className={`px-4 sm:px-5 py-3.5 text-[11px] font-bold uppercase tracking-widest text-stone-400 ${i === 5 ? 'text-right' : 'text-left'}`}>
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-50">
                    {pageOrders.map(order => (
                      <tr key={order.id} className="group hover:bg-stone-50/60 transition-colors">

                        <td className="px-4 sm:px-5 py-3.5">
                          <span className="text-sm font-mono font-semibold text-stone-700">#{order.id}</span>
                        </td>

                        <td className="px-4 sm:px-5 py-3.5 max-w-[140px] sm:max-w-[180px]">
                          <p className="text-sm font-medium text-stone-900 truncate">
                            {order.user_name ?? `User ${order.user_id.slice(0, 6)}`}
                          </p>
                          <p className="text-xs text-stone-400 font-mono mt-0.5 hidden sm:block">{order.user_id.slice(0, 8)}…</p>
                        </td>

                        <td className="px-4 sm:px-5 py-3.5">
                          <span className="text-xs text-stone-500">{formatShort(order.created_at)}</span>
                        </td>

                        <td className="px-4 sm:px-5 py-3.5">
                          <span className="text-sm font-bold text-stone-900 tabular-nums">{formatCurrency(order.total_amount)}</span>
                        </td>

                        <td className="px-4 sm:px-5 py-3.5">
                          <select
                            value={order.status}
                            onChange={e => updateOrderStatus(order.id, e.target.value)}
                            disabled={updatingStatus}
                            className={`appearance-none text-xs font-semibold rounded-full px-2.5 py-1 pr-5 border-0 cursor-pointer focus:outline-none focus:ring-2 focus:ring-stone-900/10 transition-all
                              ${STATUS[order.status.toLowerCase()]?.bg ?? 'bg-stone-100'}
                              ${STATUS[order.status.toLowerCase()]?.text ?? 'text-stone-600'}
                            `}
                            style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='6' viewBox='0 0 10 6'%3E%3Cpath d='M1 1l4 4 4-4' stroke='%23888' stroke-width='1.5' fill='none' stroke-linecap='round'/%3E%3C/svg%3E")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 8px center' }}
                          >
                            {STATUS_OPTIONS.map(s => (
                              <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
                            ))}
                          </select>
                        </td>

                        <td className="px-4 sm:px-5 py-3.5 text-right">
                          <button
                            onClick={() => handleViewOrder(order)}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-stone-500 hover:text-stone-900 hover:bg-stone-100 rounded-lg transition-all"
                          >
                            <Eye size={13} /> Details
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex flex-wrap items-center justify-between gap-2 px-4 md:px-5 py-4 border-t border-stone-100">
                  <p className="text-xs text-stone-400 tabular-nums">
                    {startIndex + 1}–{Math.min(startIndex + ITEMS_PER_PAGE, filtered.length)} of {filtered.length} orders
                  </p>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                      disabled={currentPage === 1}
                      className="w-8 h-8 flex items-center justify-center rounded-lg text-stone-400 hover:bg-stone-100 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                    >
                      <ChevronLeft size={14} />
                    </button>
                    {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => {
                      let page: number;
                      if (totalPages <= 7) page = i + 1;
                      else if (currentPage <= 4) page = i + 1;
                      else if (currentPage >= totalPages - 3) page = totalPages - 6 + i;
                      else page = currentPage - 3 + i;
                      return (
                        <button
                          key={page}
                          onClick={() => setCurrentPage(page)}
                          className={`w-8 h-8 flex items-center justify-center rounded-lg text-xs font-medium transition-all
                            ${currentPage === page ? 'bg-[#3F51B5] text-white' : 'text-stone-500 hover:bg-stone-100'}`}
                        >
                          {page}
                        </button>
                      );
                    })}
                    <button
                      onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                      disabled={currentPage === totalPages}
                      className="w-8 h-8 flex items-center justify-center rounded-lg text-stone-400 hover:bg-stone-100 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                    >
                      <ChevronRight size={14} />
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* ══════════════════ Order Details Dialog ══════════════════ */}
      {showDialog && selectedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ fontFamily: "'DM Sans', sans-serif" }}>
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setShowDialog(false)} />

          <div className="relative w-full max-w-2xl xl:max-w-3xl bg-[#fafaf7] rounded-2xl shadow-2xl border border-stone-200 overflow-hidden max-h-[90vh] flex flex-col">

            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 bg-white border-b border-stone-100 shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-[#3F51B5] flex items-center justify-center">
                  <ShoppingBag size={16} className="text-white" />
                </div>
                <div>
                  <h2 className="text-base font-semibold text-stone-900 tracking-tight">
                    Order <span className="font-mono">#{selectedOrder.id}</span>
                  </h2>
                  <p className="text-xs text-stone-400">{formatDate(selectedOrder.created_at)}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <StatusPill status={selectedOrder.status} size="md" />
                <button
                  onClick={() => setShowDialog(false)}
                  className="w-8 h-8 rounded-lg flex items-center justify-center text-stone-400 hover:bg-stone-100 hover:text-stone-700 transition-all"
                >
                  <X size={15} />
                </button>
              </div>
            </div>

            {/* Body */}
            <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4">

              {/* Customer + Order info */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="bg-white rounded-2xl border border-stone-100 p-4 space-y-3">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-stone-400 flex items-center gap-1.5">
                    <User size={11} /> Customer
                  </p>
                  <InfoRow label="Name"  value={selectedOrder.user_name} />
                  <InfoRow label="Email" value={selectedOrder.user_email} />
                  <InfoRow label="Phone" value={selectedOrder.user_phone} />
                  <InfoRow label="User ID" value={selectedOrder.user_id.slice(0, 12) + '…'} />
                </div>

                <div className="bg-white rounded-2xl border border-stone-100 p-4 space-y-3">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-stone-400 flex items-center gap-1.5">
                    <Calendar size={11} /> Order info
                  </p>
                  <InfoRow label="Date"   value={formatDate(selectedOrder.created_at)} />
                  <InfoRow label="Amount" value={formatCurrency(orders.reduce((s, o) => s + Number(o.total_amount), 0))} />
                  <div className="flex flex-col gap-1.5">
                    <span className="text-[10px] font-bold uppercase tracking-widest text-stone-400">Update status</span>
                    <select
                      value={selectedOrder.status}
                      onChange={e => updateOrderStatus(selectedOrder.id, e.target.value)}
                      disabled={updatingStatus}
                      className="text-sm border border-stone-200 rounded-xl px-3 py-2 bg-white text-stone-800 focus:outline-none focus:border-stone-900 focus:ring-2 focus:ring-stone-900/8 transition-all appearance-none"
                    >
                      {STATUS_OPTIONS.map(s => (
                        <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* Shipping address */}
              {selectedOrder.shipping_address && (
                <div className="bg-white rounded-2xl border border-stone-100 p-4">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-stone-400 flex items-center gap-1.5 mb-3">
                    <MapPin size={11} /> Shipping address
                  </p>
                  <p className="text-sm text-stone-700 whitespace-pre-line leading-relaxed">{selectedOrder.shipping_address}</p>
                </div>
              )}

              {/* Items */}
              <div className="bg-white rounded-2xl border border-stone-100 overflow-hidden">
                <div className="px-4 md:px-5 py-4 border-b border-stone-100">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-stone-400 flex items-center gap-1.5">
                    <Package size={11} /> Order items
                  </p>
                </div>

                {loadingItems ? (
                  <div className="flex items-center justify-center py-10 gap-2">
                    <div className="w-5 h-5 border-2 border-stone-900 border-t-transparent rounded-full animate-spin" />
                    <span className="text-xs text-stone-400">Loading items…</span>
                  </div>
                ) : (
                  <>
                    <div className="divide-y divide-stone-50">
                      {orderItems.map(item => (
                        <div key={item.id} className="flex flex-col sm:flex-row sm:items-center gap-3 px-4 md:px-5 py-3.5">
                          <div className="w-12 h-12 rounded-xl overflow-hidden bg-stone-100 border border-stone-100 shrink-0">
                            <img
                              src={item.image || '/kit.png'} alt={item.name}
                              className="w-full h-full object-cover"
                              onError={e => { (e.target as HTMLImageElement).src = '/kit.png'; }}
                            />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-stone-900 truncate">{item.name}</p>
                            <p className="text-xs text-stone-400 mt-0.5">Qty: {item.quantity}</p>
                          </div>
                          <div className="text-right shrink-0">
                            <p className="text-sm font-bold text-stone-900">{formatCurrency(item.price)}</p>
                            <p className="text-xs text-stone-400 mt-0.5">{formatCurrency(item.price * item.quantity)} total</p>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Totals */}
                    <div className="px-4 md:px-5 py-4 border-t border-stone-100 bg-stone-50/50 space-y-2">
                      <div className="flex justify-between text-sm text-stone-500">
                        <span>Subtotal</span>
                        <span>{formatCurrency(selectedOrder.total_amount)}</span>
                      </div>
                      <div className="flex justify-between text-sm text-stone-500">
                        <span>Shipping</span>
                        <span className="text-emerald-600 font-medium">Free</span>
                      </div>
                      <div className="flex justify-between text-sm font-bold text-stone-900 pt-2 border-t border-stone-200">
                        <span>Total</span>
                        <span>{formatCurrency(selectedOrder.total_amount)}</span>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Footer */}
            <div className="px-6 py-4 bg-white border-t border-stone-100 flex items-center justify-between shrink-0">
              <button
                onClick={() => setShowDialog(false)}
                className="px-4 py-2 rounded-xl border border-stone-200 text-stone-500 text-sm font-medium hover:bg-stone-50 transition-colors"
              >
                Close
              </button>
              <button
                onClick={() => window.print()}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#3F51B5] text-white text-sm font-medium hover:bg-stone-700 transition-colors"
              >
                <Printer size={14} /> Print invoice
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}