import { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import axios from "axios";
import { useAuth } from "../context/AuthContext";
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

interface Product {
  id: number;
  name: string;
  price: number;
  old_price: number;
  image: string;
  rating: number;
  reviews: number;
}

export default function WriteReview() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const productId = searchParams.get("productId");
  
  const [product, setProduct] = useState<Product | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    fetchData();
  }, [productId]);

  const fetchData = async () => {
    try {
      const token = localStorage.getItem('token');
      const [productRes, reviewsRes] = await Promise.all([
        productId ? axios.get(`${API_URL}/products/${productId}`) : Promise.resolve({ data: null }),
        productId ? axios.get(`${API_URL}/products/${productId}/reviews`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {}
        }) : Promise.resolve({ data: [] })
      ]);
      setProduct(productRes.data);
      setReviews(reviewsRes.data);
    } catch (error: any) {
      console.error("Error fetching data:", error);
      toast.error('Failed to load product data');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      navigate("/login");
      return;
    }
    if (rating === 0) {
      setError("Please select a rating");
      return;
    }

    setSubmitting(true);
    setError("");

    try {
      const token = localStorage.getItem("token");
      await axios.post(
        `${API_URL}/products/${productId}/review`,
        { rating, comment },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setSuccess(true);
      setComment("");
      setRating(0);
      fetchData();
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to submit review");
    } finally {
      setSubmitting(false);
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
  <div className="bg-gray-100 min-h-screen py-8 ">
    <div className="max-w-6xl mx-auto px-4">

      {/* 🔙 Header */}
      <div className="flex items-center justify-between mb-8">
        <button onClick={() => navigate(-1)}>← Back</button>

        <h1 className="text-3xl font-semibold text-center flex-1">
          Ratings & Reviews
        </h1>

        <div className="w-[60px]"></div>
      </div>

      {/* 🔥 Top Section (Fixed from Figma) */}
      <div className="flex justify-between items-start mb-6">

        {/* Left Title */}
        <h2 className="text-2xl font-medium">
          What makes a good review
        </h2>

        {/* Right Product Info */}
        {product && (
          <div className="flex items-center gap-3">
            <img
              src={product.image || "/bat1.png"}
              className="w-[75px] h-[75px] object-contain"
            />

            <div>
              <p className="text-sm">{product.name}</p>

              <div className="flex items-center gap-2 mt-1">
                <span className="bg-green-600 text-white text-xs px-2 rounded">
                  {getAverageRating()} ★
                </span>
                <span className="text-gray-500 text-sm">
                  {reviews.length}
                </span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 🧾 Main Card */}
      <div className="bg-white rounded-lg shadow-lg p-6 grid md:grid-cols-2 gap-8">

        {/* LEFT */}
        <div className="space-y-6">

          <div>
            <h3 className="font-medium text-lg">
              Have you used this product?
            </h3>
            <p className="text-gray-600 text-sm">
              Your review should be about your experience with the product.
            </p>
          </div>

          <div>
            <h3 className="font-medium text-lg">
              Why review a product?
            </h3>
            <p className="text-gray-600 text-sm">
              Your valuable feedback will help fellow shoppers decide!
            </p>
          </div>

        </div>

        {/* RIGHT */}
        <div className="bg-[#EEF0FF] rounded-lg p-6">

          <h3 className="text-lg font-semibold mb-3">
            Rate this product
          </h3>

          {/* ⭐ Stars */}
          <div className="flex gap-2 mb-6">
            {[1,2,3,4,5].map((star) => (
              <button
                key={star}
                onClick={() => setRating(star)}
                className={`text-3xl ${
                  star <= rating ? "text-yellow-400" : "text-gray-300"
                }`}
              >
                ★
              </button>
            ))}
          </div>

          <h3 className="text-lg font-semibold mb-2">
            Review this product
          </h3>

          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Enter product review"
            className="w-full p-3 border rounded-md outline-none"
            rows={4}
          />

          {/* Messages */}
          {error && (
            <p className="text-red-500 text-sm mt-2">{error}</p>
          )}

          {success && (
            <p className="text-green-600 text-sm mt-2">
              Review submitted successfully!
            </p>
          )}

          {/* Submit */}
          <button
            onClick={handleSubmit}
            disabled={submitting}
            className="mt-4 w-full bg-[#3F51B5] text-white py-2 rounded-md"
          >
            {submitting ? "Submitting..." : "Submit"}
          </button>
        </div>
      </div>

      {/* 📝 Reviews */}
      {reviews.length > 0 && (
        <div className="mt-10">
          <h3 className="text-xl font-semibold mb-4">
            Customer Reviews
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {reviews.slice(0, 4).map((review) => (
              <div key={review.id} className="bg-white p-4 rounded shadow">

                <div className="flex items-center gap-2 mb-2">
                  <span className="bg-green-600 text-white text-xs px-2 rounded">
                    {review.rating} ★
                  </span>
                  <span className="font-medium">{review.user}</span>
                </div>

                <p className="text-gray-600 text-sm">
                  {review.comment}
                </p>

                <p className="text-xs text-gray-400 mt-2">
                  {review.date
                    ? new Date(review.date).toLocaleDateString()
                    : ""}
                </p>

              </div>
            ))}
          </div>
        </div>
      )}

    </div>
  </div>
);
}