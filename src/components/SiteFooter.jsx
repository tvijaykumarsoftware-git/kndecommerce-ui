import React from 'react';
import { Link } from 'react-router-dom';

const SiteFooter = () => (
  <footer className="site-footer">
    <span>K@D eCommerce</span>
    <nav aria-label="Footer menu">
      <Link to="/catalog">Catalog</Link>
      <Link to="/about">About</Link>
      <Link to="/contact">Contact</Link>
      <Link to="/cart">Cart</Link>
      <Link to="/register">Create account</Link>
      {localStorage.getItem('role') === 'Admin' && <Link to="/admin/dashboard">Manage</Link>}
      {localStorage.getItem('role') === 'Admin' && <Link to="/admin/transactions">Transactions</Link>}
      {localStorage.getItem('role') === 'Admin' && <Link to="/admin/invoices">Invoices</Link>}
    </nav>
  </footer>
);

export default SiteFooter;
