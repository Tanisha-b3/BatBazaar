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
        if (savedCart) {
          setItems(JSON.parse(savedCart));
        }
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
          flat: '',
          area: '',
          city: '',
          state: '',
          pincode: '',
          country: 'India'
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
      const response = await axios.get(`${API_URL}/addresses`, { headers: { Authorization: `Bearer ${token}` } });
      const addrs = response.data || [];
      setSavedAddresses(addrs);
      const defaultAddr = addrs.find((a: Address) => a.is_default) || addrs[0];
      if (defaultAddr) {
        setAddress({ name: defaultAddr.full_name || defaultAddr.name || '', mobile: defaultAddr.phone || defaultAddr.mobile || '', email: '', flat: defaultAddr.address_line1 || defaultAddr.flat || '', area: defaultAddr.address_line2 || defaultAddr.area || '', city: defaultAddr.city, state: defaultAddr.state, pincode: defaultAddr.pincode, country: defaultAddr.country || 'India', is_default: !!defaultAddr.is_default });
      }
    } catch (error: any) {
      console.error('Error fetching addresses:', error);
      toast.error(error.response?.data?.message || 'Failed to load addresses');
    }
  };

  // const handleEditClick = () => {
  //   setFormData(address);
  //   setShowEditAddress(true);
  // };

  const handleSaveAddress = () => {
    setAddress(formData);
    setShowEditAddress(false);
  };

  const handleChange = (field: keyof Address, value: string) => {
    setFormData({ ...formData, [field]: value });
  };

  const handleGiftApply = () => {
    if (giftCode.trim()) {
      setGiftApplied(true);
    }
  };

  const handlePlaceOrder = async () => {
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
          price: item.price
        })),
        totalAmount: subtotal,
        shippingAddress: `${address.flat}, ${address.area}, ${address.city}, ${address.state} ${address.pincode}`,
        paymentMethod
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
          <Link to="/" className="text-gray-900 hover:underline">
            Continue Shopping
          </Link>
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
              <input
                type="text"
                value={formData.country}
                onChange={(e) => handleChange('country', e.target.value)}
                className="w-full px-3 py-2 border border-gray-400 rounded focus:outline-none focus:border-[#3F51B5]"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Enter Full name</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => handleChange('name', e.target.value)}
                className="w-full px-3 py-2 border border-gray-400 rounded focus:outline-none focus:border-[#3F51B5]"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Mobile number</label>
              <input
                type="tel"
                value={formData.mobile}
                onChange={(e) => handleChange('mobile', e.target.value)}
                className="w-full px-3 py-2 border border-gray-400 rounded focus:outline-none focus:border-[#3F51B5]"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Enter email</label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => handleChange('email', e.target.value)}
                className="w-full px-3 py-2 border border-gray-400 rounded focus:outline-none focus:border-[#3F51B5]"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Flat, House no, Building</label>
              <input
                type="text"
                value={formData.flat}
                onChange={(e) => handleChange('flat', e.target.value)}
                className="w-full px-3 py-2 border border-gray-400 rounded focus:outline-none focus:border-[#3F51B5]"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Area, Street, Sector</label>
              <input
                type="text"
                value={formData.area}
                onChange={(e) => handleChange('area', e.target.value)}
                className="w-full px-3 py-2 border border-gray-400 rounded focus:outline-none focus:border-[#3F51B5]"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">City</label>
                <input
                  type="text"
                  value={formData.city}
                  onChange={(e) => handleChange('city', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-400 rounded focus:outline-none focus:border-[#3F51B5]"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Pincode</label>
                <input
                  type="text"
                  value={formData.pincode}
                  onChange={(e) => handleChange('pincode', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-400 rounded focus:outline-none focus:border-[#3F51B5]"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">State</label>
              <select
                value={formData.state}
                onChange={(e) => handleChange('state', e.target.value)}
                className="w-full px-3 py-2 border border-gray-400 rounded focus:outline-none focus:border-[#3F51B5]"
              >
                <option value="">Select State</option>
                {indianStates.map((state) => (
                  <option key={state} value={state}>{state}</option>
                ))}
              </select>
            </div>
            <div className="flex gap-4 pt-4">
              <button
                onClick={() => setShowEditAddress(false)}
                className="flex-1 px-4 py-2 border border-gray-300 rounded text-gray-700 hover:bg-gray-100"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveAddress}
                className="flex-1 px-4 py-2 bg-[#3F51B5] text-white rounded hover:bg-[#2c3a8c]"
              >
                Save Address
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

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
            <Link to="/products" className="text-gray-900 hover:underline">
              Continue Shopping
            </Link>
          </div>
        ) : (
          <div className="flex flex-col lg:flex-row gap-6">
            {/* Left Side - Main Content */}
            <div className="flex-1 space-y-6">
              {/* 1. Delivery Address */}
              <div className="bg-white border border-gray-200 rounded-lg p-5">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-medium text-gray-900 uppercase">1 Delivery address</h2>
                  <button onClick={() => setShowSelectAddress(true)} className="text-gray-900 font-medium hover:underline">
                    Change
                  </button>
                </div>
                <div className="space-y-1">
                  <p className="font-medium text-gray-900">
                    {address.name} {address.flat}, {address.area}
                  </p>
                  <p className="text-gray-600">
                    {address.city}, {address.state} {address.pincode}
                  </p>
                </div>
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
                  <button
                    onClick={handleGiftApply}
                    className="px-4 py-2 bg-[#3F51B5] text-white rounded-r hover:bg-[#2c3a8c] font-medium"
                  >
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
                  <label
                    className={`flex items-center gap-3 p-4 border rounded-lg cursor-pointer ${
                      paymentMethod === 'card' ? 'border-[#3F51B5] bg-blue-50' : 'border-gray-200'
                    }`}
                  >
                    <input
                      type="radio"
                      name="payment"
                      checked={paymentMethod === 'card'}
                      onChange={() => setPaymentMethod('card')}
                      className="w-4 h-4"
                    />
                    <span className="font-medium">Pay with Debit/Credit/ATM cards</span>
                  </label>

                  <label
                    className={`flex items-center gap-3 p-4 border rounded-lg cursor-pointer ${
                      paymentMethod === 'netbanking' ? 'border-[#3F51B5] bg-blue-50' : 'border-gray-200'
                    }`}
                  >
                    <input
                      type="radio"
                      name="payment"
                      checked={paymentMethod === 'netbanking'}
                      onChange={() => setPaymentMethod('netbanking')}
                      className="w-4 h-4"
                    />
                    <span className="font-medium">Net Banking</span>
                  </label>

                  <label
                    className={`flex items-center gap-3 p-4 border rounded-lg cursor-pointer ${
                      paymentMethod === 'cod' ? 'border-[#3F51B5] bg-blue-50' : 'border-gray-200'
                    }`}
                  >
                    <input
                      type="radio"
                      name="payment"
                      checked={paymentMethod === 'cod'}
                      onChange={() => setPaymentMethod('cod')}
                      className="w-4 h-4"
                    />
                    <span className="font-medium">Cash On Delivery</span>
                  </label>
                </div>
              </div>

              {/* 2. Order Summary */}
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
                        <button
                          onClick={() => setQuantity(Math.max(1, quantity - 1))}
                          className="w-7 h-7 border border-gray-300 rounded flex items-center justify-center hover:bg-gray-100"
                        >
                          −
                        </button>
                        <span className="w-8 text-center font-medium">{quantity}</span>
                        <button
                          onClick={() => setQuantity(quantity + 1)}
                          className="w-7 h-7 border border-gray-300 rounded flex items-center justify-center hover:bg-gray-100 bg-gray-200"
                        >
                          +
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <p className="text-sm text-gray-500">
                Order confirmation email will be sent to {address.email}
              </p>
            </div>

            {/* Right Side - Price Details */}
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

                <button
                  onClick={handlePlaceOrder}
                  disabled={placingOrder}
                  className="w-full bg-[#3F51B5] text-white py-3 rounded mt-6 font-medium hover:bg-[#2c3a8c] disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {placingOrder ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      Processing...
                    </>
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
                  <p className="text-gray-500 mb-4">No saved addresses</p>
                  <p className="text-sm text-gray-400 mb-4">Add addresses from your Profile page</p>
                  <Link
                    to="/profile"
                    onClick={() => setShowSelectAddress(false)}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-[#3F51B5] text-white text-sm font-medium rounded-lg hover:bg-[#2c3a8c] transition"
                  >
                    Go to Profile
                  </Link>
                </div>
              ) : (
                <div className="space-y-3">
                  {savedAddresses.map(addr => (
                    <div
                      key={addr.id || addr.pincode}
                      onClick={() => {
                        setAddress({ name: addr.full_name ?? addr.name ?? '', mobile: addr.phone ?? addr.mobile ?? '', email: '', flat: addr.address_line1 ?? addr.flat ?? '', area: addr.address_line2 ?? addr.area ?? '', city: addr.city, state: addr.state, pincode: addr.pincode, country: addr.country });
                        setShowSelectAddress(false);
                      }}
                      className={`border rounded-lg p-4 cursor-pointer hover:shadow-md transition-all ${addr.is_default ? 'border-[#3F51B5] bg-blue-50' : 'border-gray-200'}`}
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-medium text-gray-900">{addr.label}</span>
                            {addr.is_default && <span className="text-xs bg-[#3F51B5] text-white px-2 py-0.5 rounded">Default</span>}
                          </div>
                          <p className="text-sm text-gray-700">{addr.full_name}</p>
                          <p className="text-sm text-gray-700">{addr.address_line1}{addr.address_line2 && <>, {addr.address_line2}</>}</p>
                          <p className="text-sm text-gray-700">{addr.city}, {addr.state} — {addr.pincode}</p>
                          <p className="text-sm text-gray-500">📞 {addr.phone}</p>
                        </div>
                        <span className="text-sm text-[#3F51B5] font-medium">Select</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}