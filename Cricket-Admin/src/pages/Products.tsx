import { useState, useEffect } from 'react';
import {
  Plus, Search, Edit, Trash2, Eye,
  ChevronLeft, ChevronRight, RefreshCw,
  Package, TrendingUp, XCircle, LayoutGrid,
  SlidersHorizontal, X,
} from 'lucide-react';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import { API_URL } from '../config';
import ProductFormDialog from './ProductForm';
import { Link } from 'react-router-dom';

/* ─── Types ─────────────────────────────────────────────────── */
interface Product {
  id: number;
  name: string;
  price: number;
  old_price: number;
  category: string;
  image: string;
  available: boolean;
  created_at: string;
  rating?: number;
  reviews?: number;
  stock?: number;
}

/* ─── Constants ─────────────────────────────────────────────── */
const CATEGORIES = [
  { value: 'all',         label: 'All categories' },
  { value: 'bats',        label: 'Bats' },
  { value: 'kit',         label: 'Kits' },
  { value: 'accessories', label: 'Accessories' },
  { value: 'helmet',      label: 'Helmets' },
  { value: 'clothing',    label: 'Clothing' },
  { value: 'shoes',       label: 'Shoes' },
];

const CATEGORY_COLORS: Record<string, { bg: string; text: string }> = {
  bats:        { bg: 'bg-sky-50',     text: 'text-sky-700' },
  kit:         { bg: 'bg-emerald-50', text: 'text-emerald-700' },
  accessories: { bg: 'bg-violet-50',  text: 'text-violet-700' },
  helmet:      { bg: 'bg-amber-50',   text: 'text-amber-700' },
  clothing:    { bg: 'bg-rose-50',    text: 'text-rose-700' },
  shoes:       { bg: 'bg-indigo-50',  text: 'text-indigo-700' },
};

/* ─── Sub-components ────────────────────────────────────────── */
function StatCard({ label, value, color = 'text-stone-900' }: {
  label: string; value: number | string; color?: string;
}) {
  return (
    <div className="bg-white rounded-2xl border border-stone-100 p-5">
      <p className="text-xs font-semibold uppercase tracking-widest text-stone-400 mb-2">{label}</p>
      <p className={`text-3xl font-bold tabular-nums ${color}`}>{value}</p>
    </div>
  );
}

function StockBadge({ stock }: { stock: number }) {
  if (stock <= 5)  return <span className="text-xs font-semibold text-red-600 bg-red-50 px-2 py-0.5 rounded-full">{stock} left</span>;
  if (stock <= 15) return <span className="text-xs font-semibold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full">{stock} units</span>;
  return <span className="text-xs font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">{stock} units</span>;
}

function CategoryPill({ category }: { category: string }) {
  const c = CATEGORY_COLORS[category] ?? { bg: 'bg-stone-100', text: 'text-stone-600' };
  return (
    <span className={`inline-block text-xs font-semibold px-2.5 py-0.5 rounded-full ${c.bg} ${c.text}`}>
      {category.charAt(0).toUpperCase() + category.slice(1)}
    </span>
  );
}

/* ─── Main Component ────────────────────────────────────────── */
export default function Products() {
  const [products, setProducts]       = useState<Product[]>([]);
  const [loading, setLoading]         = useState(true);
  const [search, setSearch]           = useState('');
  const [category, setCategory]       = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [isDialogOpen, setIsDialogOpen]       = useState(false);
  const [editingProductId, setEditingProductId] = useState<string | null>(null);
  const [viewingProduct, setViewingProduct] = useState<Product | null>(null);
  const [refreshing, setRefreshing]   = useState(false);

  const ITEMS_PER_PAGE = 10;

  useEffect(() => { fetchProducts(); }, [category, statusFilter]);

  const fetchProducts = async (showSpinner = true) => {
    if (showSpinner) setLoading(true);
    else setRefreshing(true);
    try {
      const token = localStorage.getItem('adminToken');
      if (!token) { toast.error('Please login again'); return; }
      const params: Record<string, string> = {};
      if (category !== 'all') params.category = category;
      if (statusFilter !== 'all') params.status = statusFilter;
      const response = await axios.get(`${API_URL}/api/admin/products`, {
        headers: { Authorization: `Bearer ${token}` }, params,
      });
      setProducts(response.data.products ?? response.data ?? []);
    } catch (error) {
      if (axios.isAxiosError(error)) {
        toast.error(error.response?.status === 401
          ? 'Session expired. Please login again.'
          : error.response?.data?.message ?? 'Failed to fetch products');
      } else {
        toast.error('An unexpected error occurred');
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Delete this product? This cannot be undone.')) return;
    try {
      const token = localStorage.getItem('adminToken');
      await axios.delete(`${API_URL}/api/admin/products/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setProducts(prev => prev.filter(p => p.id !== id));
      toast.success('Product deleted');
    } catch { toast.error('Failed to delete product'); }
  };

  const handleToggleStatus = async (id: number, current: boolean) => {
    try {
      const token = localStorage.getItem('adminToken');
      await axios.patch(`${API_URL}/api/admin/products/${id}/status`,
        { available: !current },
        { headers: { Authorization: `Bearer ${token}` } },
      );
      setProducts(prev => prev.map(p => p.id === id ? { ...p, available: !current } : p));
      toast.success(`Product ${!current ? 'activated' : 'deactivated'}`);
    } catch { toast.error('Failed to update status'); }
  };

  /* ── Filtering & pagination ── */
  const filtered = products.filter(p => {
    const matchSearch = p.name.toLowerCase().includes(search.toLowerCase());
    const matchStatus =
      statusFilter === 'all' ||
      (statusFilter === 'active' && p.available) ||
      (statusFilter === 'inactive' && !p.available);
    return matchSearch && matchStatus;
  });

  const totalPages    = Math.ceil(filtered.length / ITEMS_PER_PAGE);
  const startIndex    = (currentPage - 1) * ITEMS_PER_PAGE;
  const pageProducts  = filtered.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  const hasFilters    = search || category !== 'all' || statusFilter !== 'all';

  const clearFilters = () => { setSearch(''); setCategory('all'); setStatusFilter('all'); setCurrentPage(1); };

  /* ─────────────────────────── RENDER ─────────────────────── */
  return (
    <>
      <div className="space-y-4 md:space-y-6 p-4 md:p-6" style={{ fontFamily: "'DM Sans', sans-serif" }}>

        {/* ── Header ── */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-stone-900 tracking-tight">Products</h1>
            <p className="text-sm text-stone-400 mt-0.5">Manage your inventory</p>
          </div>
          <button
            onClick={() => { setEditingProductId(null); setIsDialogOpen(true); }}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-[#3F51B5] text-white text-sm font-medium rounded-xl hover:bg-stone-700 transition-colors shadow-sm"
          >
            <Plus size={16} />
            Add product
          </button>
        </div>

        {/* ── Stats ── */}
        {!loading && products.length > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <StatCard label="Total" value={products.length} />
            <StatCard label="Active" value={products.filter(p => p.available).length} color="text-emerald-600" />
            <StatCard label="Inactive" value={products.filter(p => !p.available).length} color="text-red-500" />
            <StatCard label="Categories" value={new Set(products.map(p => p.category)).size} color="text-violet-600" />
          </div>
        )}

        {/* ── Filter bar ── */}
        <div className="bg-white rounded-2xl border border-stone-100 p-4">
          <div className="flex flex-col lg:flex-row gap-3">

            {/* Search */}
            <div className="relative flex-1">
              <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400" />
              <input
                type="text"
                placeholder="Search products…"
                value={search}
                onChange={e => { setSearch(e.target.value); setCurrentPage(1); }}
                className="w-full pl-9 pr-4 py-2.5 border border-stone-200 rounded-xl text-sm text-stone-800 placeholder:text-stone-300 focus:outline-none focus:border-stone-900 focus:ring-2 focus:ring-stone-900/8 transition-all"
              />
              {search && (
                <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-300 hover:text-stone-500">
                  <X size={14} />
                </button>
              )}
            </div>

            {/* Category */}
            <div className="relative">
              <select
                value={category}
                onChange={e => { setCategory(e.target.value); setCurrentPage(1); }}
                className="appearance-none pl-3.5 pr-8 py-2.5 border border-stone-200 rounded-xl text-sm text-stone-700 focus:outline-none focus:border-stone-900 focus:ring-2 focus:ring-stone-900/8 transition-all bg-white"
              >
                {CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
              </select>
              <ChevronRight size={13} className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 rotate-90 pointer-events-none" />
            </div>

            {/* Status */}
            <div className="relative">
              <select
                value={statusFilter}
                onChange={e => { setStatusFilter(e.target.value as typeof statusFilter); setCurrentPage(1); }}
                className="appearance-none pl-3.5 pr-8 py-2.5 border border-stone-200 rounded-xl text-sm text-stone-700 focus:outline-none focus:border-stone-900 focus:ring-2 focus:ring-stone-900/8 transition-all bg-white"
              >
                <option value="all">All status</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
              <ChevronRight size={13} className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 rotate-90 pointer-events-none" />
            </div>

            {/* Refresh */}
            <button
              onClick={() => fetchProducts(false)}
              className="flex items-center gap-2 px-4 py-2.5 border border-stone-200 rounded-xl text-sm text-stone-500 hover:bg-stone-50 transition-colors"
            >
              <RefreshCw size={14} className={refreshing ? 'animate-spin' : ''} />
              <span className="hidden sm:inline">Refresh</span>
            </button>
          </div>

          {/* Active filter chips */}
          {hasFilters && (
            <div className="flex items-center gap-2 mt-3 pt-3 border-t border-stone-100">
              <SlidersHorizontal size={12} className="text-stone-400" />
              <span className="text-xs text-stone-400">Filters:</span>
              {search && (
                <span className="flex items-center gap-1 text-xs bg-stone-100 text-stone-600 px-2.5 py-1 rounded-full">
                  "{search}" <button onClick={() => setSearch('')}><X size={10} /></button>
                </span>
              )}
              {category !== 'all' && (
                <span className="flex items-center gap-1 text-xs bg-stone-100 text-stone-600 px-2.5 py-1 rounded-full">
                  {category} <button onClick={() => setCategory('all')}><X size={10} /></button>
                </span>
              )}
              {statusFilter !== 'all' && (
                <span className="flex items-center gap-1 text-xs bg-stone-100 text-stone-600 px-2.5 py-1 rounded-full">
                  {statusFilter} <button onClick={() => setStatusFilter('all')}><X size={10} /></button>
                </span>
              )}
              <button onClick={clearFilters} className="ml-auto text-xs text-stone-400 hover:text-stone-700 transition-colors">
                Clear all
              </button>
            </div>
          )}
        </div>

        {/* ── Table ── */}
        <div className="bg-white rounded-2xl border border-stone-100 overflow-hidden">
          {loading ? (
            <div className="flex flex-col items-center justify-center h-80 gap-3">
              <div className="w-8 h-8 border-2 border-stone-900 border-t-transparent rounded-full animate-spin" />
              <p className="text-sm text-stone-400">Loading products…</p>
            </div>
          ) : pageProducts.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 gap-3">
              <div className="w-16 h-16 rounded-2xl bg-stone-100 flex items-center justify-center">
                <Package size={28} className="text-stone-400" />
              </div>
              <p className="text-sm font-medium text-stone-600">No products found</p>
              {hasFilters ? (
                <button onClick={clearFilters} className="text-xs text-stone-400 hover:text-stone-700 underline underline-offset-2 transition-colors">
                  Clear filters
                </button>
              ) : (
                <button
                  onClick={() => { setEditingProductId(null); setIsDialogOpen(true); }}
                  className="flex items-center gap-1.5 text-xs text-stone-900 font-medium hover:underline"
                >
                  <Plus size={13} /> Add your first product
                </button>
              )}
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-stone-100">
                      <th className="px-5 py-3.5 text-left text-[11px] font-bold uppercase tracking-widest text-stone-400 w-16">Image</th>
                      <th className="px-5 py-3.5 text-left text-[11px] font-bold uppercase tracking-widest text-stone-400">Product</th>
                      <th className="px-5 py-3.5 text-left text-[11px] font-bold uppercase tracking-widest text-stone-400">Category</th>
                      <th className="px-5 py-3.5 text-left text-[11px] font-bold uppercase tracking-widest text-stone-400">Price</th>
                      <th className="px-5 py-3.5 text-left text-[11px] font-bold uppercase tracking-widest text-stone-400">Stock</th>
                      <th className="px-5 py-3.5 text-left text-[11px] font-bold uppercase tracking-widest text-stone-400">Status</th>
                      <th className="px-5 py-3.5 text-right text-[11px] font-bold uppercase tracking-widest text-stone-400">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-50">
                    {pageProducts.map(product => (
                      <tr key={product.id} className="group hover:bg-stone-50/60 transition-colors">

                        {/* Image */}
                        <td className="px-5 py-3.5">
                          <div className="w-11 h-11 rounded-xl overflow-hidden bg-stone-100 border border-stone-100">
                            <img
                              src={product.image || '/kit.png'}
                              alt={product.name}
                              className="w-full h-full object-cover"
                              onError={e => { (e.target as HTMLImageElement).src = '/kit.png'; }}
                            />
                          </div>
                        </td>

                        {/* Name */}
                        <td className="px-5 py-3.5 max-w-[220px]">
                          <p className="text-sm font-medium text-stone-900 truncate">{product.name}</p>
                          <p className="text-xs text-stone-400 mt-0.5 font-mono">#{product.id}</p>
                        </td>

                        {/* Category */}
                        <td className="px-5 py-3.5">
                          <CategoryPill category={product.category} />
                        </td>

                        {/* Price */}
                        <td className="px-5 py-3.5">
                          <span className="text-sm font-bold text-stone-900">₹{product.price.toLocaleString('en-IN')}</span>
                          {product.old_price > product.price && (
                            <span className="block text-xs text-stone-400 line-through">₹{product.old_price.toLocaleString('en-IN')}</span>
                          )}
                        </td>

                        {/* Stock */}
                        <td className="px-5 py-3.5">
                          <StockBadge stock={product.stock ?? 0} />
                        </td>

                        {/* Status toggle */}
                        <td className="px-5 py-3.5">
                          <button
                            onClick={() => handleToggleStatus(product.id, product.available)}
                            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold transition-all
                              ${product.available
                                ? 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                                : 'bg-stone-100 text-stone-500 hover:bg-stone-200'}
                            `}
                          >
                            <span className={`w-1.5 h-1.5 rounded-full ${product.available ? 'bg-emerald-500' : 'bg-stone-400'}`} />
                            {product.available ? 'Active' : 'Inactive'}
                          </button>
                        </td>

                        {/* Actions */}
                        <td className="px-4 md:px-5 py-3.5">
                          <div className="flex items-center justify-end gap-1">
                            <button
                              onClick={() => { setEditingProductId(product.id.toString()); setIsDialogOpen(true); }}
                              title="Edit"
                              className="w-8 h-8 rounded-lg flex items-center justify-center text-stone-400 hover:text-stone-900 hover:bg-stone-100 transition-all"
                            >
                              <Edit size={15} />
                            </button>
                            <button
                              onClick={() => setViewingProduct(product)}
                              title="View details"
                              className="w-8 h-8 rounded-lg flex items-center justify-center text-stone-400 hover:text-emerald-600 hover:bg-emerald-50 transition-all"
                            >
                              <Eye size={15} />
                            </button>
                            <button
                              onClick={() => handleDelete(product.id)}
                              title="Delete"
                              className="w-8 h-8 rounded-lg flex items-center justify-center text-stone-400 hover:text-red-500 hover:bg-red-50 transition-all"
                            >
                              <Trash2 size={15} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* ── Pagination ── */}
              {totalPages > 1 && (
                <div className="px-5 py-4 border-t border-stone-100 flex items-center justify-between">
                  <p className="text-xs text-stone-400 tabular-nums">
                    {startIndex + 1}–{Math.min(startIndex + ITEMS_PER_PAGE, filtered.length)} of {filtered.length} products
                  </p>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                      disabled={currentPage === 1}
                      className="w-8 h-8 flex items-center justify-center rounded-lg text-stone-400 hover:bg-stone-100 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                    >
                      <ChevronLeft size={15} />
                    </button>

                    {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                      <button
                        key={page}
                        onClick={() => setCurrentPage(page)}
                        className={`w-8 h-8 flex items-center justify-center rounded-lg text-xs font-medium transition-all
                          ${currentPage === page
                            ? 'bg-[#3F51B5] text-white'
                            : 'text-stone-500 hover:bg-stone-100'}
                        `}
                      >
                        {page}
                      </button>
                    ))}

                    <button
                      onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                      disabled={currentPage === totalPages}
                      className="w-8 h-8 flex items-center justify-center rounded-lg text-stone-400 hover:bg-stone-100 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                    >
                      <ChevronRight size={15} />
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* ── Dialog ── */}
      <ProductFormDialog
        isOpen={isDialogOpen}
        onClose={() => { setIsDialogOpen(false); setEditingProductId(null); }}
        productId={editingProductId}
        onSuccess={fetchProducts}
      />

      {/* ── View Product Dialog ── */}
      {viewingProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ fontFamily: "'DM Sans', sans-serif" }}>
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setViewingProduct(null)} />
          <div className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl border border-stone-200 overflow-hidden max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between px-6 py-4 border-b border-stone-100 bg-stone-50">
              <h2 className="text-lg font-semibold text-stone-900">Product Details</h2>
              <button onClick={() => setViewingProduct(null)} className="w-8 h-8 rounded-lg flex items-center justify-center text-stone-400 hover:bg-stone-200 transition-all">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6L6 18M6 6l12 12"/></svg>
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              <div className="flex flex-col md:flex-row gap-6">
                <div className="w-full md:w-48 h-48 bg-stone-100 rounded-xl flex items-center justify-center shrink-0">
                  <img src={viewingProduct.image || '/kit.png'} alt={viewingProduct.name} className="max-w-full max-h-full object-contain" />
                </div>
                <div className="flex-1 space-y-3">
                  <div>
                    <span className="text-xs font-semibold text-stone-500 uppercase tracking-wide">{viewingProduct.category}</span>
                    <h3 className="text-xl font-bold text-stone-900">{viewingProduct.name}</h3>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-2xl font-bold text-[#3F51B5]">₹{viewingProduct.price.toLocaleString('en-IN')}</span>
                    {viewingProduct.old_price > viewingProduct.price && (
                      <span className="text-lg text-stone-400 line-through">₹{viewingProduct.old_price.toLocaleString('en-IN')}</span>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${viewingProduct.available ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'}`}>
                      {viewingProduct.available ? 'Active' : 'Inactive'}
                    </span>
                    {viewingProduct.stock !== undefined && (
                      <span className="text-sm text-stone-500">Stock: {viewingProduct.stock}</span>
                    )}
                  </div>
                </div>
              </div>
              {viewingProduct.description && (
                <div>
                  <h4 className="text-sm font-semibold text-stone-700 mb-2">Description</h4>
                  <p className="text-sm text-stone-600">{viewingProduct.description}</p>
                </div>
              )}
            </div>
            <div className="px-6 py-4 border-t border-stone-100 bg-stone-50 flex justify-end gap-3">
              <button onClick={() => setViewingProduct(null)} className="px-4 py-2 border border-stone-200 rounded-lg text-sm font-medium text-stone-600 hover:bg-stone-100 transition-colors">
                Close
              </button>
              <button 
                onClick={() => { setViewingProduct(null); setEditingProductId(viewingProduct.id.toString()); setIsDialogOpen(true); }}
                className="px-4 py-2 bg-[#3F51B5] text-white rounded-lg text-sm font-medium hover:bg-stone-700 transition-colors"
              >
                Edit Product
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}