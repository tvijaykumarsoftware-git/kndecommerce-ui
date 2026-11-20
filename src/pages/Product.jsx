import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Swal from 'sweetalert2';
import API from '../api/api';
import UserHeader from '../components/UserHeader';
import SiteFooter from '../components/SiteFooter';
import '../App.css';

const emptyProduct = { 
  name: '', 
  description: '', 
  price: '', 
  discountOnMRP: '', 
  platformFee: '', 
  stockQuantity: 0, 
  categoryId: '', 
  imageUrl: '',
  isEMI: false, // Added default state for IsEMI
  images: [''] 
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
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const productsPerPage = 5;
  const requestConfig = { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } };

  const loadData = async () => {
    const [productsResponse, categoriesResponse] = await Promise.all([
      API.get('/products'),
      API.get('/categories')
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
    const value = target.type === 'checkbox' ? target.checked : target.value;
    setForm((current) => ({ ...current, [target.name]: value }));
  };

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
      isEMI: Boolean(form.isEMI),
      productImages: form.images.filter(img => img.trim() !== '').map(url => ({ imageUrl: url.trim() }))
    };

    try {
      if (editingProductId) {
        await API.put(`/products/${editingProductId}`, { ...payload, productId: editingProductId }, requestConfig);
      } else {
        await API.post('/products', payload, requestConfig);
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
      isEMI: product.isEMI ?? false,
      images: product.productImages && product.productImages.length > 0 
        ? product.productImages.map(img => img.imageUrl) 
        : [product.imageUrl || '']
    });
    setEditingProductId(product.productId);
    setIsModalOpen(true);
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
    const result = await Swal.fire({
      title: 'Are you sure?',
      text: 'Do you really want to delete this product? This process cannot be undone.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#1b3b36',
      cancelButtonColor: '#ef4444',
      confirmButtonText: 'Yes, delete it!'
    });

    if (!result.isConfirmed) return;

    setError('');
    try {
      await API.delete(`/products/${productId}`, requestConfig);
      setMessage('Product deleted.');
      await loadData();
      Swal.fire('Deleted!', 'The product has been deleted successfully.', 'success');
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Unable to delete this product.');
      Swal.fire('Error!', 'Unable to delete this product.', 'error');
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

                {/* IsEMI Checkbox Field */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '6px 0' }}>
                  <input 
                    type="checkbox" 
                    id="isEMI" 
                    name="isEMI" 
                    checked={form.isEMI} 
                    onChange={updateForm} 
                    style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                  />
                  <label htmlFor="isEMI" style={{ cursor: 'pointer', fontWeight: '500', color: '#334155' }}>
                    Available for EMI / Installments
                  </label>
                </div>

                {/* Dynamic Image Input Fields */}
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
                  {/* Cancel button with light red background */}
                  <button type="button" onClick={cancelEdit} style={{ padding: '10px 16px', background: '#fee2e2', color: '#991b1b', border: '1px solid #fca5a5', borderRadius: '4px', cursor: 'pointer', fontWeight: '600' }}>Cancel</button>
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
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                  <strong>{product.name}</strong>
                  {product.isEMI && (
                    <span style={{ background: '#e0f2fe', color: '#0369a1', fontSize: '11px', padding: '2px 6px', borderRadius: '4px', fontWeight: '600' }}>
                      EMI Available
                    </span>
                  )}
                </div>
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
              {/* Action Icons replacing text buttons */}
              <div className="admin-actions" style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                <button 
                  type="button" 
                  onClick={() => editProduct(product)} 
                  title="Edit Product"
                  style={{ background: '#f1f5f9', border: '1px solid #cbd5e1', borderRadius: '4px', padding: '6px 8px', cursor: 'pointer', display: 'flex', alignItems: 'center', color: '#334155' }}
                >
                  {/* Edit Icon SVG */}
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
                </button>
                <button 
                  type="button" 
                  onClick={() => removeProduct(product.productId)} 
                  title="Delete Product"
                  style={{ background: '#fee2e2', border: '1px solid #fca5a5', borderRadius: '4px', padding: '6px 8px', cursor: 'pointer', display: 'flex', alignItems: 'center', color: '#991b1b' }}
                >
                  {/* Delete Icon SVG */}
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>
                </button>
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
