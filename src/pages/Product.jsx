import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import UserHeader from '../components/UserHeader';
import SiteFooter from '../components/SiteFooter';
import '../App.css';

const API_URL = 'https://ecommercestoredevapi-amdjeheceag6eedy.westus3-01.azurewebsites.net/api';
const emptyProduct = { 
  name: '', 
  description: '', 
  price: '', 
  discountOnMRP: '', 
  platformFee: '', 
  stockQuantity: 0, 
  categoryId: '', 
  imageUrl: '',
  images: [''] // Dynamic image URLs list initialized with one empty field
};

const getApiErrorMessage = (requestError, fallback) => {
  const responseData = requestError.response?.data;
  if (responseData?.errors) {
    const validationMessages = Object.values(responseData.errors).flat().filter(Boolean);
    if (validationMessages.length) return validationMessages.join(' ');
  }
  return responseData?.message || responseData?.title || fallback;
};

const ProductPage = () => {
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [form, setForm] = useState(emptyProduct);
  const [editingProductId, setEditingProductId] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false); // Popup modal state
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

  // Handlers for dynamic image inputs
  const handleImageChange = (index, value) => {
    const updatedImages = [...form.images];
    updatedImages[index] = value;
    setForm((current) => ({ ...current, images: updatedImages }));
  };

  const addImageField = () => {
    setForm((current) => ({ ...current, images: [...current.images, ''] }));
  };

  const removeImageField = (index) => {
    const updatedImages = form.images.filter((_, i) => i !== index);
    setForm((current) => ({ ...current, images: updatedImages.length ? updatedImages : [''] }));
  };

  const saveProduct = async (event) => {
    event.preventDefault();
    setError('');
    setMessage('');

    const price = Number(form.price);
    const stockQuantity = Number(form.stockQuantity);
    const categoryId = Number(form.categoryId);

    if (!form.name.trim() || !Number.isFinite(price) || price < 0 || !Number.isInteger(stockQuantity) || stockQuantity < 0 || !Number.isInteger(categoryId) || categoryId < 1) {
      setError('Enter a product name, valid price and stock, and choose a category.');
      return;
    }

    const payload = {
      name: form.name.trim(),
      description: form.description.trim(),
      price,
      stockQuantity,
      categoryId,
      imageUrl: form.imageUrl.trim() || (form.images.length > 0 ? form.images[0].trim() : ''),
      discountOnMRP: form.discountOnMRP !== '' ? Number(form.discountOnMRP) : null,
      platformFee: form.platformFee !== '' ? Number(form.platformFee) : null,
      productImages: form.images.filter(img => img.trim() !== '').map(url => ({ imageUrl: url.trim() }))
    };

    try {
      if (editingProductId) {
        await axios.put(`${API_URL}/products/${editingProductId}`, { ...payload, productId: editingProductId }, requestConfig);
      } else {
        await axios.post(`${API_URL}/products`, payload, requestConfig);
      }

      setForm(emptyProduct);
      setEditingProductId(null);
      setIsModalOpen(false);
      setMessage('Product saved.');
      await loadData();
    } catch (requestError) {
      setError(getApiErrorMessage(requestError, 'Unable to save this product.'));
    }
  };

  const editProduct = (product) => {
    setForm({
      name: product.name,
      description: product.description || '',
      price: product.price,
      discountOnMRP: product.discountOnMRP ?? '',
      platformFee: product.platformFee ?? '',
      stockQuantity: product.stockQuantity,
      categoryId: product.categoryId,
      imageUrl: product.imageUrl || '',
      images: product.productImages && product.productImages.length > 0 
        ? product.productImages.map(img => img.imageUrl) 
        : [product.imageUrl || '']
    });
    setEditingProductId(product.productId);
    setIsModalOpen(true); // Open modal for editing
  };

  const openAddModal = () => {
    setForm(emptyProduct);
    setEditingProductId(null);
    setIsModalOpen(true);
  };

  const cancelEdit = () => {
    setEditingProductId(null);
    setForm(emptyProduct);
    setIsModalOpen(false);
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
      <br></br>
      <section>
        <p className="auth-kicker">Catalog || Products || Product manager</p>
      </section>
      {message && <p className="shop-message" role="status">{message}</p>}
      {error && <p className="auth-error shop-alert" role="alert">{error}</p>}
      <section className="admin-section">
        <div className="admin-section-heading" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h2>Product manager</h2>
            <span>{products.length} items</span>
          </div>
          {/* Add Product Button in the Corner */}
          <button 
            type="button" 
            onClick={openAddModal}
            style={{ padding: '10px 18px', background: '#1b3b36', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: '600' }}
          >
            + Add Product
          </button>
        </div>
        {/* Modal Popup Form */}
        {isModalOpen && (
          <div style={{
            position: 'fixed', top: 0, left: 0, width: '100%', height: '100%',
            backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000
          }}>
            <div style={{
              background: '#fff', padding: '24px', borderRadius: '8px', width: '90%', maxWidth: '700px',
              maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <h3>{editingProductId ? 'Edit Product' : 'Add New Product'}</h3>
                <button type="button" onClick={cancelEdit} style={{ background: 'transparent', border: 'none', fontSize: '18px', cursor: 'pointer' }}>&times;</button>
              </div>

              <form onSubmit={saveProduct} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <input style={{ padding: '10px', borderRadius: '4px', border: '1px solid #cbd5e1' }} name="name" placeholder="Product name *" value={form.name} onChange={updateForm} required />
                <textarea style={{ padding: '10px', borderRadius: '4px', border: '1px solid #cbd5e1' }} name="description" placeholder="Description" value={form.description} onChange={updateForm} />
                
                <div style={{ display: 'flex', gap: '8px' }}>
                  <input style={{ flex: 1, padding: '10px', borderRadius: '4px', border: '1px solid #cbd5e1' }} name="price" type="number" min="0" step="0.01" placeholder="MRP Price *" value={form.price} onChange={updateForm} required />
                  <input style={{ flex: 1, padding: '10px', borderRadius: '4px', border: '1px solid #cbd5e1' }} name="discountOnMRP" type="number" min="0" step="0.01" placeholder="Discount Price" value={form.discountOnMRP} onChange={updateForm} />
                </div>

                <div style={{ display: 'flex', gap: '8px' }}>
                  <input style={{ flex: 1, padding: '10px', borderRadius: '4px', border: '1px solid #cbd5e1' }} name="platformFee" type="number" min="0" step="0.01" placeholder="Platform Fee" value={form.platformFee} onChange={updateForm} />
                  <input style={{ flex: 1, padding: '10px', borderRadius: '4px', border: '1px solid #cbd5e1' }} name="stockQuantity" type="number" min="0" placeholder="Stock *" value={form.stockQuantity} onChange={updateForm} required />
                </div>

                <select style={{ padding: '10px', borderRadius: '4px', border: '1px solid #cbd5e1', background: '#fff' }} name="categoryId" value={form.categoryId} onChange={updateForm} required>
                  <option value="">Select Category *</option>
                  {categories.filter((category) => category.isActive).map((category) => (
                    <option key={category.categoryId} value={category.categoryId}>{category.name}</option>
                  ))}
                </select>

                {/* Dynamic Image Input Fields with + Button */}
                <div style={{ border: '1px solid #e2e8f0', padding: '12px', borderRadius: '6px', background: '#f8fafc' }}>
                  <label style={{ fontWeight: '600', display: 'block', marginBottom: '8px' }}>Product Images (Multiple allowed)</label>
                  {form.images.map((imgUrl, index) => (
                    <div key={index} style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
                      <input 
                        style={{ flex: 1, padding: '8px', borderRadius: '4px', border: '1px solid #cbd5e1' }} 
                        placeholder={`Image URL #${index + 1}`} 
                        value={imgUrl} 
                        onChange={(e) => handleImageChange(index, e.target.value)} 
                      />
                      {form.images.length > 1 && (
                        <button type="button" onClick={() => removeImageField(index)} style={{ padding: '6px 10px', background: '#ef4444', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>X</button>
                      )}
                    </div>
                  ))}
                  <button type="button" onClick={addImageField} style={{ marginTop: '4px', padding: '6px 12px', background: '#0ea5e9', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: '600' }}>
                    + Add Another Image
                  </button>
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '12px' }}>
                  <button type="button" onClick={cancelEdit} style={{ padding: '10px 16px', background: '#e2e8f0', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>Cancel</button>
                  <button type="submit" style={{ padding: '10px 16px', background: '#1b3b36', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: '600' }}>
                    {editingProductId ? 'Update Product' : 'Save Product'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        <div className="admin-grid" style={{ marginTop: '20px' }}>
          {visibleProducts.map((product) => (
            <article className="admin-card" key={product.productId}>
              <div>
                <strong>{product.name}</strong>
                <span>
                  {product.categoryName || 'Uncategorized'} · 
                  {product.discountOnMRP ? (
                    <>
                      <span style={{ textDecoration: 'line-through', color: '#878787', marginRight: '4px' }}>₹{Number(product.price).toFixed(2)}</span>
                      <strong style={{ color: '#212121', marginRight: '4px' }}>₹{Number(product.discountOnMRP).toFixed(2)}</strong>
                    </>
                  ) : (
                    ` ₹${Number(product.price).toFixed(2)} `
                  )}
                  · {product.stockQuantity} in stock
                  {product.productImages?.length > 0 && ` · ${product.productImages.length} Images`}
                </span>
              </div>
              <div className="admin-actions">
                <button type="button" onClick={() => editProduct(product)}>Edit</button>
                <button type="button" onClick={() => removeProduct(product.productId)}>Delete</button>
              </div>
            </article>
          ))}
        </div>

        {totalPages > 1 && (
          <nav className="admin-pagination" aria-label="Product pagination" style={{ marginTop: '20px' }}>
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
