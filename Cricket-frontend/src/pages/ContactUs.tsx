import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Mail, Phone, MapPin, Send, CheckCircle } from 'lucide-react';

export default function ContactUs() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    contact: '',
    message: '',
  });
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    setTimeout(() => {
      setSubmitted(true);
      setLoading(false);
    }, 1000);
  };

  if (submitted) {
    return (
      <div className="bg-white min-h-screen pt-[75px]">
        <div className="max-w-lg mx-auto px-4 py-12">
          <div className="bg-white rounded-xl shadow-lg p-8 text-center border border-gray-100">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle size={40} className="text-green-500" />
            </div>
            <h1 className="text-2xl font-semibold text-gray-900 mb-2">Message Sent!</h1>
            <p className="text-gray-500 mb-6">Thank you for contacting us. We'll get back to you within 24 hours.</p>
            <Link to="/" className="inline-block bg-[#3F51B5] text-white px-6 py-2.5 rounded-lg font-medium hover:bg-[#2c3a8c] transition-colors">
              Back to Home
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white min-h-screen ">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Back Button */}
        <button 
          onClick={() => window.history.back()} 
          className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 font-medium text-lg mb-8 transition-colors"
        >
          ← Back
        </button>

        {/* Contact Us Title */}
        <div className="text-center mb-12">
          <h1 className="font-semibold text-3xl sm:text-4xl text-[#333333]">
            Contact Us
          </h1>
          <div className="w-20 h-1 bg-[#3F51B5] mx-auto mt-3 rounded-full"></div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">
          
          {/* Left Column - Contact Info */}
          <div className="space-y-6">
            {/* ADDRESS Section */}
            <div>
              <h2 className="font-bold text-2xl text-gray-900 mb-4">ADDRESS</h2>
              
              <div className="space-y-4">
                <div className="flex gap-3">
                  <MapPin size={20} className="text-[#1F2937] flex-shrink-0 mt-1" />
                  <div>
                    <p className="font-medium text-lg text-[#1F2937] underline mb-1">Main office:</p>
                    <p className="font-medium text-base text-[#1F2937] leading-relaxed max-w-sm">
                      Lorem Ipsum is simply dummy text of the printing and typesetting industry. Lorem Ipsum
                    </p>
                  </div>
                </div>

                <div className="flex gap-3">
                  <Phone size={18} className="text-[#1F2937] flex-shrink-0 mt-1" />
                  <div>
                    <p className="font-medium text-lg text-[#1F2937]">+91 5656325632</p>
                    <p className="font-medium text-lg text-gray-900 mt-2">+91 2565896582</p>
                  </div>
                </div>

                <div className="flex gap-3">
                  <Mail size={18} className="text-gray-900 flex-shrink-0 mt-1" />
                  <p className="font-semibold text-lg text-[#333333]">
                    Write to us at qualitycricket@gmail.com
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column - Contact Form */}
          <div className="bg-[rgba(245,206,233,0.33)] rounded-lg p-6 md:p-8">
            <div className="text-center mb-6">
              <h3 className="font-semibold text-2xl text-gray-900 mb-2">Get a quote</h3>
              <p className="font-medium text-sm text-[#676C84] max-w-md mx-auto">
                Fill up the form and our Team will get back to you within 24 hours.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Full Name */}
                <div>
                  <label className="block font-medium text-base text-[#1F2937] mb-1">
                    Full Name
                  </label>
                  <input
                    type="text"
                    name="name"
                    placeholder="Enter Full name"
                    value={formData.name}
                    onChange={handleChange}
                    required
                    className="w-full h-[50px] px-4 border border-gray-300 rounded-lg bg-white font-medium text-base text-gray-900 placeholder:text-[#A5A4A4] focus:outline-none focus:ring-2 focus:ring-[#3F51B5] focus:border-transparent transition"
                  />
                </div>

                {/* Email */}
                <div>
                  <label className="block font-medium text-base text-[#1F2937] mb-1">
                    Email
                  </label>
                  <input
                    type="email"
                    name="email"
                    placeholder="Enter email"
                    value={formData.email}
                    onChange={handleChange}
                    required
                    className="w-full h-[50px] px-4 border border-gray-300 rounded-lg bg-white font-medium text-base text-gray-900 placeholder:text-[#A5A4A4] focus:outline-none focus:ring-2 focus:ring-[#3F51B5] focus:border-transparent transition"
                  />
                </div>
              </div>

              {/* Contact Number */}
              <div>
                <label className="block font-medium text-base text-[#1F2937] mb-1">
                  Contact number
                </label>
                <input
                  type="tel"
                  name="contact"
                  placeholder="Enter contact number"
                  value={formData.contact}
                  onChange={handleChange}
                  required
                  className="w-full h-[50px] px-4 border border-gray-300 rounded-lg bg-white font-medium text-base text-gray-900 placeholder:text-[#A5A4A4] focus:outline-none focus:ring-2 focus:ring-[#3F51B5] focus:border-transparent transition"
                />
              </div>

              {/* Message */}
              <div>
                <label className="block font-medium text-base text-[#1F2937] mb-1">
                  Message
                </label>
                <textarea
                  name="message"
                  placeholder="Enter your message"
                  value={formData.message}
                  onChange={handleChange}
                  required
                  rows={4}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-white font-medium text-base text-gray-900 placeholder:text-[#A5A4A4] focus:outline-none focus:ring-2 focus:ring-[#3F51B5] focus:border-transparent transition resize-none"
                />
              </div>

              {/* Send Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full md:w-auto px-8 py-3 bg-[#3F51B5] rounded-lg font-medium text-base text-white hover:bg-[#2c3a8c] transition-all duration-300 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <>
                    <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"/>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                    </svg>
                    Sending...
                  </>
                ) : (
                  <>
                    Send <Send size={18} />
                  </>
                )}
              </button>
            </form>
          </div>
        </div>

        {/* Map Section */}
        <div className="mt-12">
          <div className="bg-white rounded-xl shadow-lg overflow-hidden border border-gray-100">
            <div className="h-64 md:h-80 lg:h-96 w-full">
              <iframe
                title="Office Location"
                src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d241316.64333286168!2d72.74109963671873!3d19.082522000000004!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3be7c6306644edc1%3A0x5da4ed8f8d648c69!2sMumbai%2C%20Maharashtra!5e0!3m2!1sen!2sin!4v1700000000000!5m2!1sen!2sin"
                width="100%"
                height="100%"
                style={{ border: 0 }}
                allowFullScreen
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                className="w-full h-full"
              ></iframe>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}