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
  
  // Card States
  const [cardNumber, setCardNumber] = useState('');
  const [expiry, setExpiry] = useState('');
  const [cvv, setCvv] = useState('');
  
  // UPI States
  const [upiId, setUpiId] = useState('');
  const [timeLeft, setTimeLeft] = useState(300); // 5-minute QR validity timer
  
  // EMI States
  const selectedBank = 'HDFC Bank';
  const [selectedTenure, setSelectedTenure] = useState(3);

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

  // Countdown Timer for UPI QR Code
  useEffect(() => {
    let timer;
    if (activeTab === 'upi' && purchaseMode === 'buynow' && timeLeft > 0) {
      timer = setInterval(() => {
        setTimeLeft((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [activeTab, purchaseMode, timeLeft]);

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
    if (mode === 'buynow') setTimeLeft(300);
  };

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    if (tab === 'upi') setTimeLeft(300);
  };

  const formatTimer = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
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

  const calculateEmiBreakdown = (months) => {
    const monthlyInterestRate = 0.15 / 12;
    const p = grandTotal;
    if (monthlyInterestRate === 0) return p / months;
    const emi = (p * monthlyInterestRate * Math.pow(1 + monthlyInterestRate, months)) / (Math.pow(1 + monthlyInterestRate, months) - 1);
    return Math.round(emi);
  };
  
  const currentMonthlyEmiAmount = calculateEmiBreakdown(selectedTenure);
  const formatPrice = (amount) => `₹${Number(amount).toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;

  const merchantUpi = 'merchant@upi';
  const upiUri = `upi://pay?pa=${merchantUpi}&pn=StoreCheckout&am=${grandTotal.toFixed(2)}&cu=INR`;
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(upiUri)}`;

  const handlePaymentSubmit = (providerName) => {
    let paymentDetails = {};

    if (providerName === 'Credit / Debit Card') {
      if (!cardNumber || cardNumber.replace(/\s/g, '').length < 12) {
        alert('Please enter a valid card number.');
        return;
      }
      if (!expiry) {
        alert('Please enter card expiry (MM / YY).');
        return;
      }
      if (!cvv || cvv.length < 3) {
        alert('Please enter a valid CVV.');
        return;
      }
      paymentDetails = { cardNumber, cardExp: expiry, cardCvv: cvv };
    } else if (providerName === 'UPI') {
      if (timeLeft === 0 && !upiId) {
        alert('QR code has expired. Please refresh the QR or enter your UPI ID.');
        return;
      }
      if (upiId && !upiId.includes('@')) {
        alert('Please enter a valid UPI ID (e.g., username@okicici).');
        return;
      }
      paymentDetails = {
        method: upiId ? 'UPI ID' : 'QR Scanner',
        payerUpiId: upiId || 'Scanned via QR',
        merchantUpiId: merchantUpi,
        transactionTime: new Date().toISOString()
      };
    } else if (providerName === 'EMI') {
      paymentDetails = {
        vendorName: selectedBank,
        emiTenure: Number(selectedTenure),
        emiAmount: currentMonthlyEmiAmount,
        emiDateOn: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
      };
    }

    navigate('/checkout', {
      state: {
        paymentProvider: providerName,
        paymentDetails,
        amount: grandTotal,
        items
      }
    });
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
              {activeTab === 'card' && purchaseMode === 'buynow' && (
                <div className="fk-tab-content">
                  <h2>Card Details</h2>
                  <div className="fk-form-group"><label>Card Number</label><input type="text" placeholder="XXXX XXXX XXXX XXXX" value={cardNumber} maxLength="19" onChange={(e) => setCardNumber(e.target.value)} /></div>
                  <div className="fk-form-row">
                    <div className="fk-form-group"><label>Valid Thru</label><input type="text" placeholder="MM / YY" value={expiry} maxLength="7" onChange={(e) => setExpiry(e.target.value)} /></div>
                    <div className="fk-form-group"><label>CVV</label><input type="password" placeholder="CVV" maxLength="4" value={cvv} onChange={(e) => setCvv(e.target.value)} /></div>
                  </div>
                  <button type="button" className="fk-pay-btn" onClick={() => handlePaymentSubmit('Credit / Debit Card')}>Pay {formatPrice(grandTotal)}</button>
                </div>
              )}

              {activeTab === 'upi' && purchaseMode === 'buynow' && (
                <div className="fk-tab-content center-align" style={{ textAlign: 'center', padding: '10px 20px' }}>
                  <h2>Scan & Pay using UPI</h2>
                  <p style={{ color: '#666', fontSize: '13px', marginBottom: '12px' }}>
                    Scan using GPay, PhonePe, Paytm, or any UPI app
                  </p>

                  <div style={{ position: 'relative', display: 'inline-block', background: '#fff', padding: '14px', border: '2px solid #2874f0', borderRadius: '10px', marginBottom: '10px' }}>
                    <img
                      src={qrCodeUrl}
                      alt="Default UPI QR Scanner"
                      style={{
                        width: '180px',
                        height: '180px',
                        objectFit: 'contain',
                        filter: timeLeft === 0 ? 'blur(4px)' : 'none',
                        transition: 'filter 0.3s ease'
                      }}
                    />
                    {timeLeft === 0 && (
                      <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', background: 'rgba(255,255,255,0.95)', padding: '10px', borderRadius: '6px', width: '140px' }}>
                        <p style={{ margin: '0 0 8px', fontSize: '12px', fontWeight: '600', color: '#d32f2f' }}>QR Expired</p>
                        <button type="button" onClick={() => setTimeLeft(300)} style={{ padding: '6px 12px', background: '#2874f0', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '12px' }}>
                          Refresh QR
                        </button>
                      </div>
                    )}
                  </div>

                  <div style={{ fontSize: '13px', color: timeLeft < 60 ? '#d32f2f' : '#388e3c', fontWeight: '600', marginBottom: '16px' }}>
                    {timeLeft > 0 ? `QR valid for ${formatTimer(timeLeft)}` : 'Session timed out'}
                  </div>

                  <div style={{ borderTop: '1px solid #eee', paddingTop: '14px', marginBottom: '16px', textAlign: 'left' }}>
                    <label style={{ display: 'block', fontSize: '13px', color: '#555', marginBottom: '6px', fontWeight: '500' }}>
                      Or enter your UPI ID (Optional)
                    </label>
                    <input
                      type="text"
                      placeholder="example@okicici"
                      value={upiId}
                      onChange={(e) => setUpiId(e.target.value)}
                      style={{ width: '100%', padding: '10px', border: '1px solid #ccc', borderRadius: '4px', boxSizing: 'border-box' }}
                    />
                  </div>

                  <button type="button" className="fk-pay-btn" onClick={() => handlePaymentSubmit('UPI')}>
                    Confirm Payment ({formatPrice(grandTotal)})
                  </button>
                </div>
              )}

              {activeTab === 'emi' && purchaseMode === 'emi' && (
                <div className="fk-tab-content">
                  <h2>Select Bank & EMI Tenure</h2>
                  <select value={selectedTenure} onChange={(e) => setSelectedTenure(Number(e.target.value))} style={{ width: '100%', padding: '10px' }}>
                    <option value={3}>3 Months ({formatPrice(calculateEmiBreakdown(3))} / month)</option>
                    <option value={6}>6 Months ({formatPrice(calculateEmiBreakdown(6))} / month)</option>
                  </select>
                  <button type="button" className="fk-pay-btn" onClick={() => handlePaymentSubmit('EMI')}>Proceed with EMI</button>
                </div>
              )}

              {activeTab === 'cod' && (
                <div className="fk-tab-content">
                  <h2>Cash on Delivery</h2>
                  <button type="button" className="fk-pay-btn" onClick={() => handlePaymentSubmit('Cash on Delivery')}>Place Order (COD)</button>
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