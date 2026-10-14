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
import MorePage from './pages/MorePages';
import Payment from './pages/Payment';
import ProtectedRoute from './components/ProtectedRoute';
import HelpAssistant from './components/HelpAssistant';
import { ApplicationInsights } from '@microsoft/applicationinsights-web';
import './App.css';

const appInsights = new ApplicationInsights({
  config: {
    connectionString: 'InstrumentationKey=519027f1-92d5-4fff-979c-4efa4279ebf2;IngestionEndpoint=https://westus3-1.in.applicationinsights.azure.com/;LiveEndpoint=https://westus3.livediagnostics.monitor.azure.com/;ApplicationId=9a5261b1-2e76-48ee-935f-6cccbc1e9e8f',
    enableAutoRouteTracking: true,
    enableUnhandledPromiseRejectionTracking: true,
  },
});
appInsights.loadAppInsights();
appInsights.trackPageView();

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Registration />} />
        <Route path="/about" element={<About />} />
        <Route path="/contact" element={<ContactUs />} />
        <Route path="/notification-preferences" element={<MorePage type="notifications" />} />
        <Route path="/customer-care" element={<MorePage type="support" />} />
        <Route path="/advertise" element={<MorePage type="advertise" />} />
        <Route path="/catalog" element={<ProductCatalog />} />
        
        {/* Protected Admin Routes */}
        <Route path="/products" element={<ProtectedRoute allowedRoles={['Admin']}><Product /></ProtectedRoute>} />
        <Route path="/categories" element={<ProtectedRoute allowedRoles={['Admin']}><Category /></ProtectedRoute>} />
        <Route path="/cart" element={<ProtectedRoute><Cart /></ProtectedRoute>} />
        <Route path="/checkout" element={<ProtectedRoute><Checkout /></ProtectedRoute>} />
        <Route path="/orders" element={<ProtectedRoute><Orders /></ProtectedRoute>} />
        <Route path="/orders/:orderId" element={<ProtectedRoute><OrderDetails /></ProtectedRoute>} />
        <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
        <Route path="/payment" element={<ProtectedRoute><Payment /></ProtectedRoute>} />
        <Route path="/admin/dashboard" element={<ProtectedRoute allowedRoles={['Admin']}><AdminDashboard /></ProtectedRoute>} />
        <Route path="/admin/transactions" element={<ProtectedRoute allowedRoles={['Admin']}><Transactions /></ProtectedRoute>} />
        <Route path="/admin/invoices" element={<ProtectedRoute allowedRoles={['Admin']}><Invoices /></ProtectedRoute>} />
        
        <Route path="*" element={<Navigate to="/catalog" replace />} />
      </Routes>
      <HelpAssistant />
    </Router>
  );
}

export default App;