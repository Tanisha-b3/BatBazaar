import { useState, useEffect } from 'react';
import { Link} from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import { API_URL } from '../config';

interface Product {
  id: number;
  name: string;
  title?: string;
  price: number;
  old_price: number;
  oldPrice?: number;
  category: string;
  image: string;
  vendor?: string;
  rating?: number;
  inStock?: boolean;
}

const filters = [
  { label: 'All Products', value: 'all' },
  { label: 'Cricket Bats', value: 'bats' },
  { label: 'Accessories', value: 'accessories' },
  { label: 'Kit', value: 'kit' },
  { label: 'Helmet', value: 'helmet' },
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

export default function Features() {
  // const navigate = useNavigate();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState('all');
  const [addingToCart, setAddingToCart] = useState<number | null>(null);

  useEffect(() => {
    fetchProducts();
  }, [activeFilter]);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const url = activeFilter === 'all' 
        ? `${API_URL}/products`
        : `${API_URL}/products?category=${activeFilter}`;
      
      const response = await axios.get(url, {
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      });
      
      const productsData = response.data.products || response.data || [];
      setProducts(productsData);
    } catch (error) {
      console.error('Error fetching products:', error);
      // Fallback data
      setProducts([
        { id: 1, name: 'SS Kashmir Willow Cricket Full Kit', title: 'SS Kashmir Willow Cricket Full Kit', price: 120, old_price: 180, image: '/bat1.png', category: 'kit', rating: 4.5, inStock: true },
        { id: 2, name: 'MRF Kashmir Willow Cricket Bat', title: 'MRF Kashmir Willow Cricket Bat', price: 100, old_price: 190, image: '/bat2.png', category: 'bats', rating: 4.8, inStock: true },
        { id: 3, name: 'SS TON Cricket Kit', title: 'SS TON Cricket Kit', price: 410, old_price: 800, image: '/bat3.png', category: 'kit', rating: 4.3, inStock: true },
        { id: 4, name: 'Professional Cricket Helmet', title: 'Professional Cricket Helmet', price: 210, old_price: 280, image: '/helmet.png', category: 'helmet', rating: 4.6, inStock: true },
        { id: 5, name: 'Cricket Stumps Set', title: 'Cricket Stumps Set', price: 80, old_price: 180, image: '/stumps.png', category: 'accessories', rating: 4.2, inStock: false },
        { id: 6, name: 'Premium Cricket Kit Bag', title: 'Premium Cricket Kit Bag', price: 120, old_price: 180, image: '/kit.png', category: 'kit', rating: 4.4, inStock: true },
        { id: 7, name: 'GM Cricket Bat', title: 'GM Cricket Bat', price: 100, old_price: 190, image: '/bat2.png', category: 'bats', rating: 4.7, inStock: true },
        { id: 8, name: 'Cricket Stumps Pro', title: 'Cricket Stumps Pro', price: 410, old_price: 800, image: '/stumps.png', category: 'accessories', rating: 4.1, inStock: true },
        { id: 9, name: 'Cricket Batting Gloves', title: 'Cricket Batting Gloves', price: 210, old_price: 280, image: '/gloves.png', category: 'accessories', rating: 4.5, inStock: true },
        { id: 10, name: 'Cricket Stumps Deluxe', title: 'Cricket Stumps Deluxe', price: 80, old_price: 180, image: '/stumps.png', category: 'accessories', rating: 4.0, inStock: true },
      ]);
    } finally {
      setLoading(false);
    }
  };

  // const calculateDiscount = (price: number, old_price: number) => {
  //   if (!old_price || old_price <= price) return 0;
  //   return Math.round(((old_price - price) / old_price) * 100);
  // };

  const addToCart = async (product: Product, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    setAddingToCart(product.id);
    
    try {
      const token = localStorage.getItem('token');
      
      // Use backend if logged in
      if (token) {
        await axios.post(`${API_URL}/cart`, 
          { productId: product.id, quantity: 1 },
          { headers: { Authorization: `Bearer ${token}` } }
        );
      } else {
        // Use localStorage if not logged in
        const cartItem = {
          productId: product.id,
          name: product.name || product.title,
          price: product.price,
          old_price: product.old_price,
          category: product.category,
          image: product.image,
          quantity: 1
        };
        
        const existingCart = localStorage.getItem('cart');
        const cart = existingCart ? JSON.parse(existingCart) : [];
        
        const existingIndex = cart.findIndex((item: any) => item.productId === product.id);
        
        if (existingIndex > -1) {
          cart[existingIndex].quantity += 1;
        } else {
          cart.push(cartItem);
        }
        
        localStorage.setItem('cart', JSON.stringify(cart));
      }
      
      window.dispatchEvent(new CustomEvent('cartUpdated'));
      
      toast.success('Added to cart!');
      
      const btn = document.getElementById(`cart-btn-${product.id}`);
      if (btn) {
        btn.textContent = '✓ Added';
        setTimeout(() => {
          if (btn) btn.textContent = 'Add to Cart';
        }, 1500);
      }
    } catch (error: any) {
      console.error('Error adding to cart:', error?.response || error);
      toast.error('Failed to add to cart. Try again.');
    } finally {
      setTimeout(() => setAddingToCart(null), 1500);
    }
  };

  return (
    <div className="bg-gray-50 py-0 md:py-0 px-4 md:px-6 lg:mt-20">
      <div className="max-w-7xl mx-auto">
        {/* Section Header */}
        <div className="flex items-center justify-center mb-6 pt-4">
          <h1 className="text-2xl font-semibold text-gray-900">Featured Products</h1>
        </div>

        {/* Section Description */}
        <div className="text-center mb-10 md:mb-12 lg:mt-10">

        {/* Filter Buttons */}
        <div className="flex justify-center gap-2 md:gap-3 mb-10 md:mb-12 flex-wrap">
          {filters.map((filter) => (
            <button
              key={filter.value}
              onClick={() => setActiveFilter(filter.value)}
              className={`px-4 md:px-6 py-2 rounded-full text-sm md:text-base font-medium transition-all duration-300 ${
                activeFilter === filter.value
                  ? "bg-[#3F51B5] text-white shadow-lg transform scale-105"
                  : "bg-white text-gray-700 hover:bg-gray-100 hover:scale-105 shadow-sm"
              }`}
            >
              {filter.label}
            </button>
          ))}
        </div>

        {/* Loading State */}
        {loading ? (
          <div className="flex justify-center items-center py-16">
            <div className="text-center">
              <div className="w-12 h-12 border-4 border-[#3F51B5] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-gray-500">Loading products...</p>
            </div>
          </div>
        ) : products.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-lg">
            <p className="text-gray-500 mb-4">No products found in this category</p>
            <button
              onClick={() => setActiveFilter('all')}
              className="text-gray-900 hover:underline font-medium"
            >
              View all products
            </button>
          </div>
        ) : (
          <>
            {/* Products Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 md:gap-6">
              {products.map((product) => {
                // const discount = calculateDiscount(product.price, product.old_price || product.oldPrice || 0);
                const productName = product.name || product.title || '';
                const productImage = productImages[product.image] || product.image || '/bat1.png';
                const isInStock = product.inStock !== false;
                
                return (
                  <Link 
                    key={product.id} 
                    to={`/product/${product.id}`}
                    className="group bg-white rounded-xl overflow-hidden shadow-md hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
                  >
                    <div className="relative">
                      {/* Product Image Container */}
                      <div className="relative bg-gray-100 p-4 flex items-center justify-center h-40 sm:h-48 md:h-52 overflow-hidden">
                        {/* Discount Badge */}
                        
                        
                        {/* Stock Status */}
                        {!isInStock && (
                          <span className="absolute top-2 right-2 bg-gray-700 text-white text-xs font-bold px-2 py-1 rounded-md z-10">
                            Out of Stock
                          </span>
                        )}
                        
                        {/* Image */}
                        <img
                          src={productImage}
                          alt={productName}
                          className="h-full w-full object-contain transition-transform duration-300 group-hover:scale-110"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = '/bat1.png';
                          }}
                        />
                      </div>
                      
                      {/* Product Details */}
                      <div className="p-3 md:p-4">
                        {/* Vendor/Category */}
                        <p className="text-xs text-gray-500 mb-1 uppercase tracking-wide">
                          {product.vendor || product.category || 'Cricket'}
                        </p>
                        
                        {/* Product Name */}
                        <h3 className="text-sm md:text-base font-semibold text-gray-800 mb-2 line-clamp-2 group-hover:text-gray-900 transition-colors">
                          {productName}
                        </h3>
                        
                        {/* Rating */}
                        {product.rating && (
                          <div className="flex items-center gap-1 mb-2">
                            <div className="flex items-center">
                              {[...Array(5)].map((_, i) => (
                                <svg key={i} className={`w-3 h-3 ${i < Math.floor(product.rating || 0) ? 'text-yellow-400' : 'text-gray-300'} fill-current`} viewBox="0 0 20 20">
                                  <path d="M10 15l-5.878 3.09 1.123-6.545L.489 6.91l6.572-.955L10 0l2.939 5.955 6.572.955-4.756 4.635 1.123 6.545z"/>
                                </svg>
                              ))}
                            </div>
                            <span className="text-xs text-gray-500">({product.rating})</span>
                          </div>
                        )}
                        
                        {/* Price */}
                        <div className="flex items-center gap-2 mb-3">
                          <span className="text-gray-900 font-bold text-lg md:text-xl">
                            ${product.price}
                          </span>
                          {(product.old_price || product.oldPrice) && (product.old_price || product.oldPrice || 0) > product.price && (
                            <span className="text-gray-400 line-through text-sm">
                              ${product.old_price || product.oldPrice}
                            </span>
                          )}
                        </div>
                        
                        {/* Add to Cart Button */}
                        <button
                          id={`cart-btn-${product.id}`}
                          onClick={(e) => addToCart(product, e)}
                          disabled={!isInStock || addingToCart === product.id}
                          className={`w-full py-2 rounded-lg text-sm font-medium transition-all duration-300 ${
                            isInStock
                              ? 'bg-[#3F51B5] text-white hover:bg-[#2c3a8c] active:scale-95'
                              : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                          }`}
                        >
                          {addingToCart === product.id ? (
                            <span className="flex items-center justify-center gap-2">
                              <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"/>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                              </svg>
                              Adding...
                            </span>
                          ) : isInStock ? (
                            'Add to Cart'
                          ) : (
                            'Out of Stock'
                          )}
                        </button>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
            
            {/* View All Button */}
            <div className="flex justify-center mt-10 md:mt-12 mb-12">
              <Link 
                to="/products" 
                className="group inline-flex items-center gap-2 px-6 md:px-8 py-2.5 md:py-3 bg-[#3F51B5] text-white rounded-full font-semibold hover:bg-[#2c3a8c] transition-all duration-300 shadow-md hover:shadow-xl transform hover:scale-105"
              >
                <span>View All Products</span>
                <svg className="w-4 h-4 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </Link>
            </div>
          </>
        )}
      </div>
    </div>
    </div>
  );
}