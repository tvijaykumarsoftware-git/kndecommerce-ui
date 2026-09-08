import React, { useState } from 'react';
import UserHeader from '../components/UserHeader';
import SiteFooter from '../components/SiteFooter';
import '../App.css';

const NotificationPreferences = () => {
  const [preferences, setPreferences] = useState({
    orderUpdates: true,
    offers: true,
    recommendations: false,
    newsletter: false
  });
  const [saved, setSaved] = useState(false);

  const updatePreference = ({ target }) => {
    setPreferences((current) => ({ ...current, [target.name]: target.checked }));
    setSaved(false);
  };

  const savePreferences = (event) => {
    event.preventDefault();
    setSaved(true);
  };

  return (
    <main className="shop-page narrow-page info-page">
      <UserHeader />
      <section className="page-heading">
        <p className="auth-kicker">Your account</p>
        <h1>Notification<br />preferences.</h1>
      </section>

      <section className="info-layout">
        <div>
          <h2>Stay in the loop</h2>
          <p>Choose the updates you would like to receive from KN Commerce. Order and delivery messages help you follow every purchase, while shopping updates keep you close to new arrivals and useful offers.</p>
          <p>You can change these choices whenever you like. Essential service messages about your account, payments, and orders will still reach you.</p>
        </div>
        <form className="preference-form" onSubmit={savePreferences}>
          <label><input type="checkbox" name="orderUpdates" checked={preferences.orderUpdates} onChange={updatePreference} /> Order and delivery updates</label>
          <label><input type="checkbox" name="offers" checked={preferences.offers} onChange={updatePreference} /> Offers and sale alerts</label>
          <label><input type="checkbox" name="recommendations" checked={preferences.recommendations} onChange={updatePreference} /> Product recommendations</label>
          <label><input type="checkbox" name="newsletter" checked={preferences.newsletter} onChange={updatePreference} /> KN Commerce newsletter</label>
          {saved && <p className="shop-message" role="status">Your notification preferences are saved.</p>}
          <button className="summary-action" type="submit">Save preferences</button>
        </form>
      </section>
      <SiteFooter />
    </main>
  );
};

export default NotificationPreferences;
