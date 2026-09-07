import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Link, useNavigate } from 'react-router-dom';
import UserHeader from '../components/UserHeader';
import SiteFooter from '../components/SiteFooter';
import '../App.css';

const API_URL = 'http://localhost:5107/api';
const ITEMS_PER_PAGE = 8;

const getStatusClass = (status) => `order-status status-${String(status || 'unknown').toLowerCase().replace(/[^a-z0-9]+/g, '-')}`;

const Orders = () => {
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [error, setError] = useState('');

  useEffect(() => {
    axios.get(`${API_URL}/orders`, { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } })
      .then(({ data }) => setOrders(data))
      .catch((requestError) => {
        if (requestError.response?.status === 401) navigate('/login');
        else setError(requestError.response?.data?.message || 'Unable to load your orders.');
      });
  }, [navigate]);

  const pageCount = Math.max(1, Math.ceil(orders.length / ITEMS_PER_PAGE));
  const safeCurrentPage = Math.min(currentPage, pageCount);
  const visibleOrders = orders.slice((safeCurrentPage - 1) * ITEMS_PER_PAGE, safeCurrentPage * ITEMS_PER_PAGE);

  useEffect(() => {
    if (currentPage > pageCount) setCurrentPage(pageCount);
  }, [currentPage, pageCount]);

  return (
    <main className="shop-page narrow-page">
      <UserHeader />
      <section className="page-heading"><p className="auth-kicker">Your purchases</p><h1>Orders</h1></section>
      {error && <p className="auth-error shop-alert" role="alert">{error}</p>}
      <section className="order-list" aria-label="Order history">
        {visibleOrders.map((order) => (
          <article className="order-card" key={order.orderId}>
            <div>
              <strong>Order #{order.orderId}</strong>
              <span>{new Date(order.createdAt).toLocaleDateString()} · {(order.orderItems || []).length} item{(order.orderItems || []).length === 1 ? '' : 's'}</span>
              <span className={getStatusClass(order.orderStatus)}>{order.orderStatus} · ${Number(order.totalAmount).toFixed(2)}</span>
            </div>
            <Link className="summary-action" to={`/orders/${order.orderId}`}>View details</Link>
          </article>
        ))}
      </section>
      {pageCount > 1 && <nav className="admin-pagination" aria-label="Order pagination">
        <button type="button" disabled={safeCurrentPage === 1} onClick={() => setCurrentPage((page) => page - 1)}>Previous</button>
        {Array.from({ length: pageCount }, (_, index) => index + 1).map((pageNumber) => (
          <button key={pageNumber} type="button" className={pageNumber === safeCurrentPage ? 'pagination-page is-active' : 'pagination-page'} aria-current={pageNumber === safeCurrentPage ? 'page' : undefined} onClick={() => setCurrentPage(pageNumber)}>{pageNumber}</button>
        ))}
        <button type="button" disabled={safeCurrentPage === pageCount} onClick={() => setCurrentPage((page) => page + 1)}>Next</button>
      </nav>}
      {!error && orders.length === 0 && <p className="empty-state">No orders found.</p>}
      <SiteFooter />
    </main>
  );
};

export default Orders;
