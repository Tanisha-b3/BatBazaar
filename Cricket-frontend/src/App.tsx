import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { CartProvider } from './context/CartContext';
import Header from './components/Header';
import Footer from './components/Footer';
import ScrollToTop from './components/ScrollToTop';
import Home from './pages/Home';
import Login from './pages/Login';
import Signup from './pages/Signup';
import Products from './pages/Products';
import ProductDetail from './pages/ProductDetail';
import Cart from './pages/Cart';
import Checkout from './pages/Checkout';
import Profile from './pages/Profile';
import ContactUs from './pages/ContactUs';
import Orders from './pages/order';
import CustomerReviews from './pages/review';
import WriteReview from './pages/reveiws';
import ForgotPassword from './pages/ForgetPassword';
import ResetPassword from './pages/resetPassword';
import Notifications from './pages/Notifications';
import Settings from './pages/Settings';
// import ProtectedRoute from './components/ProtectedRoute';

// Protected Route component
interface ProtectedRouteProps {
  children: React.ReactNode;
  redirectTo?: string;
  requiredRole?: 'user' | 'admin' | 'vendor';
}

const ProtectedRouteElement: React.FC<ProtectedRouteProps> = ({ 
  children, 
  redirectTo = '/login',
  requiredRole 
}) => {
  const { user, isLoading, token } = useAuth();
  
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-[#3F51B5] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }
  
  if (!user || !token) {
    return <Navigate to={redirectTo} replace />;
  }
  
  // Check for role-based access if required
  if (requiredRole) {
    const userRole = (user as any).role || 'user';
    if (userRole !== requiredRole) {
      return <Navigate to="/" replace />;
    }
  }
  
  return <>{children}</>;
};

function AppContent() {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-[#3F51B5] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // If user is NOT logged in, show only login and signup routes
  if (!user) {
    return (
      <div className="min-h-screen flex flex-col bg-gray-50">
        <main className="flex-1">
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password/:token" element={<ResetPassword />} />
            {/* Redirect all other routes to login */}
            <Route path="*" element={<Navigate to="/login" replace />} />
          </Routes>
        </main>
      </div>
    );
  }

  // If user IS logged in, show all routes with header and footer
  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Header />
      
      <main className="flex-1">
        <Routes>
          {/* Main Routes */}
          <Route path="/" element={<Home />} />
          <Route path="/products" element={<Products />} />
          <Route path="/product/:id" element={<ProductDetail />} />
          <Route path="/product-detail/:id" element={<ProductDetail />} />
          <Route path="/contact" element={<ContactUs />} />
          <Route path="/contact-us" element={<ContactUs />} />
          <Route path="/reviews" element={<CustomerReviews />} />
          <Route path="/write-review" element={<WriteReview />} />
          
          {/* Protected Routes - Require Authentication */}
          <Route path="/cart" element={<Cart />} />
          <Route path="/checkout" element={<Checkout />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/account" element={<Profile />} />
          <Route path="/orders" element={<Orders />} />
          <Route path="/notifications" element={<Notifications />} />
          <Route path="/settings" element={<Settings />} />
          
          {/* Login/Signup - Redirect to home if already logged in */}
          <Route path="/login" element={<Navigate to="/" replace />} />
          <Route path="/signup" element={<Navigate to="/" replace />} />
          <Route path="/forgot-password" element={<Navigate to="/" replace />} />
          <Route path="/reset-password/:token" element={<Navigate to="/" replace />} />
          
          {/* Admin Routes - Require Admin Role */}
          <Route path="/admin/*" element={
            <ProtectedRouteElement requiredRole="admin">
              <AdminDashboard />
            </ProtectedRouteElement>
          } />
          
          {/* 404 Not Found Route */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </main>
      
      <Footer />
    </div>
  );
}

// Simple 404 component
const NotFound = () => (
  <div className="min-h-[60vh] flex items-center justify-center">
    <div className="text-center">
      <h1 className="text-6xl font-bold text-gray-900 mb-4">404</h1>
      <p className="text-xl text-gray-600 mb-8">Page not found</p>
      <a href="/" className="text-[#3F51B5] hover:underline">
        Go back home
      </a>
    </div>
  </div>
);

// Placeholder for AdminDashboard
const AdminDashboard = () => (
  <div className="container mx-auto px-4 py-8">
    <h1 className="text-2xl font-bold mb-4">Admin Dashboard</h1>
    <p>Welcome to admin panel</p>
  </div>
);

export default function App() {
  return (
    <AuthProvider>
      <CartProvider>
        <BrowserRouter>
          <ScrollToTop />
          <AppContent />
        </BrowserRouter>
      </CartProvider>
    </AuthProvider>
  );
}