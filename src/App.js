import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Registration from './pages/Registration';
import AdminDashboard from './pages/AdminDashboard';
import ProductCatalog from './pages/ProductCatalog';
import Product from './pages/Product';
import Category from './pages/Category';
import Cart from './pages/Cart';
import Checkout from './pages/Checkout';
import About from './pages/About';
import ContactUs from './pages/ContactUs';
import Transactions from './pages/Transactions';
import Invoices from './pages/Invoices';
import Orders from './pages/Orders';
import OrderDetails from './pages/OrderDetails';
import Profile from './pages/Profile';
import NotificationPreferences from './pages/NotificationPreferences';
import CustomerCare from './pages/CustomerCare';
import Advertise from './pages/Advertise';

const ProtectedRoute = ({ children, allowedRoles }) => {
  const token = localStorage.getItem('token');
  const role = localStorage.getItem('role');

  if (!token) return <Navigate to="/login" />;
  if (allowedRoles && !allowedRoles.includes(role)) return <Navigate to="/unauthorized" />;
  
  return children;
};

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Registration />} />
        <Route path="/about" element={<About />} />
        <Route path="/contact" element={<ContactUs />} />
        <Route path="/notification-preferences" element={<NotificationPreferences />} />
        <Route path="/customer-care" element={<CustomerCare />} />
        <Route path="/advertise" element={<Advertise />} />
        <Route path="/catalog" element={<ProductCatalog />} />
        <Route path="/products" element={<ProtectedRoute allowedRoles={['Admin']}><Product /></ProtectedRoute>} />
        <Route path="/categories" element={<ProtectedRoute allowedRoles={['Admin']}><Category /></ProtectedRoute>} />
        <Route
          path="/cart"
          element={
            <ProtectedRoute>
              <Cart />
            </ProtectedRoute>
          }
        />
        <Route
          path="/checkout"
          element={
            <ProtectedRoute>
              <Checkout />
            </ProtectedRoute>
          }
        />
        <Route path="/orders" element={<ProtectedRoute><Orders /></ProtectedRoute>} />
        <Route path="/orders/:orderId" element={<ProtectedRoute><OrderDetails /></ProtectedRoute>} />
        <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
        
        {/* Protected Admin Routes */}
        <Route 
          path="/admin/dashboard" 
          element={
            <ProtectedRoute allowedRoles={['Admin']}>
              <AdminDashboard />
            </ProtectedRoute>
          } 
        />
        <Route path="/admin/transactions" element={<ProtectedRoute allowedRoles={['Admin']}><Transactions /></ProtectedRoute>} />
        <Route path="/admin/invoices" element={<ProtectedRoute allowedRoles={['Admin']}><Invoices /></ProtectedRoute>} />
      </Routes>
    </Router>
  );
}

export default App;