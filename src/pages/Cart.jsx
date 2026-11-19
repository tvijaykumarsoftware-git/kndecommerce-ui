import React, { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import API from '../api/api';
import UserHeader from '../components/UserHeader';
import SiteFooter from '../components/SiteFooter';
import '../App.css';

const getItemName = (item) => item.productName || item.product?.name || item.name || 'Product';
const getItemImage = (item) => item.imageUrl || item.product?.imageUrl;
const getItemPrice = (item) => {
  const price = Number(item.price ?? 0);
  const discounted = Number(item.discountOnMRP ?? item.sellingPrice ?? 0);
  return discounted > 0 && discounted < price ? discounted : price;
};

const Cart = () => {
  const navigate = useNavigate();
  const [items, setItems] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [busyItemId, setBusyItemId] = useState(null);
  const [error, setError] = useState('');

  const loadCart = useCallback(async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/login');
      return;
    }
    try {
      const { data } = await API.get('/cart', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const rawList = Array.isArray(data) ? data : data?.items ?? data?.cartItems ?? [];

      const allocatedPerProduct = {};
      const formattedList = [];

      rawList.forEach((item) => {
        const qty = Number(item.quantity ?? 1);
        const baseCartItemId = item.cartItemId ?? item.cartId ?? item.id;
        const productId = item.productId;
        const productName = getItemName(item);
        const unitPrice = getItemPrice(item);
        const imageUrl = getItemImage(item);
        const liveStock = Number(item.stockQuantity ?? 0);

        for (let i = 0; i < qty; i++) {
          const alreadyAllocated = allocatedPerProduct[productId] || 0;
          const isSoldOut = liveStock <= 0 || alreadyAllocated >= liveStock;

          if (!isSoldOut) {
            allocatedPerProduct[productId] = alreadyAllocated + 1;
          }

          formattedList.push({
            cartItemId: qty > 1 ? `${baseCartItemId}-${i}` : baseCartItemId,
            rawCartItemId: baseCartItemId,
            productId,
            productName,
            price: isSoldOut ? 0 : unitPrice,
            originalPrice: unitPrice,
            isSoldOut,
            imageUrl,
            uniqueKey: `${baseCartItemId}-${i}`
          });
        }
      });

      setItems(formattedList);
      setError('');
    } catch (requestError) {
      if (requestError.response?.status === 401) {
        localStorage.removeItem('token');
        navigate('/login');
      } else {
        setError(requestError.response?.data?.message || 'Unable to load your cart.');
      }
    } finally {
      setIsLoading(false);
    }
  }, [navigate]);

  useEffect(() => {
    loadCart();
  }, [loadCart]);

  const removeItem = async (item) => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/login');
      return;
    }

    const itemId = item.rawCartItemId ?? item.cartItemId;
    if (!itemId) {
      setError('Unable to remove item. Please refresh and try again.');
      return;
    }
    setBusyItemId(item.cartItemId);
    setError('');
    try {
      await API.delete(`/cart/${itemId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      window.dispatchEvent(new Event('cartUpdated'));
      await loadCart();
    } catch (requestError) {
      if (requestError.response?.status === 401) {
        localStorage.removeItem('token');
        navigate('/login');
      } else {
        setError(requestError.response?.data?.message || 'Unable to remove this item.');
      }
    } finally {
      setBusyItemId(null);
    }
  };

  const validItems = items.filter((item) => !item.isSoldOut);
  const total = validItems.reduce((sum, item) => sum + item.price, 0);
  const itemCount = validItems.length;

  return (
    <main className="shop-page narrow-page cart-page">
      <UserHeader />
      <section>
        <div className="page-heading">
          <p className="auth-kicker">Your collection</p>
          <h1>Your cart</h1>
          <p>{itemCount} {itemCount === 1 ? 'item' : 'items'} ready for checkout.</p>
        </div>
        {error && <p className="auth-error shop-alert" role="alert">{error}</p>}
        {isLoading ? (
          <p className="empty-state">Loading your cart...</p>
        ) : items.length === 0 ? (
          <div className="empty-state">
            <p>Your cart is empty.</p>
            <Link className="text-link" to="/catalog">Browse the collection</Link>
          </div>
        ) : (
          <>
            <div className="cart-list">
              {items.map((item) => (
                <article
                  className="cart-item"
                  key={item.uniqueKey}
                  style={item.isSoldOut ? { opacity: 0.75, borderColor: '#fca5a5' } : undefined}
                >
                  <div className="cart-item-image">
                    {item.imageUrl ? <img src={item.imageUrl} alt={item.productName} /> : item.productName.slice(0, 1)}
                  </div>
                  <div className="cart-item-copy">
                    <h2>{item.productName}</h2>
                    {item.isSoldOut ? (
                      <>
                        <p style={{ color: '#dc2626', fontWeight: '700', fontSize: '13px', margin: '4px 0' }}>
                          Sold out — item is out of stock and excluded from total.
                        </p>
                        <p style={{ textDecoration: 'line-through', color: '#9ca3af' }}>
                          ₹{item.originalPrice.toLocaleString('en-IN')} each
                        </p>
                      </>
                    ) : (
                      <>
                        <p>₹{item.price.toLocaleString('en-IN')} each</p>
                        <p>Quantity: <strong>1</strong></p>
                      </>
                    )}
                  </div>
                  <strong style={{ color: item.isSoldOut ? '#dc2626' : 'inherit' }}>
                    ₹{item.price.toLocaleString('en-IN')}
                  </strong>
                  <button
                    type="button"
                    className="remove-button"
                    disabled={busyItemId === item.cartItemId}
                    onClick={() => removeItem(item)}
                  >
                    Remove
                  </button>
                </article>
              ))}
            </div>
            <div className="cart-summary">
              <span>Subtotal <strong>₹{total.toLocaleString('en-IN')}</strong></span>
              {validItems.length > 0 ? (
                <Link className="summary-action" to="/payment">Proceed to checkout</Link>
              ) : (
                <button type="button" className="summary-action" disabled style={{ opacity: 0.5, cursor: 'not-allowed' }}>
                  No available items to checkout
                </button>
              )}
            </div>
          </>
        )}
      </section>
      <SiteFooter />
    </main>
  );
};
export default Cart;