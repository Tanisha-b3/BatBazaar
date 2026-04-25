import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Mail, Lock, Phone, Send, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { API_URL } from '../config';
import { toast } from 'react-hot-toast';

interface FormErrors {
  email?: string;
  password?: string;
}

export default function Login() {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [loginType, setLoginType] = useState<'email' | 'phone'>('email');
  const [formData, setFormData] = useState({
    email: '',
    phone: '',
    password: '',
    otp: '',
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [otpSent, setOtpSent] = useState(false);
  const [otpLoading, setOtpLoading] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const phoneRegex = /^\d{10}$/;

  const validate = (data: typeof formData, type: string): FormErrors => {
    const errs: FormErrors = {};
    if (type === 'email') {
      if (!data.email.trim()) {
        errs.email = 'Email is required';
      } else if (!emailRegex.test(data.email)) {
        errs.email = 'Enter a valid email';
      }
    }
    if (!data.password) {
      errs.password = 'Password is required';
    } else if (data.password.length < 6) {
      errs.password = 'Password must be at least 6 characters';
    }
    return errs;
  };

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (touched[field]) {
      setErrors(validate({ ...formData, [field]: value }, loginType));
    }
    setError('');
  };

  const handleBlur = (field: string) => {
    setTouched(t => ({ ...t, [field]: true }));
    setErrors(validate(formData, loginType));
  };

  const handleSendOTP = async () => {
    setError('');
    
    if (!formData.phone) {
      toast.error('Please enter phone number');
      return;
    }
    if (!phoneRegex.test(formData.phone)) {
      toast.error('Enter 10-digit phone number');
      return;
    }
    
    setOtpLoading(true);
    
    try {
      await axios.post(`${API_URL}/auth/send-otp`, { phone: formData.phone });
      setOtpSent(true);
      toast.success('OTP sent successfully!');
    } catch (err: any) {
      const errorMsg = err.response?.data?.message || 'Failed to send OTP';
      setError(errorMsg);
      toast.error(errorMsg);
    } finally {
      setOtpLoading(false);
    }
  };

  const handleVerifyOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (!formData.otp) {
      toast.error('Please enter OTP');
      return;
    }
    
    setLoading(true);
    
    try {
      const response = await axios.post(`${API_URL}/auth/verify-otp`, {
        phone: formData.phone,
        otp: formData.otp
      });
      
      const { accessToken: token, user } = response.data;
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));
      await login(user.email, '', formData.phone);
      toast.success('Login successful!');
      navigate('/');
    } catch (err: any) {
      const errorMsg = err.response?.data?.message || 'Invalid OTP';
      setError(errorMsg);
      toast.error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setTouched({ email: true, password: true });
    const validationErrors = validate(formData, 'email');
    setErrors(validationErrors);

    if (Object.keys(validationErrors).length > 0) {
      toast.error('Please fix the errors');
      return;
    }
    
    setLoading(true);

    try {
      await login(formData.email, formData.password, '');
      toast.success('Login successful!');
      navigate('/');
    } catch (err: any) {
      const errorMsg = err.response?.data?.message || 'Login failed';
      setError(errorMsg);
      setErrors({ ...errors, password: errorMsg });
      toast.error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen">
      {/* Background Image */}
      <div className="absolute inset-0">
        <img 
          src="/stadium.png" 
          alt="Cricket Stadium" 
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-black/50"></div>
      </div>
      
      {/* Login Card Container */}
      <div className="relative z-10 flex items-center justify-center min-h-screen p-4">
        
        {/* Main Card */}
        <div className="bg-white rounded-lg shadow-2xl p-6 w-full max-w-sm">
          
          {/* Login Title */}
          <div className="text-center mb-6">
            <h2 className="font-poppins font-medium text-[30px] text-[#333333]">
              Login
            </h2>
          </div>

          {/* Email/Phone Toggle Buttons */}
          <div className="flex gap-0 mb-8">
            <button
              type="button"
              onClick={() => {
                setLoginType('email');
                setOtpSent(false);
                setError('');
                setFormData({ ...formData, otp: '' });
              }}
              className={`flex-1 h-[35px] rounded-l-lg font-poppins text-sm transition ${
                loginType === 'email'
                  ? 'bg-[#F8F7FC] text-[#3F51B5] border border-[#3F51B5]'
                  : 'bg-[#F8F7FC] text-[#7E7E7E] border border-gray-200'
              }`}
            >
              Email
            </button>
            <button
              type="button"
              onClick={() => {
                setLoginType('phone');
                setOtpSent(false);
                setError('');
                setFormData({ ...formData, otp: '' });
              }}
              className={`flex-1 h-[35px] rounded-r-lg font-poppins text-sm transition ${
                loginType === 'phone'
                  ? 'bg-[#F8F7FC] text-[#3F51B5] border border-[#3F51B5]'
                  : 'bg-[#F8F7FC] text-[#7E7E7E] border border-gray-200'
              }`}
            >
              Phone Number
            </button>
          </div>

          {/* Email Login Form */}
          {loginType === 'email' && (
            <form onSubmit={handleEmailLogin} className="space-y-4">
              <div>
                <label className="block font-poppins text-sm text-[#333333] mb-1">
                  Email
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                  <input
                    type="email"
                    placeholder="enter email"
                    value={formData.email}
                    onChange={(e) => handleChange('email', e.target.value)}
                    onBlur={() => handleBlur('email')}
                    className="w-full h-[35px] pl-10 pr-3 border border-[#B7B7B7] rounded-md font-poppins text-sm text-gray-700 placeholder:text-[#B7B7B7] focus:outline-none focus:border-[#3F51B5] focus:ring-1 focus:ring-[#3F51B5] transition"
                    required
                  />
                </div>
                {touched.email && errors.email && (
                  <p className="text-red-500 text-xs mt-1">{errors.email}</p>
                )}
              </div>

              <div>
                <label className="block font-poppins text-sm text-[#333333] mb-1">
                  Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                  <input
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter password"
                    value={formData.password}
                    onChange={(e) => handleChange('password', e.target.value)}
                    onBlur={() => handleBlur('password')}
                    className="w-full h-[35px] pl-10 pr-10 border border-[#B7B7B7] rounded-md font-poppins text-sm text-gray-700 placeholder:text-[#B7B7B7] focus:outline-none focus:border-[#3F51B5] focus:ring-1 focus:ring-[#3F51B5] transition"
                    required
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
                  <p className="text-red-500 text-xs mt-1">{errors.password}</p>
                )}
              </div>

              <div className="text-right">
                <Link 
                  to="/forgot-password" 
                  className="font-poppins text-sm text-[#3F51B5] hover:underline transition"
                >
                  Forget Password ?
                </Link>
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 text-red-600 px-3 py-2 rounded-md text-sm animate-shake">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full h-[35px] bg-[#3F51B5] rounded-md font-poppins font-medium text-sm text-white hover:bg-[#2c3a8c] transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Logging in...
                  </>
                ) : (
                  'Login'
                )}
              </button>
            </form>
          )}

          {/* Phone OTP Login Form */}
          {loginType === 'phone' && (
            <form onSubmit={handleVerifyOTP} className="space-y-4">
              <div>
                <label className="block font-poppins text-sm text-[#333333] mb-1">
                  Phone Number
                </label>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                    <input
                      type="tel"
                      placeholder="enter phone number"
                      value={formData.phone}
                      onChange={(e) => handleChange('phone', e.target.value)}
                      className="w-full h-[35px] pl-10 pr-3 border border-[#B7B7B7] rounded-md font-poppins text-sm text-gray-700 placeholder:text-[#B7B7B7] focus:outline-none focus:border-[#3F51B5] focus:ring-1 focus:ring-[#3F51B5] transition"
                      disabled={otpSent}
                      required={!otpSent}
                    />
                  </div>
                  {!otpSent && (
                    <button
                      type="button"
                      onClick={handleSendOTP}
                      disabled={otpLoading || !formData.phone}
                      className="px-4 h-[35px] bg-[#3F51B5] text-white rounded-md text-sm font-medium hover:bg-[#2c3a8c] transition disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
                    >
                      {otpLoading ? 'Sending...' : 'Send OTP'}
                    </button>
                  )}
                </div>
              </div>

              {otpSent && (
                <>
                  <div>
                    <label className="block font-poppins text-sm text-[#333333] mb-1">
                      Enter OTP
                    </label>
                    <div className="relative">
                      <Send className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                      <input
                        type="text"
                        placeholder="Enter OTP"
                        value={formData.otp}
                        onChange={(e) => handleChange('otp', e.target.value)}
                        className="w-full h-[35px] pl-10 pr-3 border border-[#B7B7B7] rounded-md font-poppins text-sm text-gray-700 placeholder:text-[#B7B7B7] focus:outline-none focus:border-[#3F51B5] focus:ring-1 focus:ring-[#3F51B5] transition"
                        required
                      />
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={handleSendOTP}
                    className="text-sm text-[#3F51B5] hover:underline"
                  >
                    Resend OTP
                  </button>
                </>
              )}

              {error && (
                <div className="bg-red-50 border border-red-200 text-red-600 px-3 py-2 rounded-md text-sm animate-shake">
                  {error}
                </div>
              )}

              {otpSent && (
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full h-[35px] bg-[#3F51B5] rounded-md font-poppins font-medium text-sm text-white hover:bg-[#2c3a8c] transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <>
                      <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Verifying...
                    </>
                  ) : (
                    'Verify & Login'
                  )}
                </button>
              )}
            </form>
          )}

          {/* Divider */}
          <div className="relative flex items-center gap-3 my-6">
            <div className="flex-1 h-px bg-[#9F9F9F]"></div>
            <span className="font-poppins text-sm text-[#9F9F9F] whitespace-nowrap">
              New to Quality Cricket
            </span>
            <div className="flex-1 h-px bg-[#9F9F9F]"></div>
          </div>

          {/* Create Account Button */}
          <Link to="/signup">
            <button
              type="button"
              className="w-full h-[35px] bg-[#DDDDDD] border border-[#9F9F9F] rounded-md font-poppins font-medium text-sm text-[#333333] hover:bg-gray-300 transition"
            >
              Create account
            </button>
          </Link>
        </div>
      </div>

      <style>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-5px); }
          75% { transform: translateX(5px); }
        }
        
        .animate-shake {
          animation: shake 0.3s ease-in-out;
        }
      `}</style>
    </div>
  );
}