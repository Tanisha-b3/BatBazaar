import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import axios from "axios";
import { ArrowLeft, ChevronDown, Package, Truck, CheckCircle, XCircle, Clock } from "lucide-react";
import { toast } from "react-hot-toast";
import { API_URL } from "../config";

const productImages: Record<string, string> = {
  "/bat1.png": "/bat1.png",
  "/bat2.png": "/bat2.png",
  "/bat3.png": "/bat3.png",
  "/bag.png": "/bag.png",
  "/helmet.png": "/helmet.png",
  "/stumps.png": "/stumps.png",
  "/kit.png": "/kit.png",
  "/gloves.png": "/gloves.png",
};

interface OrderItem {
  id: number;
  order_id: number;
  product_id: number;
  quantity: number;
  price: number;
  name: string;
  image: string;
}

interface Order {
  id: number;
  user_id: string;
  total_amount: number;
  status: string;
  shipping_address: string;
  created_at: string;
  items?: OrderItem[];
}

interface RecommendedProduct {
  id: number;
  name: string;
  price: number;
  old_price: number;
  image: string;
  discount: number;
}

const STATUS_CONFIG: Record<
  string,
  { label: string; icon: React.ReactNode; color: string; bg: string }
> = {
  pending: {
    label: "Order Placed",
    icon: <Clock size={14} />,
    color: "text-amber-700",
    bg: "bg-amber-50",
  },
  processing: {
    label: "Processing",
    icon: <Package size={14} />,
    color: "text-blue-700",
    bg: "bg-blue-50",
  },
  shipped: {
    label: "On the way",
    icon: <Truck size={14} />,
    color: "text-indigo-700",
    bg: "bg-indigo-50",
  },
  delivered: {
    label: "Delivered",
    icon: <CheckCircle size={14} />,
    color: "text-emerald-700",
    bg: "bg-emerald-50",
  },
  cancelled: {
    label: "Cancelled",
    icon: <XCircle size={14} />,
    color: "text-red-700",
    bg: "bg-red-50",
  },
};

const RECOMMENDED = [1, 2, 3, 4, 5];

export default function Orders() {
  const navigate = useNavigate();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("3");
  const [showFilterMenu, setShowFilterMenu] = useState(false);
  const [recommended, setRecommended] = useState<RecommendedProduct[]>([]);
  const [recLoading, setRecLoading] = useState(false);

  const filterOptions = [
    { value: "3", label: "Past 3 months" },
    { value: "6", label: "Past 6 months" },
    { value: "12", label: "Past year" },
  ];

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/login');
      return;
    }
    fetchOrders();
    fetchRecommended();
  }, [filter]);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        setLoading(false);
        return;
      }
      const response = await axios.get(`${API_URL}/orders`, {
        headers: { Authorization: `Bearer ${token}` },
        params: { months: filter },
      });
      setOrders(response.data.orders);
    } catch (error: any) {
      console.error("Error fetching orders:", error);
      toast.error(error.response?.data?.message || 'Failed to load orders');
    } finally {
      setLoading(false);
    }
  };

  const fetchRecommended = async () => {
    setRecLoading(true);
    try {
      const token = localStorage.getItem("token");
      if (token) {
        const response = await axios.get(`${API_URL}/products/recommended`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setRecommended(response.data.slice(0, 5));
      } else {
        const response = await axios.get(`${API_URL}/products?category=kit`);
        setRecommended(response.data.products.slice(0, 5));
      }
    } catch (error) {
      console.error("Error fetching recommended:", error);
    } finally {
      setRecLoading(false);
    }
  };

  const handleCancelOrder = async (orderId: number) => {
    if (!confirm("Are you sure you want to cancel this order?")) return;
    try {
      const token = localStorage.getItem("token");
      await axios.put(
        `${API_URL}/orders/${orderId}/cancel`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      fetchOrders();
      toast.success('Order cancelled successfully');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to cancel order');
    }
  };

  const formatDate = (dateStr: string) =>
    new Date(dateStr).toLocaleDateString("en-US", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });

  const getProductImage = (order: Order) =>
    order.items?.[0]
      ? productImages[order.items[0].image] || order.items[0].image
      : "/kit.png";

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center mt-20">
        <div className="w-12 h-12 border-4 border-[#3F51B5] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="bg-gray-50 min-h-screen mt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 md:py-8">

        {/* ── Header ── */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-6">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-900 transition-colors self-start sm:self-auto"
          >
            <ArrowLeft size={16} /> Back
          </button>

          <h1 className="text-xl sm:text-2xl font-semibold text-gray-900">Your Orders</h1>

          {/* Filter dropdown */}
          <div className="relative self-end sm:self-auto">
            <button
              onClick={() => setShowFilterMenu(!showFilterMenu)}
              className="flex items-center gap-2 bg-[#3F51B5] hover:bg-[#2c3a8c] text-white text-sm font-medium px-3 sm:px-4 py-2 rounded-lg transition-colors"
            >
              {filterOptions.find((o) => o.value === filter)?.label}
              <ChevronDown size={14} className={showFilterMenu ? "rotate-180 transition-transform" : "transition-transform"} />
            </button>
            {showFilterMenu && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setShowFilterMenu(false)} />
                <div className="absolute right-0 top-full mt-1 bg-white border border-gray-100 rounded-xl shadow-lg z-20 w-44 py-1 overflow-hidden">
                  {filterOptions.map((opt) => (
                    <button
                      key={opt.value}
                      onClick={() => { setFilter(opt.value); setShowFilterMenu(false); }}
                      className={`w-full text-left px-4 py-2.5 text-sm transition-colors ${
                        filter === opt.value
                          ? "text-gray-900 font-medium bg-blue-50"
                          : "text-gray-700 hover:bg-gray-50"
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>

        {/* ── Empty State ── */}
        {orders.length === 0 ? (
          <div className="bg-white border border-gray-100 rounded-xl p-8 sm:p-12 text-center">
            <Package size={40} className="mx-auto text-gray-300 mb-4" />
            <p className="text-gray-500 text-base mb-6">No orders found for this period</p>
            <Link
              to="/products"
              className="inline-block bg-[#3F51B5] hover:bg-[#2c3a8c] text-white text-sm font-medium px-6 py-2.5 rounded-lg transition-colors"
            >
              Start Shopping
            </Link>
          </div>
        ) : (
          /* ── Orders List ── */
          <div className="space-y-4">
            {orders.map((order) => {
              const statusCfg = STATUS_CONFIG[order.status] || STATUS_CONFIG.pending;
              const canCancel = !["cancelled", "delivered"].includes(order.status);

              return (
                <div
                  key={order.id}
                  className="bg-white border border-gray-100 rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow"
                >
                  {/* Order meta header - Responsive grid */}
                  <div className="bg-gray-50 border-b border-gray-100 px-4 sm:px-5 py-3 grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                    <div>
                      <p className="text-gray-400 font-medium mb-0.5">Order placed</p>
                      <p className="text-gray-700 font-medium text-xs sm:text-sm">{formatDate(order.created_at)}</p>
                    </div>
                    <div>
                      <p className="text-gray-400 font-medium mb-0.5">Total</p>
                      <p className="text-gray-700 font-medium text-xs sm:text-sm">${Number(order.total_amount).toFixed(2)}</p>
                    </div>
                    <div className="col-span-2 sm:col-span-1">
                      <p className="text-gray-400 font-medium mb-0.5">Ship to</p>
                      <p className="text-gray-700 font-medium truncate text-xs sm:text-sm">
                        {order.shipping_address || "Same as billing"}
                      </p>
                    </div>
                    <div className="text-left sm:text-right col-span-2 sm:col-span-1">
                      <p className="text-gray-500 font-medium mb-0.5 text-xs">Order #{order.id}</p>
                      <button className="text-gray-900 hover:underline text-xs">
                        Invoice
                      </button>
                    </div>
                  </div>

                  {/* Order body - Responsive flex */}
                  <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 p-4 sm:p-5">
                    {/* Product image */}
                    <div className="w-20 h-20 bg-gray-50 rounded-lg flex items-center justify-center flex-shrink-0 border border-gray-100">
                      <img
                        src={getProductImage(order)}
                        alt="product"
                        className="w-full h-full object-contain p-1"
                        onError={(e) => { (e.target as HTMLImageElement).src = "/kit.png"; }}
                      />
                    </div>

                    {/* Status + name */}
                    <div className="flex-1 min-w-0">
                      <div className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full mb-2 ${statusCfg.color} ${statusCfg.bg}`}>
                        {statusCfg.icon}
                        {statusCfg.label}
                      </div>
                      <p className="text-sm font-medium text-gray-900 leading-snug truncate">
                        {order.items?.[0]?.name || "Mixed Items"}
                      </p>
                      {order.items && order.items.length > 1 && (
                        <p className="text-xs text-gray-400 mt-0.5">
                          +{order.items.length - 1} more item{order.items.length > 2 ? "s" : ""}
                        </p>
                      )}
                    </div>

                    {/* Action buttons - Responsive row/column */}
                    <div className="flex flex-row sm:flex-col gap-2 flex-shrink-0 w-full sm:w-auto mt-4 sm:mt-0">
                      <button className="flex-1 sm:flex-none bg-[#3F51B5] hover:bg-[#2c3a8c] text-white text-xs font-medium px-4 sm:px-5 py-2 rounded-lg transition-colors">
                        Track package
                      </button>

                      {canCancel && (
                        <button
                          onClick={() => handleCancelOrder(order.id)}
                          className="flex-1 sm:flex-none border border-gray-200 text-gray-600 hover:bg-gray-50 text-xs font-medium px-4 sm:px-5 py-2 rounded-lg transition-colors hover:text-red-600 hover:border-red-200"
                        >
                          Cancel order
                        </button>
                      )}

                      <Link
                        to={`/product/${order.items?.[0]?.product_id || 1}`}
                        className="flex-1 sm:flex-none border border-gray-200 text-gray-600 hover:bg-gray-50 text-xs font-medium px-4 sm:px-5 py-2 rounded-lg transition-colors text-center hover:text-gray-900 hover:border-[#3F51B5]"
                      >
                        Buy it again
                      </Link>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

{/* ── Recommended Section ── */}
        <div className="mt-10">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 mb-5">
            <h2 className="text-base sm:text-lg font-semibold text-gray-900 text-center sm:text-left">
              Recommended based on your purchase
            </h2>
            <Link
              to="/products"
              className="text-sm border border-gray-200 rounded-lg px-4 py-2 text-gray-600 hover:bg-gray-50 hover:text-gray-900 hover:border-[#3F51B5] transition-all duration-200 text-center w-full sm:w-auto"
            >
              Continue shopping
            </Link>
          </div>

          {recLoading ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 sm:gap-4">
              {[1,2,3,4,5].map(i => (
                <div key={i} className="bg-white border border-gray-100 rounded-xl overflow-hidden animate-pulse">
                  <div className="h-24 sm:h-28 bg-gray-100"></div>
                  <div className="p-2 space-y-2">
                    <div className="h-3 bg-gray-100 rounded"></div>
                    <div className="h-3 bg-gray-100 rounded w-1/2"></div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 sm:gap-4">
              {recommended.length > 0 ? recommended.map((item) => (
                <Link
                  key={item.id}
                  to={`/product/${item.id}`}
                  className="bg-white border border-gray-100 rounded-xl overflow-hidden cursor-pointer group hover:-translate-y-0.5 hover:shadow-md hover:shadow-[#3F51B5]/10 hover:border-[#3F51B5] transition-all duration-200"
                >
                  <div className="h-24 sm:h-28 bg-gray-50 flex items-center justify-center p-2">
                    <img
                      src={item.image || '/kit.png'}
                      alt="Product"
                      className="h-full w-full object-contain group-hover:scale-105 transition-transform duration-200"
                      onError={(e) => { (e.target as HTMLImageElement).src = "/kit.png"; }}
                    />
                  </div>
                  <div className="p-2">
                    <p className="text-[10px] sm:text-[11px] text-gray-700 leading-snut line-clamp-2 mb-2 group-hover:text-gray-900 transition-colors">
                      {item.name}
                    </p>
                    <div className="flex gap-1 mb-1 flex-wrap">
                      {item.discount > 0 && (
                        <span className="bg-[#3F51B5] text-white text-[8px] sm:text-[10px] font-semibold px-1 py-0.5 rounded">
                          {Math.round(item.discount)}% off
                        </span>
                      )}
                    </div>
                    <div className="flex items-baseline gap-1">
                      <span className="text-xs sm:text-sm font-semibold text-gray-900">${item.price}</span>
                      {item.old_price > item.price && (
                        <span className="text-[9px] sm:text-[11px] text-gray-400 line-through">${item.old_price}</span>
                      )}
                    </div>
                  </div>
                </Link>
              )) : (
                <Link
                  key="more"
                  to="/products"
                  className="col-span-2 sm:col-span-3 md:col-span-4 lg:col-span-5 flex items-center justify-center h-28 bg-gray-50 rounded-xl border border-dashed border-gray-200 text-gray-500 hover:text-gray-900 hover:border-[#3F51B5] transition-colors"
                >
                  View more products →
                </Link>
              )}
            </div>
          )}
        </div>

          {/* Responsive grid: 2 → 3 → 5 columns */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 sm:gap-4">
            {RECOMMENDED.map((item) => (
              <Link
                key={item}
                to={`/product/${item}`}
                className="bg-white border border-gray-100 rounded-xl overflow-hidden cursor-pointer group hover:-translate-y-0.5 hover:shadow-md hover:shadow-[#3F51B5]/10 hover:border-[#3F51B5] transition-all duration-200"
              >
                <div className="h-24 sm:h-28 bg-gray-50 flex items-center justify-center p-2">
                  <img
                    src="/bat1.png"
                    alt="Product"
                    className="h-full w-full object-contain group-hover:scale-105 transition-transform duration-200"
                    onError={(e) => { (e.target as HTMLImageElement).src = "/kit.png"; }}
                  />
                </div>
                <div className="p-2">
                  <p className="text-[10px] sm:text-[11px] text-gray-700 leading-snug line-clamp-2 mb-2 group-hover:text-gray-900 transition-colors">
                    SS TON Range TON Maximus Kashmir Willow Cricket Bat
                  </p>
                  <div className="flex gap-1 mb-1 flex-wrap">
                    <span className="bg-[#3F51B5] text-white text-[8px] sm:text-[10px] font-semibold px-1 py-0.5 rounded">
                      65% off
                    </span>
                    <span className="bg-orange-500 text-white text-[8px] sm:text-[10px] font-semibold px-1 py-0.5 rounded">
                      Deal of the Day
                    </span>
                  </div>
                  <div className="flex items-baseline gap-1">
                    <span className="text-xs sm:text-sm font-semibold text-gray-900">$100</span>
                    <span className="text-[9px] sm:text-[11px] text-gray-400 line-through">$190</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>

      </div>
  );
}