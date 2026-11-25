import React, { useEffect, useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import API from '../api/api';
import UserHeader from '../components/UserHeader';
import SiteFooter from '../components/SiteFooter';
import '../App.css';

const Checkout = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const paymentProvider = location.state?.paymentProvider || 'Cash on Delivery';
  const [items, setItems] = useState([]);
  const [shippingAddress, setShippingAddress] = useState(location.state?.shippingAddress || '');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [confirmation, setConfirmation] = useState(location.state?.confirmation || null);

  useEffect(() => {
    if (location.state?.confirmation) return;

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
  }, [location.state, navigate]);

  const getItemTotal = (item) => {
    const price = Number(item.price ?? 0);
    const discounted = Number(item.discountOnMRP ?? 0);
    const sellingPrice = discounted > 0 && discounted < price ? discounted : price;
    return (sellingPrice + Number(item.platformFee ?? 0)) * Number(item.quantity ?? 1);
  };
  const total = items.reduce((sum, item) => sum + getItemTotal(item), 0);

  const placeOrder = async (event) => {
    event.preventDefault();
    setError('');
    setIsSubmitting(true);
    try {
      const payload = {
        shippingAddress,
        paymentProvider,
        cartItemIds: location.state?.cartItemIds || items.map((item) => item.cartItemId)
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
                <strong>₹{getItemTotal(item).toFixed(2)}</strong>
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