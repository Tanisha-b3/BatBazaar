import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Package, ShoppingCart, TrendingUp, Users, DollarSign, ArrowUp, ArrowDown,
  RefreshCw, Calendar, Eye, ShoppingBag,
} from 'lucide-react';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import { API_URL } from '../config';

interface AnalyticsData {
  totalOrders: number;
  totalRevenue: number;
  totalProducts: number;
  totalUsers: number;
  pendingOrders: number;
  processingOrders: number;
  shippedOrders: number;
  deliveredOrders: number;
  cancelledOrders: number;
  revenueChange: number;
  ordersChange: number;
  topProducts: { id: number; name: string; sales: number; revenue: number }[];
  recentOrders: { id: number; user_name: string; total_amount: number; status: string; created_at: string }[];
  ordersByStatus: { status: string; count: number }[];
}

const formatCurrency = (amount: number) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(amount);

const formatDate = (s: string) =>
  new Date(s).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });

export default function Analytics() {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [period, setPeriod] = useState<'7days' | '30days' | '90days'>('30days');

  useEffect(() => { fetchAnalytics(); }, [period]);

  const fetchAnalytics = async (showSpinner = false) => {
    if (showSpinner) setRefreshing(true);
    else setLoading(true);
    try {
      const token = localStorage.getItem('adminToken');
      if (!token) { toast.error('Please login'); return; }

      const res = await axios.get(`${API_URL}/api/admin/analytics?period=${period}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = res.data;
      setData({
        totalOrders: data.totalOrders,
        totalRevenue: data.totalRevenue,
        totalProducts: data.totalProducts,
        totalUsers: data.totalUsers,
        pendingOrders: data.pendingOrders,
        processingOrders: data.processingOrders,
        shippedOrders: data.shippedOrders,
        deliveredOrders: data.deliveredOrders,
        cancelledOrders: data.cancelledOrders,
        revenueChange: data.revenueChange,
        ordersChange: data.ordersChange,
        topProducts: data.topProducts,
        recentOrders: data.recentOrders,
        ordersByStatus: data.ordersByStatus,
      });
    } catch (err) {
      console.error('Analytics error:', err);
      toast.error('Failed to load analytics');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-80 gap-3" style={{ fontFamily: "'DM Sans', sans-serif" }}>
        <div className="w-8 h-8 border-2 border-stone-900 border-t-transparent rounded-full animate-spin" />
        <p className="text-sm text-stone-400">Loading analytics…</p>
      </div>
    );
  }

  return (
    <div className="space-y-4 md:space-y-6 p-4 md:p-6" style={{ fontFamily: "'DM Sans', sans-serif" }}>
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-stone-900">Analytics</h1>
          <p className="text-xs text-stone-400 mt-0.5">Track your store performance</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <select
            value={period}
            onChange={(e) => setPeriod(e.target.value as any)}
            className="px-3 py-2 border border-stone-200 rounded-lg text-sm text-stone-700 bg-white focus:outline-none focus:border-stone-900"
          >
            <option value="7days">Last 7 days</option>
            <option value="30days">Last 30 days</option>
            <option value="90days">Last 90 days</option>
          </select>
          <button
            onClick={() => fetchAnalytics(true)}
            className="flex items-center gap-2 px-4 py-2 bg-[#3F51B5] text-white text-sm font-medium rounded-lg hover:bg-stone-700 transition-colors"
          >
            <RefreshCw size={14} className={refreshing ? 'animate-spin' : ''} /> Refresh
          </button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Total Revenue"
          value={formatCurrency(data?.totalRevenue || 0)}
          icon={DollarSign}
          change={data?.revenueChange}
          color="text-emerald-600"
        />
        <StatCard
          label="Total Orders"
          value={data?.totalOrders || 0}
          icon={ShoppingCart}
          change={data?.ordersChange}
        />
        <StatCard
          label="Products"
          value={data?.totalProducts || 0}
          icon={Package}
        />
        <StatCard
          label="Customers"
          value={data?.totalUsers || 0}
          icon={Users}
        />
      </div>

      {/* Order Status & Top Products */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
        {/* Order Status Breakdown */}
        <div className="bg-white rounded-2xl border border-stone-100 p-5">
          <h2 className="text-sm font-semibold text-stone-900 mb-4">Orders by Status</h2>
          <div className="space-y-3">
            {[
              { label: 'Pending', count: data?.pendingOrders || 0, color: 'bg-amber-500' },
              { label: 'Processing', count: data?.processingOrders || 0, color: 'bg-sky-500' },
              { label: 'Shipped', count: data?.shippedOrders || 0, color: 'bg-violet-500' },
              { label: 'Delivered', count: data?.deliveredOrders || 0, color: 'bg-emerald-500' },
              { label: 'Cancelled', count: data?.cancelledOrders || 0, color: 'bg-red-500' },
            ].map(item => (
              <div key={item.label} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className={`w-3 h-3 rounded-full ${item.color}`} />
                  <span className="text-sm text-stone-600">{item.label}</span>
                </div>
                <span className="text-sm font-semibold text-stone-900">{item.count}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Top Products */}
        <div className="bg-white rounded-2xl border border-stone-100 p-5">
          <h2 className="text-sm font-semibold text-stone-900 mb-4">Top Selling Products</h2>
          <div className="space-y-3">
            {data?.topProducts.slice(0, 5).map((product, i) => (
              <div key={product.id} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="w-6 h-6 rounded-full bg-stone-100 text-xs font-semibold text-stone-500 flex items-center justify-center">
                    {i + 1}
                  </span>
                  <span className="text-sm text-stone-700 truncate max-w-[180px]">{product.name}</span>
                </div>
                <div className="text-right">
                  <span className="text-sm font-semibold text-stone-900">{product.sales} sold</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recent Orders */}
      <div className="bg-white rounded-2xl border border-stone-100 overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-stone-100">
          <h2 className="text-sm font-semibold text-stone-900">Recent Orders</h2>
          <Link to="/orders" className="text-xs text-[#3F51B5] hover:underline">View all</Link>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-stone-100">
                <th className="px-5 py-3 text-left text-[11px] font-semibold text-stone-400 uppercase">Order</th>
                <th className="px-5 py-3 text-left text-[11px] font-semibold text-stone-400 uppercase">Customer</th>
                <th className="px-5 py-3 text-left text-[11px] font-semibold text-stone-400 uppercase">Amount</th>
                <th className="px-5 py-3 text-left text-[11px] font-semibold text-stone-400 uppercase">Status</th>
                <th className="px-5 py-3 text-left text-[11px] font-semibold text-stone-400 uppercase">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-50">
              {data?.recentOrders.map(order => (
                <tr key={order.id} className="hover:bg-stone-50/50">
                  <td className="px-5 py-3">
                    <span className="text-sm font-mono font-semibold text-stone-700">#{order.id}</span>
                  </td>
                  <td className="px-5 py-3">
                    <span className="text-sm text-stone-700">{order.user_name || 'Guest'}</span>
                  </td>
                  <td className="px-5 py-3">
                    <span className="text-sm font-semibold text-stone-900">{formatCurrency(order.total_amount)}</span>
                  </td>
                  <td className="px-5 py-3">
                    <StatusBadge status={order.status} />
                  </td>
                  <td className="px-5 py-3">
                    <span className="text-xs text-stone-500">{formatDate(order.created_at)}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function StatCard({ label, value, icon: Icon, change, color = 'text-stone-900' }: {
  label: string;
  value: string | number;
  icon: any;
  change?: number;
  color?: string;
}) {
  return (
    <div className="bg-white rounded-2xl border border-stone-100 p-5 hover:border-stone-200 transition-colors">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs text-stone-400 font-medium">{label}</p>
          <p className={`text-xl md:text-2xl font-bold ${color} mt-1`}>{value}</p>
        </div>
        <div className="w-10 h-10 rounded-xl bg-stone-50 flex items-center justify-center">
          <Icon size={18} className="text-stone-600" />
        </div>
      </div>
      {change !== undefined && (
        <div className="flex items-center gap-1 mt-2">
          {change >= 0 ? (
            <ArrowUp size={12} className="text-emerald-500" />
          ) : (
            <ArrowDown size={12} className="text-red-500" />
          )}
          <span className={`text-xs font-medium ${change >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
            {Math.abs(change)}%
          </span>
          <span className="text-xs text-stone-400">vs last period</span>
        </div>
      )}
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const colors: Record<string, { bg: string; text: string }> = {
    pending: { bg: 'bg-amber-50', text: 'text-amber-700' },
    processing: { bg: 'bg-sky-50', text: 'text-sky-700' },
    shipped: { bg: 'bg-violet-50', text: 'text-violet-700' },
    delivered: { bg: 'bg-emerald-50', text: 'text-emerald-700' },
    cancelled: { bg: 'bg-red-50', text: 'text-red-700' },
  };
  const c = colors[status] || colors.pending;
  return (
    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold ${c.bg} ${c.text}`}>
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  );
}