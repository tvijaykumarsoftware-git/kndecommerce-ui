import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import UserHeader from '../components/UserHeader';
import SiteFooter from '../components/SiteFooter';
import '../App.css';

const API_URL = 'http://localhost:5107/api';

const Payment = () => {
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState('card');
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  // Card details
  const [cardNumber, setCardNumber] = useState('');
  const [expiry, setExpiry] = useState('');
  const [cvv, setCvv] = useState('');

  // EMI details
  const [selectedBank, setSelectedBank] = useState('HDFC Bank');

  // Price details expand/collapse
  const [showFees, setShowFees] = useState(false);
  const [showDiscounts, setShowDiscounts] = useState(false);

  useEffect(() => {
    const fetchCart = async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await axios.get(`${API_URL}/cart`, {
          headers: { Authorization: `Bearer ${token}` }
        });

        if (Array.isArray(response.data)) {
          setItems(response.data);
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

  // Helper getters
  const getQuantity = (item) => Number(item.quantity ?? item.Quantity ?? item.qty ?? item.Qty ?? 1);
  const getMrp = (item) => Number(item.mrp ?? item.MRP ?? item.price ?? item.Price ?? 0);
  
  const getSellingPrice = (item) => {
    const directDiscount = Number(item.discount ?? item.Discount ?? 0);
    if (directDiscount > 0) {
      return Math.max(getMrp(item) - directDiscount, 0);
    }
    return Number(
      item.sellingPrice ?? 
      item.SellingPrice ?? 
      item.discountOnMRP ?? 
      item.DiscountOnMRP ?? 
      getMrp(item)
    );
  };
  
  const getPlatformFee = (item) => Number(item.platformFee ?? item.PlatformFee ?? 0);

  // Totals
  const mrpTotal = items.reduce((sum, item) => sum + (getMrp(item) * getQuantity(item)), 0);
  const sellingTotal = items.reduce((sum, item) => sum + (getSellingPrice(item) * getQuantity(item)), 0);
  const discountAmount = Math.max(mrpTotal - sellingTotal, 0);
  const platformFee = items.reduce((sum, item) => sum + (getPlatformFee(item) * getQuantity(item)), 0);
  const grandTotal = Math.max(sellingTotal + platformFee, 0);
  const totalSavings = discountAmount;
  const itemCount = items.reduce((sum, item) => sum + getQuantity(item), 0);

  const formatPrice = (amount) => `₹${Number(amount).toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;

  const handlePaymentSubmit = (providerName) => {
    let paymentDetails = {};

    if (providerName === 'Credit / Debit Card') {
      if (!cardNumber || cardNumber.replace(/\s/g, '').length < 12) {
        alert('Please enter a valid card number.');
        return;
      }
      if (!expiry) {
        alert('Please enter card expiry.');
        return;
      }
      if (!cvv || cvv.length < 3) {
        alert('Please enter CVV.');
        return;
      }
      paymentDetails = { cardNumber, cardExp: expiry, cardCvv: cvv };
    } else if (providerName === 'EMI') {
      paymentDetails = { vendorName: selectedBank };
    }

    navigate('/checkout', {
      state: {
        paymentProvider: providerName,
        paymentDetails,
        amount: grandTotal,
        priceDetails: {
          itemCount,
          mrp: mrpTotal,
          discount: discountAmount,
          platformFee,
          sellingTotal,
          total: grandTotal,
          savings: totalSavings
        },
        items
      }
    });
  };

  if (loading) {
    return (
      <main className="shop-page fk-payment-page">
        <UserHeader />
        <div className="fk-loading-state">
          <div className="spinner"></div>
          <p>Loading secure checkout details...</p>
        </div>
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

        <div className="fk-checkout-grid">
          <div className="fk-main-card">
            <aside className="fk-payment-sidebar">
              <button
                type="button"
                className={`fk-tab-btn ${activeTab === 'card' ? 'is-active' : ''}`}
                onClick={() => setActiveTab('card')}
              >
                <div className="tab-icon">💳</div>
                <div className="tab-info">
                  <strong>Credit / Debit / ATM Card</strong>
                  <span>Add and secure cards as per RBI guidelines</span>
                </div>
              </button>

              <button
                type="button"
                className={`fk-tab-btn ${activeTab === 'upi' ? 'is-active' : ''}`}
                onClick={() => setActiveTab('upi')}
              >
                <div className="tab-icon">📱</div>
                <div className="tab-info">
                  <strong>UPI</strong>
                  <span>Google Pay, PhonePe, Paytm</span>
                </div>
              </button>

              <button
                type="button"
                className={`fk-tab-btn ${activeTab === 'emi' ? 'is-active' : ''}`}
                onClick={() => setActiveTab('emi')}
              >
                <div className="tab-icon">🏦</div>
                <div className="tab-info">
                  <strong>EMI</strong>
                  <span>Credit Card EMI Options</span>
                </div>
              </button>

              <button
                type="button"
                className={`fk-tab-btn ${activeTab === 'cod' ? 'is-active' : ''}`}
                onClick={() => setActiveTab('cod')}
              >
                <div className="tab-icon">💵</div>
                <div className="tab-info">
                  <strong>Cash on Delivery</strong>
                  <span>Pay cash at doorstep</span>
                </div>
              </button>
            </aside>

            <section className="fk-payment-body">
              {activeTab === 'card' && (
                <div className="fk-tab-content">
                  <h2>Card Details</h2>
                  <div className="fk-form-group">
                    <label>Card Number</label>
                    <input
                      type="text"
                      placeholder="XXXX XXXX XXXX XXXX"
                      value={cardNumber}
                      maxLength="19"
                      onChange={(e) => setCardNumber(e.target.value)}
                    />
                  </div>
                  <div className="fk-form-row">
                    <div className="fk-form-group">
                      <label>Valid Thru</label>
                      <input
                        type="text"
                        placeholder="MM / YY"
                        value={expiry}
                        maxLength="7"
                        onChange={(e) => setExpiry(e.target.value)}
                      />
                    </div>
                    <div className="fk-form-group">
                      <label>CVV</label>
                      <input
                        type="password"
                        placeholder="CVV"
                        maxLength="4"
                        value={cvv}
                        onChange={(e) => setCvv(e.target.value)}
                      />
                    </div>
                  </div>
                  <button type="button" className="fk-pay-btn" onClick={() => handlePaymentSubmit('Credit / Debit Card')}>
                    Pay {formatPrice(grandTotal)}
                  </button>
                </div>
              )}

              {activeTab === 'upi' && (
                <div className="fk-tab-content center-align">
                  <h2>Scan QR Code</h2>
                  <p className="qr-subtext">Scan using Google Pay, PhonePe, Paytm or any UPI App</p>
                  <div className="qr-box">
                    <div className="qr-placeholder">
                      <span className="qr-icon">📷</span>
                      <span>UPI QR Code</span>
                    </div>
                    <p className="qr-amount">Total Amount: <strong>{formatPrice(grandTotal)}</strong></p>
                  </div>
                  <button type="button" className="fk-pay-btn" onClick={() => handlePaymentSubmit('UPI')}>
                    Pay {formatPrice(grandTotal)} with UPI
                  </button>
                </div>
              )}

              {activeTab === 'emi' && (
                <div className="fk-tab-content">
                  <h2>Select Bank for EMI</h2>
                  <div className="bank-options">
                    <label className={`bank-card ${selectedBank === 'HDFC Bank' ? 'selected' : ''}`}>
                      <input
                        type="radio"
                        name="bank"
                        value="HDFC Bank"
                        checked={selectedBank === 'HDFC Bank'}
                        onChange={(e) => setSelectedBank(e.target.value)}
                      />
                      <span>HDFC Bank EMI</span>
                    </label>
                    <label className={`bank-card ${selectedBank === 'ICICI Bank' ? 'selected' : ''}`}>
                      <input
                        type="radio"
                        name="bank"
                        value="ICICI Bank"
                        checked={selectedBank === 'ICICI Bank'}
                        onChange={(e) => setSelectedBank(e.target.value)}
                      />
                      <span>ICICI Bank EMI</span>
                    </label>
                  </div>
                  <button type="button" className="fk-pay-btn" onClick={() => handlePaymentSubmit('EMI')}>
                    Continue with EMI
                  </button>
                </div>
              )}

              {activeTab === 'cod' && (
                <div className="fk-tab-content">
                  <h2>Cash on Delivery</h2>
                  <div className="cod-info-box">
                    <p>💡 Cash or UPI collection is available at time of delivery.</p>
                  </div>
                  <button type="button" className="fk-pay-btn" onClick={() => handlePaymentSubmit('Cash on Delivery')}>
                    Place Order (COD)
                  </button>
                </div>
              )}
            </section>
          </div>

          <aside className="fk-price-summary">
            <div className="fk-price-title">PRICE DETAILS</div>
            <div className="fk-price-row">
              <span>MRP ({itemCount} {itemCount === 1 ? 'item' : 'items'})</span>
              <span>{formatPrice(mrpTotal)}</span>
            </div>

            <div className="fk-price-row fk-clickable" onClick={() => setShowFees(!showFees)}>
              <span className="fk-fee-label">
                Platform Fees <span className={`fk-arrow ${showFees ? 'rotate' : ''}`}>⌄</span>
              </span>
              <span>{formatPrice(platformFee)}</span>
            </div>
            {showFees && (
              <div className="fk-expand-box">
                <div className="fk-small-row">
                  <span>Standard Fee</span>
                  <span>{formatPrice(platformFee)}</span>
                </div>
              </div>
            )}

            <div className="fk-price-row fk-clickable fk-discount-row" onClick={() => setShowDiscounts(!showDiscounts)}>
              <span className="fk-discount-label">
                Discounts <span className={`fk-arrow ${showDiscounts ? 'rotate' : ''}`}>⌄</span>
              </span>
              <span className="fk-green">-{formatPrice(discountAmount)}</span>
            </div>
            {showDiscounts && (
              <div className="fk-expand-box">
                <div className="fk-small-row">
                  <span>Discount on MRP</span>
                  <span className="fk-green">-{formatPrice(discountAmount)}</span>
                </div>
              </div>
            )}

            <div className="fk-price-divider"></div>
            <div className="fk-total-row">
              <span>Total Amount</span>
              <strong>{formatPrice(grandTotal)}</strong>
            </div>

            {totalSavings > 0 && (
              <div className="fk-savings-box">
                <span className="fk-savings-icon">🎉</span>
                <span>You will save <strong>{formatPrice(totalSavings)}</strong> on this order!</span>
              </div>
            )}
          </aside>
        </div>
      </div>
      <SiteFooter />
    </main>
  );
};

export default Payment;