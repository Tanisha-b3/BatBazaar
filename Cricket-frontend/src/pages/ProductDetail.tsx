import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { Star, ShoppingCart, CreditCard, Truck, ShieldCheck, RotateCcw } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { API_URL } from '../config';

interface Review {
  id: number;
  user: string;
  rating: number;
  comment: string;
  date: string;
  verified: boolean;
}

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
  description?: string;
  features?: string[];
  rating?: number;
  reviews?: number;
  ratingsBreakdown?: Record<number, number>;
}

interface RelatedProduct {
  id: number;
  name: string;
  price: number;
  old_price: number;
  image: string;
  discount: number;
}

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

export default function ProductDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const [selectedImage, setSelectedImage] = useState(0);
  const [showAllReviews, setShowAllReviews] = useState(false);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [relatedProducts, setRelatedProducts] = useState<RelatedProduct[]>([]);
  const [productImagesList, setProductImagesList] = useState<string[]>([]);
  const [addingToCart, setAddingToCart] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const { addToCart } = useCart();
  const { user } = useAuth();

  useEffect(() => {
    if (id) {
      fetchProduct();
      fetchProductReviews();
      fetchRelatedProducts();
    }
  }, [id]);

const fetchProduct = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_URL}/products/${id}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      });
      
      const productData = response.data;
      
      if (typeof productData.features === 'string') {
        productData.features = JSON.parse(productData.features);
      }
      if (typeof productData.images === 'string') {
        productData.images = JSON.parse(productData.images);
      }
      
      setProduct(productData);
      
      const productImages = productData.images || [];
      if (productImages && productImages.length > 0) {
        setProductImagesList(productImages);
      } else if (productData.image) {
        setProductImagesList([productData.image]);
      } else {
        setProductImagesList(['/kit.png']);
      }
    } catch (error) {
      console.error('Error fetching product:', error);
      setProduct({
        id: Number(id) || 1,
        name: 'SS TON Range TON Maximus Kashmir Willow Cricket Bat - SH',
        price: 90,
        old_price: 190,
        category: 'bats',
        image: '/bat2.png',
        vendor: 'SS',
        productType: 'BAT',
        size: 'Medium',
        inStock: true,
        description: 'Super Grade 3 Premium Kashmir Willow. Air Dried Willow. Latest Shape With Massive concave TON Edges enable high impact with optimum performance. Embossed sticker with high quality grip. Wide Play area with Clean bat face. Includes Protective Bat Cover.',
        features: [
          'Super Grade 3 Premium Kashmir Willow',
          'Air Dried Willow',
          'Latest Shape With Massive concave TON Edges',
          'Embossed sticker with high quality grip',
          'Wide Play area with Clean bat face',
          'Includes Protective Bat Cover'
        ],
        rating: 3.6,
        reviews: 450,
        ratingsBreakdown: { 5: 245, 4: 85, 3: 60, 2: 35, 1: 25 }
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchProductReviews = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_URL}/products/${id}/reviews`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      });
      setReviews(response.data);
    } catch (error) {
      console.error('Error fetching reviews:', error);
      setReviews([
        { id: 1, user: 'Pranay Shukla', rating: 5, comment: 'The Bat is very nice and it is good for hitter who loves to hit six and it is also good for 14year old boys love it thank you', date: '2024-01-15', verified: true },
        { id: 2, user: 'Quality Cricket Customer', rating: 4, comment: 'Great bat for the price. Good pickup and nice edges. Recommended for intermediate players.', date: '2024-01-10', verified: true },
        { id: 3, user: 'Cricket Lover', rating: 3, comment: 'Decent bat but expected better performance. Otherwise okay.', date: '2024-01-05', verified: false },
      ]);
    }
  };

  const fetchRelatedProducts = async () => {
    try {
      const response = await axios.get(`${API_URL}/products/${id}/related`);
      setRelatedProducts(response.data);
    } catch (error) {
      console.error('Error fetching related products:', error);
      setRelatedProducts([
        { id: 1, name: 'MRF Genius Grand Edition English Willow Cricket Bat', price: 100, old_price: 190, image: '/bat1.png', discount: 65 },
        { id: 2, name: 'SS TON Range TON Maximus Kashmir Willow Cricket Bat', price: 100, old_price: 190, image: '/bat2.png', discount: 65 },
        { id: 3, name: 'GM Dynamo Kashmir Willow Cricket Bat', price: 100, old_price: 190, image: '/bat3.png', discount: 65 },
        { id: 4, name: 'SG Rotiq Kashmir Willow Cricket Bat', price: 100, old_price: 190, image: '/bat1.png', discount: 65 },
        { id: 5, name: 'Kookaburra Kahuna Cricket Bat', price: 100, old_price: 190, image: '/bat2.png', discount: 65 },
      ]);
    }
  };

  const handleAddToCart = async () => {
    if (!product) return;
    
    if (!user) {
      toast.error('Please login to add items to cart');
      navigate('/login');
      return;
    }
    
    setAddingToCart(true);
    try {
      await addToCart(product.id, quantity);
      setShowSuccess(true);
      toast.success('Added to cart successfully!');
      setTimeout(() => setShowSuccess(false), 3000);
    } catch (error) {
      console.error('Error adding to cart:', error);
      toast.error('Failed to add item to cart');
    } finally {
      setAddingToCart(false);
    }
  };

  const handleBuyNow = async () => {
    if (!product) return;
    
    if (!user) {
      toast.error('Please login to continue');
      navigate('/login');
      return;
    }
    
    setAddingToCart(true);
    try {
      await addToCart(product.id, quantity);
      toast.success('Added to cart! Redirecting to checkout...');
      setTimeout(() => {
        window.location.href = '/checkout';
      }, 500);
    } catch (error) {
      console.error('Error:', error);
      toast.error('Failed to process');
    } finally {
      setAddingToCart(false);
    }
  };



  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center mt-20">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-[#3F51B5] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <div className="text-gray-500 text-lg">Loading product...</div>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center mt-20">
        <p className="text-gray-500 mb-4 text-lg">Product not found</p>
        <Link to="/products" className="text-gray-900 hover:text-[#2c3a8c]">
          Back to Products
        </Link>
      </div>
    );
  }

  const discount = Math.round(((product.old_price - product.price) / product.old_price) * 100);
  const displayReviews = showAllReviews ? reviews : reviews.slice(0, 2);
  const averageRating = reviews.length > 0
    ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1)
    : product.rating || 0;

  return (
    <div className="bg-white min-h-screen mt-20">
      {/* Success Toast */}
      {showSuccess && (
        <div className="fixed top-24 right-4 z-50 bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg animate-slideIn">
          ✓ Item added to cart successfully!
        </div>
      )}

      <div className="max-w-7xl mx-auto px-4 py-6">
        
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-sm text-gray-500 mb-6">
          <Link to="/" className="hover:text-gray-900 transition">Home</Link>
          <span>/</span>
          <Link to="/products" className="hover:text-gray-900 transition">Products</Link>
          <span>/</span>
          <span className="text-gray-900">{product.name.substring(0, 50)}...</span>
        </div>

        {/* Product Main Section - Stack on mobile, side-by-side on lg */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 lg:gap-8 mb-12">
          
          {/* Left Column - Product Images */}
          <div className="lg:col-span-2">
            {/* Thumbnails + Image + Buttons */}
            <div className="flex flex-col md:flex-row gap-3 md:gap-4">
              {/* Thumbnails - Below image on mobile, LEFT on desktop */}
              <div className="flex flex-row md:flex-col gap-2 md:gap-3">
                {productImagesList.map((img, idx) => (
                  <button
                    key={idx}
                    onClick={() => setSelectedImage(idx)}
                    className={`w-[60px] h-[60px] sm:w-[80px] sm:h-[80px] md:w-[100px] md:h-[100px] lg:w-[121px] lg:h-[130px] border rounded-lg overflow-hidden transition-all flex-shrink-0 ${
                      selectedImage === idx 
                        ? 'shadow-[0_0_10px_1px_rgba(63,81,181,0.5)] border-[#3F51B5]' 
                        : 'border-gray-200 hover:border-[#3F51B5]'
                    }`}
                  >
                    <img
                      src={img || '/kit.png'}
                      alt={`Product view ${idx + 1}`}
                      className="w-full h-full object-cover"
                    />
                  </button>
                ))}
              </div>

              {/* Main Image + Buttons - Column */}
              <div className="flex-1">
                <div className="bg-gray-50 rounded-lg p-3 sm:p-6 md:p-8 flex items-center justify-center h-[220px] sm:h-[300px] md:h-[380px]">
                  <img
                    src={productImagesList[selectedImage] || product?.image || '/kit.png'}
                    alt={product.name}
                    className="max-w-full max-h-full object-contain"
                  />
                </div>

                {/* Buttons - Below Image */}
                <div className="flex gap-2 sm:gap-4 mt-3 sm:mt-4">
                  <button 
                    onClick={handleAddToCart}
                    disabled={addingToCart || product.inStock === false}
                    className="flex-1 sm:flex-none sm:w-[170px] bg-[#2F80ED] text-white py-2 sm:py-3 px-3 sm:px-4 rounded-lg font-semibold hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-sm sm:text-base"
                  >
                    <ShoppingCart size={18} />
                    <span className="hidden sm:inline">{addingToCart ? 'Adding...' : 'Add to Cart'}</span>
                    <span className="sm:hidden">Add</span>
                  </button>
                  <button 
                    onClick={handleBuyNow}
                    disabled={product.inStock === false}
                    className="flex-1 sm:flex-none sm:w-[170px] bg-[#3F51B5] text-white py-2 sm:py-3 px-3 sm:px-3 rounded-lg font-semibold hover:bg-[#2c3a8c] transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-sm sm:text-base"
                  >
                    <CreditCard size={16} />
                    <span className="hidden sm:inline">Buy Now</span>
                    <span className="sm:hidden">Buy</span>
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column - Product Info */}
          <div className="lg:col-span-3 space-y-3 sm:space-y-4">
            <p className="text-sm text-gray-500">{product.vendor} {product.productType || product.category}</p>
            <h1 className="text-xl sm:text-2xl md:text-3xl font-semibold text-gray-900">{product.name}</h1>
            
            {/* Rating Summary */}
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1">
                {[1,2,3,4,5].map((star) => (
                  <Star key={star} className={`w-4 h-4 ${star <= Number(averageRating) ? 'text-yellow-400 fill-current' : 'text-gray-300'}`} />
                ))}
              </div>
              <span className="text-sm text-gray-600">{averageRating} out of 5</span>
              <span className="text-sm text-gray-400">({product.reviews || reviews.length} reviews)</span>
            </div>
            
            <div className="border-t border-gray-100 my-3"></div>
            
            {/* Price Section */}
            <div className="flex flex-col sm:flex-row sm:items-baseline gap-1 sm:gap-3 flex-wrap">
              {discount > 0 && (
                <span className="text-xl sm:text-2xl font-bold text-gray-900">{discount}% OFF</span>
              )}
              <span className="text-2xl sm:text-3xl font-bold text-gray-900">${product.price}</span>
              <span className="text-base sm:text-lg text-gray-400 line-through">${product.old_price}</span>
            </div>
            
            <p className="text-sm text-green-600">✓ Inclusive of all taxes</p>
            
            <div className="border-t border-gray-100 my-3"></div>
            
            {/* Features List */}
            <div className="space-y-2">
              <h3 className="font-semibold text-gray-900">Key Features:</h3>
              {product.features?.slice(0, 4).map((feature, i) => (
                <p key={i} className="text-sm text-gray-600 flex items-start gap-2">
                  <span className="text-gray-900">•</span> {feature}
                </p>
              ))}
            </div>
            
            {/* Size Selection */}
            <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 pt-2">
              <span className="text-gray-700 font-medium">Size:</span>
              <div className="flex flex-wrap gap-2">
                {['Small', 'Medium', 'Large', 'Senior'].map((size) => (
                  <button
                    key={size}
                    className={`px-3 sm:px-4 py-1.5 border rounded-lg text-xs sm:text-sm transition ${
                      product.size === size 
                        ? 'border-[#3F51B5] bg-[#3F51B5]/10 text-gray-900 font-medium' 
                        : 'border-gray-300 hover:border-[#3F51B5] hover:text-gray-900'
                    }`}
                  >
                    {size}
                  </button>
                ))}
              </div>
            </div>
            
            {/* Quantity */}
            <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
              <span className="text-gray-700 font-medium">Quantity:</span>
              <div className="flex items-center border border-gray-300 rounded-lg w-fit">
                <button
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="px-3 py-1.5 hover:bg-gray-100 transition rounded-l-lg"
                >
                  −
                </button>
                <span className="px-4 sm:px-5 py-1.5 min-w-[40px] sm:min-w-[60px] text-center border-x border-gray-200">{quantity}</span>
                <button
                  onClick={() => setQuantity(quantity + 1)}
                  className="px-3 py-1.5 hover:bg-gray-100 transition rounded-r-lg"
                >
                  +
                </button>
              </div>
            </div>
            
            {/* Stock Status */}
            <div className="text-sm">
              {product.inStock !== false ? (
                <span className="text-green-600 font-medium flex items-center gap-1">
                  <span className="w-2 h-2 bg-green-600 rounded-full"></span> In Stock
                </span>
              ) : (
                <span className="text-red-600 font-medium">Out of Stock</span>
              )}
            </div>
            
            {/* Delivery Info */}
            <div className="pt-3 sm:pt-4 border-t space-y-2">
              <div className="flex items-center gap-2 text-xs sm:text-sm text-gray-600">
                <Truck size={16} className="text-gray-900" />
                <span>Free delivery on orders above $50</span>
              </div>
              <div className="flex items-center gap-2 text-xs sm:text-sm text-gray-600">
                <ShieldCheck size={16} className="text-gray-900" />
                <span>2 year warranty</span>
              </div>
              <div className="flex items-center gap-2 text-xs sm:text-sm text-gray-600">
                <RotateCcw size={16} className="text-gray-900" />
                <span>7 days return policy</span>
              </div>
            </div>
          </div>
        </div>

        {/* Rating & Reviews Section */}
        <div className="border-t border-gray-200 pt-6 sm:pt-8 mb-8">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-0 mb-4 sm:mb-6">
            <h2 className="text-xl sm:text-2xl font-semibold text-gray-900">Ratings & Reviews</h2>
            <Link
              to={`/write-review?productId=${id}`}
              className="bg-white border-2 border-[#3F51B5] text-gray-900 rounded-lg px-4 sm:px-6 py-1.5 sm:py-2 text-sm font-medium hover:bg-[#3F51B5] hover:text-white transition-all duration-300"
            >
              Rate Product
            </Link>
          </div>

          {/* Rating Summary */}
          <div className="flex flex-col md:flex-row gap-8 mb-10">
            {/* Left - Average Rating */}
            <div className="text-center md:w-1/3">
              <div className="text-5xl font-bold text-gray-800">{averageRating}</div>
              <div className="flex justify-center gap-1 my-2">
                {[1,2,3,4,5].map((star) => (
                  <Star key={star} className={`w-6 h-6 ${star <= Number(averageRating) ? 'text-yellow-400 fill-current' : 'text-gray-300'}`} />
                ))}
              </div>
              <p className="text-gray-500 text-sm">
                {product.reviews || reviews.length} Ratings & {reviews.length} Reviews
              </p>
            </div>

            {/* Right - Rating Bars */}
            <div className="flex-1 space-y-2">
              {[5,4,3,2,1].map((star) => {
                const count = reviews.filter(r => r.rating === star).length;
                const total = reviews.length || 1;
                const percentage = (count / total) * 100;
                
                const barColor = star >= 4 ? 'bg-green-500' : star === 3 ? 'bg-yellow-500' : 'bg-red-500';
                
                return (
                  <div key={star} className="flex items-center gap-3">
                    <span className="text-sm font-medium w-8">{star} ★</span>
                    <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div className={`h-full ${barColor} rounded-full`} style={{ width: `${percentage}%` }} />
                    </div>
                    <span className="text-sm text-gray-500 w-12">{Math.round(percentage)}%</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Customer Reviews */}
          <div className="space-y-6">
            {displayReviews.map((review) => (
              <div key={review.id} className="border-b border-gray-100 pb-6">
                <div className="flex items-center gap-3 mb-2 flex-wrap">
                  <div className="bg-[#3F51B5] text-white px-2 py-0.5 rounded text-sm font-medium">
                    {review.rating} ★
                  </div>
                  <span className="font-medium text-gray-900">{review.user}</span>
                  {review.verified && (
                    <span className="text-xs text-green-600 bg-green-50 px-2 py-0.5 rounded">Verified Buyer</span>
                  )}
                </div>
                <div className="flex gap-1 mb-2">
                  {[1,2,3,4,5].map((star) => (
                    <Star key={star} className={`w-4 h-4 ${star <= review.rating ? 'text-yellow-400 fill-current' : 'text-gray-300'}`} />
                  ))}
                </div>
                <p className="text-gray-700 text-sm leading-relaxed">{review.comment}</p>
                <p className="text-xs text-gray-400 mt-2">{new Date(review.date).toLocaleDateString()}</p>
              </div>
            ))}
          </div>

          {/* View All Reviews Button */}
          {reviews.length > 2 && (
            <button
              onClick={() => setShowAllReviews(!showAllReviews)}
              className="mt-6 text-gray-900 font-medium hover:underline"
            >
              {showAllReviews ? 'Show Less' : `View All ${reviews.length} Reviews`}
            </button>
          )}
        </div>

        {/* Related Products */}
        {relatedProducts.length > 0 && (
          <div className="border-t border-gray-200 pt-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-6">You May Also Like</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
              {relatedProducts.map((item) => (
                <Link 
                  key={item.id} 
                  to={`/product/${item.id}`}
                  className="group bg-white border border-gray-100 rounded-xl overflow-hidden hover:shadow-lg transition-all duration-300 hover:-translate-y-1"
                >
                  <div className="bg-gray-50 p-3 flex items-center justify-center h-32">
                    <img
                      src={productImages[item.image] || item.image}
                      alt={item.name}
                      className="h-full object-contain group-hover:scale-105 transition-transform duration-300"
                      onError={(e) => { (e.target as HTMLImageElement).src = '/bat1.png'; }}
                    />
                  </div>
                  <div className="p-2">
                    <div className="bg-[#3F51B5] text-white text-xs font-semibold px-1.5 py-0.5 rounded inline-block mb-1">
                      {item.discount}% OFF
                    </div>
                    <p className="text-xs text-orange-500 font-medium mb-1">Deal of the Day</p>
                    <p className="text-xs text-gray-800 line-clamp-2 mb-2 group-hover:text-gray-900 transition">
                      {item.name}
                    </p>
                    <div className="flex items-center gap-1">
                      <span className="text-sm font-bold text-gray-900">${item.price}</span>
                      <span className="text-xs text-gray-400 line-through">${item.old_price}</span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>

      <style>{`
        @keyframes slideIn {
          from { transform: translateX(100%); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
        .animate-slideIn { animation: slideIn 0.3s ease-out; }
      `}</style>
    </div>
  );
}