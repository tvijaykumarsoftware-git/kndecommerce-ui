import React from 'react';
import { Link } from 'react-router-dom';
import UserHeader from '../components/UserHeader';
import SiteFooter from '../components/SiteFooter';
import '../App.css';

const pageData = {
  notifications: {
    kicker: 'Notification preferences',
    title: 'Choose what<br />you want to hear.',
    intro: 'Manage the updates that keep your shopping experience useful, timely, and easy to control.',
    heading: 'Your notification plan',
    description: 'The values below are sample preferences for this demo. Flipkart values are shown as a reference comparison, not live account data.',
    columns: ['Notification', 'KN Commerce', 'Flipkart reference'],
    rows: [
      ['Order and delivery updates', 'Email + SMS', 'App + email'],
      ['Price drops and offers', 'Off', 'App notifications'],
      ['Invoice availability', 'Email', 'Email'],
      ['Personalised recommendations', 'Off', 'App notifications']
    ]
  },
  support: {
    kicker: '24x7 customer care',
    title: 'Help that stays<br />close at hand.',
    intro: 'Find a clear next step for orders, payments, returns, and account questions whenever you need it.',
    heading: 'Support comparison',
    description: 'These are sample service details for the demo storefront, compared with commonly presented Flipkart support channels.',
    columns: ['Support area', 'KN Commerce sample', 'Flipkart reference'],
    rows: [
      ['Order tracking', 'Orders page + email', 'Help Centre + app'],
      ['Payment questions', 'Email support', 'Help Centre'],
      ['Returns and refunds', 'Case review within 1 business day', 'Help Centre workflow'],
      ['Live assistance', '9am - 5pm support desk', '24x7 Help Centre access']
    ]
  },
  advertise: {
    kicker: 'Advertise with us',
    title: 'Put useful products<br />in the right view.',
    intro: 'Explore sample placements for brands that want to reach shoppers without interrupting their experience.',
    heading: 'Sample advertising inventory',
    description: 'The figures below are illustrative demo data. Flipkart references indicate comparable marketplace placements, not connected campaign results.',
    columns: ['Placement', 'KN Commerce sample', 'Flipkart reference'],
    rows: [
      ['Catalog feature', 'From $250 / week', 'Search and category ads'],
      ['Product spotlight', 'From $120 / week', 'Product listing promotion'],
      ['Email feature', '12,400 sample subscribers', 'Promotional messaging'],
      ['Campaign reporting', 'Weekly summary', 'Seller campaign dashboard']
    ]
  }
};

const MorePage = ({ type }) => {
  const content = pageData[type];

  return (
    <main className="shop-page narrow-page info-page more-page">
      <UserHeader />
      <section className="page-heading">
        <p className="auth-kicker">{content.kicker}</p>
        <h1 dangerouslySetInnerHTML={{ __html: content.title }} />
        <p className="more-page-intro">{content.intro}</p>
      </section>
      <section className="more-page-section">
        <div className="more-page-section-heading">
          <div>
            <p className="auth-kicker">Sample data</p>
            <h2>{content.heading}</h2>
          </div>
          <Link className="summary-action" to="/catalog">Browse catalog</Link>
        </div>
        <p className="more-page-description">{content.description}</p>
        <div className="comparison-table-wrap">
          <table className="comparison-table">
            <thead>
              <tr>{content.columns.map((column) => <th key={column}>{column}</th>)}</tr>
            </thead>
            <tbody>
              {content.rows.map((row) => (
                <tr key={row[0]}>{row.map((cell, index) => <td key={`${row[0]}-${index}`}>{cell}</td>)}</tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
      <SiteFooter />
    </main>
  );
};

export default MorePage;
