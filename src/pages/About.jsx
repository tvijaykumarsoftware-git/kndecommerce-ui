import React from 'react';
import UserHeader from '../components/UserHeader';
import SiteFooter from '../components/SiteFooter';
import '../App.css';

const studioPhotos = [
  {
    src: 'https://images.unsplash.com/photo-1497366754035-f200968a6e72?auto=format&fit=crop&w=900&q=80',
    alt: 'Minimal home workspace',
    title: 'Thoughtful spaces'
  },
  {
    src: 'https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=900&q=80',
    alt: 'Soft neutral interior',
    title: 'Daily rituals'
  },
  {
    src: 'https://images.unsplash.com/photo-1524758631624-e2822e304c36?auto=format&fit=crop&w=900&q=80',
    alt: 'Carefully arranged home decor',
    title: 'Designed to last'
  }
];

const About = () => (
  <main className="shop-page narrow-page info-page about-page">
    <UserHeader />
    <section className="page-heading">
      <p className="auth-kicker">About KN Commerce</p>
      <h1>Useful things,<br />chosen carefully.</h1>
    </section>

    <section className="info-layout about-story">
      <div>
        <h2>A calmer way to shop</h2>
        <p>K@D eCommerce brings considered products together for everyday spaces, work, and rituals. We focus on quality, clarity, and a straightforward experience from first look to delivery.</p>
        <p>We curate pieces that feel useful from day one: durable, tasteful, and made to settle naturally into the rhythm of home life.</p>
      </div>
      <div>
        <h2>Made for real life</h2>
        <p>Every order is tracked from checkout through payment and invoicing, so your purchase history stays easy to find when you need it.</p>
        <p>From quick essentials to long-term favorites, we design the experience to feel clear, dependable, and personal.</p>
      </div>
    </section>

    <section className="about-gallery" aria-label="Our studio and product lifestyle images">
      {studioPhotos.map((photo) => (
        <figure key={photo.title} className="about-photo-card">
          <img src={photo.src} alt={photo.alt} />
          <figcaption>{photo.title}</figcaption>
        </figure>
      ))}
    </section>

    <section className="about-highlight">
      <div className="about-highlight-copy">
        <p className="auth-kicker">Our promise</p>
        <h2>Built around practicality and beauty.</h2>
      </div>
      <div className="about-metrics">
        <div>
          <strong>Curated</strong>
          <span>Thoughtful essentials with lasting value</span>
        </div>
        <div>
          <strong>Clear</strong>
          <span>Simple checkout, tracking, and support</span>
        </div>
        <div>
          <strong>Reliable</strong>
          <span>Orders and invoices kept easy to follow</span>
        </div>
      </div>
    </section>

    <SiteFooter />
  </main>
);

export default About;
