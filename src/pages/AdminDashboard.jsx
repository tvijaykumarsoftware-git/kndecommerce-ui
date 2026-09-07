import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Link, useNavigate } from 'react-router-dom';
import { Area, AreaChart, Bar, BarChart, CartesianGrid, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import UserHeader from '../components/UserHeader';
import SiteFooter from '../components/SiteFooter';
import '../App.css';

const API_URL = 'http://localhost:5107/api';

const AdminDashboard = () => {
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [orders, setOrders] = useState([]);
  const [error, setError] = useState('');

  useEffect(() => {
    const loadData = async () => {
      try {
        const requestConfig = { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } };
        const [productsResponse, categoriesResponse, ordersResponse] = await Promise.all([
          axios.get(`${API_URL}/products`),
          axios.get(`${API_URL}/categories`),
          axios.get(`${API_URL}/orders`, requestConfig)
        ]);
        setProducts(productsResponse.data);
        setCategories(categoriesResponse.data);
        setOrders(ordersResponse.data);
      } catch (requestError) {
        if (requestError.response?.status === 401 || requestError.response?.status === 403) {
          navigate('/login');
          return;
        }
        setError('Unable to load the dashboard data.');
      }
    };

    loadData();
  }, [navigate]);

  const totalProducts = products.length;
  const totalCategories = categories.length;
  const activeCategories = categories.filter((category) => category.isActive).length;
  const lowStockProducts = products.filter((product) => Number(product.stockQuantity) <= 5).length;
  const revenue = orders.reduce((total, order) => total + Number(order.totalAmount || 0), 0);
  const orderStatusData = Object.entries(orders.reduce((statusCounts, order) => {
    const status = order.orderStatus || 'Unknown';
    statusCounts[status] = (statusCounts[status] || 0) + 1;
    return statusCounts;
  }, {})).map(([name, value]) => ({ name, value }));
  const categoryStockData = categories.map((category) => ({
    name: category.name,
    stock: products
      .filter((product) => product.categoryId === category.categoryId)
      .reduce((total, product) => total + Number(product.stockQuantity || 0), 0)
  })).filter((category) => category.stock > 0);
  const revenueData = orders.reduce((dailyRevenue, order) => {
    const date = new Date(order.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
    const current = dailyRevenue.find((entry) => entry.name === date);
    if (current) current.revenue += Number(order.totalAmount || 0);
    else dailyRevenue.push({ name: date, revenue: Number(order.totalAmount || 0) });
    return dailyRevenue;
  }, []).slice(-7);
  const lowStockList = products.filter((product) => Number(product.stockQuantity) <= 5).sort((first, second) => Number(first.stockQuantity) - Number(second.stockQuantity)).slice(0, 5);
  const chartColors = ['#18312f', '#c65d3b', '#d9a441', '#60716d', '#9a6b55'];

  return (
    <main className="shop-page narrow-page admin-page">
      <UserHeader />
      <section className="page-heading">
        <p className="auth-kicker">Overview</p>
        <h1>Store management</h1>
      </section>
      {error && <p className="auth-error shop-alert" role="alert">{error}</p>}

      <section className="admin-overview-grid">
        <article className="admin-overview-card">
          <span>Total products</span>
          <strong>{totalProducts}</strong>
        </article>
        <article className="admin-overview-card">
          <span>Total categories</span>
          <strong>{totalCategories}</strong>
        </article>
        <article className="admin-overview-card">
          <span>Active categories</span>
          <strong>{activeCategories}</strong>
        </article>
        <article className="admin-overview-card warning">
          <span>Low stock</span>
          <strong>{lowStockProducts}</strong>
        </article>
      </section>

      <section className="admin-quick-links">
        <Link className="summary-action" to="/products">Manage products</Link>
        <Link className="summary-action" to="/categories">Manage categories</Link>
        <Link className="summary-action" to="/admin/transactions">View transactions</Link>
        <Link className="summary-action" to="/admin/invoices">View invoices</Link>
      </section>

      <section className="admin-dashboard-grid" aria-label="Store analytics">
        <article className="admin-chart-card admin-chart-card-wide">
          <div className="admin-chart-heading"><div><p className="auth-kicker">Performance</p><h2>Revenue trend</h2></div><strong>${revenue.toFixed(2)} total</strong></div>
          <div className="admin-chart"><ResponsiveContainer width="100%" height="100%"><AreaChart data={revenueData} margin={{ top: 8, right: 8, left: -24, bottom: 0 }}><defs><linearGradient id="revenueFill" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#c65d3b" stopOpacity={0.35} /><stop offset="100%" stopColor="#c65d3b" stopOpacity={0.03} /></linearGradient></defs><CartesianGrid stroke="#d8e0da" strokeDasharray="3 3" vertical={false} /><XAxis dataKey="name" tick={{ fill: '#60716d', fontSize: 12 }} axisLine={false} tickLine={false} /><YAxis tick={{ fill: '#60716d', fontSize: 12 }} axisLine={false} tickLine={false} tickFormatter={(value) => `$${value}`} /><Tooltip formatter={(value) => [`$${Number(value).toFixed(2)}`, 'Revenue']} contentStyle={{ border: '1px solid #d8e0da', borderRadius: 4, background: '#fffdf8' }} /><Area type="monotone" dataKey="revenue" stroke="#c65d3b" strokeWidth={3} fill="url(#revenueFill)" /></AreaChart></ResponsiveContainer></div>
        </article>
        <article className="admin-chart-card">
          <div className="admin-chart-heading"><div><p className="auth-kicker">Orders</p><h2>Order status</h2></div><strong>{orders.length} total</strong></div>
          <div className="admin-chart admin-pie-chart"><ResponsiveContainer width="100%" height="100%"><PieChart><Pie data={orderStatusData} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius="55%" outerRadius="78%" paddingAngle={3}>{orderStatusData.map((entry, index) => <Cell key={entry.name} fill={chartColors[index % chartColors.length]} />)}</Pie><Tooltip contentStyle={{ border: '1px solid #d8e0da', borderRadius: 4, background: '#fffdf8' }} /></PieChart></ResponsiveContainer></div>
          <div className="admin-legend">{orderStatusData.map((entry, index) => <span key={entry.name}><i style={{ backgroundColor: chartColors[index % chartColors.length] }} />{entry.name} <strong>{entry.value}</strong></span>)}</div>
        </article>
        <article className="admin-chart-card admin-chart-card-wide">
          <div className="admin-chart-heading"><div><p className="auth-kicker">Inventory</p><h2>Stock by category</h2></div><strong>{products.reduce((total, product) => total + Number(product.stockQuantity || 0), 0)} units</strong></div>
          <div className="admin-chart"><ResponsiveContainer width="100%" height="100%"><BarChart data={categoryStockData} margin={{ top: 8, right: 8, left: -24, bottom: 0 }}><CartesianGrid stroke="#d8e0da" strokeDasharray="3 3" vertical={false} /><XAxis dataKey="name" tick={{ fill: '#60716d', fontSize: 12 }} axisLine={false} tickLine={false} /><YAxis tick={{ fill: '#60716d', fontSize: 12 }} axisLine={false} tickLine={false} /><Tooltip cursor={{ fill: 'rgba(216, 224, 218, 0.35)' }} contentStyle={{ border: '1px solid #d8e0da', borderRadius: 4, background: '#fffdf8' }} /><Bar dataKey="stock" fill="#18312f" radius={[3, 3, 0, 0]} /></BarChart></ResponsiveContainer></div>
        </article>
        <article className="admin-chart-card stock-watchlist"><div className="admin-chart-heading"><div><p className="auth-kicker">Attention</p><h2>Low stock watchlist</h2></div><strong>{lowStockProducts} items</strong></div>{lowStockList.length > 0 ? <div className="stock-watchlist-items">{lowStockList.map((product) => <div key={product.productId}><span>{product.name}</span><strong className={Number(product.stockQuantity) === 0 ? 'out-of-stock' : ''}>{product.stockQuantity} left</strong></div>)}</div> : <p className="empty-state">All products are well stocked.</p>}</article>
      </section>

      <SiteFooter />
    </main>
  );
};

export default AdminDashboard;