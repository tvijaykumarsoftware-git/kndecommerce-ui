import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Link, useNavigate, useParams } from 'react-router-dom';
import UserHeader from '../components/UserHeader';
import SiteFooter from '../components/SiteFooter';
import '../App.css';

const API_URL = 'http://localhost:5107/api';

// Step definition with individual color coding
const ALL_STEPS = [
  { key: 'pending', label: 'Pending', color: '#f59e0b', bg: '#fef3c7' },
  { key: 'processing', label: 'Processing', color: '#3b82f6', bg: '#dbeafe' },
  { key: 'shipped', label: 'Shipped', color: '#8b5cf6', bg: '#ede9fe' },
  { key: 'cancelled', label: 'Cancelled', color: '#ef4444', bg: '#fee2e2' },
  { key: 'delivered', label: 'Delivered', color: '#10b981', bg: '#d1fae5' },
];

const getStatusStyle = (status) => {
  const matched = ALL_STEPS.find(s => s.key === String(status || '').toLowerCase());
  if (matched) {
    return { color: matched.color, backgroundColor: matched.bg, padding: '4px 12px', borderRadius: '12px', fontWeight: '600' };
  }
  return { color: '#6b7280', backgroundColor: '#f3f4f6', padding: '4px 12px', borderRadius: '12px', fontWeight: '600' };
};

const OrderDetails = () => {
  const navigate = useNavigate();
  const { orderId } = useParams();
  const [order, setOrder] = useState(null);
  const [error, setError] = useState('');
  const [isDownloading, setIsDownloading] = useState(false);

  useEffect(() => {
    axios.get(`${API_URL}/orders/${encodeURIComponent(orderId)}`, { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } })
      .then(({ data }) => setOrder({ ...data, orderItems: data.orderItems || [], transactions: data.transactions || [], invoices: data.invoices || [] }))
      .catch((requestError) => {
        if (requestError.response?.status === 401) navigate('/login');
        else setError(requestError.response?.data?.message || 'Unable to load this order.');
      });
  }, [navigate, orderId]);

  const downloadInvoice = async () => {
    setIsDownloading(true);
    setError('');
    try {
      const response = await axios.get(`${API_URL}/invoices/generate/${orderId}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
        responseType: 'blob'
      });
      const url = URL.createObjectURL(response.data);
      const link = document.createElement('a');
      link.href = url;
      link.download = `Invoice_${orderId}.pdf`;
      link.click();
      URL.revokeObjectURL(url);
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Unable to download the invoice.');
    } finally {
      setIsDownloading(false);
    }
  };

  const currentStatus = String(order?.orderStatus || '').toLowerCase();
  const isCancelled = ['cancelled', 'canceled'].includes(currentStatus);

  // If not cancelled, exclude 'Cancelled' from the flow entirely
  const activeStepsList = isCancelled 
    ? ALL_STEPS 
    : ALL_STEPS.filter(step => step.key !== 'cancelled');

  const activeIndex = activeStepsList.findIndex(s => s.key === currentStatus);

  return (
    <main className="shop-page narrow-page">
      <UserHeader />
      <section className="page-heading">
        <p className="auth-kicker">Order tracking</p>
        <h1>{order ? `Order #${order.orderId}` : 'Order details'}</h1>
      </section>

      {error && <p className="auth-error shop-alert" role="alert">{error}</p>}

      {order && <>
        <section className="tracking-panel" aria-label="Order tracking status">
          <div className="section-heading-row">
            <div>
              <p className="auth-kicker">Current status</p>
              <h2>
                <span style={getStatusStyle(order.orderStatus)}>{order.orderStatus}</span>
              </h2>
            </div>
            <span>{new Date(order.createdAt).toLocaleDateString()}</span>
          </div>

          {/* Expanded Color-Coded Tracking Steps with Larger Arrows */}
          <ol className="tracking-steps" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px', flexWrap: 'nowrap', marginTop: '24px', width: '100%', padding: 0, listStyle: 'none' }}>
            {activeStepsList.map((step, index) => {
              const isPassed = activeIndex !== -1 && index <= activeIndex;
              
              const circleBg = isPassed ? step.color : '#e5e7eb';
              const circleTextColor = isPassed ? '#ffffff' : '#6b7280';
              const labelColor = isPassed ? step.color : '#9ca3af';

              return (
                <React.Fragment key={step.key}>
                  <li style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: '1', justifyContent: 'center' }}>
                    <span style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      width: '28px',
                      height: '28px',
                      borderRadius: '50%',
                      backgroundColor: circleBg,
                      color: circleTextColor,
                      fontSize: '13px',
                      fontWeight: 'bold',
                      flexShrink: 0,
                      transition: 'all 0.3s'
                    }}>
                      {index + 1}
                    </span>
                    <strong style={{ color: labelColor, fontSize: '14px', whiteSpace: 'nowrap', transition: 'color 0.3s' }}>
                      {step.label}
                    </strong>
                  </li>
                  {index < activeStepsList.length - 1 && (
                    <span style={{ 
                      color: index < activeIndex ? step.color : '#d1d5db', 
                      fontWeight: 'bold', 
                      fontSize: '24px', // Increased arrow size here
                      margin: '0 12px', 
                      flexShrink: 0,
                      lineHeight: '1'
                    }} aria-hidden="true">
                      →
                    </span>
                  )}
                </React.Fragment>
              );
            })}
          </ol>
        </section>

        <div className="order-detail-layout">
          <section className="order-detail-section">
            <div className="section-heading-row">
              <h2>Items</h2>
              <span>{order.orderItems.length} item{order.orderItems.length === 1 ? '' : 's'}</span>
            </div>
            <div className="order-items">
              {order.orderItems.map((item) => (
                <div className="order-item-row" key={item.orderItemId}>
                  <div>
                    <strong>{item.productName}</strong>
                    <span>{item.quantity} x \${Number(item.unitPrice).toFixed(2)}</span>
                  </div>
                  <strong>\${Number(item.lineTotal).toFixed(2)}</strong>
                </div>
              ))}
            </div>
            <div className="review-total">
              <span>Total</span>
              <strong>\${Number(order.totalAmount).toFixed(2)}</strong>
            </div>
          </section>

          <aside className="order-detail-aside">
            <div>
              <h2>Delivery</h2>
              <p>{order.shippingAddress}</p>
            </div>
            <div>
              <h2>Payment</h2>
              <p>{order.transactions[0]?.status || 'Pending'}{order.transactions[0]?.transactionReference ? ` · ${order.transactions[0].transactionReference}` : ''}</p>
            </div>
            {order.invoices.length > 0 && (
              <button className="summary-action" type="button" disabled={isDownloading} onClick={downloadInvoice}>
                {isDownloading ? 'Preparing...' : 'Download invoice'}
              </button>
            )}
          </aside>
        </div>

        <Link className="text-link order-back-link" to="/orders">Back to orders</Link>
      </>}

      {!order && !error && <p className="empty-state">Loading order details...</p>}
      <SiteFooter />
    </main>
  );
};

export default OrderDetails;