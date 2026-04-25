import { useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import Layout from './components/Layout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Products from './pages/Products';
import Analytics from './pages/Analytics';
import Orders from './pages/Orders';
import OrderDetail from './pages/OrderDetail';
import AddressManagement from './pages/AddressManagement';

function AppRoutes() {
  const navigate = useNavigate();
  const [isAuthenticated, setIsAuthenticated] = useState(
    !!localStorage.getItem('adminToken')
  );

  const handleLogin = () => {
    setIsAuthenticated(true);
    navigate('/', { replace: true }); // ← force navigation after state update
  };

const handleLogout = () => {
  setIsAuthenticated(false);
  navigate('/login', { replace: true });
};


  return (
    <Routes>
      <Route
        path="/login"
        element={
          isAuthenticated
            ? <Navigate to="/" replace />
            : <Login onLogin={handleLogin} />
        }
      />
      <Route path="/" element={isAuthenticated ? <Layout onLogout={handleLogout} /> : <Navigate to="/login" replace />}>
        <Route index element={<Dashboard />} />
        <Route path="analytics" element={<Analytics />} />
        <Route path="products" element={<Products />} />
        <Route path="orders" element={<Orders />} />
        <Route path="orders/:id" element={<OrderDetail />} />
        <Route path="users/:userId/addresses" element={<AddressManagement />} />
      </Route>
    </Routes>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AppRoutes />
    </BrowserRouter>
  );
}


export default App;