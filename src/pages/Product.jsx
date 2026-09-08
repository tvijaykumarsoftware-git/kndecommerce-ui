import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import UserHeader from '../components/UserHeader';
import SiteFooter from '../components/SiteFooter';
import '../App.css';

const API_URL = 'http://localhost:5107/api';
const emptyProduct = { name: '', description: '', price: '', stockQuantity: 0, categoryId: '', imageUrl: '' };

const ProductPage = () => {
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [form, setForm] = useState(emptyProduct);
  const [editingProductId, setEditingProductId] = useState(null);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const productsPerPage = 5;
  const requestConfig = { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } };

  const loadData = async () => {
    const [productsResponse, categoriesResponse] = await Promise.all([
      axios.get(`${API_URL}/products`),
      axios.get(`${API_URL}/categories`)
    ]);
    setProducts(productsResponse.data);
    setCategories(categoriesResponse.data);
  };

  useEffect(() => {
    loadData().catch((requestError) => {
      if (requestError.response?.status === 401 || requestError.response?.status === 403) navigate('/login');
      else setError('Unable to load the product list.');
    });
  }, [navigate]);

  const totalPages = Math.max(1, Math.ceil(products.length / productsPerPage));
  const visibleProducts = products.slice((currentPage - 1) * productsPerPage, currentPage * productsPerPage);

  useEffect(() => {
    setCurrentPage((page) => Math.min(page, totalPages));
  }, [totalPages]);

  const updateForm = ({ target }) => {
    setForm((current) => ({ ...current, [target.name]: target.value }));
  };

  const saveProduct = async (event) => {
    event.preventDefault();
    setError('');
    try {
      const payload = {
        ...form,
        price: Number(form.price),
        stockQuantity: Number(form.stockQuantity),
        categoryId: Number(form.categoryId)
      };

      if (editingProductId) {
        await axios.put(`${API_URL}/products/${editingProductId}`, { ...payload, productId: editingProductId }, requestConfig);
      } else {
        await axios.post(`${API_URL}/products`, payload, requestConfig);
      }

      setForm(emptyProduct);
      setEditingProductId(null);
      setMessage('Product saved.');
      await loadData();
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Unable to save this product.');
    }
  };

  const editProduct = (product) => {
    setForm({
      name: product.name,
      description: product.description || '',
      price: product.price,
      stockQuantity: product.stockQuantity,
      categoryId: product.categoryId,
      imageUrl: product.imageUrl || ''
    });
    setEditingProductId(product.productId);
  };

  const cancelEdit = () => {
    setEditingProductId(null);
    setForm(emptyProduct);
  };

  const removeProduct = async (productId) => {
    if (!window.confirm('Delete this product?')) return;

    setError('');
    try {
      await axios.delete(`${API_URL}/products/${productId}`, requestConfig);
      setMessage('Product deleted.');
      await loadData();
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Unable to delete this product.');
    }
  };

  const pageNumbers = Array.from({ length: totalPages }, (_, index) => index + 1);

  return (
    <main className="shop-page narrow-page admin-page">
      <UserHeader />
      <section className="page-heading">
        <p className="auth-kicker">Catalog</p>
        <h1>Products</h1>
      </section>
      {message && <p className="shop-message" role="status">{message}</p>}
      {error && <p className="auth-error shop-alert" role="alert">{error}</p>}

      <section className="admin-section">
        <div className="admin-section-heading">
          <h2>Product manager</h2>
          <span>{products.length} items</span>
        </div>

        <form className="admin-form" onSubmit={saveProduct}>
          <input name="name" placeholder="Product name" value={form.name} onChange={updateForm} required />
          <input name="description" placeholder="Description" value={form.description} onChange={updateForm} />
          <input name="price" type="number" min="0" step="0.01" placeholder="Price" value={form.price} onChange={updateForm} required />
          <input name="stockQuantity" type="number" min="0" placeholder="Stock" value={form.stockQuantity} onChange={updateForm} required />
          <select name="categoryId" value={form.categoryId} onChange={updateForm} required>
            <option value="">Category</option>
            {categories.filter((category) => category.isActive).map((category) => (
              <option key={category.categoryId} value={category.categoryId}>{category.name}</option>
            ))}
          </select>
          <input name="imageUrl" placeholder="Image URL" value={form.imageUrl} onChange={updateForm} />
          <button className="summary-action" type="submit">{editingProductId ? 'Update product' : 'Add product'}</button>
          {editingProductId && (
            <button type="button" className="text-button" onClick={cancelEdit}>Cancel</button>
          )}
        </form>

        <div className="admin-grid">
          {visibleProducts.map((product) => (
            <article className="admin-card" key={product.productId}>
              <div>
                <strong>{product.name}</strong>
                <span>{product.categoryName || 'Uncategorized'} · ${Number(product.price).toFixed(2)} · {product.stockQuantity} in stock</span>
              </div>
              <div className="admin-actions">
                <button type="button" onClick={() => editProduct(product)}>Edit</button>
                <button type="button" onClick={() => removeProduct(product.productId)}>Delete</button>
              </div>
            </article>
          ))}
        </div>

        {totalPages > 1 && (
          <nav className="admin-pagination" aria-label="Product pagination">
            <button type="button" className="pagination-arrow" onClick={() => setCurrentPage((page) => Math.max(1, page - 1))} disabled={currentPage === 1}>Previous</button>
            {pageNumbers.map((pageNumber) => (
              <button
                key={pageNumber}
                type="button"
                className={pageNumber === currentPage ? 'pagination-page is-active' : 'pagination-page'}
                onClick={() => setCurrentPage(pageNumber)}
                aria-current={pageNumber === currentPage ? 'page' : undefined}
              >
                {pageNumber}
              </button>
            ))}
            <button type="button" className="pagination-arrow" onClick={() => setCurrentPage((page) => Math.min(totalPages, page + 1))} disabled={currentPage === totalPages}>Next</button>
          </nav>
        )}
      </section>

      <SiteFooter />
    </main>
  );
};

export default ProductPage;
