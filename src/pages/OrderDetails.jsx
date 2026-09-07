import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Link, useNavigate, useParams } from 'react-router-dom';
import UserHeader from '../components/UserHeader';
import SiteFooter from '../components/SiteFooter';
import '../App.css';

const API_URL = 'http://localhost:5107/api';
const TRACKING_STEPS = ['Pending', 'Processing', 'Shipped', 'Delivered'];

const getStatusClass = (status) => `order-status status-${String(status || 'unknown').toLowerCase().replace(/[^a-z0-9]+/g, '-')}`;

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

  const activeStep = order ? TRACKING_STEPS.findIndex((step) => step.toLowerCase() === String(order.orderStatus).toLowerCase()) : -1;

  return (
    <main className="shop-page narrow-page">
      <UserHeader />
      <section className="page-heading"><p className="auth-kicker">Order tracking</p><h1>{order ? `Order #${order.orderId}` : 'Order details'}</h1></section>
      {error && <p className="auth-error shop-alert" role="alert">{error}</p>}
      {order && <>
        <section className="tracking-panel" aria-label="Order tracking status">
          <div className="section-heading-row"><div><p className="auth-kicker">Current status</p><h2 className={getStatusClass(order.orderStatus)}>{order.orderStatus}</h2></div><span>{new Date(order.createdAt).toLocaleDateString()}</span></div>
          <ol className="tracking-steps">
            {TRACKING_STEPS.map((step, index) => <li className={index <= activeStep ? 'is-complete' : ''} key={step}><span>{index + 1}</span><strong>{step}</strong></li>)}
          </ol>
        </section>
        <div className="order-detail-layout">
          <section className="order-detail-section"><div className="section-heading-row"><h2>Items</h2><span>{order.orderItems.length} item{order.orderItems.length === 1 ? '' : 's'}</span></div>
            <div className="order-items">{order.orderItems.map((item) => <div className="order-item-row" key={item.orderItemId}><div><strong>{item.productName}</strong><span>{item.quantity} x ${Number(item.unitPrice).toFixed(2)}</span></div><strong>${Number(item.lineTotal).toFixed(2)}</strong></div>)}</div>
            <div className="review-total"><span>Total</span><strong>${Number(order.totalAmount).toFixed(2)}</strong></div>
          </section>
          <aside className="order-detail-aside"><div><h2>Delivery</h2><p>{order.shippingAddress}</p></div><div><h2>Payment</h2><p>{order.transactions[0]?.status || 'Pending'}{order.transactions[0]?.transactionReference ? ` · ${order.transactions[0].transactionReference}` : ''}</p></div>{order.invoices.length > 0 && <button className="summary-action" type="button" disabled={isDownloading} onClick={downloadInvoice}>{isDownloading ? 'Preparing...' : 'Download invoice'}</button>}</aside>
        </div>
        <Link className="text-link order-back-link" to="/orders">Back to orders</Link>
      </>}
      {!order && !error && <p className="empty-state">Loading order details...</p>}
      <SiteFooter />
    </main>
  );
};

export default OrderDetails;
