import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import {
  ArrowLeft, Package, User, Calendar, MapPin, Phone, Mail,
  Truck, Clock, CheckCircle, XCircle, Printer, RefreshCw,
  ChevronRight, X, Hash,
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { API_URL } from '../config';

/* ─── Types ─────────────────────────────────────────────────── */
interface OrderItem {
  id: number;
  product_id: number;
  name: string;
  quantity: number;
  price: number;
  image: string;
}

interface Order {
  id: number;
  user_id: string;
  user_name?: string;
  user_email?: string;
  user_phone?: string;
  total_amount: number;
  status: string;
  shipping_address?: string;
  created_at: string;
  updated_at?: string;
  items?: OrderItem[];
  payment_method?: string;
  payment_status?: string;
}

/* ─── Helpers ────────────────────────────────────────────────── */
const formatCurrency = (n: number) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n);

const formatDate = (s: string) =>
  new Date(s).toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' });

const formatShort = (s: string) =>
  new Date(s).toLocaleDateString('en-IN', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });

/* ─── Status config ──────────────────────────────────────────── */
const STATUS_OPTIONS = ['pending', 'processing', 'shipped', 'delivered', 'cancelled'] as const;

const STATUS_CFG: Record<string, { bg: string; text: string; dot: string; border: string; icon: React.ElementType }> = {
  pending:    { bg: 'bg-amber-50',   text: 'text-amber-700',   dot: 'bg-amber-400',   border: 'border-amber-200',  icon: Clock },
  processing: { bg: 'bg-sky-50',     text: 'text-sky-700',     dot: 'bg-sky-400',     border: 'border-sky-200',    icon: Truck },
  shipped:    { bg: 'bg-violet-50',  text: 'text-violet-700',  dot: 'bg-violet-400',  border: 'border-violet-200', icon: Truck },
  delivered:  { bg: 'bg-emerald-50', text: 'text-emerald-700', dot: 'bg-emerald-400', border: 'border-emerald-200',icon: CheckCircle },
  cancelled:  { bg: 'bg-red-50',     text: 'text-red-600',     dot: 'bg-red-400',     border: 'border-red-200',    icon: XCircle },
};

const TIMELINE_STEPS: Array<{ key: string; label: string }> = [
  { key: 'pending',    label: 'Order placed' },
  { key: 'processing', label: 'Processing' },
  { key: 'shipped',    label: 'Shipped' },
  { key: 'delivered',  label: 'Delivered' },
];

const STATUS_ORDER: Record<string, number> = { pending: 0, processing: 1, shipped: 2, delivered: 3, cancelled: -1 };

/* ─── Sub-components ────────────────────────────────────────── */
function StatusPill({ status }: { status: string }) {
  const c = STATUS_CFG[status.toLowerCase()] ?? { bg: 'bg-stone-100', text: 'text-stone-500', dot: 'bg-stone-400' };
  return (
    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${c.bg} ${c.text}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${c.dot}`} />
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  );
}

function SectionCard({ title, icon: Icon, children }: { title: string; icon: React.ElementType; children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-2xl border border-stone-100 overflow-hidden">
      <div className="flex items-center gap-2 px-5 py-4 border-b border-stone-100">
        <Icon size={14} className="text-stone-400" />
        <p className="text-[11px] font-bold uppercase tracking-widest text-stone-400">{title}</p>
      </div>
      <div className="px-5 py-4">{children}</div>
    </div>
  );
}

function InfoRow({ icon: Icon, label, value, mono }: { icon: React.ElementType; label: string; value?: string | null; mono?: boolean }) {
  return (
    <div className="flex items-start gap-3">
      <div className="w-7 h-7 rounded-lg bg-stone-50 border border-stone-100 flex items-center justify-center shrink-0 mt-0.5">
        <Icon size={12} className="text-stone-400" />
      </div>
      <div>
        <p className="text-[10px] font-bold uppercase tracking-widest text-stone-400">{label}</p>
        <p className={`text-sm text-stone-800 mt-0.5 ${mono ? 'font-mono text-xs' : ''}`}>{value || '—'}</p>
      </div>
    </div>
  );
}

/* ─── Main ───────────────────────────────────────────────────── */
export default function OrderDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [order, setOrder]               = useState<Order | null>(null);
  const [loading, setLoading]           = useState(true);
  const [updating, setUpdating]         = useState(false);
  const [refreshing, setRefreshing]     = useState(false);
  const [showTracking, setShowTracking] = useState(false);
  const [trackingNumber, setTrackingNumber] = useState('');

  useEffect(() => { fetchOrder(); }, [id]);

  const fetchOrder = async (soft = false) => {
    soft ? setRefreshing(true) : setLoading(true);
    try {
      const token = localStorage.getItem('adminToken');
      if (!token) { toast.error('Please login again'); navigate('/login'); return; }
      const { data } = await axios.get(`${API_URL}/api/admin/orders/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setOrder(data);
    } catch (err) {
      if (axios.isAxiosError(err)) {
        if (err.response?.status === 404) toast.error('Order not found');
        else if (err.response?.status === 401) { toast.error('Session expired'); navigate('/login'); }
        else toast.error(err.response?.data?.message ?? 'Failed to load order');
      } else toast.error('An unexpected error occurred');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleStatusUpdate = async (newStatus: string) => {
    setUpdating(true);
    try {
      const token = localStorage.getItem('adminToken');
      await axios.patch(`${API_URL}/api/admin/orders/${id}/status`,
        { status: newStatus },
        { headers: { Authorization: `Bearer ${token}` } },
      );
      setOrder(o => o ? { ...o, status: newStatus } : o);
      toast.success(`Status updated to ${newStatus}`);
    } catch { toast.error('Failed to update status'); }
    finally { setUpdating(false); }
  };

  const handleAddTracking = async () => {
    if (!trackingNumber.trim()) { toast.error('Enter a tracking number'); return; }
    try {
      const token = localStorage.getItem('adminToken');
      await axios.post(`${API_URL}/api/admin/orders/${id}/tracking`,
        { trackingNumber },
        { headers: { Authorization: `Bearer ${token}` } },
      );
      toast.success('Tracking number added');
      setShowTracking(false);
      setTrackingNumber('');
      fetchOrder(true);
    } catch { toast.error('Failed to add tracking number'); }
  };

  const handlePrint = () => {
    if (!order) return;
    const w = window.open('', '_blank');
    if (!w) return;
    w.document.write(`<!DOCTYPE html><html><head><title>Invoice #${order.id}</title>
    <style>body{font-family:'DM Sans',Arial,sans-serif;padding:48px;color:#111;}
    h1{font-size:22px;font-weight:700;margin-bottom:4px}
    .sub{color:#888;font-size:13px;margin-bottom:32px}
    .meta{display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:32px;font-size:13px}
    .meta-label{color:#888;font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:.06em;margin-bottom:2px}
    table{width:100%;border-collapse:collapse;font-size:13px}
    th{text-align:left;padding:10px 12px;background:#f5f4f0;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.06em;color:#888}
    td{padding:12px;border-bottom:1px solid #eee}
    .total-row{display:flex;justify-content:space-between;padding:8px 0;font-size:14px}
    .total-final{font-weight:700;font-size:16px;border-top:2px solid #111;margin-top:8px;padding-top:12px}
    .footer{text-align:center;margin-top:48px;font-size:12px;color:#aaa}</style></head>
    <body>
    <h1>Cricket Store</h1><p class="sub">Invoice · Order #${order.id}</p>
    <div class="meta">
      <div><div class="meta-label">Date</div>${formatDate(order.created_at)}</div>
      <div><div class="meta-label">Status</div>${order.status}</div>
      <div><div class="meta-label">Customer</div>${order.user_name ?? order.user_id}</div>
      <div><div class="meta-label">Payment</div>${order.payment_status ?? 'Paid'}</div>
    </div>
    <table><thead><tr><th>Product</th><th>Qty</th><th>Unit price</th><th>Total</th></tr></thead>
    <tbody>${order.items?.map(i => `<tr><td>${i.name}</td><td>${i.quantity}</td><td>₹${i.price}</td><td>₹${(i.quantity * i.price).toFixed(0)}</td></tr>`).join('') ?? ''}</tbody></table>
    <div style="max-width:280px;margin-left:auto;margin-top:24px">
      <div class="total-row"><span>Subtotal</span><span>₹${order.total_amount.toFixed(0)}</span></div>
      <div class="total-row"><span>Shipping</span><span style="color:#16a34a">Free</span></div>
      <div class="total-row total-final"><span>Total</span><span>₹${order.total_amount.toFixed(0)}</span></div>
    </div>
    <div class="footer">Thank you for shopping with Cricket Store!</div>
    </body></html>`);
    w.document.close(); w.print();
  };

  /* ─── Loading ── */
  if (loading) return (
    <div className="flex flex-col items-center justify-center h-80 gap-3" style={{ fontFamily: "'DM Sans', sans-serif" }}>
      <div className="w-8 h-8 border-2 border-stone-900 border-t-transparent rounded-full animate-spin" />
      <p className="text-sm text-stone-400">Loading order…</p>
    </div>
  );

  if (!order) return (
    <div className="flex flex-col items-center justify-center h-80 gap-4" style={{ fontFamily: "'DM Sans', sans-serif" }}>
      <div className="w-14 h-14 rounded-2xl bg-stone-100 flex items-center justify-center">
        <Package size={24} className="text-stone-400" />
      </div>
      <p className="text-sm text-stone-500">Order not found</p>
      <Link to="/orders" className="text-xs text-stone-400 hover:text-stone-700 underline underline-offset-2">
        Back to orders
      </Link>
    </div>
  );

  const statusCfg = STATUS_CFG[order.status.toLowerCase()] ?? STATUS_CFG.pending;
  const StatusIcon = statusCfg.icon;
  const currentStep = STATUS_ORDER[order.status.toLowerCase()] ?? 0;
  const isCancelled = order.status.toLowerCase() === 'cancelled';

  /* ─── Render ── */
  return (
    <>
      <div className="space-y-5 p-4 md:p-6" style={{ fontFamily: "'DM Sans', sans-serif" }}>

        {/* ── Header ── */}
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <div className="order-2 sm:order-1">
            <button
              onClick={() => navigate('/orders')}
              className="flex items-center gap-1.5 text-xs text-stone-400 hover:text-stone-700 transition-colors mb-3"
            >
              <ArrowLeft size={13} /> Back to orders
            </button>
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="text-xl sm:text-2xl font-bold text-stone-900 tracking-tight">
                Order <span className="font-mono">#{order.id}</span>
              </h1>
              <StatusPill status={order.status} />
            </div>
            <p className="text-xs text-stone-400 mt-1">Placed {formatDate(order.created_at)}</p>
          </div>
          <div className="flex flex-wrap gap-2 shrink-0">
            <button
              onClick={() => {
                localStorage.setItem('viewingUserId', order.user_id);
                navigate(`/users/${order.user_id}/addresses`);
              }}
              className="flex items-center gap-2 px-4 py-2.5 border border-stone-200 rounded-xl text-sm text-stone-600 hover:bg-stone-50 transition-colors"
            >
              <MapPin size={14} /> Addresses
            </button>
            <button
              onClick={handlePrint}
              className="flex items-center gap-2 px-4 py-2.5 border border-stone-200 rounded-xl text-sm text-stone-600 hover:bg-stone-50 transition-colors"
            >
              <Printer size={14} /> Print
            </button>
            <button
              onClick={() => fetchOrder(true)}
              className="flex items-center gap-2 px-4 py-2.5 bg-[#3F51B5] text-white text-sm font-medium rounded-xl hover:bg-stone-700 transition-colors"
            >
              <RefreshCw size={14} className={refreshing ? 'animate-spin' : ''} /> Refresh
            </button>
          </div>
        </div>

        {/* ── Status banner ── */}
        <div className={`rounded-2xl border px-4 md:px-5 py-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 ${statusCfg.bg} ${statusCfg.border}`}>
          <div className="flex items-center gap-3">
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${statusCfg.bg}`}>
              <StatusIcon size={18} className={statusCfg.text} />
            </div>
            <div>
              <p className={`text-sm font-semibold ${statusCfg.text}`}>
                {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
              </p>
              <p className="text-xs text-stone-400 mt-0.5">
                Updated {formatShort(order.updated_at ?? order.created_at)}
              </p>
            </div>
          </div>
          <div className="relative">
            <select
              value={order.status}
              onChange={e => handleStatusUpdate(e.target.value)}
              disabled={updating}
              className="appearance-none pl-3.5 pr-8 py-2 rounded-xl border border-stone-200 bg-white text-sm text-stone-700 focus:outline-none focus:border-stone-900 focus:ring-2 focus:ring-stone-900/8 transition-all disabled:opacity-50"
            >
              {STATUS_OPTIONS.map(s => <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
            </select>
            <ChevronRight size={12} className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 rotate-90 pointer-events-none" />
          </div>
        </div>

        {/* ── Main grid ── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

          {/* Left: Order + Customer */}
          <div className="lg:col-span-2 space-y-4">

            {/* Order info */}
            <SectionCard title="Order information" icon={Package}>
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-2 gap-4">
                {[
                  { label: 'Order ID',       value: `#${order.id}`,                     mono: true },
                  { label: 'Date placed',    value: formatDate(order.created_at),        mono: false },
                  { label: 'Payment method', value: order.payment_method ?? 'Credit card', mono: false },
                  { label: 'Payment status', value: order.payment_status ?? 'Paid',       mono: false },
                ].map(r => (
                  <div key={r.label}>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-stone-400">{r.label}</p>
                    <p className={`text-sm text-stone-800 mt-1 ${r.mono ? 'font-mono' : ''}`}>{r.value}</p>
                  </div>
                ))}
              </div>
            </SectionCard>

            {/* Customer info */}
            <SectionCard title="Customer" icon={User}>
              <div className="space-y-3">
                <InfoRow icon={User}  label="Full name"  value={order.user_name} />
                <InfoRow icon={Mail}  label="Email"      value={order.user_email} />
                <InfoRow icon={Phone} label="Phone"      value={order.user_phone} />
                <InfoRow icon={Hash}  label="User ID"    value={order.user_id} mono />
              </div>
            </SectionCard>

            {/* Shipping */}
            {order.shipping_address && (
              <SectionCard title="Shipping address" icon={MapPin}>
                <p className="text-sm text-stone-700 leading-relaxed whitespace-pre-line">{order.shipping_address}</p>
              </SectionCard>
            )}

            {/* Timeline */}
            <SectionCard title="Order timeline" icon={Clock}>
              {isCancelled ? (
                <div className="flex items-center gap-3">
                  <div className="w-7 h-7 rounded-full bg-red-50 flex items-center justify-center">
                    <XCircle size={14} className="text-red-500" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-stone-800">Order cancelled</p>
                    <p className="text-xs text-stone-400 mt-0.5">{formatShort(order.updated_at ?? order.created_at)}</p>
                  </div>
                </div>
              ) : (
                <div className="relative">
                  {/* Connector line */}
                  <div className="absolute left-3 top-4 bottom-4 w-px bg-stone-100" />
                  <div className="space-y-4">
                    {TIMELINE_STEPS.map((step, i) => {
                      const done = i <= currentStep;
                      const active = i === currentStep;
                      return (
                        <div key={step.key} className="flex items-center gap-4 relative">
                          <div className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 z-10 border-2 transition-all
                            ${active  ? 'bg-[#3F51B5] border-stone-900'
                            : done   ? 'bg-emerald-500 border-emerald-500'
                            : 'bg-white border-stone-200'}`}
                          >
                            {done && !active && <CheckCircle size={12} className="text-white" />}
                            {active && <span className="w-2 h-2 rounded-full bg-white" />}
                          </div>
                          <div>
                            <p className={`text-sm font-medium ${done ? 'text-stone-900' : 'text-stone-400'}`}>{step.label}</p>
                            {(active || done) && (
                              <p className="text-xs text-stone-400 mt-0.5">
                                {i === 0
                                  ? formatShort(order.created_at)
                                  : formatShort(order.updated_at ?? order.created_at)}
                              </p>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </SectionCard>
          </div>

          {/* Right: Summary */}
          <div className="space-y-4">
            <div className="bg-white rounded-2xl border border-stone-100 overflow-hidden sticky top-6">
              <div className="flex items-center gap-2 px-5 py-4 border-b border-stone-100">
                <Calendar size={14} className="text-stone-400" />
                <p className="text-[11px] font-bold uppercase tracking-widest text-stone-400">Order summary</p>
              </div>
              <div className="px-5 py-4 space-y-2.5">
                <div className="flex justify-between text-sm text-stone-500">
                  <span>Subtotal</span>
                  <span className="text-stone-800 tabular-nums">{formatCurrency(order.total_amount)}</span>
                </div>
                <div className="flex justify-between text-sm text-stone-500">
                  <span>Shipping</span>
                  <span className="text-emerald-600 font-medium">Free</span>
                </div>
                <div className="flex justify-between text-sm text-stone-500">
                  <span>Tax</span>
                  <span className="text-stone-800">Included</span>
                </div>
                <div className="pt-2.5 border-t border-stone-100 flex justify-between items-baseline">
                  <span className="text-sm font-bold text-stone-900">Total</span>
                  <span className="text-xl font-bold text-stone-900 tabular-nums">{formatCurrency(order.total_amount)}</span>
                </div>
              </div>

              {/* Quick actions */}
              <div className="px-5 pb-5 space-y-2">
                <button
                  onClick={() => setShowTracking(true)}
                  className="w-full py-2.5 rounded-xl border border-stone-200 text-sm font-medium text-stone-600 hover:bg-stone-50 transition-colors flex items-center justify-center gap-2"
                >
                  <Truck size={14} /> Add tracking
                </button>
                <button
                  onClick={handlePrint}
                  className="w-full py-2.5 rounded-xl bg-[#3F51B5] text-white text-sm font-medium hover:bg-stone-700 transition-colors flex items-center justify-center gap-2"
                >
                  <Printer size={14} /> Print invoice
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* ── Order items ── */}
        <div className="bg-white rounded-2xl border border-stone-100 overflow-hidden">
          <div className="flex flex-wrap items-center gap-2 px-4 md:px-5 py-4 border-b border-stone-100">
            <Package size={14} className="text-stone-400" />
            <p className="text-[11px] font-bold uppercase tracking-widest text-stone-400">Order items</p>
            <span className="ml-auto text-xs text-stone-400 font-mono">{order.items?.length ?? 0} item{order.items?.length !== 1 ? 's' : ''}</span>
          </div>

          {order.items && order.items.length > 0 ? (
            <>
              <div className="divide-y divide-stone-50">
                {order.items.map(item => (
                  <div key={item.id} className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4 px-4 md:px-5 py-4 hover:bg-stone-50/50 transition-colors group">
                    <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-xl overflow-hidden bg-stone-100 border border-stone-100 shrink-0">
                      <img
                        src={item.image || '/kit.png'} alt={item.name}
                        className="w-full h-full object-cover"
                        onError={e => { (e.target as HTMLImageElement).src = '/kit.png'; }}
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-stone-900 truncate">{item.name}</p>
                      <p className="text-xs text-stone-400 mt-0.5">
                        {item.quantity} × {formatCurrency(item.price)}
                        <span className="hidden sm:inline font-mono ml-1 text-stone-300">· #{item.product_id}</span>
                      </p>
                    </div>
                    <div className="flex items-center justify-between sm:flex-col sm:items-end gap-2 shrink-0">
                      <p className="text-sm font-bold text-stone-900 tabular-nums">{formatCurrency(item.price * item.quantity)}</p>
                      <Link
                        to={`/admin/products/${item.product_id}/edit`}
                        className="text-[10px] font-semibold text-stone-400 hover:text-stone-700 transition-all underline underline-offset-2"
                      >
                        Edit product
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
              {/* Totals */}
              <div className="px-5 py-4 border-t border-stone-100 bg-stone-50/50 flex justify-end">
                <div className="space-y-1.5 min-w-[200px]">
                  <div className="flex justify-between text-xs text-stone-400">
                    <span>Subtotal</span><span className="tabular-nums">{formatCurrency(order.total_amount)}</span>
                  </div>
                  <div className="flex justify-between text-xs text-stone-400">
                    <span>Shipping</span><span className="text-emerald-600">Free</span>
                  </div>
                  <div className="flex justify-between text-sm font-bold text-stone-900 pt-1.5 border-t border-stone-200">
                    <span>Total</span><span className="tabular-nums">{formatCurrency(order.total_amount)}</span>
                  </div>
                </div>
              </div>
            </>
          ) : (
            <div className="flex flex-col items-center justify-center py-14 gap-2">
              <Package size={22} className="text-stone-300" />
              <p className="text-sm text-stone-400">No items found for this order</p>
            </div>
          )}
        </div>
      </div>

      {/* ══════════════════ Tracking Dialog ══════════════════ */}
      {showTracking && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ fontFamily: "'DM Sans', sans-serif" }}>
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setShowTracking(false)} />
          <div className="relative w-full max-w-sm bg-[#fafaf7] rounded-2xl shadow-2xl border border-stone-200 overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 bg-white border-b border-stone-100">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-[#3F51B5] flex items-center justify-center">
                  <Truck size={14} className="text-white" />
                </div>
                <p className="text-sm font-semibold text-stone-900">Add tracking number</p>
              </div>
              <button onClick={() => setShowTracking(false)} className="w-7 h-7 rounded-lg flex items-center justify-center text-stone-400 hover:bg-stone-100 transition-all">
                <X size={14} />
              </button>
            </div>
            <div className="px-5 py-5 space-y-4">
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-widest text-stone-400 mb-1.5">Tracking number</label>
                <input
                  type="text"
                  value={trackingNumber}
                  onChange={e => setTrackingNumber(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleAddTracking()}
                  placeholder="e.g., 1Z999AA10123456784"
                  className="w-full px-3.5 py-2.5 border border-stone-200 rounded-xl text-sm text-stone-800 placeholder:text-stone-300 focus:outline-none focus:border-stone-900 focus:ring-2 focus:ring-stone-900/8 transition-all bg-white font-mono"
                />
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setShowTracking(false)}
                  className="flex-1 py-2.5 rounded-xl border border-stone-200 text-sm text-stone-500 font-medium hover:bg-stone-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAddTracking}
                  className="flex-1 py-2.5 rounded-xl bg-[#3F51B5] text-white text-sm font-medium hover:bg-stone-700 transition-colors"
                >
                  Add tracking
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}