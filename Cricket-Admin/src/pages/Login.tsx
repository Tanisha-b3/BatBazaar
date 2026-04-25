import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Package, Mail, Lock, Eye, EyeOff, AlertCircle } from 'lucide-react';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import { API_URL } from '../config';

interface FormErrors {
  email?: string;
  password?: string;
}

interface Props {
  onLogin: () => void;
}


export default function AdminLogin({ onLogin }: Props) {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({ email: '', password: '' });
  const [errors, setErrors] = useState<FormErrors>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  const validate = (data: typeof formData): FormErrors => {
    const errs: FormErrors = {};
    if (!data.email.trim()) {
      errs.email = 'Email is required';
    } else if (!emailRegex.test(data.email)) {
      errs.email = 'Enter a valid email address';
    }
    if (!data.password) {
      errs.password = 'Password is required';
    } else if (data.password.length < 6) {
      errs.password = 'Password must be at least 6 characters';
    }
    return errs;
  };

  const handleChange = (field: 'email' | 'password', value: string) => {
    const updated = { ...formData, [field]: value };
    setFormData(updated);
    if (touched[field]) setErrors(validate(updated));
  };

  const handleBlur = (field: string) => {
    setTouched(t => ({ ...t, [field]: true }));
    setErrors(validate(formData));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setTouched({ email: true, password: true });
    const validationErrors = validate(formData);
    setErrors(validationErrors);
    if (Object.keys(validationErrors).length > 0) {
      toast.error('Please fix the errors before logging in');
      return;
    }

    setLoading(true);
    try {
      const response = await axios.post(`${API_URL}/api/admin/auth/login`, {
        email: formData.email.trim(),
        password: formData.password,
      });

      const { token, admin } = response.data;
      localStorage.setItem('adminToken', token);
      localStorage.setItem('admin', JSON.stringify(admin));

      toast.success('Welcome back, Admin!');
      onLogin(); // ← replaces navigate('/')
    } catch (err: any) {
      const errorMsg = err.response?.data?.message || 'Invalid email or password';
      setErrors({ email: errorMsg });
      toast.error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const getFieldClass = (field: keyof FormErrors) => {
    if (!touched[field]) return 'border-[#B7B7B7]';
    return errors[field]
      ? 'border-red-400 focus:border-red-500 focus:ring-red-500'
      : 'border-emerald-400 focus:border-emerald-500 focus:ring-emerald-500';
  };

  return (
    <div className="relative min-h-screen">
      <div className="absolute inset-0">
        <img src="/stadium.webp" alt="Cricket Stadium" className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-black/50" />
      </div>

      <div className="relative z-10 flex items-center justify-center min-h-screen p-4">
        <div className="bg-white rounded-lg shadow-2xl p-6 w-full max-w-sm">

          <div className="text-center mb-6">
            <div className="w-16 h-16 bg-[#3F51B5] rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
              <Package size={32} className="text-white" />
            </div>
            <h2 className="font-poppins font-medium text-[30px] text-[#333333]">Admin Login</h2>
            <p className="font-poppins text-sm text-[#7E7E7E] mt-1">Cricket Store Management</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block font-poppins text-sm text-[#333333] mb-1">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                <input
                  type="email"
                  placeholder="admin@cricketstore.com"
                  value={formData.email}
                  onChange={(e) => handleChange('email', e.target.value)}
                  onBlur={() => handleBlur('email')}
                  className={`w-full h-[35px] pl-10 pr-3 border rounded-md font-poppins text-sm text-gray-700 placeholder:text-[#B7B7B7] focus:outline-none focus:ring-1 transition ${getFieldClass('email')}`}
                  autoComplete="email"
                />
              </div>
              {touched.email && errors.email && (
                <p className="flex items-center gap-1 text-red-500 text-xs mt-1">
                  <AlertCircle size={12} /> {errors.email}
                </p>
              )}
            </div>

            <div>
              <label className="block font-poppins text-sm text-[#333333] mb-1">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Enter your password"
                  value={formData.password}
                  onChange={(e) => handleChange('password', e.target.value)}
                  onBlur={() => handleBlur('password')}
                  className={`w-full h-[35px] pl-10 pr-10 border rounded-md font-poppins text-sm text-gray-700 placeholder:text-[#B7B7B7] focus:outline-none focus:ring-1 transition ${getFieldClass('password')}`}
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              {touched.password && errors.password && (
                <p className="flex items-center gap-1 text-red-500 text-xs mt-1">
                  <AlertCircle size={12} /> {errors.password}
                </p>
              )}
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full h-[35px] bg-[#3F51B5] rounded-md font-poppins font-medium text-sm text-white hover:bg-[#2c3a8c] transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Logging in...
                </>
              ) : (
                'Login as Admin'
              )}
            </button>
          </form>

          <div className="relative flex items-center gap-3 my-6">
            <div className="flex-1 h-px bg-[#9F9F9F]" />
            <span className="font-poppins text-sm text-[#9F9F9F] whitespace-nowrap">Admin Access Only</span>
            <div className="flex-1 h-px bg-[#9F9F9F]" />
          </div>
        </div>
      </div>
    </div>
  );
}