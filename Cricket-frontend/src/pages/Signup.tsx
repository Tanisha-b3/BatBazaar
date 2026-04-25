import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, Lock, ArrowRight, User, Phone } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-hot-toast';

interface FormErrors {
  name?: string;
  email?: string;
  phone?: string;
  password?: string;
  confirmPassword?: string;
}

export default function Signup() {
  const navigate = useNavigate();
  const { register } = useAuth();
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  // const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [errors, setErrors] = useState<FormErrors>({});

  // Validation functions
  const validateName = (name: string): string => {
    if (!name.trim()) return 'Full name is required';
    if (name.trim().length < 2) return 'Name must be at least 2 characters';
    if (!/^[a-zA-Z\s]+$/.test(name.trim())) return 'Name can only contain letters and spaces';
    return '';
  };

  const validateEmail = (email: string): string => {
    if (!email.trim()) return 'Email is required';
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) return 'Enter a valid email address';
    return '';
  };

  const validatePhone = (phone: string): string => {
    if (!phone.trim()) return 'Mobile number is required';
    const phoneRegex = /^\d{10}$/;
    if (!phoneRegex.test(phone)) return 'Enter a valid 10-digit mobile number';
    return '';
  };

  const validatePassword = (password: string): string => {
    if (!password) return 'Password is required';
    if (password.length < 6) return 'Password must be at least 6 characters';
    if (!/(?=.*[a-z])/.test(password)) return 'Password must contain at least one lowercase letter';
    if (!/(?=.*[A-Z])/.test(password)) return 'Password must contain at least one uppercase letter';
    if (!/(?=.*\d)/.test(password)) return 'Password must contain at least one number';
    return '';
  };

  // const validateConfirmPassword = (password: string, confirmPassword: string): string => {
  //   if (!confirmPassword) return 'Please confirm your password';
  //   if (password !== confirmPassword) return 'Passwords do not match';
  //   return '';
  // };

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {
      name: validateName(formData.name),
      email: validateEmail(formData.email),
      phone: validatePhone(formData.phone),
      password: validatePassword(formData.password),
      // confirmPassword: validateConfirmPassword(formData.password, formData.confirmPassword),
    };
    
    // Remove empty error messages
    Object.keys(newErrors).forEach(key => {
      if (!newErrors[key as keyof FormErrors]) {
        delete newErrors[key as keyof FormErrors];
      }
    });
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setError('');
    
    // Clear specific field error when user starts typing
    if (touched[field]) {
      let fieldError = '';
      switch (field) {
        case 'name':
          fieldError = validateName(value);
          break;
        case 'email':
          fieldError = validateEmail(value);
          break;
        case 'phone':
          fieldError = validatePhone(value);
          break;
        case 'password':
          fieldError = validatePassword(value);
          break;
        // case 'confirmPassword':
        //   fieldError = validateConfirmPassword(formData.password, value);
        //   break;
      }
      setErrors(prev => ({ ...prev, [field]: fieldError || undefined }));
    }
  };

  const handleBlur = (field: string) => {
    setTouched(prev => ({ ...prev, [field]: true }));
    
    let fieldError = '';
    switch (field) {
      case 'name':
        fieldError = validateName(formData.name);
        break;
      case 'email':
        fieldError = validateEmail(formData.email);
        break;
      case 'phone':
        fieldError = validatePhone(formData.phone);
        break;
      case 'password':
        fieldError = validatePassword(formData.password);
        break;
      // case 'confirmPassword':
      //   fieldError = validateConfirmPassword(formData.password, formData.confirmPassword);
      //   break;
    }
    
    setErrors(prev => ({ ...prev, [field]: fieldError || undefined }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    // Mark all fields as touched
    const allTouched = { name: true, email: true, phone: true, password: true, confirmPassword: true };
    setTouched(allTouched);
    
    // Validate all fields
    if (!validateForm()) {
      toast.error('Please fix the errors before submitting');
      return;
    }
    
    setLoading(true);
    try {
      await register(formData.name, formData.email, formData.phone, formData.password);
      toast.success('Account created successfully!');
      navigate('/');
    } catch (err: any) {
      const errorMsg = err.response?.data?.message || 'Registration failed';
      setError(errorMsg);
      toast.error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const getFieldClass = (field: keyof FormErrors) => {
    if (!touched[field]) return 'border-[#B7B7B7] focus-within:border-[#3F51B5]';
    return errors[field] 
      ? 'border-red-400 focus-within:border-red-500' 
      : 'border-emerald-400 focus-within:border-emerald-500';
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
        <div className="absolute inset-0 bg-black/60"></div>
      </div>
      
      {/* Signup Card Container */}
      <div className="relative z-10 flex items-center justify-center min-h-screen p-4">
        <div className="bg-white rounded-lg shadow-2xl p-6 w-full max-w-md">
          
          {/* Header */}
          <div className="text-center mb-6">
            <h2 className="font-poppins font-medium text-[30px] text-[#333333]" style={{ lineHeight: '45px' }}>
              Create Account
            </h2>
            <p className="font-poppins text-sm text-[#9F9F9F] mt-2">
              Sign up to get started
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Full Name */}
            <div>
              <label className="block font-poppins text-sm text-[#333333] mb-1">
                Full Name <span className="text-red-500">*</span>
              </label>
              <div className={`flex items-center w-full h-[35px] px-3 border rounded-md focus-within:ring-1 transition ${getFieldClass('name')}`}>
                <User size={18} className="text-gray-400 mr-2" />
                <input 
                  type="text" 
                  placeholder="Enter your name" 
                  value={formData.name} 
                  onChange={(e) => handleChange('name', e.target.value)} 
                  onBlur={() => handleBlur('name')}
                  className="flex-1 outline-none bg-transparent font-poppins text-sm text-gray-700 placeholder:text-[#B7B7B7]"
                  required 
                />
              </div>
              {touched.name && errors.name && (
                <p className="text-red-500 text-xs mt-1">{errors.name}</p>
              )}
            </div>

            {/* Mobile Number */}
            <div>
              <label className="block font-poppins text-sm text-[#333333] mb-1">
                Mobile Number <span className="text-red-500">*</span>
              </label>
              <div className={`flex items-center w-full h-[35px] px-3 border rounded-md focus-within:ring-1 transition ${getFieldClass('phone')}`}>
                <Phone size={18} className="text-gray-400 mr-2" />
                <input 
                  type="tel" 
                  placeholder="Enter 10-digit mobile number" 
                  value={formData.phone} 
                  onChange={(e) => handleChange('phone', e.target.value)} 
                  onBlur={() => handleBlur('phone')}
                  className="flex-1 outline-none bg-transparent font-poppins text-sm text-gray-700 placeholder:text-[#B7B7B7]"
                  maxLength={10}
                  required 
                />
              </div>
              {touched.phone && errors.phone && (
                <p className="text-red-500 text-xs mt-1">{errors.phone}</p>
              )}
            </div>

            {/* Email Address */}
            <div>
              <label className="block font-poppins text-sm text-[#333333] mb-1">
                Email Address <span className="text-red-500">*</span>
              </label>
              <div className={`flex items-center w-full h-[35px] px-3 border rounded-md focus-within:ring-1 transition ${getFieldClass('email')}`}>
                <Mail size={18} className="text-gray-400 mr-2" />
                <input 
                  type="email" 
                  placeholder="Enter your email" 
                  value={formData.email} 
                  onChange={(e) => handleChange('email', e.target.value)} 
                  onBlur={() => handleBlur('email')}
                  className="flex-1 outline-none bg-transparent font-poppins text-sm text-gray-700 placeholder:text-[#B7B7B7]"
                  required 
                />
              </div>
              {touched.email && errors.email && (
                <p className="text-red-500 text-xs mt-1">{errors.email}</p>
              )}
            </div>

            {/* Password */}
            <div>
              <label className="block font-poppins text-sm text-[#333333] mb-1">
                Password <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <div className={`flex items-center w-full h-[35px] px-3 border rounded-md focus-within:ring-1 transition ${getFieldClass('password')}`}>
                  <Lock size={18} className="text-gray-400 mr-2" />
                  <input 
                    type={showPassword ? "text" : "password"}
                    placeholder="Create a password" 
                    value={formData.password} 
                    onChange={(e) => handleChange('password', e.target.value)} 
                    onBlur={() => handleBlur('password')}
                    className="flex-1 outline-none bg-transparent font-poppins text-sm text-gray-700 placeholder:text-[#B7B7B7]"
                    required 
                  />
                </div>
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? (
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                    </svg>
                  ) : (
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  )}
                </button>
              </div>
              {touched.password && errors.password && (
                <p className="text-red-500 text-xs mt-1">{errors.password}</p>
              )}
              {touched.password && !errors.password && formData.password && (
                <p className="text-green-500 text-xs mt-1">✓ Strong password</p>
              )}
            </div>

            {/* Confirm Password */}
         

            {/* Error Message */}
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-600 px-3 py-2 rounded-md text-sm animate-shake">
                {error}
              </div>
            )}

            {/* Terms Checkbox */}
            <label className="flex items-start gap-2 font-poppins text-sm text-gray-600 cursor-pointer">
              <input type="checkbox" required className="mt-0.5" />
              <span>I agree to the Terms of Service and Privacy Policy <span className="text-red-500">*</span></span>
            </label>

            {/* Sign Up Button */}
            <button 
              type="submit" 
              className="w-full h-[35px] bg-[#3F51B5] text-white rounded-md font-poppins font-medium text-sm hover:bg-[#2c3a8c] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              disabled={loading}
            >
              {loading ? (
                <>
                  <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Creating Account...
                </>
              ) : (
                <>
                  Sign Up <ArrowRight size={18} />
                </>
              )}
            </button>
          </form>

          {/* Divider */}
          <div className="relative flex items-center gap-3 my-6">
            <div className="flex-1 h-px bg-[#9F9F9F]"></div>
            <span className="font-poppins text-sm text-[#9F9F9F] whitespace-nowrap">
              Already have an account?
            </span>
            <div className="flex-1 h-px bg-[#9F9F9F]"></div>
          </div>

          {/* Login Link */}
          <Link to="/login">
            <button
              type="button"
              className="w-full h-[35px] bg-[#DDDDDD] border border-[#9F9F9F] rounded-md font-poppins font-medium text-sm text-[#333333] hover:bg-gray-300 transition"
            >
              Login
            </button>
          </Link>
        </div>
      </div>

      {/* Animation Styles */}
      <style>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-5px); }
          75% { transform: translateX(5px); }
        }
        
        .animate-shake {
          animation: shake 0.3s ease-in-out;
        }
        
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        
        .animate-spin {
          animation: spin 1s linear infinite;
        }
      `}</style>
    </div>
  );
}