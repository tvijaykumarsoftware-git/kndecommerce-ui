import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Link, useNavigate } from 'react-router-dom';
import UserHeader from '../components/UserHeader';
import SiteFooter from '../components/SiteFooter';
import '../App.css';

const API_URL = 'http://localhost:5107/api';

const Cart = () => {
  const navigate = useNavigate();
  const [items, setItems] = useState([]);
  const [error, setError] = useState('');
  const [removingId, setRemovingId] = useState(null);

  useEffect(() => {
    const loadCart = async () => {
      try {
        const { data } = await axios.get(`${API_URL}/cart`, {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
        });
        setItems(data);
      } catch (requestError) {
        if (requestError.response?.status === 401) navigate('/login');
        else setError(requestError.response?.data?.message || 'Unable to load your cart.');
      }
    };

    loadCart();
  }, [navigate]);

  const removeItem = async (cartItemId) => {
    setRemovingId(cartItemId);
    setError('');
    try {
      await axios.delete(`${API_URL}/cart/${cartItemId}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      setItems((current) => current.filter((item) => item.cartItemId !== cartItemId));
      window.dispatchEvent(new Event('cartUpdated'));
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Unable to remove this item.');
    } finally {
      setRemovingId(null);
    }
  };

  const total = items.reduce((sum, item) => sum + Number(item.price) * item.quantity, 0);

  return (
    <main className="shop-page narrow-page cart-page">
      <UserHeader />
      <section className="page-heading"><p className="auth-kicker">Your selection</p><h1>Shopping cart</h1></section>
      {error && <p className="auth-error shop-alert" role="alert">{error}</p>}
      {items.length === 0 ? <div className="empty-state"><p>Your cart is empty.</p><Link className="text-link" to="/catalog">Explore the collection</Link></div> : (
        <>
          <section className="cart-list">
            {items.map((item) => <article className="cart-item" key={item.cartItemId}>
              <div className="cart-item-image">{item.imageUrl ? <img src={item.imageUrl} alt="" /> : item.productName.slice(0, 1)}</div>
              <div className="cart-item-copy"><h2>{item.productName}</h2><p>{item.quantity} {item.quantity === 1 ? 'item' : 'items'} at ${Number(item.price).toFixed(2)}</p></div>
              <strong>${(Number(item.price) * item.quantity).toFixed(2)}</strong>
              <button className="remove-button" type="button" disabled={removingId === item.cartItemId} onClick={() => removeItem(item.cartItemId)}>{removingId === item.cartItemId ? 'Removing...' : 'Remove'}</button>
            </article>)}
          </section>
          <section className="cart-summary"><span>Total</span><strong>${total.toFixed(2)}</strong><Link className="auth-submit summary-action" to="/checkout">Checkout</Link></section>
        </>
      )}
      <SiteFooter />
    </main>
  );
};

export default Cart;