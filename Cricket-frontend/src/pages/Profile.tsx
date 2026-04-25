import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import { API_URL } from '../config';

interface UserInfo {
  name: string;
  email: string;
  phone: string;
}

interface Address {
  id: number;
  label: string;
  full_name: string;
  phone: string;
  address_line1: string;
  address_line2?: string;
  city: string;
  state: string;
  pincode: string;
  country: string;
  is_default: boolean;
}

function AddressDialog({
  address,
  form,
  setForm,
  onSave,
  onCancel,
  saving,
}: {
  address: Address | null;
  form: Address;
  setForm: (f: Address) => void;
  onSave: () => void;
  onCancel: () => void;
  saving: boolean;
}) {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-gray-900">
              {address ? 'Edit Address' : 'Add New Address'}
            </h2>
            <button onClick={onCancel} className="text-gray-400 hover:text-gray-600 text-2xl">×</button>
          </div>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Address Type</label>
              <select
                value={form.label}
                onChange={(e) => setForm({ ...form, label: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:border-blue-500"
              >
                <option value="Home">Home</option>
                <option value="Office">Office</option>
                <option value="Work">Work</option>
                <option value="Other">Other</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Full Name *</label>
              <input type="text" value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:border-blue-500" placeholder="Enter full name" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number *</label>
              <input type="tel" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:border-blue-500" placeholder="Enter phone number" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Address Line 1 *</label>
              <input type="text" value={form.address_line1} onChange={(e) => setForm({ ...form, address_line1: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:border-blue-500" placeholder="Flat, House no, Building" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Address Line 2</label>
              <input type="text" value={form.address_line2} onChange={(e) => setForm({ ...form, address_line2: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:border-blue-500" placeholder="Area, Street, Sector" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">City *</label>
                <input type="text" value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:border-blue-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">State *</label>
                <input type="text" value={form.state} onChange={(e) => setForm({ ...form, state: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:border-blue-500" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Pincode *</label>
                <input type="text" value={form.pincode} onChange={(e) => setForm({ ...form, pincode: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:border-blue-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Country</label>
                <input type="text" value={form.country} onChange={(e) => setForm({ ...form, country: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:border-blue-500" />
              </div>
            </div>
            <label className="flex items-center gap-2">
              <input type="checkbox" checked={form.is_default} onChange={(e) => setForm({ ...form, is_default: e.target.checked })}
                className="rounded border-gray-300 text-[#3F51B5] focus:ring-[#3F51B5]" />
              <span className="text-sm text-gray-600">Set as default address</span>
            </label>
            <div className="flex gap-4 pt-4">
              <button onClick={onCancel} disabled={saving}
                className="flex-1 px-4 py-2 border border-gray-300 rounded text-gray-700 hover:bg-gray-100 disabled:opacity-50">
                Cancel
              </button>
              <button onClick={onSave} disabled={saving}
                className="flex-1 px-4 py-2 bg-[#3F51B5] text-white rounded hover:bg-[#2c3a8c] disabled:opacity-50 flex items-center justify-center gap-2">
                {saving ? (<><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>Saving...</>) : (address ? 'Update Address' : 'Save Address')}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function Profile() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [user, setUser] = useState<UserInfo | null>(null);
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [addressesLoading, setAddressesLoading] = useState(false);
  const navigate = useNavigate();

  const [activeSection, setActiveSection] = useState<string | null>(null);
  const [editData, setEditData] = useState<UserInfo>({ name: '', phone: '', email: '' });
  const [showAddressDialog, setShowAddressDialog] = useState(false);
  const [editingAddress, setEditingAddress] = useState<Address | null>(null);
  const [addressForm, setAddressForm] = useState<Address>({
    id: 0, label: 'Home', full_name: '', phone: '', address_line1: '', address_line2: '',
    city: '', state: '', pincode: '', country: 'India', is_default: false,
  });

  useEffect(() => { fetchUser(); fetchAddresses(); }, []);

  const fetchUser = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) { navigate('/login'); return; }
      const response = await axios.get(`${API_URL}/auth/user`, { headers: { Authorization: `Bearer ${token}` } });
      setUser(response.data.user);
      setEditData({ name: response.data.user.name || '', phone: response.data.user.phone || '', email: response.data.user.email || '' });
    } catch (err: any) {
      if (err.response?.status === 401) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        navigate('/login');
      }
    } finally {
      setLoading(false);
    }
  };

  const fetchAddresses = async () => {
    setAddressesLoading(true);
    try {
      const token = localStorage.getItem('token');
      if (!token) return;
      const response = await axios.get(`${API_URL}/addresses`, { headers: { Authorization: `Bearer ${token}` } });
      setAddresses(response.data || []);
    } catch (err: any) {
      if (err.response?.status === 401) toast.error('Please login again');
    } finally {
      setAddressesLoading(false);
    }
  };

  const handleEditProfile = () => {
    if (user) setEditData({ name: user.name, phone: user.phone || user.phone, email: user.email });
    setActiveSection('profile');
  };

  const handleAddAddress = () => {
    setEditingAddress(null);
    setAddressForm({ id: 0, label: 'Home', full_name: '', phone: user?.phone || '', address_line1: '', address_line2: '',
      city: '', state: '', pincode: '', country: 'India', is_default: addresses.length === 0 });
    setShowAddressDialog(true);
  };

  const handleEditAddress = (addr: Address) => {
    setEditingAddress(addr);
    setAddressForm({ ...addr });
    setShowAddressDialog(true);
  };

  const handleSaveProfile = async () => {
    if (!editData.name.trim()) { toast.error('Name is required'); return; }
    setSaving(true);
    try {
      const token = localStorage.getItem('token');
      await axios.put(`${API_URL}/auth/user`, { name: editData.name, phone: editData.phone }, { headers: { Authorization: `Bearer ${token}` } });
      setUser({ ...user!, name: editData.name, phone: editData.phone, email: editData.email });
      const storedUser = JSON.parse(localStorage.getItem('user') || '{}');
      localStorage.setItem('user', JSON.stringify({ ...storedUser, name: editData.name, phone: editData.phone }));
      toast.success('Profile updated successfully');
      setActiveSection(null);
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  const handleSaveAddress = async () => {
    if (!addressForm.full_name.trim() || !addressForm.phone.trim() || !addressForm.address_line1.trim() ||
        !addressForm.city.trim() || !addressForm.state.trim() || !addressForm.pincode.trim()) {
      toast.error('Please fill all required fields'); return;
    }
    setSaving(true);
    try {
      const token = localStorage.getItem('token');
      if (editingAddress) {
        await axios.put(`${API_URL}/addresses/${editingAddress.id}`, addressForm, { headers: { Authorization: `Bearer ${token}` } });
        toast.success('Address updated successfully');
      } else {
        await axios.post(`${API_URL}/addresses`, addressForm, { headers: { Authorization: `Bearer ${token}` } });
        toast.success('Address added successfully');
      }
      setShowAddressDialog(false);
      fetchAddresses();
    } catch (err) {
      toast.error('Failed to save address');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteAddress = async (id: number) => {
    if (!confirm('Delete this address?')) return;
    try {
      const token = localStorage.getItem('token');
      await axios.delete(`${API_URL}/addresses/${id}`, { headers: { Authorization: `Bearer ${token}` } });
      toast.success('Address deleted');
      fetchAddresses();
    } catch { toast.error('Failed to delete address'); }
  };

  const handleSetDefault = async (addr: Address) => {
    try {
      const token = localStorage.getItem('token');
      await axios.patch(`${API_URL}/addresses/${addr.id}/default`, {}, { headers: { Authorization: `Bearer ${token}` } });
      toast.success('Default address updated');
      fetchAddresses();
    } catch { toast.error('Failed to set default address'); }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  if (loading) {
    return (
      <div className="bg-white min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-[#3F51B5] border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (activeSection === 'profile') {
    return (
      <div className="bg-white min-h-screen py-8">
        <div className="max-w-2xl mx-auto px-4">
          <button onClick={() => setActiveSection(null)} className="text-gray-700 font-medium mb-6 flex items-center gap-2">← Back</button>
          <h1 className="text-2xl font-semibold text-gray-900 mb-6">Edit Profile</h1>
          <div className="bg-white border border-gray-200 rounded-lg p-6 space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
              <input type="text" value={editData.name} onChange={(e) => setEditData({ ...editData, name: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500" placeholder="Enter your name" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Mobile Number</label>
              <input type="tel" value={editData.phone} onChange={(e) => setEditData({ ...editData, phone: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500" placeholder="Enter phone number" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <input type="email" value={editData.email} disabled
                className="w-full px-3 py-2 border border-gray-200 rounded bg-gray-100 text-gray-500" />
              <p className="text-xs text-gray-400 mt-1">Email cannot be changed</p>
            </div>
            <div className="flex gap-4 pt-4">
              <button onClick={() => setActiveSection(null)} disabled={saving}
                className="flex-1 px-4 py-2 border border-gray-300 rounded text-gray-700 hover:bg-gray-100 disabled:opacity-50">Cancel</button>
              <button onClick={handleSaveProfile} disabled={saving}
                className="flex-1 px-4 py-2 bg-[#3F51B5] text-white rounded hover:bg-[#2c3a8c] disabled:opacity-50 flex items-center justify-center gap-2">
                {saving ? (<><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>Saving...</>) : 'Save'}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (activeSection === 'addresses') {
    return (
      <div className="bg-white min-h-screen py-8 mt-20">
        <div className="max-w-3xl mx-auto px-4">
          <button onClick={() => setActiveSection(null)} className="text-gray-700 font-medium mb-6 flex items-center gap-2">← Back</button>
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-2xl font-semibold text-gray-900">Your Addresses</h1>
            <button onClick={handleAddAddress}
              className="px-4 py-2 bg-[#3F51B5] text-white rounded hover:bg-[#2c3a8c] text-sm font-medium">+ Add New Address</button>
          </div>
          {addressesLoading ? (
            <div className="flex justify-center py-12">
              <div className="w-8 h-8 border-4 border-[#3F51B5] border-t-transparent rounded-full animate-spin"></div>
            </div>
          ) : addresses.length === 0 ? (
            <div className="text-center py-12 bg-gray-50 rounded-lg">
              <p className="text-gray-500 mb-4">No addresses saved yet</p>
              <button onClick={handleAddAddress} className="text-[#3F51B5] hover:underline">Add your first address</button>
            </div>
          ) : (
            <div className="space-y-4">
              {addresses.map(addr => (
                <div key={addr.id} className={`border rounded-lg p-4 ${addr.is_default ? 'border-[#3F51B5] bg-blue-50' : 'border-gray-200'}`}>
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <span className="font-medium text-gray-900">{addr.label}</span>
                        {addr.is_default && <span className="text-xs bg-[#3F51B5] text-white px-2 py-0.5 rounded">Default</span>}
                      </div>
                      <p className="text-sm text-gray-700">{addr.full_name}, {addr.address_line1}{addr.address_line2 && <>, {addr.address_line2}</>}</p>
                      <p className="text-sm text-gray-700">{addr.city}, {addr.state} — {addr.pincode}</p>
                      <p className="text-sm text-gray-500 mt-1">📞 {addr.phone}</p>
                    </div>
                    <div className="flex gap-2">
                      {!addr.is_default && <button onClick={() => handleSetDefault(addr)} className="text-xs text-[#3F51B5] hover:underline">Set Default</button>}
                      <button onClick={() => handleEditAddress(addr)} className="text-xs text-gray-500 hover:text-gray-700">Edit</button>
                      <button onClick={() => handleDeleteAddress(addr.id)} className="text-xs text-red-500 hover:text-red-700">Delete</button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
        {showAddressDialog && (
          <AddressDialog
            address={editingAddress}
            form={addressForm}
            setForm={setAddressForm}
            onSave={handleSaveAddress}
            onCancel={() => setShowAddressDialog(false)}
            saving={saving}
          />
        )}
      </div>
    );
  }

  return (
    <div className="bg-white min-h-screen py-8 mt-20">
      <div className="max-w-6xl mx-auto px-4">
        <div className="flex items-center justify-between mb-8">
          <button onClick={() => window.history.back()} className="text-gray-700 text-sm hover:text-gray-900">← Back</button>
          <h1 className="text-3xl font-semibold text-gray-900 text-center flex-1">Your Account</h1>
          <button onClick={handleLogout} className="text-sm text-red-500 hover:text-red-700">Logout</button>
        </div>

        {user && (
          <div className="bg-gradient-to-r from-[#3F51B5] to-[#5C6BC0] rounded-lg p-4 mb-6 text-white">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center text-2xl font-semibold">
                {user.name?.charAt(0).toUpperCase() || 'U'}
              </div>
              <div>
                <h2 className="text-xl font-semibold">{user.name}</h2>
                <p className="text-white/80">{user.email}</p>
                {user.phone && <p className="text-white/80">{user.phone}</p>}
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div onClick={() => navigate('/orders')} className="bg-white border border-gray-200 rounded-lg p-6 cursor-pointer hover:shadow-lg hover:scale-[1.02] transition-all">
            <div className="text-4xl mb-4 text-center">📦</div>
            <div className="text-base text-gray-900 text-center">
              <p className="font-medium">Your Orders</p>
              <p className="text-gray-500 text-sm mt-1">Track, return, or buy things again</p>
            </div>
          </div>
          <div onClick={handleEditProfile} className="bg-white border border-gray-200 rounded-lg p-6 cursor-pointer hover:shadow-lg hover:scale-[1.02] transition-all">
            <div className="text-4xl mb-4 text-center">🔐</div>
            <div className="text-base text-gray-900">
              <p className="font-medium">Login & security</p>
              <p className="text-gray-500 text-sm mt-1">Edit login, name, phone number and email</p>
            </div>
          </div>
          <div onClick={() => navigate('/contact')} className="bg-white border border-gray-200 rounded-lg p-6 cursor-pointer hover:shadow-lg hover:scale-[1.02] transition-all">
            <div className="text-4xl mb-4 text-center">📞</div>
            <div className="text-base text-gray-900">
              <p className="font-medium">Contact Us</p>
              <p className="text-gray-500 text-sm mt-1">Get help with your orders</p>
            </div>
          </div>
          <div onClick={() => setActiveSection('addresses')} className="bg-white border border-gray-200 rounded-lg p-6 cursor-pointer hover:shadow-lg hover:scale-[1.02] transition-all">
            <div className="text-4xl mb-4 text-center">📍</div>
            <div className="text-base text-gray-900">
              <p className="font-medium">Your Address</p>
              <p className="text-gray-500 text-sm mt-1">{addresses.length} saved address{addresses.length !== 1 ? 'es' : ''}</p>
            </div>
          </div>
        </div>
      </div>

      {showAddressDialog && (
        <AddressDialog
          address={editingAddress}
          form={addressForm}
          setForm={setAddressForm}
          onSave={handleSaveAddress}
          onCancel={() => setShowAddressDialog(false)}
          saving={saving}
        />
      )}
    </div>
  );
}