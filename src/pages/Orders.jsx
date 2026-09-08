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

  // Modal states
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [modalType, setModalType] = useState(null); // 'status' or 'rate'
  const [selectedStatus, setSelectedStatus] = useState('');
  const [selectedRating, setSelectedRating] = useState(0);

  const fetchOrders = () => {
    axios.get(`${API_URL}/orders`, { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } })
      .then(({ data }) => setOrders(data))
      .catch((requestError) => {
        if (requestError.response?.status === 401) navigate('/login');
        else setError(requestError.response?.data?.message || 'Unable to load your orders.');
      });
  };

  useEffect(() => {
    fetchOrders();
  }, [navigate]);

  const pageCount = Math.max(1, Math.ceil(orders.length / ITEMS_PER_PAGE));
  const safeCurrentPage = Math.min(currentPage, pageCount);
  const visibleOrders = orders.slice((safeCurrentPage - 1) * ITEMS_PER_PAGE, safeCurrentPage * ITEMS_PER_PAGE);

  useEffect(() => {
    if (currentPage > pageCount) setCurrentPage(pageCount);
  }, [currentPage, pageCount]);

  const openStatusModal = (order) => {
    setError('');
    setSelectedOrder(order);
    setSelectedStatus(order.orderStatus);
    setModalType('status');
  };

  const openRatingModal = (order) => {
    setError('');
    setSelectedOrder(order);
    setSelectedRating(order.rating || 0);
    setModalType('rate');
  };

  const closeModal = () => {
    setSelectedOrder(null);
    setModalType(null);
    setSelectedStatus('');
    setSelectedRating(0);
  };

  const handleStatusSubmit = async () => {
    if (!selectedOrder) return;
    setError('');

    try {
      await axios.put(
        `${API_URL}/orders/${selectedOrder.orderId}/status`,
        { orderStatus: selectedStatus },
        { 
          headers: { 
            'Content-Type': 'application/json',
            Authorization: `Bearer ${localStorage.getItem('token')}` 
          } 
        }
      );
      fetchOrders();
      closeModal();
    } catch (err) {
      console.error("Status Update Failed:", err.response);
      const msg = err.response?.data?.message || err.response?.data || err.message || 'Failed to update status';
      setError(typeof msg === 'string' ? msg : JSON.stringify(msg));
    }
  };

  const handleRatingSubmit = async () => {
    if (!selectedOrder || selectedRating === 0) return;
    setError('');

    try {
      await axios.put(
        `${API_URL}/orders/${selectedOrder.orderId}/rate`,
        { rating: selectedRating },
        { 
          headers: { 
            'Content-Type': 'application/json',
            Authorization: `Bearer ${localStorage.getItem('token')}` 
          } 
        }
      );
      fetchOrders();
      closeModal();
    } catch (err) {
      console.error("Rating Submission Failed:", err.response);
      const msg = err.response?.data?.message || err.response?.data || err.message || 'Failed to submit rating';
      setError(typeof msg === 'string' ? msg : JSON.stringify(msg));
    }
  };

  return (
    <main className="shop-page narrow-page">
      <UserHeader />
      <section className="page-heading">
        <p className="auth-kicker">Your purchases</p>
        <h1>Orders</h1>
      </section>

      {error && <p className="auth-error shop-alert" role="alert">{error}</p>}

      <section className="order-list" aria-label="Order history">
        {visibleOrders.map((order) => {
          const isDelivered = String(order.orderStatus).toLowerCase() === 'delivered';

          return (
            <article className="order-card" key={order.orderId}>
              <div>
                <strong>Order #{order.orderId}</strong>
                <span>{new Date(order.createdAt).toLocaleDateString()} · {(order.orderItems || []).length} item{(order.orderItems || []).length === 1 ? '' : 's'}</span>
                <span className={getStatusClass(order.orderStatus)}>{order.orderStatus} · ${Number(order.totalAmount).toFixed(2)}</span>
                {order.rating > 0 && (
                  <span style={{ color: '#ffc107', marginTop: '4px', display: 'block', fontWeight: 'bold' }}>
                    Rating: {'★'.repeat(order.rating)}{'☆'.repeat(5 - order.rating)}
                  </span>
                )}
              </div>

              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                {!isDelivered ? (
                  <button type="button" className="summary-action" onClick={() => openStatusModal(order)}>
                    Status
                  </button>
                ) : (
                  <button type="button" className="summary-action" onClick={() => openRatingModal(order)}>
                    {order.rating ? 'Update Rating' : 'Rate Us'}
                  </button>
                )}
                <Link className="summary-action" to={`/orders/${order.orderId}`}>View details</Link>
              </div>
            </article>
          );
        })}
      </section>

      {pageCount > 1 && (
        <nav className="admin-pagination" aria-label="Order pagination">
          <button type="button" disabled={safeCurrentPage === 1} onClick={() => setCurrentPage((page) => page - 1)}>Previous</button>
          {Array.from({ length: pageCount }, (_, index) => index + 1).map((pageNumber) => (
            <button key={pageNumber} type="button" className={pageNumber === safeCurrentPage ? 'pagination-page is-active' : 'pagination-page'} aria-current={pageNumber === safeCurrentPage ? 'page' : undefined} onClick={() => setCurrentPage(pageNumber)}>{pageNumber}</button>
          ))}
          <button type="button" disabled={safeCurrentPage === pageCount} onClick={() => setCurrentPage((page) => page + 1)}>Next</button>
        </nav>
      )}

      {!error && orders.length === 0 && <p className="empty-state">No orders found.</p>}

      {/* Status Update Modal */}
      {modalType === 'status' && (
        <div className="modal-overlay" style={modalOverlayStyle}>
          <div className="modal-content" style={modalContentStyle}>
            <h3 style={{ marginTop: 0 }}>Update Order #{selectedOrder?.orderId} Status</h3>
            <div style={{ margin: '15px 0' }}>
              {['Pending', 'Processing', 'Shipped', 'Delivered'].map((status) => (
                <label key={status} style={{ display: 'flex', alignItems: 'center', margin: '10px 0', cursor: 'pointer' }}>
                  <input
                    type="radio"
                    name="orderStatus"
                    value={status}
                    checked={selectedStatus === status}
                    onChange={(e) => setSelectedStatus(e.target.value)}
                  />
                  <span style={{ marginLeft: '10px', fontSize: '15px' }}>{status}</span>
                </label>
              ))}
            </div>
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '20px' }}>
              <button type="button" className="btn-secondary" style={buttonStyle} onClick={closeModal}>Cancel</button>
              <button type="button" className="btn-primary" style={{ ...buttonStyle, backgroundColor: '#000', color: '#fff' }} onClick={handleStatusSubmit}>Save</button>
            </div>
          </div>
        </div>
      )}

      {/* Rating Modal */}
      {modalType === 'rate' && (
        <div className="modal-overlay" style={modalOverlayStyle}>
          <div className="modal-content" style={modalContentStyle}>
            <h3 style={{ marginTop: 0 }}>Rate Order #{selectedOrder?.orderId}</h3>
            <div style={{ fontSize: '32px', margin: '20px 0', cursor: 'pointer', textAlign: 'center' }}>
              {[1, 2, 3, 4, 5].map((star) => (
                <span
                  key={star}
                  onClick={() => setSelectedRating(star)}
                  style={{ color: star <= selectedRating ? '#ffc107' : '#e4e5e9', padding: '0 6px', userSelect: 'none' }}
                >
                  ★
                </span>
              ))}
            </div>
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '20px' }}>
              <button type="button" className="btn-secondary" style={buttonStyle} onClick={closeModal}>Cancel</button>
              <button type="button" className="btn-primary" style={{ ...buttonStyle, backgroundColor: '#000', color: '#fff' }} disabled={selectedRating === 0} onClick={handleRatingSubmit}>
                Submit Rating
              </button>
            </div>
          </div>
        </div>
      )}

      <SiteFooter />
    </main>
  );
};

// Styling definitions
const modalOverlayStyle = {
  position: 'fixed',
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  backgroundColor: 'rgba(0, 0, 0, 0.6)',
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  zIndex: 1000
};

const modalContentStyle = {
  background: '#ffffff',
  padding: '24px',
  borderRadius: '8px',
  minWidth: '320px',
  maxWidth: '400px',
  boxShadow: '0 10px 25px rgba(0,0,0,0.2)'
};

const buttonStyle = {
  padding: '8px 16px',
  borderRadius: '4px',
  border: '1px solid #ccc',
  cursor: 'pointer'
};

export default Orders;
