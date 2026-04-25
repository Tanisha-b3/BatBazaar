import { useState, useEffect } from "react";
import { useSearchParams, Link} from "react-router-dom";
import axios from "axios";
import { toast } from "react-hot-toast";
import { API_URL } from "../config";

interface Review {
  id: number;
  user: string;
  rating: number;
  comment: string;
  date: string;
  verified: boolean;
}

export default function CustomerReviews() {
  const [searchParams] = useSearchParams();
  // const navigate = useNavigate();
  const productId = searchParams.get("productId");
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchReviews();
  }, [productId]);

  const fetchReviews = async () => {
    try {
      if (productId) {
        const token = localStorage.getItem('token');
        const response = await axios.get(`${API_URL}/products/${productId}/reviews`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {}
        });
        setReviews(response.data);
      }
    } catch (error: any) {
      console.error('Error fetching reviews:', error);
      toast.error('Failed to load reviews');
    } finally {
      setLoading(false);
    }
  };

  const getAverageRating = () => {
    if (reviews.length === 0) return 0;
    const sum = reviews.reduce((acc, r) => acc + r.rating, 0);
    return (sum / reviews.length).toFixed(1);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center mt-20">
        <div className="w-16 h-16 border-4 border-[#3F51B5] border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="bg-white py-16 px-6 min-h-screen mt-20">

      {/* Title */}
      <div className="text-center mb-12">
        <h2 className="text-3xl md:text-4xl font-semibold text-gray-800">
          Customer Reviews
        </h2>
        <p className="text-gray-500 mt-2 text-sm md:text-base">
          What our customer say about quality cricket gear
        </p>
        
        {/* Rating Summary */}
        {reviews.length > 0 && (
          <div className="mt-4">
            <div className="text-4xl font-bold text-[#3F51B5]">{getAverageRating()}</div>
            <div className="flex gap-1 justify-center mt-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <span key={star} className={`text-2xl ${star <= Math.round(Number(getAverageRating())) ? 'text-yellow-400' : 'text-gray-300'}`}>
                  ★
                </span>
              ))}
            </div>
            <p className="text-gray-500 mt-1">{reviews.length} reviews</p>
          </div>
        )}
      </div>

      {reviews.length === 0 ? (
        <div className="text-center text-gray-500">
          <p>No reviews yet. Be the first to review!</p>
        </div>
      ) : (
        /* Cards */
        <div className="max-w-[1200px] mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">

          {reviews.map((review, i) => (
            <div
              key={i}
              className="bg-white p-5 rounded-lg shadow-md hover:shadow-lg transition"
            >
              {/* Quote Icon */}
              <div className="text-[#3F51B5] text-4xl font-bold mb-3">
                "
              </div>

              {/* Text */}
              <p className="text-gray-700 text-sm leading-6 mb-4">
                {review.comment || "Great product! Highly recommended."}
              </p>

              {/* User */}
              <div className="flex items-center gap-3 mt-4">
                <img
                  src="/user.png"
                  alt={review.user}
                  className="w-9 h-9 rounded-full object-cover"
                />
                <div>
                  <p className="text-sm font-medium">{review.user}</p>
                  <p className="text-xs text-gray-500">{review.date ? new Date(review.date).toLocaleDateString() : 'Verified Buyer'}</p>
                </div>
              </div>

              {/* Stars */}
              <div className="flex gap-1 mt-3 text-yellow-400">
                {[1, 2, 3, 4, 5].map((star) => (
                  <span key={star} className={star <= review.rating ? 'text-yellow-400' : 'text-gray-300'}>★</span>
                ))}
              </div>
            </div>
          ))}

        </div>
      )}

      {/* Back Button */}
      {productId && (
        <div className="text-center mt-8">
          <Link 
            to={`/product/${productId}`}
            className="bg-[#3F51B5] text-white px-6 py-2 rounded hover:bg-indigo-700"
          >
            Back to Product
          </Link>
        </div>
      )}
    </div>
  );
}