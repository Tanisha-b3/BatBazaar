import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { ArrowLeft, Plus, Pencil, Trash2, Home, MapPin, Phone, User, Check, X } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { API_URL } from '../config';

interface Address {
  id: number;
  user_id: string;
  label: string;
  full_name: string;
  phone: string;
  address_line1: string;
  address_line2?: string;
  city: string;
  state: string;
  pincode: string;
  country: string;
  is_default: number;
  created_at: string;
}

const LABEL_OPTIONS = ['Home', 'Office', 'Work', 'Other'];

export default function AddressManagement() {
  const navigate = useNavigate();
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [userId, setUserId] = useState<string>('');

  const [form, setForm] = useState({
    label: 'Home',
    full_name: '',
    phone: '',
    address_line1: '',
    address_line2: '',
    city: '',
    state: '',
    pincode: '',
    country: 'India',
    is_default: false,
  });

  useEffect(() => {
    const storedUserId = localStorage.getItem('viewingUserId');
    if (storedUserId) {
      setUserId(storedUserId);
      fetchAddresses(storedUserId);
    } else {
      toast.error('No user selected');
      navigate(-1);
    }
  }, []);

  const fetchAddresses = async (uid: string) => {
    setLoading(true);
    try {
      const token = localStorage.getItem('adminToken');
      const { data } = await axios.get(`${API_URL}/api/admin/users/${uid}/addresses`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setAddresses(Array.isArray(data) ? data : []);
    } catch {
      toast.error('Failed to load addresses');
      setAddresses([]);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setForm({
      label: 'Home',
      full_name: '',
      phone: '',
      address_line1: '',
      address_line2: '',
      city: '',
      state: '',
      pincode: '',
      country: 'India',
      is_default: false,
    });
    setEditingId(null);
    setShowForm(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.full_name || !form.phone || !form.address_line1 || !form.city || !form.state || !form.pincode) {
      toast.error('Please fill all required fields');
      return;
    }

    try {
      const token = localStorage.getItem('adminToken');
      if (editingId) {
        await axios.put(`${API_URL}/api/admin/addresses/${editingId}`, form, {
          headers: { Authorization: `Bearer ${token}` },
        });
        toast.success('Address updated');
      } else {
        await axios.post(`${API_URL}/api/admin/users/${userId}/addresses`, form, {
          headers: { Authorization: `Bearer ${token}` },
        });
        toast.success('Address added');
      }
      fetchAddresses(userId);
      resetForm();
    } catch {
      toast.error(editingId ? 'Failed to update address' : 'Failed to add address');
    }
  };

  const handleEdit = (addr: Address) => {
    setForm({
      label: addr.label,
      full_name: addr.full_name,
      phone: addr.phone,
      address_line1: addr.address_line1,
      address_line2: addr.address_line2 || '',
      city: addr.city,
      state: addr.state,
      pincode: addr.pincode,
      country: addr.country,
      is_default: !!addr.is_default,
    });
    setEditingId(addr.id);
    setShowForm(true);
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Delete this address?')) return;
    try {
      const token = localStorage.getItem('adminToken');
      await axios.delete(`${API_URL}/api/admin/addresses/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      toast.success('Address deleted');
      fetchAddresses(userId);
    } catch {
      toast.error('Failed to delete address');
    }
  };

  const handleSetDefault = async (id: number) => {
    try {
      const token = localStorage.getItem('adminToken');
      await axios.patch(`${API_URL}/api/admin/addresses/${id}/default`, {}, {
        headers: { Authorization: `Bearer ${token}` },
      });
      toast.success('Default address updated');
      fetchAddresses(userId);
    } catch {
      toast.error('Failed to set default address');
    }
  };

  const labelIcon = (label: string) => {
    switch (label.toLowerCase()) {
      case 'home': return <Home size={14} className="text-stone-400" />;
      case 'office': case 'work': return <MapPin size={14} className="text-stone-400" />;
      default: return <MapPin size={14} className="text-stone-400" />;
    }
  };

  return (
    <div className="space-y-4 md:space-y-5 p-4 md:p-6" style={{ fontFamily: "'DM Sans', sans-serif" }}>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div>
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-1.5 text-xs text-stone-400 hover:text-stone-700 transition-colors mb-3"
          >
            <ArrowLeft size={13} /> Back
          </button>
          <h1 className="text-2xl font-bold text-stone-900 tracking-tight">
            Manage Addresses
          </h1>
          <p className="text-xs text-stone-400 mt-1">User ID: <span className="font-mono">{userId}</span></p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2 px-4 py-2.5 bg-[#3F51B5] text-white text-sm font-medium rounded-xl hover:bg-stone-700 transition-colors shrink-0"
        >
          <Plus size={14} /> Add Address
        </button>
      </div>

      {/* List */}
      {loading ? (
        <div className="flex flex-col items-center justify-center h-48 gap-3">
          <div className="w-8 h-8 border-2 border-stone-900 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-stone-400">Loading…</p>
        </div>
      ) : addresses.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-48 gap-3 bg-white rounded-2xl border border-stone-100">
          <MapPin size={24} className="text-stone-300" />
          <p className="text-sm text-stone-400">No addresses found</p>
          <button
            onClick={() => setShowForm(true)}
            className="text-xs text-[#3F51B5] hover:underline"
          >
            Add first address
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {addresses.map(addr => (
            <div
              key={addr.id}
              className={`bg-white rounded-2xl border overflow-hidden transition-all ${
                addr.is_default ? 'border-[#3F51B5] ring-1 ring-[#3F51B5]/20' : 'border-stone-100'
              }`}
            >
              <div className="px-5 py-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    {labelIcon(addr.label)}
                    <span className="text-sm font-semibold text-stone-900">{addr.label}</span>
                    {addr.is_default ? (
                      <span className="text-[10px] font-bold uppercase tracking-widest bg-[#3F51B5]/10 text-[#3F51B5] px-2 py-0.5 rounded-full">
                        Default
                      </span>
                    ) : null}
                  </div>
                  <div className="flex gap-1">
                    {!addr.is_default && (
                      <button
                        onClick={() => handleSetDefault(addr.id)}
                        title="Set as default"
                        className="w-7 h-7 rounded-lg flex items-center justify-center text-stone-400 hover:bg-stone-100 transition-all"
                      >
                        <Check size={12} />
                      </button>
                    )}
                    <button
                      onClick={() => handleEdit(addr)}
                      className="w-7 h-7 rounded-lg flex items-center justify-center text-stone-400 hover:bg-stone-100 transition-all"
                    >
                      <Pencil size={12} />
                    </button>
                    <button
                      onClick={() => handleDelete(addr.id)}
                      className="w-7 h-7 rounded-lg flex items-center justify-center text-stone-400 hover:bg-red-50 hover:text-red-500 transition-all"
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                </div>

                <div className="space-y-1.5 text-sm text-stone-600">
                  <p className="font-medium text-stone-900">{addr.full_name}</p>
                  <p className="flex items-start gap-1.5">
                    <Phone size={12} className="mt-0.5 text-stone-400 shrink-0" />
                    {addr.phone}
                  </p>
                  <p className="text-xs text-stone-500 leading-relaxed">
                    {addr.address_line1}
                    {addr.address_line2 && <>, {addr.address_line2}</>}
                    <br />
                    {addr.city}, {addr.state} — {addr.pincode}
                    <br />
                    {addr.country}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Form Dialog */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ fontFamily: "'DM Sans', sans-serif" }}>
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={resetForm} />
          <div className="relative w-full max-w-lg bg-[#fafaf7] rounded-2xl shadow-2xl border border-stone-200 overflow-hidden max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between px-5 py-4 bg-white border-b border-stone-100 sticky top-0 z-10">
              <p className="text-sm font-semibold text-stone-900">
                {editingId ? 'Edit Address' : 'Add New Address'}
              </p>
              <button
                onClick={resetForm}
                className="w-7 h-7 rounded-lg flex items-center justify-center text-stone-400 hover:bg-stone-100 transition-all"
              >
                <X size={14} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="px-5 py-5 space-y-4">
              {/* Label */}
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-widest text-stone-400 mb-1.5">Label</label>
                <div className="flex gap-2">
                  {LABEL_OPTIONS.map(l => (
                    <button
                      key={l}
                      type="button"
                      onClick={() => setForm(f => ({ ...f, label: l }))}
                      className={`px-3 py-2 rounded-xl text-xs font-medium border transition-all ${
                        form.label === l
                          ? 'bg-[#3F51B5] text-white border-[#3F51B5]'
                          : 'bg-white text-stone-500 border-stone-200 hover:border-stone-400'
                      }`}
                    >
                      {l}
                    </button>
                  ))}
                </div>
              </div>

              {/* Full Name */}
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-widest text-stone-400 mb-1.5">Full Name *</label>
                <input
                  type="text"
                  value={form.full_name}
                  onChange={e => setForm(f => ({ ...f, full_name: e.target.value }))}
                  placeholder="Rahul Sharma"
                  className="w-full px-3.5 py-2.5 border border-stone-200 rounded-xl text-sm text-stone-800 placeholder:text-stone-300 focus:outline-none focus:border-stone-900 focus:ring-2 focus:ring-stone-900/8 transition-all bg-white"
                />
              </div>

              {/* Phone */}
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-widest text-stone-400 mb-1.5">Phone *</label>
                <input
                  type="text"
                  value={form.phone}
                  onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
                  placeholder="9876543210"
                  className="w-full px-3.5 py-2.5 border border-stone-200 rounded-xl text-sm text-stone-800 placeholder:text-stone-300 focus:outline-none focus:border-stone-900 focus:ring-2 focus:ring-stone-900/8 transition-all bg-white"
                />
              </div>

              {/* Address Line 1 */}
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-widest text-stone-400 mb-1.5">Address Line 1 *</label>
                <input
                  type="text"
                  value={form.address_line1}
                  onChange={e => setForm(f => ({ ...f, address_line1: e.target.value }))}
                  placeholder="123 MG Road, Sector 5"
                  className="w-full px-3.5 py-2.5 border border-stone-200 rounded-xl text-sm text-stone-800 placeholder:text-stone-300 focus:outline-none focus:border-stone-900 focus:ring-2 focus:ring-stone-900/8 transition-all bg-white"
                />
              </div>

              {/* Address Line 2 */}
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-widest text-stone-400 mb-1.5">Address Line 2</label>
                <input
                  type="text"
                  value={form.address_line2}
                  onChange={e => setForm(f => ({ ...f, address_line2: e.target.value }))}
                  placeholder="Near City Mall"
                  className="w-full px-3.5 py-2.5 border border-stone-200 rounded-xl text-sm text-stone-800 placeholder:text-stone-300 focus:outline-none focus:border-stone-900 focus:ring-2 focus:ring-stone-900/8 transition-all bg-white"
                />
              </div>

              {/* City / State */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-widest text-stone-400 mb-1.5">City *</label>
                  <input
                    type="text"
                    value={form.city}
                    onChange={e => setForm(f => ({ ...f, city: e.target.value }))}
                    placeholder="Mumbai"
                    className="w-full px-3.5 py-2.5 border border-stone-200 rounded-xl text-sm text-stone-800 placeholder:text-stone-300 focus:outline-none focus:border-stone-900 focus:ring-2 focus:ring-stone-900/8 transition-all bg-white"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-widest text-stone-400 mb-1.5">State *</label>
                  <input
                    type="text"
                    value={form.state}
                    onChange={e => setForm(f => ({ ...f, state: e.target.value }))}
                    placeholder="Maharashtra"
                    className="w-full px-3.5 py-2.5 border border-stone-200 rounded-xl text-sm text-stone-800 placeholder:text-stone-300 focus:outline-none focus:border-stone-900 focus:ring-2 focus:ring-stone-900/8 transition-all bg-white"
                  />
                </div>
              </div>

              {/* Pincode / Country */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-widest text-stone-400 mb-1.5">Pincode *</label>
                  <input
                    type="text"
                    value={form.pincode}
                    onChange={e => setForm(f => ({ ...f, pincode: e.target.value }))}
                    placeholder="400001"
                    className="w-full px-3.5 py-2.5 border border-stone-200 rounded-xl text-sm text-stone-800 placeholder:text-stone-300 focus:outline-none focus:border-stone-900 focus:ring-2 focus:ring-stone-900/8 transition-all bg-white"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-widest text-stone-400 mb-1.5">Country</label>
                  <input
                    type="text"
                    value={form.country}
                    onChange={e => setForm(f => ({ ...f, country: e.target.value }))}
                    className="w-full px-3.5 py-2.5 border border-stone-200 rounded-xl text-sm text-stone-800 focus:outline-none focus:border-stone-900 focus:ring-2 focus:ring-stone-900/8 transition-all bg-white"
                  />
                </div>
              </div>

              {/* Default */}
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.is_default}
                  onChange={e => setForm(f => ({ ...f, is_default: e.target.checked }))}
                  className="w-4 h-4 rounded border-stone-300 text-[#3F51B5] focus:ring-[#3F51B5]"
                />
                <span className="text-sm text-stone-600">Set as default address</span>
              </label>

              {/* Actions */}
              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={resetForm}
                  className="flex-1 py-2.5 rounded-xl border border-stone-200 text-sm text-stone-500 font-medium hover:bg-stone-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-[#3F51B5] text-white text-sm font-medium hover:bg-stone-700 transition-colors"
                >
                  {editingId ? 'Update Address' : 'Add Address'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}