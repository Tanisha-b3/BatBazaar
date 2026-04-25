import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Mail, Lock, Phone, ArrowLeft, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { API_URL } from '../config';
import { toast } from 'react-hot-toast';

interface FormErrors {
  email?: string;
  password?: string;
}

export default function Login() {
  const navigate = useNavigate();
  const { login, user, otpLogin } = useAuth();

  const [loginType, setLoginType] = useState<'email' | 'phone'>('email');
  const [formData, setFormData] = useState({ email: '', phone: '', password: '', otp: '' });
  const [errors, setErrors] = useState<FormErrors>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [otpSent, setOtpSent] = useState(false);
  const [otpLoading, setOtpLoading] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');

  // 6-box OTP state
  const [otpDigits, setOtpDigits] = useState(['', '', '', '', '', '']);
  const otpRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    if (user) navigate('/');
  }, [user, navigate]);

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const phoneRegex = /^\d{10}$/;

  const validate = (data: typeof formData, type: string): FormErrors => {
    const errs: FormErrors = {};
    if (type === 'email') {
      if (!data.email.trim()) errs.email = 'Email is required';
      else if (!emailRegex.test(data.email)) errs.email = 'Enter a valid email';
    }
    if (!data.password) errs.password = 'Password is required';
    else if (data.password.length < 6) errs.password = 'Password must be at least 6 characters';
    return errs;
  };

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (touched[field]) setErrors(validate({ ...formData, [field]: value }, loginType));
    setError('');
  };

  const handleBlur = (field: string) => {
    setTouched(t => ({ ...t, [field]: true }));
    setErrors(validate(formData, loginType));
  };

  // ── OTP box handlers ──
  const handleOtpDigit = (index: number, value: string) => {
    if (!/^\d?$/.test(value)) return;
    const next = [...otpDigits];
    next[index] = value;
    setOtpDigits(next);
    setError('');
    if (value && index < 5) otpRefs.current[index + 1]?.focus();
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !otpDigits[index] && index > 0) {
      otpRefs.current[index - 1]?.focus();
    }
  };

  const handleOtpPaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    const next = [...otpDigits];
    pasted.split('').forEach((d, i) => { next[i] = d; });
    setOtpDigits(next);
    otpRefs.current[Math.min(pasted.length, 5)]?.focus();
  };

  const handleSendOTP = async () => {
    setError('');
    if (!formData.phone) { toast.error('Please enter phone number'); return; }
    if (!phoneRegex.test(formData.phone)) { toast.error('Enter 10-digit phone number'); return; }
    setOtpLoading(true);
    try {
      await axios.post(`${API_URL}/auth/send-otp`, { phone: formData.phone });
      setOtpSent(true);
      setOtpDigits(['', '', '', '', '', '']);
      toast.success('OTP sent successfully!');
      setTimeout(() => otpRefs.current[0]?.focus(), 100);
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Failed to send OTP';
      setError(msg);
      toast.error(msg);
    } finally {
      setOtpLoading(false);
    }
  };

  const handleVerifyOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    const otp = otpDigits.join('');
    if (otp.length < 6) { toast.error('Please enter the complete 6-digit OTP'); return; }
    setLoading(true);
    try {
      const response = await axios.post(`${API_URL}/auth/verify-otp`, { phone: formData.phone, otp });
      const { accessToken, refreshToken, user: userData } = response.data;
      if (!accessToken || !userData) throw new Error('Invalid response from server');
      if (refreshToken) localStorage.setItem('refreshToken', refreshToken);
      otpLogin(userData, accessToken);
      toast.success('Login successful!');
      setTimeout(() => navigate('/'), 500);
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Invalid OTP';
      setError(msg);
      toast.error(msg);
      setOtpDigits(['', '', '', '', '', '']);
      setTimeout(() => otpRefs.current[0]?.focus(), 50);
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
    if (Object.keys(validationErrors).length > 0) { toast.error('Please fix the errors'); return; }
    setLoading(true);
    try {
      await login(formData.email, formData.password, '');
      toast.success('Login successful!');
      setTimeout(() => navigate('/'), 500);
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Login failed';
      setError(msg);
      setErrors({ ...errors, password: msg });
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleBackToPhone = () => {
    setOtpSent(false);
    setOtpDigits(['', '', '', '', '', '']);
    setError('');
  };

  const switchTab = (type: 'email' | 'phone') => {
    setLoginType(type);
    setOtpSent(false);
    setOtpDigits(['', '', '', '', '', '']);
    setError('');
    setFormData(prev => ({ ...prev, otp: '' }));
  };

  return (
    <div className="relative min-h-screen">
      {/* Background */}
      <div className="absolute inset-0">
        <img src="/stadium.webp" alt="Cricket Stadium" className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-black/50" />
      </div>

      {/* Card */}
      <div className="relative z-10 flex items-center justify-center min-h-screen p-4">
        <div className="bg-white rounded-lg shadow-2xl p-6 w-full max-w-sm">

          {/* ── OTP verification screen ── */}
          {otpSent ? (
            <>
              <button
                onClick={handleBackToPhone}
                className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-5 transition-colors"
              >
                <ArrowLeft size={17} />
                <span className="text-sm">Back</span>
              </button>

              <div className="text-center mb-6">
                <h2 className="font-poppins font-medium text-[28px] text-[#333333]">Enter OTP</h2>
                <p className="text-sm text-gray-500 mt-1">Sent to <span className="font-medium text-gray-700">{formData.phone}</span></p>
              </div>

              <form onSubmit={handleVerifyOTP} className="space-y-5">
                {/* 6 boxes */}
                <div className="flex justify-between gap-2" onPaste={handleOtpPaste}>
                  {otpDigits.map((digit, i) => (
                    <input
                      key={i}
                      ref={el => { otpRefs.current[i] = el; }}
                      type="text"
                      inputMode="numeric"
                      maxLength={1}
                      value={digit}
                      onChange={e => handleOtpDigit(i, e.target.value)}
                      onKeyDown={e => handleOtpKeyDown(i, e)}
                      className={`w-11 h-12 text-center text-lg font-semibold border rounded-lg focus:outline-none transition
                        ${digit ? 'border-[#3F51B5] bg-[#F8F7FC] text-[#3F51B5]' : 'border-[#B7B7B7] text-gray-700'}
                        focus:border-[#3F51B5] focus:ring-1 focus:ring-[#3F51B5]`}
                    />
                  ))}
                </div>

                {error && (
                  <div className="bg-red-50 border border-red-200 text-red-600 px-3 py-2 rounded-md text-sm animate-shake">
                    {error}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading || otpDigits.join('').length < 6}
                  className="w-full h-[38px] bg-[#3F51B5] rounded-md font-poppins font-medium text-sm text-white hover:bg-[#2c3a8c] transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <>
                      <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      Verifying...
                    </>
                  ) : 'Verify & Login'}
                </button>

                <div className="text-center">
                  <button
                    type="button"
                    onClick={handleSendOTP}
                    disabled={otpLoading}
                    className="text-sm text-[#3F51B5] hover:underline disabled:opacity-50"
                  >
                    {otpLoading ? 'Resending...' : 'Resend OTP'}
                  </button>
                </div>
              </form>
            </>
          ) : (
            <>
              {/* ── Normal login screen ── */}
              <div className="text-center mb-6">
                <h2 className="font-poppins font-medium text-[30px] text-[#333333]">Login</h2>
              </div>

              {/* Tab toggle */}
              <div className="flex gap-0 mb-6">
                <button
                  type="button"
                  onClick={() => switchTab('email')}
                  className={`flex-1 h-[35px] rounded-l-lg font-poppins text-sm transition border ${
                    loginType === 'email'
                      ? 'bg-[#F8F7FC] text-[#3F51B5] border-[#3F51B5]'
                      : 'bg-[#F8F7FC] text-[#7E7E7E] border-gray-200'
                  }`}
                >
                  Email
                </button>
                <button
                  type="button"
                  onClick={() => switchTab('phone')}
                  className={`flex-1 h-[35px] rounded-r-lg font-poppins text-sm transition border ${
                    loginType === 'phone'
                      ? 'bg-[#F8F7FC] text-[#3F51B5] border-[#3F51B5]'
                      : 'bg-[#F8F7FC] text-[#7E7E7E] border-gray-200'
                  }`}
                >
                  Phone Number
                </button>
              </div>

              {/* ── Email form ── */}
              {loginType === 'email' && (
                <form onSubmit={handleEmailLogin} className="space-y-4">
                  <div>
                    <label className="block font-poppins text-sm text-[#333333] mb-1">Email</label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                      <input
                        type="email"
                        placeholder="enter email"
                        value={formData.email}
                        onChange={e => handleChange('email', e.target.value)}
                        onBlur={() => handleBlur('email')}
                        className="w-full h-[35px] pl-10 pr-3 border border-[#B7B7B7] rounded-md font-poppins text-sm text-gray-700 placeholder:text-[#B7B7B7] focus:outline-none focus:border-[#3F51B5] focus:ring-1 focus:ring-[#3F51B5] transition"
                        required
                      />
                    </div>
                    {touched.email && errors.email && <p className="text-red-500 text-xs mt-1">{errors.email}</p>}
                  </div>

                  <div>
                    <label className="block font-poppins text-sm text-[#333333] mb-1">Password</label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                      <input
                        type={showPassword ? 'text' : 'password'}
                        placeholder="Enter password"
                        value={formData.password}
                        onChange={e => handleChange('password', e.target.value)}
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
                    {touched.password && errors.password && <p className="text-red-500 text-xs mt-1">{errors.password}</p>}
                  </div>

                  <div className="text-right">
                    <Link to="/forgot-password" className="font-poppins text-sm text-[#3F51B5] hover:underline">
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
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                        </svg>
                        Logging in...
                      </>
                    ) : 'Login'}
                  </button>
                </form>
              )}

              {/* ── Phone form ── */}
              {loginType === 'phone' && (
                <div className="space-y-4">
                  <div>
                    <label className="block font-poppins text-sm text-[#333333] mb-1">Phone Number</label>
                    <div className="flex gap-2">
                      <div className="relative flex-1">
                        <Phone className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                        <input
                          type="tel"
                          placeholder="Enter 10-digit number"
                          value={formData.phone}
                          onChange={e => handleChange('phone', e.target.value)}
                          className="w-full h-[35px] pl-10 pr-3 border border-[#B7B7B7] rounded-md font-poppins text-sm text-gray-700 placeholder:text-[#B7B7B7] focus:outline-none focus:border-[#3F51B5] focus:ring-1 focus:ring-[#3F51B5] transition"
                          maxLength={10}
                        />
                      </div>
                      <button
                        type="button"
                        onClick={handleSendOTP}
                        disabled={otpLoading || !formData.phone}
                        className="px-4 h-[35px] bg-[#3F51B5] text-white rounded-md text-sm font-medium hover:bg-[#2c3a8c] transition disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
                      >
                        {otpLoading ? 'Sending...' : 'Send OTP'}
                      </button>
                    </div>
                  </div>

                  {error && (
                    <div className="bg-red-50 border border-red-200 text-red-600 px-3 py-2 rounded-md text-sm animate-shake">
                      {error}
                    </div>
                  )}
                </div>
              )}

              {/* Divider + Create account (email only) */}
              {loginType === 'email' && (
                <>
                  <div className="relative flex items-center gap-3 my-6">
                    <div className="flex-1 h-px bg-[#9F9F9F]" />
                    <span className="font-poppins text-sm text-[#9F9F9F] whitespace-nowrap">New to Quality Cricket</span>
                    <div className="flex-1 h-px bg-[#9F9F9F]" />
                  </div>
                  <Link to="/signup">
                    <button
                      type="button"
                      className="w-full h-[35px] bg-[#DDDDDD] border border-[#9F9F9F] rounded-md font-poppins font-medium text-sm text-[#333333] hover:bg-gray-300 transition"
                    >
                      Create account
                    </button>
                  </Link>
                </>
              )}
            </>
          )}
        </div>
      </div>

      <style>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-5px); }
          75% { transform: translateX(5px); }
        }
        .animate-shake { animation: shake 0.3s ease-in-out; }
      `}</style>
    </div>
  );
}