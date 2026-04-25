import { useState, useEffect } from 'react';
import {
  Package, ShoppingCart, TrendingUp, Users,
  Eye, ArrowUp, ArrowDown, RefreshCw,
  AlertTriangle, ChevronRight, BarChart3,
} from 'lucide-react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';

/* ─── Types ─────────────────────────────────────────────────── */
interface Stats {
  totalProducts: number;
  totalOrders: number;
  totalRevenue: number;
  recentOrders: number;
  totalUsers?: number;
  pendingOrders?: number;
  revenueChange?: number;
  ordersChange?: number;
}

interface RecentOrder {
  id: number;
  user_id: string;
  total_amount: number;
  status: string;
  created_at: string;
  user_name?: string;
}

interface LowStockProduct {
  id: number;
  name: string;
  stock: number;
  price: number;
}

/* ─── Helpers ────────────────────────────────────────────────── */
const formatCurrency = (amount: number) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(amount);

const formatDate = (dateString: string) =>
  new Date(dateString).toLocaleDateString('en-IN', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });

const STATUS_STYLES: Record<string, { bg: string; text: string; dot: string }> = {
  pending:    { bg: 'bg-amber-50',   text: 'text-amber-700',   dot: 'bg-amber-400' },
  processing: { bg: 'bg-sky-50',     text: 'text-sky-700',     dot: 'bg-sky-400' },
  shipped:    { bg: 'bg-violet-50',  text: 'text-violet-700',  dot: 'bg-violet-400' },
  delivered:  { bg: 'bg-emerald-50', text: 'text-emerald-700', dot: 'bg-emerald-400' },
  cancelled:  { bg: 'bg-red-50',     text: 'text-red-600',     dot: 'bg-red-400' },
};

/* ─── Demo Data (for when API is unavailable) ───────────────── */
const DEMO_STATS: Stats = {
  totalProducts: 156,
  totalOrders: 1248,
  totalRevenue: 3842500,
  recentOrders: 89,
  totalUsers: 3421,
  pendingOrders: 23,
  revenueChange: 12.5,
  ordersChange: 8.3,
};

const DEMO_RECENT_ORDERS: RecentOrder[] = [
  { id: 1001, user_id: 'user_001', total_amount: 2499, status: 'delivered', created_at: new Date().toISOString(), user_name: 'Rahul Sharma' },
  { id: 1002, user_id: 'user_002', total_amount: 3999, status: 'shipped', created_at: new Date(Date.now() - 86400000).toISOString(), user_name: 'Priya Patel' },
  { id: 1003, user_id: 'user_003', total_amount: 1899, status: 'processing', created_at: new Date(Date.now() - 172800000).toISOString(), user_name: 'Amit Kumar' },
  { id: 1004, user_id: 'user_004', total_amount: 5499, status: 'pending', created_at: new Date(Date.now() - 259200000).toISOString(), user_name: 'Sneha Reddy' },
  { id: 1005, user_id: 'user_005', total_amount: 1299, status: 'delivered', created_at: new Date(Date.now() - 345600000).toISOString(), user_name: 'Vikram Singh' },
];

const DEMO_LOW_STOCK: LowStockProduct[] = [
  { id: 1, name: 'Cricket Bat - Professional Grade', stock: 3, price: 4999 },
  { id: 2, name: 'Leather Cricket Ball', stock: 5, price: 899 },
  { id: 3, name: 'Batting Gloves - Premium', stock: 2, price: 1299 },
  { id: 4, name: 'Helmet - Pro Series', stock: 4, price: 2499 },
];

/* ─── Sub-components ────────────────────────────────────────── */
function StatusPill({ status }: { status: string }) {
  const s = STATUS_STYLES[status.toLowerCase()] ?? { bg: 'bg-stone-100', text: 'text-stone-600', dot: 'bg-stone-400' };
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold ${s.bg} ${s.text}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${s.dot}`} />
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  );
}

function SectionHeader({ title, action }: { title: string; action?: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between px-5 py-4 border-b border-stone-100">
      <h2 className="text-sm font-bold uppercase tracking-widest text-stone-400">{title}</h2>
      {action}
    </div>
  );
}

/* ─── Main ───────────────────────────────────────────────────── */
export default function Dashboard() {
  const [stats, setStats] = useState<Stats>({
    totalProducts: 0, totalOrders: 0, totalRevenue: 0,
    recentOrders: 0, totalUsers: 0, pendingOrders: 0,
    revenueChange: 0, ordersChange: 0,
  });
  const [recentOrders, setRecentOrders]         = useState<RecentOrder[]>([]);
  const [lowStockProducts, setLowStockProducts] = useState<LowStockProduct[]>([]);
  const [loading, setLoading]   = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError]       = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  const [usingDemoMode, setUsingDemoMode] = useState(false);

  useEffect(() => { fetchData(); }, []);

  const fetchData = async (soft = false) => {
    // Check if we're in demo mode
    const isDemoMode = localStorage.getItem('useDemoMode') === 'true';
    
    if (isDemoMode) {
      // Use demo data
      setStats(DEMO_STATS);
      setRecentOrders(DEMO_RECENT_ORDERS);
      setLowStockProducts(DEMO_LOW_STOCK);
      setUsingDemoMode(true);
      setLoading(false);
      setRefreshing(false);
      setLastUpdated(new Date());
      return;
    }

    soft ? setRefreshing(true) : setLoading(true);
    setError(null);
    
    try {
      const token = localStorage.getItem('adminToken');
      if (!token) { 
        setError('Authentication required. Please login again.');
        setLoading(false);
        return;
      }
      
      // Use relative path to avoid CORS issues
      const response = await axios.get(`${import.meta.env.VITE_API_URL}/api/admin/dashboard`, {
        headers: { Authorization: `Bearer ${token}` },
        timeout: 10000, // 10 second timeout
      });
      
      setStats(response.data.stats ?? response.data);
      setRecentOrders(response.data.recentOrders ?? []);
      setLowStockProducts(response.data.lowStockProducts ?? []);
      setUsingDemoMode(false);
      setLastUpdated(new Date());
      
    } catch (err) {
      console.error('Dashboard fetch error:', err);
      
      // Fall back to demo data on error
      if (axios.isAxiosError(err)) {
        if (err.response?.status === 401) {
          setError('Session expired. Please login again.');
          setTimeout(() => { window.location.href = '/login'; }, 2000);
        } else if (err.code === 'ERR_NETWORK' || err.message.includes('CORS')) {
          // Network/CORS error - use demo data
          console.log('Network/CORS error, using demo data');
          setStats(DEMO_STATS);
          setRecentOrders(DEMO_RECENT_ORDERS);
          setLowStockProducts(DEMO_LOW_STOCK);
          setUsingDemoMode(true);
          setError(null); // Clear error since we have demo data
          toast.error('Using demo data (API unavailable)');
        } else {
          setError(err.response?.data?.message ?? 'Failed to load dashboard');
        }
      } else {
        setError('An unexpected error occurred');
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  /* ── Stat card data ── */
  const statCards = [
    {
      label: 'Total revenue',
      value: formatCurrency(stats.totalRevenue),
      icon: TrendingUp,
      change: stats.revenueChange,
      sub: 'vs. last month',
    },
    {
      label: 'Total orders',
      value: stats.totalOrders.toLocaleString(),
      icon: ShoppingCart,
      change: stats.ordersChange,
      sub: 'vs. last month',
    },
    {
      label: 'Products',
      value: stats.totalProducts.toLocaleString(),
      icon: Package,
      change: null,
      sub: `${stats.pendingOrders ?? 0} pending orders`,
    },
    {
      label: 'Active users',
      value: (stats.totalUsers ?? 0).toLocaleString(),
      icon: Users,
      change: null,
      sub: `${stats.recentOrders} orders (30 days)`,
    },
  ];

  /* ─── Loading ─── */
  if (loading) return (
    <div className="flex flex-col items-center justify-center h-80 gap-3" style={{ fontFamily: "'DM Sans', sans-serif" }}>
      <div className="w-8 h-8 border-2 border-stone-900 border-t-transparent rounded-full animate-spin" />
      <p className="text-sm text-stone-400">Loading dashboard…</p>
    </div>
  );

  /* ─── Error ─── */
  if (error) return (
    <div className="flex items-center justify-center h-80 p-6" style={{ fontFamily: "'DM Sans', sans-serif" }}>
      <div className="bg-white border border-red-100 rounded-2xl p-8 max-w-sm w-full text-center shadow-sm">
        <div className="w-12 h-12 rounded-2xl bg-red-50 flex items-center justify-center mx-auto mb-4">
          <AlertTriangle size={22} className="text-red-500" />
        </div>
        <h3 className="text-base font-semibold text-stone-900 mb-1">Failed to load</h3>
        <p className="text-sm text-stone-400 mb-5">{error}</p>
        <div className="space-y-2">
          <button
            onClick={() => fetchData()}
            className="inline-flex items-center justify-center gap-2 w-full px-5 py-2.5 bg-[#3F51B5] text-white text-sm font-medium rounded-xl hover:bg-stone-700 transition-colors"
          >
            <RefreshCw size={14} /> Retry
          </button>
          <button
            onClick={() => {
              localStorage.setItem('useDemoMode', 'true');
              fetchData();
            }}
            className="inline-flex items-center justify-center gap-2 w-full px-5 py-2.5 border border-stone-200 text-stone-600 text-sm font-medium rounded-xl hover:bg-stone-50 transition-colors"
          >
            Use Demo Data
          </button>
        </div>
      </div>
    </div>
  );

  /* ─── Main render ─── */
  return (
    <div className="space-y-4 md:space-y-6 p-4 md:p-6" style={{ fontFamily: "'DM Sans', sans-serif" }}>

      {/* ── Demo Mode Banner ── */}
      {usingDemoMode && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertTriangle size={16} className="text-amber-600" />
            <p className="text-xs text-amber-700">Demo Mode: Using sample data (API unavailable)</p>
          </div>
          <button
            onClick={() => {
              localStorage.removeItem('useDemoMode');
              fetchData();
            }}
            className="text-xs text-amber-700 hover:text-amber-900 underline"
          >
            Try API again
          </button>
        </div>
      )}

      {/* ── Header ── */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-stone-900 tracking-tight">Dashboard</h1>
          <p className="text-xs text-stone-400 mt-0.5 font-mono">
            Updated {lastUpdated.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
            {usingDemoMode && ' (Demo Data)'}
          </p>
        </div>
        <button
          onClick={() => fetchData(true)}
          className="flex items-center gap-2 px-4 py-2.5 border border-stone-200 rounded-xl text-sm text-stone-500 hover:bg-stone-50 transition-colors"
        >
          <RefreshCw size={14} className={refreshing ? 'animate-spin' : ''} />
          <span>Refresh</span>
        </button>
      </div>

      {/* ── Stat cards ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((card, i) => {
          const Icon = card.icon;
          const up = card.change !== null && card.change !== undefined && card.change > 0;
          const dn = card.change !== null && card.change !== undefined && card.change < 0;
          return (
            <div key={i} className="bg-white rounded-2xl border border-stone-100 p-5 hover:border-stone-200 transition-colors">
              <div className="flex items-start justify-between mb-4">
                <p className="text-xs font-semibold uppercase tracking-widest text-stone-400">{card.label}</p>
                <div className="w-8 h-8 rounded-xl bg-stone-100 flex items-center justify-center shrink-0">
                  <Icon size={15} className="text-stone-500" />
                </div>
              </div>
              <p className="text-2xl font-bold text-stone-900 tabular-nums mb-1.5">{card.value}</p>
              {card.change !== null && card.change !== undefined ? (
                <div className="flex items-center gap-1">
                  {up && <ArrowUp size={11} className="text-emerald-500" />}
                  {dn && <ArrowDown size={11} className="text-red-400" />}
                  <span className={`text-xs font-semibold ${up ? 'text-emerald-600' : dn ? 'text-red-500' : 'text-stone-400'}`}>
                    {card.change > 0 ? '+' : ''}{card.change}%
                  </span>
                  <span className="text-xs text-stone-400">{card.sub}</span>
                </div>
              ) : (
                <p className="text-xs text-stone-400">{card.sub}</p>
              )}
            </div>
          );
        })}
      </div>

      {/* ── Recent orders + Low stock ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">

        {/* Recent Orders */}
        <div className="bg-white rounded-2xl border border-stone-100 overflow-hidden">
          <SectionHeader
            title="Recent orders"
            action={
              <Link to="/orders" className="flex items-center gap-1 text-xs font-semibold text-stone-500 hover:text-stone-900 transition-colors">
                View all <ChevronRight size={13} />
              </Link>
            }
          />
          <div className="divide-y divide-stone-50">
            {recentOrders.length > 0 ? recentOrders.slice(0, 5).map(order => (
              <div key={order.id} className="flex items-center justify-between px-5 py-3.5 hover:bg-stone-50/60 transition-colors">
                <div>
                  <p className="text-sm font-medium text-stone-900">Order <span className="font-mono text-xs text-stone-500">#{order.id}</span></p>
                  <p className="text-xs text-stone-400 mt-0.5">
                    {order.user_name ?? `${order.user_id.slice(0, 8)}…`} · {formatDate(order.created_at)}
                  </p>
                </div>
                <div className="text-right flex flex-col items-end gap-1.5">
                  <span className="text-sm font-bold text-stone-900 tabular-nums">{formatCurrency(order.total_amount)}</span>
                  <StatusPill status={order.status} />
                </div>
              </div>
            )) : (
              <div className="flex flex-col items-center justify-center py-14 gap-2">
                <div className="w-12 h-12 rounded-2xl bg-stone-100 flex items-center justify-center">
                  <ShoppingCart size={20} className="text-stone-400" />
                </div>
                <p className="text-sm text-stone-400">No recent orders</p>
              </div>
            )}
          </div>
        </div>

        {/* Low Stock */}
        <div className="bg-white rounded-2xl border border-stone-100 overflow-hidden">
          <SectionHeader
            title="Low stock alert"
            action={
              lowStockProducts.length > 0
                ? <Link to="/products?filter=low-stock" className="flex items-center gap-1 text-xs font-semibold text-stone-500 hover:text-stone-900 transition-colors">
                    Manage <ChevronRight size={13} />
                  </Link>
                : undefined
            }
          />
          <div className="divide-y divide-stone-50">
            {lowStockProducts.length > 0 ? lowStockProducts.slice(0, 5).map(product => (
              <div key={product.id} className="flex items-center justify-between px-5 py-3.5 hover:bg-stone-50/60 transition-colors">
                <div>
                  <p className="text-sm font-medium text-stone-900">{product.name}</p>
                  <p className="text-xs text-stone-400 mt-0.5">{formatCurrency(product.price)}</p>
                </div>
                <span className={`text-xs font-bold px-2.5 py-1 rounded-full tabular-nums
                  ${product.stock <= 5
                    ? 'bg-red-50 text-red-600'
                    : 'bg-amber-50 text-amber-600'}
                `}>
                  {product.stock} left
                </span>
              </div>
            )) : (
              <div className="flex flex-col items-center justify-center py-14 gap-2">
                <div className="w-12 h-12 rounded-2xl bg-emerald-50 flex items-center justify-center">
                  <Package size={20} className="text-emerald-500" />
                </div>
                <p className="text-sm text-stone-400">All products well stocked</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Quick actions ── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[
          {
            to: '/products',            icon: Package,
            title: 'Add product',
            sub: 'Create a new product listing',
            accent: 'hover:border-stone-400',
          },
          {
            to: '/orders',
            icon: ShoppingCart,
            title: 'Manage orders',
            sub: 'View and update customer orders',
            accent: 'hover:border-stone-400',
          },
          {
            to: '/analytics',
            icon: BarChart3,
            title: 'Analytics',
            sub: 'Sales reports and insights',
            accent: 'hover:border-stone-400',
          },
        ].map(({ to, icon: Icon, title, sub, accent }) => (
          <Link
            key={to}
            to={to}
            className={`group flex items-center gap-4 p-5 bg-white rounded-2xl border border-stone-200 ${accent} transition-all hover:shadow-sm`}
          >
            <div className="w-11 h-11 rounded-xl bg-stone-100 flex items-center justify-center shrink-0 group-hover:bg-[#3F51B5] transition-colors">
              <Icon size={18} className="text-stone-500 group-hover:text-white transition-colors" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-stone-900">{title}</p>
              <p className="text-xs text-stone-400 mt-0.5 truncate">{sub}</p>
            </div>
            <ChevronRight size={15} className="text-stone-300 group-hover:text-stone-600 transition-colors shrink-0" />
          </Link>
        ))}
      </div>
    </div>
  );
}