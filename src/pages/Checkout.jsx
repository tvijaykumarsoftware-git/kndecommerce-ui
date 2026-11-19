import React, { useEffect, useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import API from '../api/api';
import UserHeader from '../components/UserHeader';
import SiteFooter from '../components/SiteFooter';
import '../App.css';

const Checkout = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const paymentProvider = location.state?.paymentProvider || 'Credit / Debit Card';
  const paymentDetails = location.state?.paymentDetails || {};
  const [items, setItems] = useState([]);
  const [shippingAddress, setShippingAddress] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [confirmation, setConfirmation] = useState(null);

  useEffect(() => {
    API.get('/cart', {
      headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
    })
      .then(({ data }) => {
        const allocatedPerProduct = {};
        const availableItems = (Array.isArray(data) ? data : []).filter((item) => {
          const liveStock = Number(item.stockQuantity ?? 0);
          const pid = item.productId;
          const used = allocatedPerProduct[pid] || 0;
          if (liveStock <= 0 || used >= liveStock) return false;
          allocatedPerProduct[pid] = used + 1;
          return true;
        });
        setItems(availableItems);
      })
      .catch((requestError) => {
        if (requestError.response?.status === 401) navigate('/login');
        else setError(requestError.response?.data?.message || 'Unable to load your cart.');
      });
  }, [navigate]);

  const total = items.reduce((sum, item) => sum + Number(item.price) * Number(item.quantity ?? 1), 0);

  const placeOrder = async (event) => {
    event.preventDefault();
    setError('');
    setIsSubmitting(true);
    try {
      const payload = {
        shippingAddress,
        paymentProvider,
        vendorName: paymentDetails.vendorName || null,
        cardNumber: paymentDetails.cardNumber || null,
        cardExp: paymentDetails.cardExp || null,
        cardCvv: paymentDetails.cardCvv || null,
        emiTenure: paymentDetails.emiTenure ? Number(paymentDetails.emiTenure) : null,
        emiAmount: paymentDetails.emiAmount ? Number(paymentDetails.emiAmount) : null,
        emiDateOn: paymentDetails.emiDateOn || null,
        cartItemIds: items.map((item) => item.cartItemId) // Only pass in-stock item IDs
      };
      const { data } = await API.post('/orders', payload, {
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

  if (confirmation) {
    return (
      <main className="auth-page confirmation-page">
        <section className="auth-panel confirmation-panel">
          <p className="auth-kicker">Order confirmed</p>
          <h1>Thank you for your order.</h1>
          <p className="auth-subtitle">Order #{confirmation.orderId} is being prepared.</p>
          <p>Invoice: <strong>{confirmation.invoiceNumber}</strong></p>
          <p>Payment Method: <strong>{paymentProvider}</strong></p>
          <Link className="auth-submit summary-action" to="/orders">Back to orders</Link>
        </section>
        <SiteFooter />
      </main>
    );
  }

  return (
    <main className="shop-page narrow-page checkout-page">
      <UserHeader />
      <section>
        <p className="auth-kicker">Almost yours || Checkout</p>
      </section>
      {error && <p className="auth-error shop-alert" role="alert">{error}</p>}
      {items.length === 0 ? (
        <div className="empty-state">
          <p>Your cart is empty or contains only sold-out items.</p>
          <Link className="text-link" to="/catalog">Return to catalog</Link>
        </div>
      ) : (
        <div className="checkout-layout">
          <form className="checkout-form" onSubmit={placeOrder}>
            <label htmlFor="shippingAddress">Shipping address</label>
            <textarea
              id="shippingAddress"
              value={shippingAddress}
              onChange={(event) => setShippingAddress(event.target.value)}
              rows="5"
              required
              placeholder="Street, city, state, postal code"
            />
            <button className="auth-submit" type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Placing order...' : 'Place order'}
            </button>
          </form>
          <aside className="order-review">
            <h2>Order summary</h2>
            {items.map((item) => (
              <p key={item.cartItemId}>
                <span>{item.productName} x {item.quantity ?? 1}</span>
                <strong>₹{(Number(item.price) * Number(item.quantity ?? 1)).toFixed(2)}</strong>
              </p>
            ))}
            <div className="review-payment">
              <span>Payment Option</span>
              <strong>{paymentProvider}</strong>
            </div>
            <div className="review-total">
              <span>Total</span>
              <strong>₹{total.toFixed(2)}</strong>
            </div>
          </aside>
        </div>
      )}
      <SiteFooter />
    </main>
  );
};
export default Checkout;