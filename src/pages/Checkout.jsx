import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Link, useNavigate } from 'react-router-dom';
import UserHeader from '../components/UserHeader';
import SiteFooter from '../components/SiteFooter';
import '../App.css';

const API_URL = 'http://localhost:5107/api';

const Checkout = () => {
  const navigate = useNavigate();
  const [items, setItems] = useState([]);
  const [shippingAddress, setShippingAddress] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [confirmation, setConfirmation] = useState(null);

  useEffect(() => {
    axios.get(`${API_URL}/cart`, { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } })
      .then(({ data }) => setItems(data))
      .catch((requestError) => {
        if (requestError.response?.status === 401) navigate('/login');
        else setError(requestError.response?.data?.message || 'Unable to load your cart.');
      });
  }, [navigate]);

  const total = items.reduce((sum, item) => sum + Number(item.price) * item.quantity, 0);

  const placeOrder = async (event) => {
    event.preventDefault();
    setError('');
    setIsSubmitting(true);
    try {
      const { data } = await axios.post(`${API_URL}/orders`, { shippingAddress }, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      setConfirmation(data);
      setItems([]);
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Unable to place your order.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (confirmation) return <main className="auth-page confirmation-page"><section className="auth-panel confirmation-panel"><p className="auth-kicker">Order confirmed</p><h1>Thank you for your order.</h1><p className="auth-subtitle">Order #{confirmation.orderId} is being prepared.</p><p>Invoice: <strong>{confirmation.invoiceNumber}</strong></p><Link className="auth-submit summary-action" to="/orders">Back to orders</Link></section><SiteFooter /></main>;

  return (
    <main className="shop-page narrow-page checkout-page">
      <UserHeader />
      <section className="page-heading"><p className="auth-kicker">Almost yours</p><h1>Checkout</h1></section>
      {error && <p className="auth-error shop-alert" role="alert">{error}</p>}
      {items.length === 0 ? <div className="empty-state"><p>Your cart is empty.</p><Link className="text-link" to="/catalog">Return to catalog</Link></div> : <div className="checkout-layout">
        <form className="checkout-form" onSubmit={placeOrder}><label htmlFor="shippingAddress">Shipping address</label><textarea id="shippingAddress" value={shippingAddress} onChange={(event) => setShippingAddress(event.target.value)} rows="5" required placeholder="Street, city, state, postal code" /><button className="auth-submit" type="submit" disabled={isSubmitting}>{isSubmitting ? 'Placing order...' : 'Place order'}</button></form>
        <aside className="order-review"><h2>Order summary</h2>{items.map((item) => <p key={item.cartItemId}><span>{item.productName} x {item.quantity}</span><strong>${(Number(item.price) * item.quantity).toFixed(2)}</strong></p>)}<div className="review-total"><span>Total</span><strong>${total.toFixed(2)}</strong></div></aside>
      </div>}
      <SiteFooter />
    </main>
  );
};

export default Checkout;