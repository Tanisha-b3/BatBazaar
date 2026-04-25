import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import { API_URL } from '../config';

interface Product {
  id: number;
  name: string;
  title?: string;
  price: number;
  old_price: number;
  category: string;
  image: string;
  vendor?: string;
  discount?: number;
}

const filters = [
  { label: 'All Products', value: 'all' },
  { label: 'Cricket Bats', value: 'bats' },
  { label: 'Accessories', value: 'accessories' },
  { label: 'Kit', value: 'kit' },
  { label: 'Helmet', value: 'helmet' },
];

const topSellersImages: Record<string, string> = {
  '/bat1.png': '/bat1.png',
  '/bat2.png': '/bat2.png',
  '/bag.png': '/bag.png',
  '/helmet.png': '/helmet.png',
  '/stumps.png': '/stumps.png',
  '/kit.png': '/kit.png',
  '/gloves.png': '/gloves.png',
  '/bat3.png': '/bat3.png',
};

export default function TopSellers() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState('all');

  const fetchProducts = useCallback(async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const url = activeFilter === 'all' 
        ? `${API_URL}/products`
        : `${API_URL}/products?category=${activeFilter}`;
      
      const response = await axios.get(url, {
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      });
      
      let productsData = response.data.products || response.data || [];
      setProducts(productsData.slice(0, 5));
    } catch (error) {
      console.error('Error fetching products:', error);
      setProducts([{ id: 1, name: 'SS Kashmir Willow Cricket Full Kit', title: 'SS Kashmir Willow Cricket Full Kit', price: 100, old_price: 190, image: '/bat1.png', category: 'kit', discount: 65 }]);
    } finally {
      setLoading(false);
    }
  }, [activeFilter]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);



  const calculateDiscount = (price: number, old_price: number) => {
    if (!old_price || old_price <= price) return 0;
    return Math.round(((old_price - price) / old_price) * 100);
  };

  return (
    <div className="bg-white px-4 md:px-6 py-10 md:py-16">
      <div className="max-w-7xl mx-auto">
        {/* Header without Back Button */}
        <div className="flex items-center justify-center mb-8">
          <h2 className="text-black text-2xl md:text-3xl font-semibold text-center">
            Top Sellers
          </h2>
        </div>

        {/* Filter Buttons */}
        <div className="flex justify-center gap-2 md:gap-4 mb-8 md:mb-12 flex-wrap">
          {filters.map((filter) => (
            <button
              key={filter.value}
              onClick={() => setActiveFilter(filter.value)}
              className={`px-4 md:px-6 py-2 rounded-full text-sm md:text-base font-medium transition-all duration-300 ${
                activeFilter === filter.value
                  ? "bg-[#3F51B5] text-white shadow-md transform scale-105"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200 hover:scale-105"
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
              <p className="text-gray-500">Loading top sellers...</p>
            </div>
          </div>
        ) : products.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-gray-500 mb-4">No products found in this category</p>
            <button
              onClick={() => setActiveFilter('all')}
              className="text-black hover:underline"
            >
              View all products
            </button>
          </div>
        ) : (
          /* Products Grid */
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 md:gap-6">
            {products.map((item) => {
              const discount = item.discount || calculateDiscount(item.price, item.old_price);
              const productName = item.name || item.title || '';
              const productImage = topSellersImages[item.image] || item.image || '/bat1.png';
              
              return (
                <Link 
                  key={item.id} 
                  to={`/product/${item.id}`}
                  className="group cursor-pointer transition-all duration-300 hover:transform hover:-translate-y-1"
                >
                  <div className="space-y-3">
                    {/* Product Image Container */}
                    <div className="bg-gray-50 rounded-lg p-4 flex items-center justify-center relative overflow-hidden hover:shadow-lg transition-shadow duration-300">
                      {/* Discount Badge */}
                      {discount > 0 && (
                        <span className="absolute top-2 left-2 bg-[#3F51B5] text-white text-xs font-semibold px-2 py-1 rounded-md z-10">
                          {discount}% OFF
                        </span>
                      )}
                      
                      {/* Hot Seller Badge */}
                      {item.id <= 3 && (
                        <span className="absolute top-2 right-2 bg-red-500 text-white text-xs font-semibold px-2 py-1 rounded-md z-10">
                          🔥 Hot
                        </span>
                      )}
                      
                      {/* Image */}
                      <img
                        src={productImage}
                        alt={productName}
                        className="h-[100px] sm:h-[120px] md:h-[140px] object-contain transition-transform duration-300 group-hover:scale-105"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = '/bat1.png';
                        }}
                      />
                    </div>
                    
                    {/* Product Details */}
                    <div className="text-center space-y-2">
                      {/* Deal Tag */}
                      <p className="text-black text-xs font-semibold uppercase tracking-wide">
                        Deal of the Day
                      </p>
                      
                      {/* Product Name */}
                      <p className="text-gray-800 text-sm font-medium line-clamp-2 hover:text-black transition-colors">
                        {productName}
                      </p>
                      
                      {/* Price */}
                      <div className="flex items-center justify-center gap-2">
                        <span className="text-black font-bold text-lg">
                          ${item.price}
                        </span>
                        {item.old_price && item.old_price > item.price && (
                          <span className="text-gray-400 line-through text-sm">
                            ${item.old_price}
                          </span>
                        )}
                      </div>
                      
                      {/* Rating Stars (Optional) */}
                      <div className="flex items-center justify-center gap-0.5">
                        {[...Array(5)].map((_, i) => (
                          <svg key={i} className="w-3 h-3 text-yellow-400 fill-current" viewBox="0 0 20 20">
                            <path d="M10 15l-5.878 3.09 1.123-6.545L.489 6.91l6.572-.955L10 0l2.939 5.955 6.572.955-4.756 4.635 1.123 6.545z"/>
                          </svg>
                        ))}
                        <span className="text-xs text-gray-500 ml-1">(5.0)</span>
                      </div>
                      
                      {/* Add to Cart Button - Appears on Hover */}
                      <button 
                        onClick={async (e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          
                          const token = localStorage.getItem('token');
                           
                          if (token) {
                            try {
                              await axios.post(`${API_URL}/cart`, 
                                { productId: item.id, quantity: 1 },
                                { headers: { Authorization: `Bearer ${token}` } }
                              );
                              window.dispatchEvent(new CustomEvent('cartUpdated'));
                              toast.success('Added to cart!');
                            } catch (err: any) {
                              console.error('Error adding to cart:', err);
                              toast.error('Failed to add to cart');
                            }
                          } else {
                            const cart = JSON.parse(localStorage.getItem('cart') || '[]');
                            const existingIndex = cart.findIndex((c: any) => c.productId === item.id);
                            
                            if (existingIndex > -1) {
                              cart[existingIndex].quantity += 1;
                            } else {
                              cart.push({ 
                                productId: item.id, 
                                name: item.name, 
                                price: item.price, 
                                old_price: item.old_price,
                                category: item.category,
                                image: item.image,
                                quantity: 1 
                              });
                            }
                            
                            localStorage.setItem('cart', JSON.stringify(cart));
                            window.dispatchEvent(new CustomEvent('cartUpdated'));
                            toast.success('Added to cart!');
                          }
                        }}
                        className="w-full mt-2 bg-[#3F51B5] text-white text-xs font-medium py-2 rounded-md opacity-0 group-hover:opacity-100 transition-opacity duration-300 hover:bg-[#2c3a8c]"
                      >
                        Add to Cart
                      </button>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
        
        {/* View All Products Button */}
        {products.length > 0 && (
          <div className="text-center mt-12">
            <Link 
              to="/products"
              className="inline-flex items-center gap-2 px-6 py-2.5 border-2 border-[#3F51B5] text-black font-semibold rounded-full hover:bg-[#3F51B5] hover:text-white transition-all duration-300"
            >
              View All Products
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}