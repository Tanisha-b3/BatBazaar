import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import { API_URL } from '../config';

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

interface CartItem {
  id: number;
  product_id: number;
  name: string;
  price: number;
  old_price: number;
  image: string;
  quantity: number;
}

interface Address {
  id?: number;
  label?: string;
  is_default?: boolean;
  full_name?: string;
  name: string;
  phone?: string;
  mobile: string;
  email: string;
  address_line1?: string;
  flat: string;
  address_line2?: string;
  area: string;
  city: string;
  state: string;
  pincode: string;
  country: string;
}

const indianStates = [
  'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh',
  'Goa', 'Gujarat', 'Haryana', 'Himachal Pradesh', 'Jharkhand',
  'Karnataka', 'Kerala', 'Madhya Pradesh', 'Maharashtra', 'Manipur',
  'Meghalaya', 'Mizoram', 'Nagaland', 'Odisha', 'Punjab',
  'Rajasthan', 'Sikkim', 'Tamil Nadu', 'Telangana', 'Tripura',
  'Uttar Pradesh', 'Uttarakhand', 'West Bengal', 'Delhi',
];

type PaymentMethod = 'card' | 'netbanking' | 'cod';

// Check if an address has all required fields filled
function isAddressComplete(addr: Address): boolean {
  return !!(
    addr.name?.trim() &&
    addr.mobile?.trim() &&
    addr.flat?.trim() &&
    addr.area?.trim() &&
    addr.city?.trim() &&
    addr.state?.trim() &&
    addr.pincode?.trim()
  );
}

export default function Checkout() {
  const [items, setItems] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const [showEditAddress, setShowEditAddress] = useState(false);
  const [showSelectAddress, setShowSelectAddress] = useState(false);
  const [savedAddresses, setSavedAddresses] = useState<Address[]>([]);
  const [address, setAddress] = useState<Address>({
    name: '', mobile: '', email: '', flat: '', area: '', city: '', state: '', pincode: '', country: 'India', is_default: false,
  });
  const [formData, setFormData] = useState<Address>(address);
  const [giftCode, setGiftCode] = useState('');
  const [giftApplied, setGiftApplied] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('cod');
  const [orderPlaced, setOrderPlaced] = useState(false);
  const [placingOrder, setPlacingOrder] = useState(false);
  const [addressError, setAddressError] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    fetchCart();
    fetchUserAddress();
    fetchAddresses();
  }, []);

  const fetchCart = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        const savedCart = localStorage.getItem('cart');
        if (savedCart) setItems(JSON.parse(savedCart));
        setLoading(false);
        return;
      }
      const response = await axios.get(`${API_URL}/cart`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setItems(response.data.cart || []);
    } catch (error: any) {
      console.error('Error fetching cart:', error);
      toast.error(error.response?.data?.message || 'Failed to load cart');
    } finally {
      setLoading(false);
    }
  };

  const fetchUserAddress = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;
      const response = await axios.get(`${API_URL}/user`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const user = response.data.user;
      if (user) {
        const defaultAddress: Address = {
          name: user.name || '',
          mobile: user.phone || '',
          email: user.email || '',
          flat: '', area: '', city: '', state: '', pincode: '', country: 'India',
        };
        setAddress(defaultAddress);
        setFormData(defaultAddress);
      }
    } catch (error) {
      console.error('Error fetching user:', error);
    }
  };

  const fetchAddresses = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;
      const response = await axios.get(`${API_URL}/addresses`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const addrs = response.data || [];
      setSavedAddresses(addrs);
      const defaultAddr = addrs.find((a: Address) => a.is_default) || addrs[0];
      if (defaultAddr) {
        setAddress({
          name: defaultAddr.full_name || defaultAddr.name || '',
          mobile: defaultAddr.phone || defaultAddr.mobile || '',
          email: '',
          flat: defaultAddr.address_line1 || defaultAddr.flat || '',
          area: defaultAddr.address_line2 || defaultAddr.area || '',
          city: defaultAddr.city,
          state: defaultAddr.state,
          pincode: defaultAddr.pincode,
          country: defaultAddr.country || 'India',
          is_default: !!defaultAddr.is_default,
        });
      }
    } catch (error: any) {
      console.error('Error fetching addresses:', error);
      toast.error(error.response?.data?.message || 'Failed to load addresses');
    }
  };

  const handleSaveAddress = () => {
    setAddress(formData);
    setShowEditAddress(false);
  };

  const handleChange = (field: keyof Address, value: string) => {
    setFormData({ ...formData, [field]: value });
  };

  const handleGiftApply = () => {
    if (giftCode.trim()) setGiftApplied(true);
  };

  const handlePlaceOrder = async () => {
    // Address validation before placing order
    if (!isAddressComplete(address)) {
      setAddressError(true);
      // Scroll to the address section
      document.getElementById('delivery-address-section')?.scrollIntoView({ behavior: 'smooth' });
      toast.error('Please add a complete delivery address before placing your order.');
      return;
    }

    setAddressError(false);
    setPlacingOrder(true);
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        toast.error('Please login to place order');
        navigate('/login');
        return;
      }

      const orderData = {
        items: items.map(item => ({
          productId: item.id || item.product_id,
          quantity: item.quantity,
          price: item.price,
        })),
        totalAmount: subtotal,
        shippingAddress: `${address.flat}, ${address.area}, ${address.city}, ${address.state} ${address.pincode}`,
        paymentMethod,
      };

      await axios.post(`${API_URL}/orders`, orderData, {
        headers: { Authorization: `Bearer ${token}` }
      });

      await axios.delete(`${API_URL}/cart`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      localStorage.removeItem('cart');
      window.dispatchEvent(new CustomEvent('cartUpdated'));

      setOrderPlaced(true);
      toast.success('Order placed successfully!');
    } catch (error: any) {
      console.error('Error placing order:', error);
      toast.error(error.response?.data?.message || 'Failed to place order');
    } finally {
      setPlacingOrder(false);
    }
  };

  const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const originalPrice = items.reduce((sum, item) => sum + (item.old_price || item.price) * item.quantity, 0);
  const savings = originalPrice - subtotal;
  const deliveryCharges = 'Free';
  const totalPayable = subtotal;

  if (loading) {
    return (
      <div className="bg-white min-h-screen py-8 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-[#3F51B5] border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (orderPlaced) {
    return (
      <div className="bg-white min-h-screen py-8">
        <div className="max-w-lg mx-auto px-4 text-center">
          <div className="text-5xl mb-4">✓</div>
          <h1 className="text-2xl font-semibold text-gray-900 mb-2">Order Placed Successfully!</h1>
          <p className="text-gray-500 mb-6">Thank you for your order. You will receive a confirmation email shortly.</p>
          <Link to="/" className="text-gray-900 hover:underline">Continue Shopping</Link>
        </div>
      </div>
    );
  }

  if (showEditAddress) {
    return (
      <div className="bg-white min-h-screen py-8">
        <div className="max-w-2xl mx-auto px-4">
          <h1 className="text-2xl font-medium text-gray-900 mb-6">Edit your address</h1>
          <div className="bg-white border border-gray-200 rounded-lg p-6 space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Country/Region</label>
              <input type="text" value={formData.country} onChange={(e) => handleChange('country', e.target.value)}
                className="w-full px-3 py-2 border border-gray-400 rounded focus:outline-none focus:border-[#3F51B5]" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Enter Full name <span className="text-red-500">*</span></label>
              <input type="text" value={formData.name} onChange={(e) => handleChange('name', e.target.value)}
                className="w-full px-3 py-2 border border-gray-400 rounded focus:outline-none focus:border-[#3F51B5]" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Mobile number <span className="text-red-500">*</span></label>
              <input type="tel" value={formData.mobile} onChange={(e) => handleChange('mobile', e.target.value)}
                className="w-full px-3 py-2 border border-gray-400 rounded focus:outline-none focus:border-[#3F51B5]" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Enter email</label>
              <input type="email" value={formData.email} onChange={(e) => handleChange('email', e.target.value)}
                className="w-full px-3 py-2 border border-gray-400 rounded focus:outline-none focus:border-[#3F51B5]" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Flat, House no, Building <span className="text-red-500">*</span></label>
              <input type="text" value={formData.flat} onChange={(e) => handleChange('flat', e.target.value)}
                className="w-full px-3 py-2 border border-gray-400 rounded focus:outline-none focus:border-[#3F51B5]" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Area, Street, Sector <span className="text-red-500">*</span></label>
              <input type="text" value={formData.area} onChange={(e) => handleChange('area', e.target.value)}
                className="w-full px-3 py-2 border border-gray-400 rounded focus:outline-none focus:border-[#3F51B5]" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">City <span className="text-red-500">*</span></label>
                <input type="text" value={formData.city} onChange={(e) => handleChange('city', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-400 rounded focus:outline-none focus:border-[#3F51B5]" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Pincode <span className="text-red-500">*</span></label>
                <input type="text" value={formData.pincode} onChange={(e) => handleChange('pincode', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-400 rounded focus:outline-none focus:border-[#3F51B5]" />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">State <span className="text-red-500">*</span></label>
              <select value={formData.state} onChange={(e) => handleChange('state', e.target.value)}
                className="w-full px-3 py-2 border border-gray-400 rounded focus:outline-none focus:border-[#3F51B5]">
                <option value="">Select State</option>
                {indianStates.map((state) => (
                  <option key={state} value={state}>{state}</option>
                ))}
              </select>
            </div>
            <div className="flex gap-4 pt-4">
              <button onClick={() => setShowEditAddress(false)}
                className="flex-1 px-4 py-2 border border-gray-300 rounded text-gray-700 hover:bg-gray-100">
                Cancel
              </button>
              <button onClick={handleSaveAddress}
                className="flex-1 px-4 py-2 bg-[#3F51B5] text-white rounded hover:bg-[#2c3a8c]">
                Save Address
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const addressMissing = !isAddressComplete(address);

  return (
    <div className="bg-white min-h-screen py-8">
      <div className="max-w-6xl mx-auto px-4">
        <button onClick={() => navigate(-1)} className="text-gray-700 font-medium mb-6 flex items-center gap-2">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back
        </button>
        <h1 className="text-3xl font-semibold text-gray-900 mb-8">Checkout</h1>

        {items.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500 mb-4">Your cart is empty</p>
            <Link to="/products" className="text-gray-900 hover:underline">Continue Shopping</Link>
          </div>
        ) : (
          <div className="flex flex-col lg:flex-row gap-6">
            {/* Left Side */}
            <div className="flex-1 space-y-6">

              {/* 1. Delivery Address */}
              <div
                id="delivery-address-section"
                className={`bg-white border rounded-lg p-5 transition-colors ${
                  addressError && addressMissing
                    ? 'border-red-400 ring-2 ring-red-200'
                    : 'border-gray-200'
                }`}
              >
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-medium text-gray-900 uppercase">1 Delivery address</h2>
                  <button
                    onClick={() => setShowSelectAddress(true)}
                    className="text-gray-900 font-medium hover:underline"
                  >
                    Change
                  </button>
                </div>

                {/* Address missing — prompt to add */}
                {addressMissing ? (
                  <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                    <div className="flex items-start gap-3">
                      {/* Warning icon */}
                      <svg className="w-5 h-5 text-amber-500 mt-0.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                          d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
                      </svg>
                      <div>
                        <p className="text-sm font-medium text-gray-800">No delivery address added</p>
                        <p className="text-xs text-gray-500 mt-0.5">
                          You need to add a complete address before placing your order.
                        </p>
                      </div>
                    </div>
                    <Link
                      to="/profile"
                      className="shrink-0 inline-flex items-center gap-1.5 px-4 py-2 bg-[#3F51B5] text-white text-sm font-medium rounded-lg hover:bg-[#2c3a8c] transition"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                      </svg>
                      Add Address
                    </Link>
                  </div>
                ) : (
                  <div className="space-y-1">
                    <p className="font-medium text-gray-900">
                      {address.name} — {address.flat}, {address.area}
                    </p>
                    <p className="text-gray-600">
                      {address.city}, {address.state} {address.pincode}
                    </p>
                    {address.mobile && (
                      <p className="text-gray-500 text-sm">📞 {address.mobile}</p>
                    )}
                  </div>
                )}

                {/* Inline error message shown after failed Place Order attempt */}
                {addressError && addressMissing && (
                  <p className="mt-3 text-sm text-red-600 flex items-center gap-1.5">
                    <svg className="w-4 h-4 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M18 10A8 8 0 11 2 10a8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd"/>
                    </svg>
                    Please add a complete delivery address to continue.
                  </p>
                )}
              </div>

              {/* 4. Add gift card */}
              <div className="bg-white border border-gray-200 rounded-lg p-5">
                <h2 className="text-lg font-medium text-gray-900 uppercase mb-4">4 Add gift card</h2>
                <div className="flex gap-0">
                  <input
                    type="text"
                    placeholder="enter code"
                    value={giftCode}
                    onChange={(e) => setGiftCode(e.target.value)}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-l focus:outline-none focus:border-[#3F51B5]"
                  />
                  <button onClick={handleGiftApply}
                    className="px-4 py-2 bg-[#3F51B5] text-white rounded-r hover:bg-[#2c3a8c] font-medium">
                    Apply
                  </button>
                </div>
                {giftApplied && (
                  <p className="text-green-600 text-sm mt-2">Gift card applied successfully!</p>
                )}
              </div>

              {/* 5. Payment options */}
              <div className="bg-white border border-gray-200 rounded-lg p-5">
                <h2 className="text-lg font-medium text-gray-900 uppercase mb-4">5 Payment options</h2>
                <div className="space-y-3">
                  {(['card', 'netbanking', 'cod'] as PaymentMethod[]).map((method) => (
                    <label
                      key={method}
                      className={`flex items-center gap-3 p-4 border rounded-lg cursor-pointer ${
                        paymentMethod === method ? 'border-[#3F51B5] bg-blue-50' : 'border-gray-200'
                      }`}
                    >
                      <input
                        type="radio"
                        name="payment"
                        checked={paymentMethod === method}
                        onChange={() => setPaymentMethod(method)}
                        className="w-4 h-4"
                      />
                      <span className="font-medium">
                        {method === 'card' && 'Pay with Debit/Credit/ATM cards'}
                        {method === 'netbanking' && 'Net Banking'}
                        {method === 'cod' && 'Cash On Delivery'}
                      </span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Order Summary */}
              <div className="bg-white border border-gray-200 rounded-lg p-5">
                <h2 className="text-lg font-medium text-gray-900 uppercase mb-4">Order summary</h2>
                {items.map((item) => (
                  <div key={item.id || item.product_id} className="flex gap-4">
                    <div className="w-40 h-40 bg-gray-50 rounded-lg flex items-center justify-center p-2">
                      <img
                        src={productImages[item.image] || item.image || '/bat1.png'}
                        alt={item.name}
                        className="max-w-full max-h-full object-contain"
                        onError={(e) => { (e.target as HTMLImageElement).src = '/bat1.png'; }}
                      />
                    </div>
                    <div className="flex-1 space-y-2">
                      <h3 className="text-base font-medium text-gray-900 line-clamp-2">{item.name}</h3>
                      <p className="text-sm text-gray-500">Delivery in 2 days</p>
                      <div className="flex items-center gap-2">
                        <span className="text-base text-gray-500 line-through">${item.old_price}</span>
                        <span className="text-lg font-semibold text-gray-900">$ {item.price}</span>
                      </div>
                      <div className="flex items-center gap-2 pt-2">
                        <button onClick={() => setQuantity(Math.max(1, quantity - 1))}
                          className="w-7 h-7 border border-gray-300 rounded flex items-center justify-center hover:bg-gray-100">−</button>
                        <span className="w-8 text-center font-medium">{quantity}</span>
                        <button onClick={() => setQuantity(quantity + 1)}
                          className="w-7 h-7 border border-gray-300 rounded flex items-center justify-center hover:bg-gray-100 bg-gray-200">+</button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <p className="text-sm text-gray-500">
                Order confirmation email will be sent to {address.email}
              </p>
            </div>

            {/* Right Side — Price Details */}
            <div className="lg:w-80">
              <div className="bg-white border border-gray-200 rounded-lg p-5 sticky top-4">
                <h2 className="text-xl font-medium text-gray-500 mb-4">Price Detail</h2>

                <div className="border-t border-b border-gray-200 py-4 space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Price ({items.length} items)</span>
                    <span className="text-gray-900">${subtotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Delivery Charges</span>
                    <span className="text-green-600 font-medium">{deliveryCharges}</span>
                  </div>
                </div>

                <div className="border-b border-gray-200 py-4">
                  <div className="flex justify-between">
                    <span className="font-medium text-gray-900">Total Payable</span>
                    <span className="font-medium text-gray-900">${totalPayable.toFixed(2)}</span>
                  </div>
                </div>

                <div className="pt-4">
                  <p className="text-green-700 font-medium text-sm">
                    Your Total Saving on this order ${savings.toFixed(2)}
                  </p>
                </div>

                {/* Address missing — compact warning inside price box */}
                {addressMissing && (
                  <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-lg flex items-start gap-2">
                    <svg className="w-4 h-4 text-amber-600 mt-0.5 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd"/>
                    </svg>
                    <div>
                      <p className="text-xs font-medium text-amber-800">Address required</p>
                      <Link to="/profile" className="text-xs text-[#3F51B5] hover:underline font-medium">
                        Add address in Profile →
                      </Link>
                    </div>
                  </div>
                )}

                <button
                  onClick={handlePlaceOrder}
                  disabled={placingOrder}
                  className={`w-full py-3 rounded mt-4 font-medium flex items-center justify-center gap-2 transition-colors ${
                    addressMissing
                      ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                      : 'bg-[#3F51B5] text-white hover:bg-[#2c3a8c]'
                  } disabled:opacity-50`}
                >
                  {placingOrder ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      Processing...
                    </>
                  ) : addressMissing ? (
                    'Add Address to Continue'
                  ) : (
                    'Place Order'
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Address Selection Dialog */}
      {showSelectAddress && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-gray-900">Select Delivery Address</h2>
                <div className="flex items-center gap-3">
                  <Link
                    to="/profile"
                    onClick={() => setShowSelectAddress(false)}
                    className="text-sm text-[#3F51B5] font-medium hover:underline"
                  >
                    Manage addresses
                  </Link>
                  <button onClick={() => setShowSelectAddress(false)} className="text-gray-400 hover:text-gray-600 text-2xl">×</button>
                </div>
              </div>

              {savedAddresses.length === 0 ? (
                <div className="text-center py-8">
                  <div className="w-14 h-14 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg className="w-7 h-7 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                        d="M17.657 16.657L13.414 20.9a2 2 0 01-2.828 0L6.343 16.657a8 8 0 1111.314 0z"/>
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/>
                    </svg>
                  </div>
                  <p className="text-gray-700 font-medium mb-1">No saved addresses</p>
                  <p className="text-sm text-gray-400 mb-5">
                    Add a delivery address from your Profile page to place orders.
                  </p>
                  <Link
                    to="/profile"
                    onClick={() => setShowSelectAddress(false)}
                    className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#3F51B5] text-white text-sm font-medium rounded-lg hover:bg-[#2c3a8c] transition"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4"/>
                    </svg>
                    Add New Address
                  </Link>
                </div>
              ) : (
                <div className="space-y-3">
                  {savedAddresses.map(addr => (
                    <div
                      key={addr.id || addr.pincode}
                      onClick={() => {
                        setAddress({
                          name: addr.full_name ?? addr.name ?? '',
                          mobile: addr.phone ?? addr.mobile ?? '',
                          email: '',
                          flat: addr.address_line1 ?? addr.flat ?? '',
                          area: addr.address_line2 ?? addr.area ?? '',
                          city: addr.city,
                          state: addr.state,
                          pincode: addr.pincode,
                          country: addr.country,
                        });
                        setAddressError(false);
                        setShowSelectAddress(false);
                      }}
                      className={`border rounded-lg p-4 cursor-pointer hover:shadow-md transition-all ${
                        addr.is_default ? 'border-[#3F51B5] bg-blue-50' : 'border-gray-200'
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-medium text-gray-900">{addr.label}</span>
                            {addr.is_default && (
                              <span className="text-xs bg-[#3F51B5] text-white px-2 py-0.5 rounded">Default</span>
                            )}
                          </div>
                          <p className="text-sm text-gray-700">{addr.full_name}</p>
                          <p className="text-sm text-gray-700">
                            {addr.address_line1}{addr.address_line2 && <>, {addr.address_line2}</>}
                          </p>
                          <p className="text-sm text-gray-700">{addr.city}, {addr.state} — {addr.pincode}</p>
                          <p className="text-sm text-gray-500">📞 {addr.phone}</p>
                        </div>
                        <span className="text-sm text-[#3F51B5] font-medium">Select</span>
                      </div>
                    </div>
                  ))}

                  {/* Add new address link inside list */}
                  <Link
                    to="/profile"
                    onClick={() => setShowSelectAddress(false)}
                    className="flex items-center gap-2 w-full px-4 py-3 border-2 border-dashed border-gray-300 rounded-lg text-sm text-gray-600 hover:border-[#3F51B5] hover:text-[#3F51B5] transition"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4"/>
                    </svg>
                    Add new address
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}