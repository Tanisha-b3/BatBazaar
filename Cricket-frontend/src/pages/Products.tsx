import { useState, useEffect, useCallback, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Search, SlidersHorizontal, ChevronDown, ChevronUp, X, } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { API_URL } from '../config';

interface Product {
  id: number;
  name: string;
  price: number;
  old_price: number;
  category: string;
  image: string;
  vendor?: string;
  productType?: string;
  size?: string;
  inStock?: boolean;
  rating?: number;
  reviews?: number;
  isDeal?: boolean;
}

const collectionFilters = [
  'All Products',
  'Cricket Accessories',
  'English Willow Bats',
  'Junior Range',
  'Kashmir Willow Bats',
];

const vendorFilters = ['MRF', 'SS', 'GM', 'SG', 'Kookaburra'];

const productTypeFilters = [
  'BAT',
  'Bails',
  'Batting Leg Guards',
  'Cricket Accessories',
  'Cricket Bat Accessories',
  'Cricket Sets',
  'GLOVES',
  'IMPACT_PROTECTION_GEAR',
  'KIT BAGS',
  'Kits',
  'SPORTING_GOODS',
  'SPORT_ACTIVITY_GLOVE',
  'SPORT_BAT',
  'SPORT_EQUIPMENT_BAG_CASE',
  'SPORT_HELMET',
];

const availabilityFilters = ['In Stock', 'Out Of Stock'];

const sizeFilters = [
  'Boys', 'Harrow', 'Junior', 'Large', 'Medium',
  'Senior', 'Size 4', 'Size 5', 'Size 6', 'Small', 'Youth',
];

type SortOption = 'featured' | 'best-selling' | 'alpha-asc' | 'alpha-desc' | 'price-asc' | 'price-desc' | 'date-new' | 'date-old' | 'sale';

const sortOptions: { label: string; value: SortOption }[] = [
  { label: 'Availability', value: 'featured' },
  { label: 'Best Selling', value: 'best-selling' },
  { label: 'Alphabetically, A-Z', value: 'alpha-asc' },
  { label: 'Alphabetically, Z-A', value: 'alpha-desc' },
  { label: 'Price, low to high', value: 'price-asc' },
  { label: 'Price, high to low', value: 'price-desc' },
  { label: 'Date, new to old', value: 'date-new' },
  { label: 'Date, old to new', value: 'date-old' },
  { label: '% Sale off', value: 'sale' },
];

const productImages: Record<string, string> = {
  '/bat1.png': '/bat1.png',
  '/bat2.png': '/bat2.png',
  '/bat3.png': '/bat3.png',
  '/bag.png': '/bag.png',
  '/helmet.png': '/helmet.png',
  '/stumps.png': '/stumps.png',
  '/kit.png': '/kit.png',
  '/gloves.png': '/gloves.png',
};

const FALLBACK_PRODUCTS: Product[] = [
  { id: 1,  name: 'SS TON Range TON Maximus Kashmir Willow Cricket Bat', price: 100, old_price: 190, category: 'bats',        image: '/bat1.png',    vendor: 'SS',          inStock: true  },
  { id: 2,  name: 'SS Stunner Duffle Cricket Kit Bag with wheels',       price: 410, old_price: 600, category: 'kit',         image: '/bag.png',     vendor: 'SS',          inStock: true  },
  { id: 3,  name: 'SS Gutsy Cricket Helmet',                             price: 210, old_price: 280, category: 'helmet',      image: '/helmet.png',  vendor: 'SS',          inStock: true  },
  { id: 4,  name: 'SS Spring Loaded Stumps for Cricket - Heavy Duty',    price: 80,  old_price: 160, category: 'accessories', image: '/stumps.png',  vendor: 'SS',          inStock: true  },
  { id: 5,  name: 'SS TON Range TON Maximus Kashmir Willow Cricket Bat', price: 100, old_price: 190, category: 'bats',        image: '/bat2.png',    vendor: 'SS',          inStock: true  },
  { id: 6,  name: 'SS Spring Loaded Stumps for Cricket - Heavy Duty',    price: 410, old_price: 600, category: 'accessories', image: '/stumps.png',  vendor: 'SS',          inStock: true  },
  { id: 7,  name: 'SS Ranji Max Cricket Batting Gloves White',           price: 210, old_price: 280, category: 'accessories', image: '/gloves.png',  vendor: 'SS',          inStock: true  },
  { id: 8,  name: 'SS Spring Loaded Stumps for Cricket - Heavy Duty',    price: 80,  old_price: 160, category: 'accessories', image: '/stumps.png',  vendor: 'SS',          inStock: true  },
  { id: 9,  name: 'SS TON Range TON Maximus Kashmir Willow Cricket Bat', price: 100, old_price: 190, category: 'bats',        image: '/bat3.png',    vendor: 'SS',          inStock: true  },
  { id: 10, name: 'SS Ranji Max Cricket Batting Gloves White',           price: 410, old_price: 600, category: 'accessories', image: '/gloves.png',  vendor: 'SS',          inStock: true  },
  { id: 11, name: 'MRF Legend VK 18 SR Cricket Adult Kit Bag',           price: 210, old_price: 280, category: 'kit',         image: '/kit.png',     vendor: 'MRF',         inStock: true  },
  { id: 12, name: 'SS TON Range TON Maximus Kashmir Willow Cricket Bat', price: 80,  old_price: 160, category: 'bats',        image: '/bat1.png',    vendor: 'SS',          inStock: true,  isDeal: true },
  { id: 13, name: 'SS TON Range TON Maximus Kashmir Willow Cricket Bat', price: 100, old_price: 190, category: 'bats',        image: '/bat2.png',    vendor: 'SS',          inStock: true  },
  { id: 14, name: 'SS Spring Loaded Stumps for Cricket',                 price: 410, old_price: 600, category: 'accessories', image: '/stumps.png',  vendor: 'SS',          inStock: false },
  { id: 15, name: 'SS Ranji Max Cricket Batting Gloves',                 price: 210, old_price: 280, category: 'accessories', image: '/gloves.png',  vendor: 'SS',          inStock: true,  isDeal: true },
  { id: 16, name: 'SS Spring Loaded Stumps for Cricket',                 price: 80,  old_price: 160, category: 'accessories', image: '/stumps.png',  vendor: 'SS',          inStock: true  },
];

// ── Filter Sidebar Section ──────────────────────────────────────────────────
function FilterSection({
  title,
  options,
  filterType,
  selectedFilters,
  onToggle,
}: {
  title: string;
  options: string[];
  filterType: string;
  selectedFilters: Record<string, string[]>;
  onToggle: (type: string, value: string) => void;
}) {
  const [open, setOpen] = useState(true);
  const selected = selectedFilters[filterType] || [];

  return (
    <div className="border-b border-gray-100 pb-3 mb-1">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center justify-between w-full py-2 text-[11px] font-bold text-gray-700 uppercase tracking-widest hover:text-gray-900 transition-colors"
      >
        {title}
        {open ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
      </button>
      {open && (
        <div className="mt-1.5 space-y-1">
          {options.map((opt) => (
            <label key={opt} className="flex items-center gap-2 cursor-pointer group py-0.5">
              <input
                type="checkbox"
                checked={selected.includes(opt)}
                onChange={() => onToggle(filterType, opt)}
                className="w-3 h-3 accent-[#3F51B5] rounded"
              />
              <span className="text-[12px] text-gray-500 group-hover:text-gray-800 transition-colors leading-tight">
                {opt}
              </span>
            </label>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Sort Dropdown ───────────────────────────────────────────────────────────
function SortDropdown({
  value,
  onChange,
}: {
  value: SortOption;
  onChange: (v: SortOption) => void;
}) {
  const [open, setOpen] = useState(false);
  const current = sortOptions.find((o) => o.value === value);

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 bg-[#3F51B5] hover:bg-[#303F9F] text-white text-[13px] font-medium px-3 sm:px-4 py-2 rounded-lg transition-colors whitespace-nowrap"
      >
        <span className="hidden sm:inline">{current?.label}</span>
        <span className="sm:hidden">Sort</span>
        <ChevronDown size={14} className={open ? 'rotate-180 transition-transform' : 'transition-transform'} />
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-full mt-1 bg-white border border-gray-100 rounded-xl shadow-xl z-20 w-44 sm:w-52 py-1 overflow-hidden">
            {sortOptions.map((opt) => (
              <button
                key={opt.value}
                onClick={() => { onChange(opt.value); setOpen(false); }}
                className={`w-full text-left px-4 py-2 text-[13px] transition-colors ${
                  value === opt.value
                    ? 'text-gray-900 font-semibold bg-blue-50'
                    : 'text-gray-700 hover:bg-gray-50'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

// ── Product Card ────────────────────────────────────────────────────────────
function ProductCard({ product }: { product: Product }) {
  const [adding, setAdding] = useState(false);
  
  const discount = product.old_price > product.price
    ? Math.round(((product.old_price - product.price) / product.old_price) * 100)
    : 0;

  const handleAddToCart = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (product.inStock === false) return;
    setAdding(true);
    
    try {
      const token = localStorage.getItem('token');
      
      if (token) {
        await axios.post(`${API_URL}/cart`, 
          { productId: product.id, quantity: 1 },
          { headers: { Authorization: `Bearer ${token}` } }
        );
      } else {
        const cart = JSON.parse(localStorage.getItem('cart') || '[]');
        const idx = cart.findIndex((c: any) => c.productId === product.id);
        if (idx > -1) cart[idx].quantity += 1;
        else cart.push({ 
          productId: product.id, 
          name: product.name, 
          price: product.price, 
          old_price: product.old_price, 
          category: product.category, 
          image: product.image, 
          quantity: 1 
        });
        localStorage.setItem('cart', JSON.stringify(cart));
      }
      
      window.dispatchEvent(new CustomEvent('cartUpdated'));
    } catch (err) {
      console.error('Error adding to cart:', err);
    } finally {
      setTimeout(() => setAdding(false), 1000);
    }
  };

  return (
    <div className="bg-white border border-gray-100 rounded-xl overflow-hidden group hover:-translate-y-1 hover:shadow-lg hover:shadow-blue-100 hover:border-[#3F51B5]/20 transition-all duration-200">
      <Link to={`/product/${product.id}`}>
        {/* Image */}
        <div className="h-32 xs:h-36 sm:h-40 bg-gray-50 flex items-center justify-center relative p-2">
          <img
            src={productImages[product.image] || product.image || '/bat1.png'}
            alt={product.name}
            className="max-h-28 xs:max-h-32 sm:max-h-36 max-w-[85%] object-contain group-hover:scale-105 transition-transform duration-200"
            onError={(e) => { (e.target as HTMLImageElement).src = '/bat1.png'; }}
          />
          {/* Badges */}
          <div className="absolute bottom-2 left-2 flex gap-1 flex-wrap">
            {discount > 0 && (
              <span className="bg-[#3F51B5] text-white text-[8px] xs:text-[10px] font-semibold px-1 xs:px-1.5 py-0.5 rounded">
                {discount}% off
              </span>
            )}
            {product.isDeal && (
              <span className="bg-orange-500 text-white text-[8px] xs:text-[10px] font-semibold px-1 xs:px-1.5 py-0.5 rounded">
                Deal
              </span>
            )}
          </div>
          {/* Out of stock overlay */}
          {product.inStock === false && (
            <div className="absolute inset-0 bg-white/60 flex items-center justify-center">
              <span className="text-[10px] xs:text-[11px] font-semibold text-gray-500 bg-white border border-gray-200 px-2 py-1 rounded-full">
                Out of Stock
              </span>
            </div>
          )}
        </div>

        {/* Info */}
        <div className="p-2 xs:p-2.5 sm:p-3">
          {product.vendor && (
            <p className="text-[9px] xs:text-[10px] text-gray-400 font-medium mb-0.5 uppercase tracking-wide">{product.vendor}</p>
          )}
          <p className="text-[11px] xs:text-[12px] text-gray-800 leading-snug mb-2 line-clamp-2 min-h-[28px] xs:min-h-[32px] group-hover:text-gray-900 transition-colors">
            {product.name}
          </p>
          <div className="flex items-baseline gap-1 xs:gap-2">
            <span className="text-xs xs:text-sm font-bold text-gray-900">$ {product.price}</span>
            {product.old_price > product.price && (
              <span className="text-[10px] xs:text-[11px] text-gray-400 line-through">${product.old_price}</span>
            )}
          </div>
        </div>
      </Link>
      
      {/* Add to Cart - Clickable area outside Link */}
      {product.inStock !== false && (
        <button
          onClick={handleAddToCart}
          disabled={adding}
          className="w-full py-1.5 xs:py-2 bg-[#3F51B5] text-white text-[11px] xs:text-xs font-medium hover:bg-[#2c3a8c] transition-colors"
        >
          {adding ? 'Added!' : 'Add to Cart'}
        </button>
      )}
      
      {product.inStock === false && (
        <div className="w-full py-1.5 xs:py-2 bg-gray-200 text-gray-400 text-[11px] xs:text-xs font-medium text-center">
          Out of Stock
        </div>
      )}
    </div>
  );
}

// ── Main Products Page ──────────────────────────────────────────────────────
export default function Products() {
  const navigate = useNavigate();
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<SortOption>('price-desc');
  const [isMobileFilterOpen, setIsMobileFilterOpen] = useState(false);

  const [selectedFilters, setSelectedFilters] = useState<Record<string, string[]>>({
    COLLECTION: [],
    VENDOR: [],
    PRODUCT_TYPE: [],
    AVAILABILITY: [],
    SIZE: [],
  });

  const fetchProducts = useCallback(async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_URL}/products`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      setAllProducts(response.data.products || response.data || []);
    } catch (error: any) {
      console.error('Error fetching products:', error);
      toast.error('Failed to load products. Showing fallback data.');
      setAllProducts(FALLBACK_PRODUCTS);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchProducts(); }, [fetchProducts]);

  const toggleFilter = (type: string, value: string) => {
    setSelectedFilters((prev) => {
      const cur = prev[type] || [];
      return {
        ...prev,
        [type]: cur.includes(value) ? cur.filter((v) => v !== value) : [...cur, value],
      };
    });
  };

  const clearAllFilters = () => {
    setSelectedFilters({ COLLECTION: [], VENDOR: [], PRODUCT_TYPE: [], AVAILABILITY: [], SIZE: [] });
    setSearchQuery('');
    setSortBy('price-desc');
  };

  const totalActive = Object.values(selectedFilters).flat().length;

  const filtered = useMemo(() => {
    let list = [...allProducts];

    // Collection
    const col = selectedFilters.COLLECTION;
    if (col.length > 0 && !col.includes('All Products')) {
      list = list.filter((p) =>
        col.some((c) => {
          if (c === 'English Willow Bats') return p.category === 'bats' && p.name.toLowerCase().includes('english');
          if (c === 'Kashmir Willow Bats') return p.category === 'bats' && p.name.toLowerCase().includes('kashmir');
          if (c === 'Junior Range') return p.size === 'Junior' || p.size === 'Youth';
          if (c === 'Cricket Accessories') return p.category === 'accessories';
          return false;
        })
      );
    }

    // Vendor
    const ven = selectedFilters.VENDOR;
    if (ven.length > 0) {
      list = list.filter((p) => ven.some((v) => p.vendor?.toUpperCase() === v));
    }

    // Product type
    const pt = selectedFilters.PRODUCT_TYPE;
    if (pt.length > 0) {
      list = list.filter((p) =>
        pt.some((t) => {
          if (t === 'BAT') return p.category === 'bats';
          if (t === 'SPORT_HELMET') return p.category === 'helmet';
          if (t === 'KIT BAGS' || t === 'Kits') return p.category === 'kit';
          if (t === 'GLOVES' || t === 'SPORT_ACTIVITY_GLOVE') return p.name.toLowerCase().includes('glove');
          if (t === 'Cricket Accessories' || t === 'SPORTING_GOODS') return p.category === 'accessories';
          return false;
        })
      );
    }

    // Availability
    const av = selectedFilters.AVAILABILITY;
    if (av.length > 0) {
      list = list.filter((p) =>
        av.some((a) => (a === 'In Stock' ? p.inStock !== false : p.inStock === false))
      );
    }

    // Size
    const sz = selectedFilters.SIZE;
    if (sz.length > 0) {
      list = list.filter((p) => sz.some((s) => p.size === s));
    }

    // Search
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      list = list.filter((p) =>
        p.name.toLowerCase().includes(q) ||
        p.vendor?.toLowerCase().includes(q) ||
        p.category.toLowerCase().includes(q)
      );
    }

    // Sort
    switch (sortBy) {
      case 'price-asc':   list.sort((a, b) => a.price - b.price); break;
      case 'price-desc':  list.sort((a, b) => b.price - a.price); break;
      case 'alpha-asc':   list.sort((a, b) => a.name.localeCompare(b.name)); break;
      case 'alpha-desc':  list.sort((a, b) => b.name.localeCompare(a.name)); break;
      case 'sale':        list.sort((a, b) => (b.old_price - b.price) - (a.old_price - a.price)); break;
      default: break;
    }

    return list;
  }, [allProducts, selectedFilters, searchQuery, sortBy]);

  const sidebarContent = (
    <div className="space-y-0">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2 text-[11px] font-bold text-gray-600 uppercase tracking-widest">
          <SlidersHorizontal size={13} />
          Filters
        </div>
        {totalActive > 0 && (
          <button onClick={clearAllFilters} className="text-[11px] text-red-500 hover:text-red-700 font-medium">
            Clear all
          </button>
        )}
      </div>
      <FilterSection title="Collection"     options={collectionFilters}   filterType="COLLECTION"   selectedFilters={selectedFilters} onToggle={toggleFilter} />
      <FilterSection title="Vendor"         options={vendorFilters}        filterType="VENDOR"       selectedFilters={selectedFilters} onToggle={toggleFilter} />
      <FilterSection title="Product Type"   options={productTypeFilters}   filterType="PRODUCT_TYPE" selectedFilters={selectedFilters} onToggle={toggleFilter} />
      <FilterSection title="Availability"   options={availabilityFilters}  filterType="AVAILABILITY" selectedFilters={selectedFilters} onToggle={toggleFilter} />
      <FilterSection title="Size"           options={sizeFilters}          filterType="SIZE"         selectedFilters={selectedFilters} onToggle={toggleFilter} />
    </div>
  );

  return (
    <div className="bg-gray-50 min-h-screen pt-[75px]">
      <div className="max-w-screen-xl mx-auto px-3 sm:px-4 lg:px-6">

        {/* ── Page heading ── */}
        <div className="flex items-center justify-between py-4 sm:py-6">
          <button 
            onClick={() => navigate(-1)} 
            className="flex items-center gap-1 text-gray-600 hover:text-gray-900 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back
          </button>
          <h1 className="text-xl sm:text-2xl font-semibold text-gray-900">Featured Products</h1>
          <div className="w-16"></div>
        </div>

        <div className="flex min-h-[calc(100vh-140px)]">

          {/* ── Desktop Sidebar ── */}
          <aside className="hidden lg:block w-48 flex-shrink-0 bg-white border-r border-gray-100 px-4 py-5 overflow-y-auto">
            {sidebarContent}
          </aside>

          {/* ── Main Content ── */}
          <main className="flex-1 px-3 sm:px-4 lg:px-5 pb-10">

            {/* Toolbar */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 mb-5">
              {/* Mobile filter btn */}
              <button
                onClick={() => setIsMobileFilterOpen(true)}
                className="lg:hidden flex items-center justify-center gap-1.5 border border-gray-200 bg-white text-gray-700 text-sm px-3 py-2 rounded-lg"
              >
                <SlidersHorizontal size={14} />
                Filters {totalActive > 0 && `(${totalActive})`}
              </button>

              {/* Search */}
              <div className="relative flex-1">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search Products"
                  className="w-full pl-9 pr-4 py-2 text-sm border border-gray-200 rounded-lg bg-white placeholder-gray-400 focus:outline-none focus:border-[#3F51B5] transition-colors"
                />
              </div>

              {/* Sort */}
              <SortDropdown value={sortBy} onChange={setSortBy} />
            </div>

            {/* Active filter pills */}
            {totalActive > 0 && (
              <div className="flex flex-wrap gap-1.5 mb-4">
                {Object.entries(selectedFilters).flatMap(([key, vals]) =>
                  vals.map((val) => (
                    <span
                      key={`${key}-${val}`}
                      className="inline-flex items-center gap-1 px-2 py-1 bg-blue-50 text-gray-900 text-xs rounded-md border border-blue-100"
                    >
                      {val}
                      <button onClick={() => toggleFilter(key, val)} className="hover:text-blue-900">
                        <X size={12} />
                      </button>
                    </span>
                  ))
                )}
              </div>
            )}

            {/* Product Grid */}
            {loading ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
                {[...Array(12)].map((_, i) => (
                  <div key={i} className="bg-white rounded-xl overflow-hidden animate-pulse">
                    <div className="h-32 sm:h-40 bg-gray-100" />
                    <div className="p-3 space-y-2">
                      <div className="h-3 bg-gray-100 rounded w-3/4" />
                      <div className="h-3 bg-gray-100 rounded w-1/2" />
                    </div>
                  </div>
                ))}
              </div>
            ) : filtered.length === 0 ? (
              <div className="bg-white rounded-xl p-8 sm:p-16 text-center border border-gray-100">
                <p className="text-gray-400 text-base sm:text-lg mb-4">No products found</p>
                <button onClick={clearAllFilters} className="text-sm text-gray-900 hover:underline">
                  Clear all filters
                </button>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
                  {filtered.map((product) => (
                    <ProductCard key={product.id} product={product} />
                  ))}
                </div>
                <p className="text-center text-xs text-gray-400 mt-6">
                  Showing {filtered.length} product{filtered.length !== 1 ? 's' : ''}
                </p>
              </>
            )}
          </main>
        </div>
      </div>

      {/* ── Mobile Filter Drawer ── */}
      {isMobileFilterOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black/40" onClick={() => setIsMobileFilterOpen(false)} />
          <div className="absolute right-0 top-0 h-full w-80 max-w-[85vw] bg-white shadow-2xl overflow-y-auto">
            <div className="flex items-center justify-between px-4 py-4 border-b border-gray-100 sticky top-0 bg-white">
              <span className="font-semibold text-gray-900">Filters</span>
              <button onClick={() => setIsMobileFilterOpen(false)}>
                <X size={20} className="text-gray-500" />
              </button>
            </div>
            <div className="p-4">{sidebarContent}</div>
            <div className="sticky bottom-0 bg-white border-t border-gray-100 p-4">
              <button
                onClick={() => setIsMobileFilterOpen(false)}
                className="w-full bg-[#3F51B5] text-white py-2.5 rounded-lg text-sm font-semibold"
              >
                View {filtered.length} Products
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}