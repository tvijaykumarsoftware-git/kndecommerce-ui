import React, { useEffect, useState } from 'react';
import axios from 'axios';
import UserHeader from '../components/UserHeader';
import SiteFooter from '../components/SiteFooter';
import '../App.css';

const API_URL = 'http://localhost:5107/api';
const ITEMS_PER_PAGE = 8;

const Transactions = () => {
  const [transactions, setTransactions] = useState([]);
  const [error, setError] = useState('');
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    axios.get(`${API_URL}/transactions`, { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } })
      .then(({ data }) => setTransactions(data))
      .catch((requestError) => setError(requestError.response?.data?.message || 'Unable to load transactions.'));
  }, []);

  const pageCount = Math.ceil(transactions.length / ITEMS_PER_PAGE);
  const pageNumbers = Array.from({ length: pageCount }, (_, index) => index + 1);
  const visibleTransactions = transactions.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  return (
    <main className="shop-page narrow-page admin-page">
      <UserHeader />
      <section className="page-heading"><p className="auth-kicker">Payments</p><h1>Transactions</h1></section>
      {error && <p className="auth-error shop-alert" role="alert">{error}</p>}
      <section className="data-grid" aria-label="Transactions list">
        <div className="data-grid-header"><span>Reference</span><span>Order</span><span>Provider</span><span>Amount</span><span>Status</span><span>Processed</span></div>
        {visibleTransactions.map((transaction) => <div className="data-grid-row" key={transaction.transactionId}><strong>{transaction.transactionReference}</strong><span>#{transaction.orderId}</span><span>{transaction.paymentProvider}</span><span>${Number(transaction.amount).toFixed(2)}</span><span className="status-text">{transaction.status}</span><span>{new Date(transaction.processedAt).toLocaleDateString()}</span></div>)}
      </section>
      {pageCount > 1 && <nav className="admin-pagination" aria-label="Transaction pagination">
        <button type="button" disabled={currentPage === 1} onClick={() => setCurrentPage((page) => page - 1)}>Previous</button>
        {pageNumbers.map((pageNumber) => <button key={pageNumber} type="button" className={pageNumber === currentPage ? 'pagination-page is-active' : 'pagination-page'} onClick={() => setCurrentPage(pageNumber)}>{pageNumber}</button>)}
        <button type="button" disabled={currentPage === pageCount} onClick={() => setCurrentPage((page) => page + 1)}>Next</button>
      </nav>}
      {!error && transactions.length === 0 && <p className="empty-state">No transactions found.</p>}
      <SiteFooter />
    </main>
  );
};

export default Transactions;
