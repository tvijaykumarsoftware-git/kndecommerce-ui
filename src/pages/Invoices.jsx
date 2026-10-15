import React, { useEffect, useState } from 'react';
import axios from 'axios';
import UserHeader from '../components/UserHeader';
import SiteFooter from '../components/SiteFooter';
import '../App.css';

const API_URL = 'http://localhost:5107/api';
const ITEMS_PER_PAGE = 8;

const Invoices = () => {
  const [invoices, setInvoices] = useState([]);
  const [error, setError] = useState('');
  const [downloadingId, setDownloadingId] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    axios.get(`${API_URL}/invoices`, { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } })
      .then(({ data }) => setInvoices(data))
      .catch((requestError) => setError(requestError.response?.data?.message || 'Unable to load invoices.'));
  }, []);

  const downloadPdf = async (orderId) => {
    setDownloadingId(orderId);
    setError('');
    try {
      const response = await axios.get(`${API_URL}/invoices/generate/${orderId}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
        responseType: 'blob'
      });
      const url = URL.createObjectURL(response.data);
      const link = document.createElement('a');
      link.href = url;
      link.download = `Invoice_${orderId}.pdf`;
      link.click();
      URL.revokeObjectURL(url);
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Unable to download this invoice.');
    } finally {
      setDownloadingId(null);
    }
  };

  const pageCount = Math.ceil(invoices.length / ITEMS_PER_PAGE);
  const pageNumbers = Array.from({ length: pageCount }, (_, index) => index + 1);
  const visibleInvoices = invoices.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  return (
    <main className="shop-page narrow-page admin-page">
      <UserHeader />
      <section className="page-heading"><p className="auth-kicker">Order records</p><h1>Invoices</h1></section>
      {error && <p className="auth-error shop-alert" role="alert">{error}</p>}
      <section className="invoice-grid" aria-label="Invoices list">
        {visibleInvoices.map((invoice) => <article className="invoice-card" key={invoice.invoiceId}><div><strong>{invoice.invoiceNumber}</strong><span>Order #{invoice.orderId} · {new Date(invoice.invoiceDate).toLocaleDateString()}</span><span>{invoice.Order?.orderStatus || invoice.order?.orderStatus} · ${Number(invoice.Order?.totalAmount ?? invoice.order?.totalAmount ?? 0).toFixed(2)}</span></div><button className="summary-action" type="button" disabled={downloadingId === invoice.orderId} onClick={() => downloadPdf(invoice.orderId)}>{downloadingId === invoice.orderId ? 'Preparing...' : 'Download PDF'}</button></article>)}
      </section>
      {pageCount > 1 && <nav className="admin-pagination" aria-label="Invoice pagination">
        <button type="button" disabled={currentPage === 1} onClick={() => setCurrentPage((page) => page - 1)}>Previous</button>
        {pageNumbers.map((pageNumber) => <button key={pageNumber} type="button" className={pageNumber === currentPage ? 'pagination-page is-active' : 'pagination-page'} onClick={() => setCurrentPage(pageNumber)}>{pageNumber}</button>)}
        <button type="button" disabled={currentPage === pageCount} onClick={() => setCurrentPage((page) => page + 1)}>Next</button>
      </nav>}
      {!error && invoices.length === 0 && <p className="empty-state">No invoices found.</p>}
      <SiteFooter />
    </main>
  );
};

export default Invoices;
