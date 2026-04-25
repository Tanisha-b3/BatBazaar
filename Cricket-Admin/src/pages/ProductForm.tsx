import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import {
  Upload, X, Plus, Trash2, ChevronRight, ChevronLeft,
  Package, ImageIcon, AlignLeft, Settings2, Check,
  IndianRupee,
} from 'lucide-react';
import { toast } from 'react-hot-toast';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

/* ─── Types ────────────────────────────────────────────────── */
interface ProductImage {
  url: string;
  isMain: boolean;
  file?: File;
}

interface ProductFormData {
  name: string;
  price: string;
  old_price: string;
  category: string;
  description: string;
  features: string[];
  sizes: string[];
  available: boolean;
  featured: boolean;
  in_stock: boolean;
  stock: number;
  vendor: string;
  product_type: string;
}

interface ProductFormDialogProps {
  isOpen: boolean;
  onClose: () => void;
  productId?: string | null;
  onSuccess?: () => void;
}

/* ─── Constants ─────────────────────────────────────────────── */
const STEPS = [
  { label: 'Basics',    icon: Package },
  { label: 'Images',    icon: ImageIcon },
  { label: 'Details',   icon: AlignLeft },
  { label: 'Status',    icon: Settings2 },
] as const;

const CATEGORIES = ['bats', 'kit', 'accessories', 'helmet', 'clothing', 'shoes'] as const;
const PRODUCT_TYPES = ['', 'new', 'featured', 'best-seller', 'sale'] as const;
const PRODUCT_TYPE_LABELS: Record<string, string> = {
  '': '— Select type —',
  'new': 'New Arrival',
  'featured': 'Featured',
  'best-seller': 'Best Seller',
  'sale': 'On Sale',
};

const EMPTY_FORM: ProductFormData = {
  name: '', price: '', old_price: '', category: 'bats',
  description: '', features: [], sizes: [],
  available: true, featured: false, in_stock: true,
  stock: 0, vendor: '', product_type: '',
};

/* ─── Sub-components ────────────────────────────────────────── */
function StepDot({ index, current, total }: { index: number; current: number; total: number }) {
  const done = index < current;
  const active = index === current;
  return (
    <div className="flex items-center">
      <div
        className={`
          w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold
          transition-all duration-300 shrink-0
          ${done  ? 'bg-emerald-500 text-white'
          : active ? 'bg-[#3F51B5] text-white ring-4 ring-stone-900/10'
          : 'bg-stone-100 text-stone-400'}
        `}
      >
        {done ? <Check size={13} strokeWidth={2.5} /> : index + 1}
      </div>
      {index < total - 1 && (
        <div className={`h-px w-8 sm:w-12 mx-1 transition-all duration-500 ${done ? 'bg-emerald-400' : 'bg-stone-200'}`} />
      )}
    </div>
  );
}

function FieldLabel({ children, required }: { children: React.ReactNode; required?: boolean }) {
  return (
    <label className="block text-xs font-semibold tracking-wide text-stone-500 uppercase mb-1.5">
      {children}{required && <span className="text-red-400 ml-0.5">*</span>}
    </label>
  );
}

function TextInput(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className={`
        w-full px-3.5 py-2.5 rounded-xl border border-stone-200 bg-white
        text-stone-800 text-sm placeholder:text-stone-300
        focus:outline-none focus:border-stone-900 focus:ring-2 focus:ring-stone-900/8
        transition-all duration-150
        ${props.className ?? ''}
      `}
    />
  );
}

function PriceInput({ prefix = '₹', ...props }: React.InputHTMLAttributes<HTMLInputElement> & { prefix?: string }) {
  return (
    <div className="flex items-center rounded-xl border border-stone-200 bg-white overflow-hidden focus-within:border-stone-900 focus-within:ring-2 focus-within:ring-stone-900/8 transition-all duration-150">
      <span className="px-3 py-2.5 text-xs font-semibold text-stone-400 bg-stone-50 border-r border-stone-200 select-none">
        {prefix}
      </span>
      <input
        {...props}
        className="flex-1 px-3 py-2.5 text-sm text-stone-800 placeholder:text-stone-300 focus:outline-none bg-transparent"
      />
    </div>
  );
}

function StyledSelect({ children, ...props }: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <div className="relative">
      <select
        {...props}
        className={`
          w-full appearance-none px-3.5 py-2.5 pr-9 rounded-xl border border-stone-200 bg-white
          text-stone-800 text-sm focus:outline-none focus:border-stone-900
          focus:ring-2 focus:ring-stone-900/8 transition-all duration-150
          ${props.className ?? ''}
        `}
      >
        {children}
      </select>
      <ChevronRight size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 rotate-90 pointer-events-none" />
    </div>
  );
}

function Toggle({ checked, onChange, label, hint }: {
  checked: boolean; onChange: (v: boolean) => void; label: string; hint?: string;
}) {
  return (
    <div className="flex items-center justify-between p-4 rounded-xl bg-white border border-stone-100">
      <div>
        <p className="text-sm font-medium text-stone-800">{label}</p>
        {hint && <p className="text-xs text-stone-400 mt-0.5">{hint}</p>}
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={`relative w-11 h-6 rounded-full transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-stone-900/10 ${checked ? 'bg-emerald-500' : 'bg-stone-200'}`}
      >
        <span
          className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow-sm transition-transform duration-200 ${checked ? 'translate-x-5' : 'translate-x-0'}`}
        />
      </button>
    </div>
  );
}

/* ─── Main Component ────────────────────────────────────────── */
export default function ProductFormDialog({ isOpen, onClose, productId, onSuccess }: ProductFormDialogProps) {
  const navigate = useNavigate();
  const isEdit = !!productId;

  const [step, setStep]         = useState(0);
  const [loading, setLoading]   = useState(false);
  const [saving, setSaving]     = useState(false);
  const [images, setImages]     = useState<ProductImage[]>([]);
  const [newFeature, setNewFeature] = useState('');
  const [newSize, setNewSize]   = useState('');
  const [form, setForm]         = useState<ProductFormData>(EMPTY_FORM);
  const [dragging, setDragging] = useState(false);
  const fileInputRef            = useRef<HTMLInputElement>(null);

  /* ── Reset / fetch on open ── */
  useEffect(() => {
    if (!isOpen) return;
    setStep(0);
    if (isEdit && productId) { fetchProduct(); }
    else { setForm(EMPTY_FORM); setImages([]); }
  }, [isOpen, productId]);

  /* ── Prevent body scroll ── */
  useEffect(() => {
    document.body.style.overflow = isOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  const fetchProduct = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('adminToken');
      const { data } = await axios.get(`${API_URL}/api/admin/products/${productId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setForm({
        name: data.name,
        price: data.price.toString(),
        old_price: data.old_price?.toString() ?? '',
        category: data.category,
        description: data.description ?? '',
        features: data.features ? JSON.parse(data.features) : [],
        sizes: data.sizes ? JSON.parse(data.sizes) : [],
        available: data.available,
        featured: data.featured ?? false,
        in_stock: data.in_stock ?? true,
        stock: data.stock ?? 0,
        vendor: data.vendor ?? '',
        product_type: data.product_type ?? '',
      });
      if (data.images) {
        setImages(JSON.parse(data.images).map((url: string, i: number) => ({ url, isMain: i === 0 })));
      }
    } catch {
      toast.error('Failed to load product');
    } finally {
      setLoading(false);
    }
  };

  /* ── Image handling ── */
  const processFiles = useCallback(async (files: FileList | File[]) => {
    const arr = Array.from(files);
    if (images.length + arr.length > 10) { toast.error('Maximum 10 images allowed'); return; }
    const valid: ProductImage[] = [];
    for (const f of arr) {
      if (!f.type.startsWith('image/')) { toast.error(`${f.name} is not an image`); continue; }
      if (f.size > 5 * 1024 * 1024) { toast.error(`${f.name} exceeds 5MB`); continue; }
      valid.push({ url: URL.createObjectURL(f), isMain: images.length === 0 && valid.length === 0, file: f });
    }
    if (valid.length) { setImages(prev => [...prev, ...valid]); toast.success(`${valid.length} image(s) added`); }
  }, [images.length]);

  const removeImage = (i: number) => {
    setImages(prev => {
      const next = prev.filter((_, idx) => idx !== i);
      if (prev[i].isMain && next.length) next[0].isMain = true;
      return next;
    });
  };

  const setMainImage = (i: number) =>
    setImages(prev => prev.map((img, idx) => ({ ...img, isMain: idx === i })));

  const uploadAll = async (): Promise<string[]> => {
    const token = localStorage.getItem('adminToken');
    const urls: string[] = [];
    for (const img of images) {
      if (img.file) {
        const fd = new FormData();
        fd.append('image', img.file);
        const { data } = await axios.post(`${API_URL}/api/admin/upload`, fd, {
          headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'multipart/form-data' },
        });
        urls.push(data.url);
      } else {
        urls.push(img.url);
      }
    }
    return urls;
  };

  /* ── Submit ── */
  const handleSubmit = async () => {
    if (!form.name.trim()) { toast.error('Product name is required'); setStep(0); return; }
    if (!form.price || parseFloat(form.price) <= 0) { toast.error('Valid price is required'); setStep(0); return; }
    setSaving(true);
    try {
      const token = localStorage.getItem('adminToken');
      const uploadedImages = images.length ? await uploadAll() : [];
      const payload = {
        ...form,
        price: parseFloat(form.price),
        old_price: form.old_price ? parseFloat(form.old_price) : null,
        features: JSON.stringify(form.features),
        sizes: JSON.stringify(form.sizes),
        images: JSON.stringify(uploadedImages),
        stock: parseInt(form.stock.toString()),
      };
      if (isEdit) {
        await axios.put(`${API_URL}/api/admin/products/${productId}`, payload, { headers: { Authorization: `Bearer ${token}` } });
        toast.success('Product updated!');
      } else {
        await axios.post(`${API_URL}/api/admin/products`, payload, { headers: { Authorization: `Bearer ${token}` } });
        toast.success('Product created!');
      }
      onSuccess?.();
      onClose();
    } catch {
      toast.error('Failed to save product');
    } finally {
      setSaving(false);
    }
  };

  const addFeature = () => {
    if (newFeature.trim()) { setForm(f => ({ ...f, features: [...f.features, newFeature.trim()] })); setNewFeature(''); }
  };
  const addSize = () => {
    if (newSize.trim()) { setForm(f => ({ ...f, sizes: [...f.sizes, newSize.trim()] })); setNewSize(''); }
  };

  if (!isOpen) return null;

  /* ── Progress width ── */
  const progress = ((step + 1) / STEPS.length) * 100;

  /* ─────────────────────────── RENDER ─────────────────────── */
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">

      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative w-full max-w-2xl flex flex-col bg-[#fafaf7] rounded-2xl shadow-2xl overflow-hidden max-h-[92vh]"
        style={{ fontFamily: "'DM Sans', sans-serif" }}
      >

        {/* ── Header ── */}
        <div className="flex items-center justify-between px-6 py-4 bg-white border-b border-stone-100 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#3F51B5] flex items-center justify-center">
              <Package size={16} className="text-white" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-stone-900 tracking-tight">
                {isEdit ? 'Edit product' : 'Add new product'}
              </h2>
              <p className="text-xs text-stone-400">Cricket store · Admin</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-stone-400 hover:bg-stone-100 hover:text-stone-700 transition-all"
          >
            <X size={16} />
          </button>
        </div>

        {/* ── Progress bar ── */}
        <div className="h-0.5 bg-stone-100 shrink-0">
          <div
            className="h-full bg-stone-800 transition-all duration-500 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>

        {/* ── Step tabs ── */}
        <div className="flex items-center justify-between px-6 py-3 bg-white border-b border-stone-100 shrink-0">
          {STEPS.map((s, i) => {
            const Icon = s.icon;
            const done   = i < step;
            const active = i === step;
            return (
              <button
                key={i}
                type="button"
                onClick={() => setStep(i)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-150
                  ${active ? 'bg-[#3F51B5] text-white'
                  : done   ? 'text-emerald-600 hover:bg-emerald-50'
                  : 'text-stone-400 hover:text-stone-600 hover:bg-stone-50'}
                `}
              >
                {done
                  ? <Check size={12} strokeWidth={2.5} />
                  : <Icon size={12} />
                }
                <span className="hidden sm:inline">{s.label}</span>
                <span className="sm:hidden">{i + 1}</span>
              </button>
            );
          })}
        </div>

        {/* ── Body ── */}
        <div className="flex-1 overflow-y-auto px-6 py-5 min-h-0">
          {loading ? (
            <div className="flex items-center justify-center h-48">
              <div className="w-8 h-8 border-2 border-stone-900 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : (
            <>
              {/* ── Step 0: Basics ── */}
              {step === 0 && (
                <div className="space-y-4 animate-[fadeUp_0.2s_ease]">
                  <div>
                    <FieldLabel required>Product name</FieldLabel>
                    <TextInput
                      value={form.name}
                      onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                      placeholder="e.g., SS Kashmir Willow Cricket Bat"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <FieldLabel required>Price</FieldLabel>
                      <PriceInput
                        type="number" step="0.01"
                        value={form.price}
                        onChange={e => setForm(f => ({ ...f, price: e.target.value }))}
                        placeholder="0.00"
                      />
                    </div>
                    <div>
                      <FieldLabel>Old price</FieldLabel>
                      <PriceInput
                        type="number" step="0.01"
                        value={form.old_price}
                        onChange={e => setForm(f => ({ ...f, old_price: e.target.value }))}
                        placeholder="0.00"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <FieldLabel>Category</FieldLabel>
                      <StyledSelect value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))}>
                        {CATEGORIES.map(c => <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>)}
                      </StyledSelect>
                    </div>
                    <div>
                      <FieldLabel>Stock qty</FieldLabel>
                      <TextInput
                        type="number" min={0}
                        value={form.stock}
                        onChange={e => setForm(f => ({ ...f, stock: parseInt(e.target.value) || 0 }))}
                      />
                    </div>
                    <div>
                      <FieldLabel>Vendor</FieldLabel>
                      <TextInput
                        value={form.vendor}
                        onChange={e => setForm(f => ({ ...f, vendor: e.target.value }))}
                        placeholder="SS, MRF, SG…"
                      />
                    </div>
                  </div>

                  <div>
                    <FieldLabel>Product type</FieldLabel>
                    <StyledSelect value={form.product_type} onChange={e => setForm(f => ({ ...f, product_type: e.target.value }))}>
                      {PRODUCT_TYPES.map(t => <option key={t} value={t}>{PRODUCT_TYPE_LABELS[t]}</option>)}
                    </StyledSelect>
                  </div>
                </div>
              )}

              {/* ── Step 1: Images ── */}
              {step === 1 && (
                <div className="space-y-4 animate-[fadeUp_0.2s_ease]">
                  {/* Drop zone */}
                  <div
                    onDragOver={e => { e.preventDefault(); setDragging(true); }}
                    onDragLeave={() => setDragging(false)}
                    onDrop={e => { e.preventDefault(); setDragging(false); processFiles(Array.from(e.dataTransfer.files)); }}
                    onClick={() => fileInputRef.current?.click()}
                    className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all duration-200
                      ${dragging ? 'border-stone-900 bg-stone-50' : 'border-stone-200 hover:border-stone-400 hover:bg-stone-50/50 bg-white'}
                    `}
                  >
                    <input
                      ref={fileInputRef}
                      type="file" multiple accept="image/*" className="hidden"
                      onChange={e => e.target.files && processFiles(e.target.files)}
                    />
                    <div className="w-11 h-11 rounded-xl bg-stone-100 flex items-center justify-center mx-auto mb-3">
                      <Upload size={20} className="text-stone-500" />
                    </div>
                    <p className="text-sm font-medium text-stone-700">Click or drag images here</p>
                    <p className="text-xs text-stone-400 mt-1">PNG, JPG, JPEG · max 5 MB each · up to 10</p>
                  </div>

                  {/* Thumbnails */}
                  {images.length > 0 && (
                    <div className="grid grid-cols-4 gap-3">
                      {images.map((img, i) => (
                        <div key={i} className="group relative aspect-square rounded-xl overflow-hidden border border-stone-200 bg-stone-100">
                          <img src={img.url} alt="" className="w-full h-full object-cover" />
                          {img.isMain && (
                            <span className="absolute top-1.5 left-1.5 bg-[#3F51B5] text-white text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-md">
                              Main
                            </span>
                          )}
                          <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1.5">
                            {!img.isMain && (
                              <button
                                type="button"
                                onClick={() => setMainImage(i)}
                                className="text-[10px] font-semibold bg-white/90 text-stone-800 px-2 py-1 rounded-md hover:bg-white"
                              >
                                Set main
                              </button>
                            )}
                            <button
                              type="button"
                              onClick={() => removeImage(i)}
                              className="w-6 h-6 rounded-full bg-red-500 text-white flex items-center justify-center hover:bg-red-600"
                            >
                              <X size={11} />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {images.length === 0 && (
                    <p className="text-xs text-stone-400 text-center">No images yet. The first image will be the main display image.</p>
                  )}
                </div>
              )}

              {/* ── Step 2: Details ── */}
              {step === 2 && (
                <div className="space-y-5 animate-[fadeUp_0.2s_ease]">
                  <div>
                    <FieldLabel>Description</FieldLabel>
                    <textarea
                      value={form.description}
                      onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                      rows={4}
                      placeholder="Write a detailed product description…"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-stone-200 bg-white text-stone-800 text-sm placeholder:text-stone-300 focus:outline-none focus:border-stone-900 focus:ring-2 focus:ring-stone-900/8 transition-all resize-none"
                    />
                  </div>

                  {/* Features */}
                  <div>
                    <FieldLabel>Features & specifications</FieldLabel>
                    <div className="flex gap-2 mb-2">
                      <TextInput
                        value={newFeature}
                        onChange={e => setNewFeature(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addFeature())}
                        placeholder="e.g., English Willow Grade 1"
                      />
                      <button
                        type="button" onClick={addFeature}
                        className="shrink-0 w-10 h-10 rounded-xl bg-[#3F51B5] text-white flex items-center justify-center hover:bg-stone-700 transition-colors"
                      >
                        <Plus size={16} />
                      </button>
                    </div>
                    <div className="space-y-1.5 max-h-36 overflow-y-auto">
                      {form.features.map((feat, i) => (
                        <div key={i} className="flex items-center justify-between px-3.5 py-2 bg-white rounded-xl border border-stone-100 text-sm text-stone-700 group">
                          <span className="flex items-center gap-2">
                            <span className="text-emerald-500 text-xs">✓</span>
                            {feat}
                          </span>
                          <button
                            type="button"
                            onClick={() => setForm(f => ({ ...f, features: f.features.filter((_, j) => j !== i) }))}
                            className="text-stone-300 hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Sizes */}
                  <div>
                    <FieldLabel>Available sizes</FieldLabel>
                    <div className="flex gap-2 mb-2">
                      <TextInput
                        value={newSize}
                        onChange={e => setNewSize(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addSize())}
                        placeholder="e.g., Short Handle, Harrow…"
                      />
                      <button
                        type="button" onClick={addSize}
                        className="shrink-0 w-10 h-10 rounded-xl bg-[#3F51B5] text-white flex items-center justify-center hover:bg-stone-700 transition-colors"
                      >
                        <Plus size={16} />
                      </button>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {form.sizes.map((size, i) => (
                        <div key={i} className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-stone-200 rounded-full text-xs font-medium text-stone-700">
                          {size}
                          <button
                            type="button"
                            onClick={() => setForm(f => ({ ...f, sizes: f.sizes.filter((_, j) => j !== i) }))}
                            className="text-stone-300 hover:text-red-400 transition-colors"
                          >
                            <X size={11} />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* ── Step 3: Status ── */}
              {step === 3 && (
                <div className="space-y-3 animate-[fadeUp_0.2s_ease]">
                  <Toggle
                    checked={form.available}
                    onChange={v => setForm(f => ({ ...f, available: v }))}
                    label="Active listing"
                    hint="Product is visible to customers in the store"
                  />
                  <Toggle
                    checked={form.in_stock}
                    onChange={v => setForm(f => ({ ...f, in_stock: v }))}
                    label="In stock"
                    hint="Mark as available for purchase"
                  />
                  <Toggle
                    checked={form.featured}
                    onChange={v => setForm(f => ({ ...f, featured: v }))}
                    label="Featured product"
                    hint="Highlights this product on the home page"
                  />

                  {/* Summary card */}
                  <div className="mt-4 p-4 rounded-xl bg-stone-100/70 border border-stone-200/60">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-stone-400 mb-3">Summary</p>
                    <div className="grid grid-cols-2 gap-y-2 text-sm">
                      {[
                        ['Name', form.name || '—'],
                        ['Price', form.price ? `₹${parseFloat(form.price).toLocaleString('en-IN')}` : '—'],
                        ['Category', form.category],
                        ['Vendor', form.vendor || '—'],
                        ['Images', `${images.length} uploaded`],
                        ['Features', `${form.features.length} added`],
                      ].map(([k, v]) => (
                        <div key={k} className="contents">
                          <span className="text-stone-400">{k}</span>
                          <span className="text-stone-800 font-medium text-right">{v}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* ── Footer ── */}
        <div className="px-6 py-4 bg-white border-t border-stone-100 flex items-center justify-between shrink-0">
          <span className="text-xs text-stone-400 font-mono tabular-nums">
            Step {step + 1} / {STEPS.length}
          </span>
          <div className="flex items-center gap-2">
            {step > 0 && (
              <button
                type="button"
                onClick={() => setStep(s => s - 1)}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl border border-stone-200 text-stone-600 text-sm font-medium hover:bg-stone-50 transition-colors"
              >
                <ChevronLeft size={14} /> Back
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-stone-200 text-stone-500 text-sm font-medium hover:bg-stone-50 transition-colors"
            >
              Cancel
            </button>
            {step < STEPS.length - 1 ? (
              <button
                type="button"
                onClick={() => setStep(s => s + 1)}
                className="flex items-center gap-1.5 px-5 py-2 rounded-xl bg-[#3F51B5] text-white text-sm font-medium hover:bg-stone-700 transition-colors"
              >
                Continue <ChevronRight size={14} />
              </button>
            ) : (
              <button
                type="button"
                onClick={handleSubmit}
                disabled={saving}
                className="flex items-center gap-1.5 px-5 py-2 rounded-xl bg-[#3F51B5] text-white text-sm font-medium hover:bg-stone-700 transition-colors disabled:opacity-50 min-w-[120px] justify-center"
              >
                {saving ? (
                  <span className="flex items-center gap-2">
                    <span className="w-3.5 h-3.5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                    Saving…
                  </span>
                ) : (
                  <>{isEdit ? 'Update product' : 'Create product'} <Check size={14} /></>
                )}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Keyframe injection */}
      <style>{`
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(10px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}