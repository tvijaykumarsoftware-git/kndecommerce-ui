import React, { useState } from 'react';
import UserHeader from '../components/UserHeader';
import SiteFooter from '../components/SiteFooter';
import '../App.css';

const ContactUs = () => {
  const [sent, setSent] = useState(false);

  const submitMessage = (event) => {
    event.preventDefault();
    setSent(true);
    event.target.reset();
  };

  return (
    <main className="shop-page narrow-page info-page contact-page">
      <UserHeader />
      <section className="page-heading">
        <p className="auth-kicker">Contact us</p>
        <h1>Let’s talk<br />things through.</h1>
      </section>
      <section className="contact-layout">
        <div>
          <h2>We’re here to help</h2>
          <p>Questions about an order, a product, or delivery? Send a note and our team will get back to you.</p>
            <p className="contact-detail">support@ecommerce.com<br />Monday to Friday, 9am to 5pm</p>
            <div className="location-card">
              <h3>Visit our showroom</h3>
              <p>124 Mercer Street<br />New York, NY 10012</p>
              <p>Mon–Sat: 10:00 AM – 6:00 PM</p>
            </div>
        </div>
        <form className="contact-form" onSubmit={submitMessage}>
          <label htmlFor="contact-name">Name</label>
          <input id="contact-name" name="name" required />
          <label htmlFor="contact-email">Email</label>
          <input id="contact-email" name="email" type="email" required />
          <label htmlFor="contact-message">Message</label>
          <textarea id="contact-message" name="message" rows="5" required />
          {sent && <p className="shop-message" role="status">Thanks. Your message is ready for our team.</p>}
          <button className="auth-submit" type="submit">Send message</button>
        </form>
      </section>

      <section className="location-section" aria-label="Store location and map">
        <div className="location-map-wrap">
          <iframe
            title="KN Commerce location map"
            src="https://www.google.com/maps?q=SoHo%20New%20York&z=13&output=embed"
            loading="lazy"
            allowFullScreen
            referrerPolicy="no-referrer-when-downgrade"
          />
        </div>
        <div className="location-details">
          <p className="auth-kicker">Find us</p>
          <h2>Studio & showroom</h2>
          <ul>
            <li>124 Mercer Street, New York, NY 10012</li>
            <li>hello@kncommerce.com</li>
            <li>+1 (212) 555-0184</li>
          </ul>
        </div>
      </section>

      <SiteFooter />
    </main>
  );
};

export default ContactUs;
