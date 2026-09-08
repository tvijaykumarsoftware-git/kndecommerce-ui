import React, { useState } from 'react';
import UserHeader from '../components/UserHeader';
import SiteFooter from '../components/SiteFooter';
import '../App.css';

const Advertise = () => {
  const [sent, setSent] = useState(false);

  const submitEnquiry = (event) => {
    event.preventDefault();
    setSent(true);
    event.target.reset();
  };

  return (
    <main className="shop-page narrow-page info-page">
      <UserHeader />
      <section className="page-heading">
        <p className="auth-kicker">For growing brands</p>
        <h1>Put your brand<br />in the right hands.</h1>
      </section>

      <section className="info-layout">
        <div>
          <h2>Advertise with KN Commerce</h2>
          <p>Reach shoppers who are actively looking for useful products for work, home, and everyday life. Our marketplace placements help brands introduce products with clear, relevant storytelling.</p>
          <p>We work with emerging businesses and established makers on campaigns that are measurable, thoughtful, and built around the right audience.</p>
          <div className="advertise-points"><span>Product discovery</span><span>Audience-led campaigns</span><span>Performance reporting</span></div>
        </div>
        <form className="contact-form" onSubmit={submitEnquiry}>
          <label htmlFor="advertiser-name">Name</label>
          <input id="advertiser-name" name="name" required />
          <label htmlFor="advertiser-email">Work email</label>
          <input id="advertiser-email" name="email" type="email" required />
          <label htmlFor="advertiser-company">Company</label>
          <input id="advertiser-company" name="company" required />
          <label htmlFor="advertiser-message">Tell us about your brand</label>
          <textarea id="advertiser-message" name="message" rows="5" required />
          {sent && <p className="shop-message" role="status">Thanks. Our partnerships team will be in touch.</p>}
          <button className="summary-action" type="submit">Send enquiry</button>
        </form>
      </section>
      <SiteFooter />
    </main>
  );
};

export default Advertise;
