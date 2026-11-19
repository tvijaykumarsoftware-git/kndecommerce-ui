import React, { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import API from '../api/api';
import UserHeader from '../components/UserHeader';
import SiteFooter from '../components/SiteFooter';
import '../App.css';

// Builds { [productId]: { quantity, cartItemIds: [ids ascending] } } from individual DB rows
const normalizeCart = (data) => {
  const list = Array.isArray(data) ? data : data?.items || data?.cartItems || [];
  const map = {};
  list.forEach((item) => {
    const productId = item.productId ?? item.product?.productId;
    if (productId === undefined || productId === null) return;
    const cartItemId = item.cartItemId ?? item.cartId ?? item.id;
    const entry = map[productId] || { quantity: 0, cartItemIds: [] };
    entry.quantity += Number(item.quantity || 1);
    if (cartItemId !== undefined && cartItemId !== null) entry.cartItemIds.push(cartItemId);
    map[productId] = entry;
  });
  Object.values(map).forEach((entry) => entry.cartItemIds.sort((x, y) => x - y));
  return map;
};

// Resolves multi-image support (productImages) with fallback to single imageUrl
const getProductImages = (product) => {
  if (product?.productImages && product.productImages.length > 0) {
    return product.productImages.map((img) => img.imageUrl).filter(Boolean);
  }
  return [product?.imageUrl].filter(Boolean);
};

const ProductCatalog = () => {
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [search, setSearch] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  // cart state: { [productId]: { quantity, cartItemIds: [] } }
  const [cartMap, setCartMap] = useState({});
  const [busyProductId, setBusyProductId] = useState(null);
  const [productMessages, setProductMessages] = useState({});
  // Global success message (kept from old UI, complements per-product messages)
  const [message, setMessage] = useState('');
  // Modal & Zoom States
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [zoomedCardId, setZoomedCardId] = useState(null);
  const [isModalZoomed, setIsModalZoomed] = useState(false);
  const [zoomPos, setZoomPos] = useState({ x: 50, y: 50 });
  const [isModalLoadingDetails, setIsModalLoadingDetails] = useState(false);

  const productsPerPage = 6;

  const setMsg = (productId, type, text) =>
    setProductMessages((prev) => ({ ...prev, [productId]: { type, text } }));

  const clearMsg = (productId) =>
    setProductMessages((prev) => {
      const next = { ...prev };
      delete next[productId];
      return next;
    });

  const authHeaders = useCallback(() => {
    const token = localStorage.getItem('token');
    return token ? { headers: { Authorization: `Bearer ${token}` } } : null;
  }, []);

  const loadCart = useCallback(async () => {
    const config = authHeaders();
    if (!config) {
      setCartMap({});
      return {};
    }
    try {
      const { data } = await API.get('/cart', config);
      const map = normalizeCart(data);
      setCartMap(map);
      return map;
    } catch (err) {
      if (err.response?.status === 401) {
        localStorage.removeItem('token');
        setCartMap({});
      }
      return {};
    }
  }, [authHeaders]);

  useEffect(() => {
    loadCart();
  }, [loadCart]);

  useEffect(() => {
    const loadCategories = async () => {
      try {
        const { data } = await API.get('/categories');
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
        const { data } = await API.get('/products', {
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

  // Keep currentPage in bounds if the filtered list shrinks
  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  const goToPage = (pageNumber) => {
    if (pageNumber < 1 || pageNumber > totalPages) return;
    setCurrentPage(pageNumber);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const getCartQty = (productId) => cartMap[productId]?.quantity || 0;

  const getRemainingStock = (product) =>
    Math.max(0, Number(product.stockQuantity || 0) - getCartQty(product.productId));

  const handleAuthError = (requestError) => {
    if (requestError.response?.status === 401) {
      localStorage.removeItem('token');
      navigate('/login');
      return true;
    }
    return false;
  };

  const addToCart = async (product) => {
    const config = authHeaders();
    if (!config) {
      navigate('/login');
      return;
    }
    if (getRemainingStock(product) <= 0) {
      setMsg(product.productId, 'info', 'No more stock available for this product.');
      return;
    }
    setBusyProductId(product.productId);
    clearMsg(product.productId);
    setMessage('');
    try {
      const { data } = await API.post(
        '/cart',
        { productId: Number(product.productId), quantity: 1 },
        config
      );
      setMessage(data?.message || `${product.name} added to cart.`);
      await loadCart();
      window.dispatchEvent(new Event('cartUpdated'));
    } catch (requestError) {
      if (handleAuthError(requestError)) return;
      setMsg(
        product.productId,
        'error',
        requestError.response?.data?.message || 'Unable to add this product to your cart.'
      );
    } finally {
      setBusyProductId(null);
    }
  };

  // + inserts a NEW row (Quantity = 1) in CartItems; - deletes only the latest row of that product
  const changeQuantity = async (product, delta) => {
    const config = authHeaders();
    if (!config) {
      navigate('/login');
      return;
    }
    if (delta > 0 && getRemainingStock(product) <= 0) {
      setMsg(
        product.productId,
        'info',
        `You have added all ${product.stockQuantity} available items to your cart.`
      );
      return;
    }
    if (delta < 0 && getCartQty(product.productId) <= 0) return;
    setBusyProductId(product.productId);
    clearMsg(product.productId);
    try {
      if (delta > 0) {
        await API.post(
          '/cart',
          { productId: Number(product.productId), quantity: 1 },
          config
        );
      } else {
        const ids = cartMap[product.productId]?.cartItemIds || [];
        const latestId = ids[ids.length - 1];
        if (latestId === undefined) return;
        await API.delete(`/cart/${latestId}`, config);
      }
      await loadCart();
      window.dispatchEvent(new Event('cartUpdated'));
    } catch (requestError) {
      if (handleAuthError(requestError)) return;
      setMsg(
        product.productId,
        'error',
        requestError.response?.data?.message || 'Unable to update quantity.'
      );
    } finally {
      setBusyProductId(null);
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

  // FIX: fetch full product details so all images (productImages relation) are available
  const openProductModal = async (product) => {
    setSelectedProduct(product);
    setActiveImageIndex(0);
    setIsModalZoomed(false);
    setZoomPos({ x: 50, y: 50 });

    // If the list payload already has multiple images, no need to refetch
    const existing = getProductImages(product);
    if (existing.length > 1) return;

    try {
      setIsModalLoadingDetails(true);
      const { data } = await API.get(`/products/${product.productId}`);
      setSelectedProduct((prev) =>
        prev && prev.productId === product.productId ? { ...prev, ...data } : prev
      );
    } catch {
      // keep list data as fallback
    } finally {
      setIsModalLoadingDetails(false);
    }
  };

  const closeModal = () => {
    setSelectedProduct(null);
    setIsModalZoomed(false);
    setIsModalLoadingDetails(false);
  };

  const getProductPricing = (product) => {
    const rawPrice = Number(product.price || 0);
    const rawDiscount = product.discountOnMRP ?? null;
    const discountVal = rawDiscount !== null && rawDiscount !== undefined ? Number(rawDiscount) : null;
    const hasDiscount =
      discountVal !== null && !isNaN(discountVal) && discountVal > 0 && discountVal < rawPrice;
    const discountedPrice = hasDiscount ? discountVal : rawPrice;
    const mrp = rawPrice;
    const discountPercent = hasDiscount ? Math.round(((mrp - discountedPrice) / mrp) * 100) : 0;
    return { mrp, discountedPrice, discountPercent, hasDiscount };
  };

  const qtyBtnStyle = (disabled) => ({
    width: '30px',
    height: '30px',
    border: '1px solid #cbd5e1',
    borderRadius: '4px',
    background: disabled ? '#f1f5f9' : '#ffffff',
    color: disabled ? '#94a3b8' : '#111827',
    fontSize: '16px',
    fontWeight: '700',
    cursor: disabled ? 'not-allowed' : 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 0
  });

  const renderPaginationNav = () => {
    if (error || totalPages <= 1) return null;
    return (
      <nav className="catalog-pagination" aria-label="Product catalog pagination">
        <button
          type="button"
          className="pagination-arrow"
          onClick={() => goToPage(safeCurrentPage - 1)}
          disabled={safeCurrentPage === 1}
        >
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

        <button
          type="button"
          className="pagination-arrow"
          onClick={() => goToPage(safeCurrentPage + 1)}
          disabled={safeCurrentPage === totalPages}
        >
          Next
        </button>
      </nav>
    );
  };

  return (
    <main className="shop-page catalog-page">
      <UserHeader />

      <section className="page-heading">
        <p className="auth-kicker">The collection</p>
        <h1 style={{ whiteSpace: 'nowrap' }}>Find something worth keeping.</h1>
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
          <select
            id="category-filter"
            value={categoryId}
            onChange={(event) => setCategoryId(event.target.value)}
          >
            <option value="">All categories</option>
            {categories.map((category) => (
              <option key={category.categoryId} value={category.categoryId}>
                {category.name}
              </option>
            ))}
          </select>
        </div>
      </section>

      {/* Global message + results metadata */}
      <section className="product-grid" aria-label="Product catalog metadata">
        {message && (
          <p className="shop-message" role="status">
            {message} <Link to="/cart">View cart</Link>
          </p>
        )}
        {error && (
          <p className="auth-error shop-alert" role="alert">
            {error}
          </p>
        )}

        {!error && !isLoading && products.length > 0 && (
          <div
            className="catalog-results-meta"
            aria-live="polite"
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: '10px',
              width: '100%'
            }}
          >
            <span>
              Showing {Math.min(startIndex + 1, products.length)}-
              {Math.min(startIndex + productsPerPage, products.length)} of {products.length} products
            </span>
            <span>
              Page {safeCurrentPage} of {totalPages}
            </span>
          </div>
        )}
      </section>

      {/* Top pagination */}
      {renderPaginationNav()}

      <section className="product-grid" aria-label="Product catalog">
        {visibleProducts.map((product) => {
          const remaining = getRemainingStock(product);
          const cartQty = getCartQty(product.productId);
          const totalStock = Number(product.stockQuantity || 0);
          const outOfStockInDb = totalStock <= 0;
          const isBusy = busyProductId === product.productId;
          const isZoomed = zoomedCardId === product.productId;
          const productMsg = productMessages[product.productId];
          const { mrp, discountedPrice, discountPercent, hasDiscount } = getProductPricing(product);

          const productImages = getProductImages(product);
          const displayImg = productImages[0];

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
                {displayImg ? (
                  <img
                    src={displayImg}
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
                    zIndex: 10
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

                <div style={{ marginTop: '12px' }}>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', flexWrap: 'wrap' }}>
                    <span style={{ fontSize: '18px', fontWeight: '700', color: '#212121' }}>
                      ₹{discountedPrice.toLocaleString('en-IN')}
                    </span>
                    {hasDiscount && (
                      <span style={{ fontSize: '14px', color: '#878787', textDecoration: 'line-through' }}>
                        ₹{mrp.toLocaleString('en-IN')}
                      </span>
                    )}
                    {hasDiscount && discountPercent > 0 && (
                      <span style={{ fontSize: '13px', fontWeight: '700', color: '#388e3c' }}>
                        {discountPercent}% off
                      </span>
                    )}
                  </div>
                </div>

                <div
                  className="product-purchase"
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginTop: '12px',
                    gap: '8px'
                  }}
                >
                  <span
                    style={{
                      backgroundColor: remaining > 0 ? '#10b981' : '#ef4444',
                      color: '#ffffff',
                      padding: '6px 12px',
                      borderRadius: '4px',
                      fontSize: '12px',
                      fontWeight: '600'
                    }}
                  >
                    {outOfStockInDb ? 'Out of stock' : remaining > 0 ? `Stock: ${remaining}` : 'Stock: 0'}
                  </span>

                  {cartQty === 0 ? (
                    <button
                      type="button"
                      style={{ padding: '6px 16px', fontSize: '12px', fontWeight: '600' }}
                      disabled={outOfStockInDb || remaining <= 0 || isBusy}
                      onClick={() => addToCart(product)}
                    >
                      {outOfStockInDb ? 'Sold out' : isBusy ? 'Adding...' : 'Add to cart'}
                    </button>
                  ) : (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <button
                        type="button"
                        aria-label="Decrease quantity"
                        style={qtyBtnStyle(isBusy)}
                        disabled={isBusy}
                        onClick={() => changeQuantity(product, -1)}
                      >
                        −
                      </button>
                      <span style={{ minWidth: '24px', textAlign: 'center', fontWeight: '700', fontSize: '14px' }}>
                        {cartQty}
                      </span>
                      <button
                        type="button"
                        aria-label="Increase quantity"
                        style={qtyBtnStyle(isBusy || remaining <= 0)}
                        disabled={isBusy || remaining <= 0}
                        onClick={() => changeQuantity(product, 1)}
                      >
                        +
                      </button>
                    </div>
                  )}
                </div>

                {productMsg && (
                  <p
                    role="status"
                    style={{
                      marginTop: '10px',
                      marginBottom: 0,
                      padding: '6px 10px',
                      borderRadius: '4px',
                      fontSize: '12px',
                      fontWeight: '600',
                      color: productMsg.type === 'error' ? '#b91c1c' : '#92400e',
                      backgroundColor: productMsg.type === 'error' ? '#fee2e2' : '#fef3c7'
                    }}
                  >
                    {productMsg.text}
                  </p>
                )}
              </div>
            </article>
          );
        })}
      </section>

      {/* Bottom pagination */}
      {renderPaginationNav()}

      {/* Loading & empty states */}
      {!error && isLoading && <p className="empty-state">Loading the collection...</p>}
      {!error && !isLoading && products.length === 0 && (
        <p className="empty-state">No products match your search.</p>
      )}

      {/* Product Detail Modal */}
      {selectedProduct &&
        (() => {
          const {
            mrp: modalMrp,
            discountedPrice: modalDiscountedPrice,
            hasDiscount: modalHasDiscount
          } = getProductPricing(selectedProduct);

          const productImages = getProductImages(selectedProduct);
          const activeImg = productImages[activeImageIndex] || productImages[0];

          const handleNextImage = (e) => {
            e.stopPropagation();
            if (productImages.length === 0) return;
            setActiveImageIndex((prev) => (prev + 1) % productImages.length);
          };

          const handlePrevImage = (e) => {
            e.stopPropagation();
            if (productImages.length === 0) return;
            setActiveImageIndex((prev) => (prev - 1 + productImages.length) % productImages.length);
          };

          return (
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
                  maxWidth: '820px',
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
                  style={{
                    position: 'absolute',
                    top: '16px',
                    right: '16px',
                    background: 'none',
                    border: 'none',
                    fontSize: '22px',
                    cursor: 'pointer',
                    color: '#6b7280',
                    zIndex: 10
                  }}
                >
                  ✕
                </button>

                <div style={{ display: 'flex', gap: '24px', flexWrap: 'wrap' }}>
                  {/* Image gallery */}
                  <div style={{ flex: '1 1 320px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    <div
                      style={{
                        position: 'relative',
                        overflow: 'hidden',
                        height: '320px',
                        backgroundColor: '#f9fafb',
                        borderRadius: '8px',
                        border: '1px solid #e5e7eb',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}
                      onMouseMove={isModalZoomed ? handleMouseMove : undefined}
                    >
                      {activeImg ? (
                        <img
                          src={activeImg}
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

                      {productImages.length > 1 && (
                        <>
                          <button
                            type="button"
                            onClick={handlePrevImage}
                            style={{
                              position: 'absolute',
                              left: '10px',
                              top: 'calc(50% - 16px)',
                              background: 'rgba(0,0,0,0.6)',
                              color: '#fff',
                              border: 'none',
                              borderRadius: '50%',
                              width: '32px',
                              height: '32px',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontSize: '18px',
                              zIndex: 5
                            }}
                          >
                            ‹
                          </button>
                          <button
                            type="button"
                            onClick={handleNextImage}
                            style={{
                              position: 'absolute',
                              right: '10px',
                              top: 'calc(50% - 16px)',
                              background: 'rgba(0,0,0,0.6)',
                              color: '#fff',
                              border: 'none',
                              borderRadius: '50%',
                              width: '32px',
                              height: '32px',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontSize: '18px',
                              zIndex: 5
                            }}
                          >
                            ›
                          </button>
                        </>
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
                        {isModalZoomed ? 'Zoom Out −' : 'Zoom In +'}
                      </button>
                    </div>

                    {productImages.length > 1 && (
                      <div
                        style={{
                          display: 'flex',
                          gap: '6px',
                          justifyContent: 'center',
                          alignItems: 'center',
                          flexWrap: 'wrap'
                        }}
                      >
                        {productImages.map((imgUrl, idx) => (
                          <img
                            key={idx}
                            src={imgUrl}
                            alt={`Thumbnail ${idx + 1}`}
                            onClick={() => setActiveImageIndex(idx)}
                            style={{
                              width: '45px',
                              height: '45px',
                              objectFit: 'cover',
                              borderRadius: '4px',
                              border: activeImageIndex === idx ? '2px solid #1b3b36' : '1px solid #cbd5e1',
                              cursor: 'pointer',
                              opacity: activeImageIndex === idx ? 1 : 0.6,
                              transition: 'all 0.2s ease'
                            }}
                          />
                        ))}
                      </div>
                    )}

                    {isModalLoadingDetails && (
                      <p style={{ fontSize: '12px', color: '#6b7280', textAlign: 'center', margin: 0 }}>
                        Loading images...
                      </p>
                    )}
                  </div>

                  {/* Specs */}
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
                      <div
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          borderBottom: '1px solid #f3f4f6',
                          paddingBottom: '8px'
                        }}
                      >
                        <span style={{ fontWeight: '600', color: '#6b7280', fontSize: '14px' }}>Product:</span>
                        <span style={{ fontWeight: '700', color: '#111827', fontSize: '15px' }}>
                          {selectedProduct.name}
                        </span>
                      </div>

                      <div
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          borderBottom: '1px solid #f3f4f6',
                          paddingBottom: '8px'
                        }}
                      >
                        <span style={{ fontWeight: '600', color: '#6b7280', fontSize: '14px' }}>Price:</span>
                        <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', flexWrap: 'wrap' }}>
                          <span style={{ fontWeight: '700', color: '#212121', fontSize: '18px' }}>
                            ₹{modalDiscountedPrice.toLocaleString('en-IN')}
                          </span>
                          {modalHasDiscount && (
                            <span style={{ textDecoration: 'line-through', color: '#878787', fontSize: '14px' }}>
                              ₹{modalMrp.toLocaleString('en-IN')}
                            </span>
                          )}
                        </div>
                      </div>

                      <div
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'flex-start',
                          borderBottom: '1px solid #f3f4f6',
                          paddingBottom: '8px'
                        }}
                      >
                        <span style={{ fontWeight: '600', color: '#6b7280', fontSize: '14px', minWidth: '80px' }}>
                          Model:
                        </span>
                        <span style={{ fontWeight: '500', color: '#374151', fontSize: '14px', textAlign: 'right' }}>
                          {selectedProduct.description || selectedProduct.name}
                        </span>
                      </div>

                      <div
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          paddingTop: '4px'
                        }}
                      >
                        <span style={{ fontWeight: '600', color: '#6b7280', fontSize: '14px' }}>Stock:</span>
                        <span
                          style={{
                            backgroundColor:
                              getRemainingStock(selectedProduct) > 0 ? '#10b981' : '#ef4444',
                            color: '#ffffff',
                            padding: '4px 10px',
                            borderRadius: '4px',
                            fontSize: '12px',
                            fontWeight: '600'
                          }}
                        >
                          {getRemainingStock(selectedProduct) > 0
                            ? `In Stock: ${getRemainingStock(selectedProduct)}`
                            : 'Out of Stock'}
                        </span>
                      </div>

                      {/* Buy / quantity controls inside the modal too */}
                      <div style={{ marginTop: '12px' }}>
                        {getCartQty(selectedProduct.productId) === 0 ? (
                          <button
                            type="button"
                            style={{
                              width: '100%',
                              padding: '10px 16px',
                              fontSize: '14px',
                              fontWeight: '700'
                            }}
                            disabled={
                              Number(selectedProduct.stockQuantity || 0) <= 0 ||
                              busyProductId === selectedProduct.productId
                            }
                            onClick={() => addToCart(selectedProduct)}
                          >
                            {Number(selectedProduct.stockQuantity || 0) <= 0
                              ? 'Sold out'
                              : busyProductId === selectedProduct.productId
                              ? 'Adding...'
                              : 'Add to cart'}
                          </button>
                        ) : (
                          <div
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              gap: '12px'
                            }}
                          >
                            <button
                              type="button"
                              aria-label="Decrease quantity"
                              style={qtyBtnStyle(busyProductId === selectedProduct.productId)}
                              disabled={busyProductId === selectedProduct.productId}
                              onClick={() => changeQuantity(selectedProduct, -1)}
                            >
                              −
                            </button>
                            <span style={{ minWidth: '24px', textAlign: 'center', fontWeight: '700', fontSize: '16px' }}>
                              {getCartQty(selectedProduct.productId)}
                            </span>
                            <button
                              type="button"
                              aria-label="Increase quantity"
                              style={qtyBtnStyle(
                                busyProductId === selectedProduct.productId ||
                                  getRemainingStock(selectedProduct) <= 0
                              )}
                              disabled={
                                busyProductId === selectedProduct.productId ||
                                getRemainingStock(selectedProduct) <= 0
                              }
                              onClick={() => changeQuantity(selectedProduct, 1)}
                            >
                              +
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          );
        })()}

      <SiteFooter />
    </main>
  );
};

export default ProductCatalog;