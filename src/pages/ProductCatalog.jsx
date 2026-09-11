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

  // Modal & Zoom States
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [zoomedCardId, setZoomedCardId] = useState(null);
  const [isModalZoomed, setIsModalZoomed] = useState(false);
  const [zoomPos, setZoomPos] = useState({ x: 50, y: 50 });

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
      setError('');
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
      const { data } = await axios.post(
        `${API_URL}/cart`, 
        { productId, quantity: 1 }, 
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );
      setMessage(data.message || 'Product added to cart.');
      window.dispatchEvent(new Event('cartUpdated'));
    } catch (requestError) {
      console.error('Add to cart error response:', requestError.response || requestError);
      
      if (requestError.response?.status === 401) {
        localStorage.removeItem('token');
        navigate('/login');
        return;
      }

      setError(requestError.response?.data?.message || 'Unable to add this product to your cart.');
    } finally {
      setAddingProductId(null);
    }
  };

  const handleMouseMove = (e) => {
    const { left, top, width, height } = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - left) / width) * 100;
    const y = ((e.clientY - top) / height) * 100;
    setZoomPos({ x, y });
  };

  const toggleCardZoom = (e, productId) => {
    e.stopPropagation();
    if (zoomedCardId === productId) {
      setZoomedCardId(null);
    } else {
      setZoomedCardId(productId);
      setZoomPos({ x: 50, y: 50 });
    }
  };

  const openProductModal = (product) => {
    setSelectedProduct(product);
    setIsModalZoomed(false);
    setZoomPos({ x: 50, y: 50 });
  };

  const closeModal = () => {
    setSelectedProduct(null);
    setIsModalZoomed(false);
  };

  const hasSpecifications = (specs) => {
    if (!specs) return false;
    if (typeof specs === 'object') return Object.keys(specs).length > 0;
    return String(specs).trim().length > 0;
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
          const isZoomed = zoomedCardId === product.productId;

          return (
            <article className="product-card" key={product.productId}>
              <div 
                className="product-image" 
                style={{ 
                  position: 'relative', 
                  overflow: 'hidden', 
                  cursor: 'pointer',
                  height: '220px',
                  width: '100%',
                  borderRadius: '8px 8px 0 0',
                  backgroundColor: '#f8fafc'
                }}
                onMouseMove={isZoomed ? handleMouseMove : undefined}
                onClick={() => openProductModal(product)}
              >
                {product.imageUrl ? (
                  <img 
                    src={product.imageUrl} 
                    alt={product.name} 
                    style={{
                      width: '100%',
                      height: '100%',
                      objectFit: 'contain',
                      transformOrigin: `${zoomPos.x}% ${zoomPos.y}%`,
                      transform: isZoomed ? 'scale(2.2)' : 'scale(1)',
                      transition: isZoomed ? 'transform 0.05s linear' : 'transform 0.25s ease'
                    }}
                  />
                ) : (
                  <span>{product.name.slice(0, 1)}</span>
                )}
                
                <button
                  type="button"
                  aria-label="Toggle zoom"
                  onClick={(e) => toggleCardZoom(e, product.productId)}
                  style={{
                    position: 'absolute',
                    top: '10px',
                    right: '10px',
                    background: isZoomed ? '#ef4444' : 'rgba(0, 0, 0, 0.65)',
                    color: '#ffffff',
                    border: 'none',
                    borderRadius: '50%',
                    width: '32px',
                    height: '32px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '14px',
                    zIndex: 10,
                    boxShadow: '0 2px 5px rgba(0,0,0,0.2)'
                  }}
                >
                  {isZoomed ? '✕' : '🔍'}
                </button>
              </div>

              <div className="product-details">
                <div>
                  <h2>{product.name}</h2>
                  <p>{product.description || 'Made for daily use.'}</p>
                </div>

                <div className="product-purchase" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginTop: '12px' }}>
                  <strong>${Number(product.price).toFixed(2)}</strong>
                  
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

      {/* Product Detail Modal */}
      {selectedProduct && (
        <div 
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100vw',
            height: '100vh',
            backgroundColor: 'rgba(0, 0, 0, 0.75)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000
          }}
          onClick={closeModal}
        >
          <div 
            style={{
              backgroundColor: '#ffffff',
              padding: '28px',
              borderRadius: '12px',
              maxWidth: '780px',
              width: '90%',
              maxHeight: '85vh',
              overflowY: 'auto',
              position: 'relative',
              boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.3)'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <button 
              type="button" 
              onClick={closeModal} 
              style={{ position: 'absolute', top: '16px', right: '16px', background: 'none', border: 'none', fontSize: '22px', cursor: 'pointer', color: '#6b7280' }}
            >
              ✕
            </button>

            <div style={{ display: 'flex', gap: '24px', flexWrap: 'wrap' }}>
              {/* Modal Image Box */}
              <div 
                style={{ 
                  flex: '1 1 300px', 
                  position: 'relative', 
                  overflow: 'hidden', 
                  height: '320px', 
                  backgroundColor: '#f9fafb', 
                  borderRadius: '8px' 
                }}
                onMouseMove={isModalZoomed ? handleMouseMove : undefined}
              >
                {selectedProduct.imageUrl ? (
                  <img 
                    src={selectedProduct.imageUrl} 
                    alt={selectedProduct.name}
                    style={{
                      width: '100%',
                      height: '100%',
                      objectFit: 'contain',
                      transformOrigin: `${zoomPos.x}% ${zoomPos.y}%`,
                      transform: isModalZoomed ? 'scale(2.2)' : 'scale(1)',
                      transition: isModalZoomed ? 'transform 0.05s linear' : 'transform 0.25s ease'
                    }}
                  />
                ) : (
                  <span>{selectedProduct.name}</span>
                )}
                
                <button
                  type="button"
                  onClick={() => setIsModalZoomed(!isModalZoomed)}
                  style={{
                    position: 'absolute',
                    bottom: '12px',
                    right: '12px',
                    background: '#ffffff',
                    border: '1px solid #d1d5db',
                    borderRadius: '6px',
                    padding: '6px 12px',
                    fontSize: '12px',
                    fontWeight: '600',
                    cursor: 'pointer',
                    boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                  }}
                >
                  {isModalZoomed ? 'Zoom Out -' : 'Zoom In +'}
                </button>
              </div>

              {/* Modal Details */}
              <div style={{ flex: '1 1 300px' }}>
                <h3 
                  style={{ 
                    fontSize: '16px', 
                    margin: '0 0 16px 0', 
                    textTransform: 'uppercase', 
                    letterSpacing: '0.05em', 
                    color: '#374151',
                    borderBottom: '2px solid #e5e7eb',
                    paddingBottom: '6px'
                  }}
                >
                  Specifications
                </h3>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #f3f4f6', paddingBottom: '8px' }}>
                    <span style={{ fontWeight: '600', color: '#6b7280', fontSize: '14px' }}>Product:</span>
                    <span style={{ fontWeight: '700', color: '#111827', fontSize: '15px' }}>{selectedProduct.name}</span>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #f3f4f6', paddingBottom: '8px' }}>
                    <span style={{ fontWeight: '600', color: '#6b7280', fontSize: '14px' }}>Price:</span>
                    <span style={{ fontWeight: '700', color: '#059669', fontSize: '16px' }}>${Number(selectedProduct.price).toFixed(2)}</span>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '1px solid #f3f4f6', paddingBottom: '8px' }}>
                    <span style={{ fontWeight: '600', color: '#6b7280', fontSize: '14px', minWidth: '80px' }}>Model:</span>
                    <span style={{ fontWeight: '500', color: '#374151', fontSize: '14px', textAlign: 'right' }}>
                      {selectedProduct.description || selectedProduct.name}
                    </span>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '4px' }}>
                    <span style={{ fontWeight: '600', color: '#6b7280', fontSize: '14px' }}>Stock:</span>
                    <span
                      style={{
                        backgroundColor: selectedProduct.stockQuantity > 0 ? '#10b981' : '#ef4444',
                        color: '#ffffff',
                        padding: '4px 10px',
                        borderRadius: '4px',
                        fontSize: '12px',
                        fontWeight: '600'
                      }}
                    >
                      {selectedProduct.stockQuantity > 0 ? `In Stock: ${selectedProduct.stockQuantity}` : 'Out of Stock'}
                    </span>
                  </div>

                  {hasSpecifications(selectedProduct.specifications) && (
                    <div style={{ marginTop: '12px', background: '#f9fafb', padding: '12px', borderRadius: '6px', fontSize: '13px' }}>
                      {typeof selectedProduct.specifications === 'object' ? (
                        <ul style={{ paddingLeft: '16px', margin: 0 }}>
                          {Object.entries(selectedProduct.specifications).map(([key, val]) => (
                            <li key={key} style={{ marginBottom: '4px' }}>
                              <strong>{key}:</strong> {val}
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <p style={{ margin: 0, color: '#4b5563' }}>{selectedProduct.specifications}</p>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <SiteFooter />
    </main>
  );
};

export default ProductCatalog;