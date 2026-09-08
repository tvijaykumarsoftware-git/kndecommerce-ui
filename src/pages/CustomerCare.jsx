import React from 'react';
import { Link } from 'react-router-dom';
import UserHeader from '../components/UserHeader';
import SiteFooter from '../components/SiteFooter';
import '../App.css';

const CustomerCare = () => (
  <main className="shop-page narrow-page info-page">
    <UserHeader />
    <section className="page-heading">
      <p className="auth-kicker">Help centre</p>
      <h1>24x7 Customer<br />Care.</h1>
    </section>

    <section className="info-layout">
      <div>
        <h2>How can we help?</h2>
        <p>Our support team is here around the clock for questions about products, payments, orders, returns, and delivery. Start with your order history for the quickest route to a resolution.</p>
        <p>For account or payment safety, never share your password, one-time password, or full card number with anyone claiming to be support.</p>
      </div>
      <div className="help-list">
        <div><strong>Orders and delivery</strong><span>Track an order, update delivery details, or report a missing package.</span></div>
        <div><strong>Returns and refunds</strong><span>Get help with an eligible return, replacement, or refund status.</span></div>
        <div><strong>Payments and account</strong><span>Resolve payment questions and keep your account details up to date.</span></div>
        <Link className="summary-action" to="/orders">View your orders</Link>
      </div>
    </section>

    <section className="support-strip">
      <div><p className="auth-kicker">Always available</p><h2>Clear answers, human help.</h2></div>
      <p>Write to support@kncommerce.com and include your order number. We aim to respond as quickly as possible while keeping your account secure.</p>
    </section>
    <SiteFooter />
  </main>
);

export default CustomerCare;
