import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Link, useNavigate } from 'react-router-dom';
import UserHeader from '../components/UserHeader';
import SiteFooter from '../components/SiteFooter';
import '../App.css';

const API_URL = 'http://localhost:5107/api';

const ProductCatalog = () => {
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [search, setSearch] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [error, setError] = useState('');
  const [addingProductId, setAddingProductId] = useState(null);
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const productsPerPage = 6;

  useEffect(() => {
    const loadCategories = async () => {
      try {
        const { data } = await axios.get(`${API_URL}/categories`);
        setCategories(data.filter((category) => category.isActive));
      } catch {
        setError('We could not load the product filters right now.');
      }
    };

    loadCategories();
  }, []);

  useEffect(() => {
    setCurrentPage(1);
  }, [search, categoryId]);

  useEffect(() => {
    const loadProducts = async () => {
      setIsLoading(true);
      setError(''); // Resets any leftover error message on load
      try {
        const { data } = await axios.get(`${API_URL}/products`, {
          params: { search: search.trim() || undefined, categoryId: categoryId || undefined }
        });
        setProducts(data);
      } catch {
        setError('We could not load the catalog right now.');
      } finally {
        setIsLoading(false);
      }
    };

    loadProducts();
  }, [search, categoryId]);

  const totalPages = Math.max(1, Math.ceil(products.length / productsPerPage));
  const safeCurrentPage = Math.min(currentPage, totalPages);
  const startIndex = (safeCurrentPage - 1) * productsPerPage;
  const visibleProducts = products.slice(startIndex, startIndex + productsPerPage);

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  const goToPage = (pageNumber) => {
    if (pageNumber < 1 || pageNumber > totalPages) {
      return;
    }

    setCurrentPage(pageNumber);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const addToCart = async (productId) => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/login');
      return;
    }

    setAddingProductId(productId);
    setMessage('');
    setError('');
    try {
      const { data } = await axios.post(`${API_URL}/cart`, { productId, quantity: 1 }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setMessage(data.message || 'Product added to cart.');
      window.dispatchEvent(new Event('cartUpdated'));
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Unable to add this product to your cart.');
    } finally {
      setAddingProductId(null);
    }
  };

  return (
    <main className="shop-page catalog-page">
      <UserHeader />

      <section className="page-heading">
        <p className="auth-kicker">The collection</p>
        <h1>Find something<br />worth keeping.</h1>
        <p>Thoughtful goods for everyday spaces and rituals.</p>
      </section>

      <section className="catalog-controls" aria-label="Search and filter products">
        <div className="catalog-control">
          <label htmlFor="product-search">Search products</label>
          <input
            id="product-search"
            type="search"
            placeholder="Search by name or description"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
        </div>
        <div className="catalog-control">
          <label htmlFor="category-filter">Filter by category</label>
          <select id="category-filter" value={categoryId} onChange={(event) => setCategoryId(event.target.value)}>
            <option value="">All categories</option>
            {categories.map((category) => (
              <option key={category.categoryId} value={category.categoryId}>{category.name}</option>
            ))}
          </select>
        </div>
      </section>

      <section className="product-grid" aria-label="Product catalog">
        {message && <p className="shop-message" role="status">{message} <Link to="/cart">View cart</Link></p>}
        {error && <p className="auth-error shop-alert" role="alert">{error}</p>}

        {!error && !isLoading && products.length > 0 && (
          <div className="catalog-results-meta" aria-live="polite">
            <span>Showing {Math.min(startIndex + 1, products.length)}-{Math.min(startIndex + productsPerPage, products.length)} of {products.length} products</span>
            <span>Page {safeCurrentPage} of {totalPages}</span>
          </div>
        )}
      </section>

      <section className="product-grid" aria-label="Product catalog">
        {visibleProducts.map((product) => {
          const inStock = product.stockQuantity > 0;

          return (
            <article className="product-card" key={product.productId}>
              <div className="product-image">
                {product.imageUrl ? <img src={product.imageUrl} alt={product.name} /> : <span>{product.name.slice(0, 1)}</span>}
              </div>
              <div className="product-details">
                <div>
                  <h2>{product.name}</h2>
                  <p>{product.description || 'Made for daily use.'}</p>
                </div>

                <div className="product-purchase" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginTop: '12px' }}>
                  <strong>${Number(product.price).toFixed(2)}</strong>
                  
                  {/* Matching size controls */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', width: '110px' }}>
                    <span
                      style={{
                        backgroundColor: inStock ? '#10b981' : '#ef4444',
                        color: '#ffffff',
                        width: '100%',
                        height: '34px',
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        borderRadius: '4px',
                        fontSize: '12px',
                        fontWeight: '600',
                        textAlign: 'center',
                        boxSizing: 'border-box'
                      }}
                    >
                      {inStock ? `In Stock: ${product.stockQuantity}` : 'Out of stock'}
                    </span>

                    <button
                      type="button"
                      style={{
                        width: '100%',
                        height: '34px',
                        padding: '0',
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '12px',
                        fontWeight: '600',
                        boxSizing: 'border-box'
                      }}
                      disabled={!inStock || addingProductId === product.productId}
                      onClick={() => addToCart(product.productId)}
                    >
                      {!inStock ? 'Sold out' : addingProductId === product.productId ? 'Adding...' : 'Add to cart'}
                    </button>
                  </div>
                </div>
              </div>
            </article>
          );
        })}
      </section>

      {!error && totalPages > 1 && (
        <nav className="catalog-pagination" aria-label="Product catalog pagination">
          <button type="button" className="pagination-arrow" onClick={() => goToPage(safeCurrentPage - 1)} disabled={safeCurrentPage === 1}>
            Previous
          </button>

          {Array.from({ length: totalPages }, (_, index) => {
            const pageNumber = index + 1;
            return (
              <button
                key={pageNumber}
                type="button"
                className={pageNumber === safeCurrentPage ? 'pagination-page is-active' : 'pagination-page'}
                onClick={() => goToPage(pageNumber)}
                aria-current={pageNumber === safeCurrentPage ? 'page' : undefined}
              >
                {pageNumber}
              </button>
            );
          })}

          <button type="button" className="pagination-arrow" onClick={() => goToPage(safeCurrentPage + 1)} disabled={safeCurrentPage === totalPages}>
            Next
          </button>
        </nav>
      )}

      {!error && isLoading && <p className="empty-state">Loading the collection...</p>}
      {!error && !isLoading && products.length === 0 && <p className="empty-state">No products match your search.</p>}
      <SiteFooter />
    </main>
  );
};

export default ProductCatalog;