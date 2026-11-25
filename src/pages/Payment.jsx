import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import API from '../api/api';
import UserHeader from '../components/UserHeader';
import SiteFooter from '../components/SiteFooter';
import '../App.css';

const Payment = () => {
  const navigate = useNavigate();
  const [purchaseMode, setPurchaseMode] = useState('buynow');
  const [activeTab, setActiveTab] = useState('card');
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [shippingAddress, setShippingAddress] = useState('');
  const [paymentError, setPaymentError] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [razorpayLoaded, setRazorpayLoaded] = useState(Boolean(window.Razorpay));

  useEffect(() => {
    if (window.Razorpay) {
      setRazorpayLoaded(true);
      return undefined;
    }

    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    script.onload = () => setRazorpayLoaded(true);
    script.onerror = () => setPaymentError('Unable to load Razorpay checkout. Please refresh and try again.');
    document.body.appendChild(script);

    return () => {
      script.onload = null;
      script.onerror = null;
    };
  }, []);

  useEffect(() => {
    const fetchCart = async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await API.get('/cart', {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (Array.isArray(response.data)) {
          const allocatedPerProduct = {};
          const inStockItems = response.data.filter((item) => {
            const liveStock = Number(item.stockQuantity ?? 0);
            const pid = item.productId;
            const used = allocatedPerProduct[pid] || 0;
            if (liveStock <= 0 || used >= liveStock) return false;
            allocatedPerProduct[pid] = used + 1;
            return true;
          });
          setItems(inStockItems);
        } else {
          setItems([]);
        }
      } catch (error) {
        console.error('Failed to load cart:', error);
        setItems([]);
      } finally {
        setLoading(false);
      }
    };
    fetchCart();
  }, []);

  // Determine if AT LEAST ONE item in the cart supports EMI (isEMI === true)
  const isEmiAvailable = items.length > 0 && items.some((item) => item.isEMI === true || item.iseemi === true);

  // If items change and EMI is no longer available while on EMI mode, switch back to Buy Now
  useEffect(() => {
    if (!isEmiAvailable && purchaseMode === 'emi') {
      setPurchaseMode('buynow');
      setActiveTab('card');
    }
  }, [isEmiAvailable, purchaseMode]);

  const handlePurchaseModeChange = (mode) => {
    setPurchaseMode(mode);
    setActiveTab(mode === 'buynow' ? 'card' : 'emi');
  };

  const handleTabChange = (tab) => {
    setActiveTab(tab);
  };

  const getQuantity = (item) => Number(item.quantity ?? 1);
  const getMrp = (item) => Number(item.mrp ?? item.price ?? 0);
  const getSellingPrice = (item) => {
    const price = Number(item.price ?? 0);
    const discounted = Number(item.discountOnMRP ?? 0);
    return discounted > 0 && discounted < price ? discounted : price;
  };
  const getPlatformFee = (item) => Number(item.platformFee ?? 0);
  const getProductImageUrl = (item) => item.imageUrl || 'https://via.placeholder.com/80';
  const getProductName = (item) => item.productName || 'Product Item';

  const mrpTotal = items.reduce((sum, item) => sum + (getMrp(item) * getQuantity(item)), 0);
  const sellingTotal = items.reduce((sum, item) => sum + (getSellingPrice(item) * getQuantity(item)), 0);
  const discountAmount = Math.max(mrpTotal - sellingTotal, 0);
  const platformFee = items.reduce((sum, item) => sum + (getPlatformFee(item) * getQuantity(item)), 0);
  const grandTotal = Math.max(sellingTotal + platformFee, 0);
  const itemCount = items.reduce((sum, item) => sum + getQuantity(item), 0);

  const formatPrice = (amount) => `₹${Number(amount).toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;

  const handlePaymentSubmit = async (providerName) => {
    setPaymentError('');

    if (providerName === 'Cash on Delivery') {
      navigate('/checkout', {
        state: { paymentProvider: providerName, shippingAddress, cartItemIds: items.map((item) => item.cartItemId) }
      });
      return;
    }

    if (!shippingAddress.trim()) {
      setPaymentError('Please enter your delivery address before paying.');
      return;
    }
    if (!window.Razorpay || !razorpayLoaded) {
      setPaymentError('Razorpay checkout is still loading. Please try again in a moment.');
      return;
    }

    setIsProcessing(true);
    try {
      const cartItemIds = items.map((item) => item.cartItemId);
      const { data: razorpayOrder } = await API.post('/orders/razorpay/order', { cartItemIds });
      const checkout = new window.Razorpay({
        key: razorpayOrder.keyId,
        amount: razorpayOrder.amount,
        currency: razorpayOrder.currency,
        name: 'Store Checkout',
        description: 'Secure payment for your order',
        order_id: razorpayOrder.orderId,
        handler: async (paymentResponse) => {
          try {
            const { data: confirmation } = await API.post('/orders/razorpay/complete', {
              shippingAddress,
              cartItemIds,
              razorpayOrderId: paymentResponse.razorpay_order_id,
              razorpayPaymentId: paymentResponse.razorpay_payment_id,
              razorpaySignature: paymentResponse.razorpay_signature
            });
            navigate('/checkout', { replace: true, state: { confirmation, paymentProvider: 'Razorpay' } });
          } catch (error) {
            setPaymentError(error.response?.data?.message || 'Payment was received, but the order could not be confirmed. Please contact support.');
            setIsProcessing(false);
          }
        },
        modal: {
          ondismiss: () => setIsProcessing(false)
        },
        theme: { color: '#2874f0' }
      });
      checkout.on('payment.failed', (event) => {
        setPaymentError(event.error?.description || 'Razorpay could not complete the payment. Please try again.');
        setIsProcessing(false);
      });
      checkout.open();
    } catch (error) {
      setPaymentError(error.response?.data?.message || 'Unable to start Razorpay checkout. Please try again.');
      setIsProcessing(false);
    }
  };

  if (loading) {
    return (
      <main className="shop-page fk-payment-page">
        <UserHeader />
        <div className="fk-loading-state"><p>Loading secure checkout details...</p></div>
        <SiteFooter />
      </main>
    );
  }

  return (
    <main className="shop-page fk-payment-page">
      <UserHeader />
      <div className="fk-container">
        <header className="fk-header">
          <button className="back-btn" type="button" onClick={() => navigate('/cart')}>←</button>
          <h1>Complete Payment</h1>
          <span className="secure-badge">🔒 100% Secure</span>
        </header>

        <div className="fk-purchase-mode-container" style={{ background: '#ffffff', padding: '16px 24px', marginBottom: '20px', borderRadius: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '15px' }}>
          <div className="fk-cart-items-preview" style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
            <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', maxWidth: '250px' }}>
              {items.map((item, idx) => (
                <img key={idx} src={getProductImageUrl(item)} alt={getProductName(item)} style={{ width: '50px', height: '50px', objectFit: 'contain', border: '1px solid #e0e0e0', borderRadius: '6px', padding: '2px', background: '#fff' }} />
              ))}
            </div>
            <div>
              <h4 style={{ margin: 0, fontSize: '15px', color: '#212121', fontWeight: '600' }}>{itemCount} {itemCount === 1 ? 'Item' : 'Items'} in Order</h4>
              <span style={{ fontSize: '13px', color: '#666666' }}>Total Payable: <strong style={{ color: '#212121' }}>{formatPrice(grandTotal)}</strong></span>
            </div>
          </div>

          {/* Centered mode switch buttons */}
          <div className="fk-mode-switch-btns" style={{ display: 'flex', gap: '12px', justifyContent: 'center', flex: 1, flexDirection: 'column', alignItems: 'center' }}>
            <div style={{ display: 'flex', gap: '12px' }}>
              <button type="button" onClick={() => handlePurchaseModeChange('buynow')} style={{ padding: '11px 28px', background: purchaseMode === 'buynow' ? '#fb641b' : '#f0f0f0', color: purchaseMode === 'buynow' ? '#fff' : '#333', border: 'none', borderRadius: '6px', fontWeight: '700', cursor: 'pointer' }}>⚡ Buy Now</button>
              {isEmiAvailable && (
                <button type="button" onClick={() => handlePurchaseModeChange('emi')} style={{ padding: '11px 28px', background: purchaseMode === 'emi' ? '#2874f0' : '#f0f0f0', color: purchaseMode === 'emi' ? '#fff' : '#333', border: 'none', borderRadius: '6px', fontWeight: '700', cursor: 'pointer' }}>🏦 Buy on EMI</button>
              )}
            </div>
          </div>

          <div style={{ width: '250px', visibility: 'hidden' }} className="fk-spacer-desktop-only"></div>
        </div>

        <div className="fk-checkout-grid">
          <div className="fk-main-card">
            <aside className="fk-payment-sidebar">
              {purchaseMode === 'buynow' ? (
                <>
                  <button type="button" className={`fk-tab-btn ${activeTab === 'card' ? 'is-active' : ''}`} onClick={() => handleTabChange('card')}>💳 Credit / Debit Card</button>
                  <button type="button" className={`fk-tab-btn ${activeTab === 'upi' ? 'is-active' : ''}`} onClick={() => handleTabChange('upi')}>📱 UPI</button>
                  <button type="button" className={`fk-tab-btn ${activeTab === 'cod' ? 'is-active' : ''}`} onClick={() => handleTabChange('cod')}>💵 Cash on Delivery</button>
                </>
              ) : (
                <>
                  <button type="button" className={`fk-tab-btn ${activeTab === 'emi' ? 'is-active' : ''}`} onClick={() => handleTabChange('emi')}>🏦 EMI Options</button>
                  <button type="button" className={`fk-tab-btn ${activeTab === 'cod' ? 'is-active' : ''}`} onClick={() => handleTabChange('cod')}>💵 Cash on Delivery</button>
                </>
              )}
            </aside>

            <section className="fk-payment-body">
              {paymentError && <p className="auth-error shop-alert" role="alert">{paymentError}</p>}
              <div className="fk-tab-content">
                <h2>Delivery address</h2>
                <div className="fk-form-group">
                  <label htmlFor="payment-shipping-address">Shipping address</label>
                  <textarea
                    id="payment-shipping-address"
                    rows="3"
                    value={shippingAddress}
                    onChange={(event) => setShippingAddress(event.target.value)}
                    disabled={isProcessing}
                    required
                    placeholder="Street, city, state, postal code"
                  />
                </div>
              </div>
              {activeTab !== 'cod' && (
                <div className="fk-tab-content">
                  <h2>{activeTab === 'upi' ? 'Pay online with UPI' : activeTab === 'emi' ? 'Pay online or choose eligible EMI' : 'Secure online payment'}</h2>
                  <p>Razorpay securely handles your payment details. Choose card, UPI, net banking, or an eligible EMI option in the popup.</p>
                  <button
                    type="button"
                    className="fk-pay-btn"
                    onClick={() => handlePaymentSubmit('Razorpay')}
                    disabled={isProcessing || !razorpayLoaded || items.length === 0}
                  >
                    {isProcessing ? 'Connecting to Razorpay...' : `Pay ${formatPrice(grandTotal)} with Razorpay`}
                  </button>
                </div>
              )}

              {activeTab === 'cod' && (
                <div className="fk-tab-content">
                  <h2>Cash on Delivery</h2>
                  <button type="button" className="fk-pay-btn" onClick={() => handlePaymentSubmit('Cash on Delivery')} disabled={isProcessing || items.length === 0}>Place Order (COD)</button>
                </div>
              )}
            </section>
          </div>

          <aside className="fk-price-summary">
            <div className="fk-price-title">PRICE DETAILS</div>
            <div className="fk-price-row"><span>MRP</span><span>{formatPrice(mrpTotal)}</span></div>
            <div className="fk-price-row"><span>Discounts</span><span className="fk-green">-{formatPrice(discountAmount)}</span></div>
            <div className="fk-total-row"><span>Total Amount</span><strong>{formatPrice(grandTotal)}</strong></div>
          </aside>
        </div>
      </div>
      <SiteFooter />
    </main>
  );
};

export default Payment;