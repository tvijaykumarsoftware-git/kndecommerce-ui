import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import API from '../api/api';
import UserHeader from '../components/UserHeader';
import SiteFooter from '../components/SiteFooter';
import '../App.css';

import Swal from 'sweetalert2';
import { Pencil, Trash2 } from 'lucide-react';

const emptyCategory = { name: '', description: '', isActive: true };

const CategoryPage = () => {
  const navigate = useNavigate();
  const [categories, setCategories] = useState([]);
  const [form, setForm] = useState(emptyCategory);
  const [editingCategoryId, setEditingCategoryId] = useState(null);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const categoriesPerPage = 5;
  
  const requestConfig = { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } };

  const loadCategories = async () => {
    const { data } = await API.get('/categories');
    setCategories(data);
  };

  useEffect(() => {
    loadCategories().catch((requestError) => {
      if (requestError.response?.status === 401 || requestError.response?.status === 403) navigate('/login');
      else setError('Unable to load the category list.');
    });
  }, [navigate]);

  const totalPages = Math.max(1, Math.ceil(categories.length / categoriesPerPage));
  const visibleCategories = categories.slice((currentPage - 1) * categoriesPerPage, currentPage * categoriesPerPage);

  useEffect(() => {
    setCurrentPage((page) => Math.min(page, totalPages));
  }, [totalPages]);

  const updateForm = ({ target }) => {
    const value = target.name === 'isActive' ? target.value === 'true' : target.value;
    setForm((current) => ({ ...current, [target.name]: value }));
  };

  const saveCategory = async (event) => {
    event.preventDefault();
    setError('');
    setMessage('');
    
    try {
      if (editingCategoryId) {
        const payload = {
          CategoryId: editingCategoryId,
          Name: form.name,
          Description: form.description,
          IsActive: form.isActive
        };
        
        await API.put(`/categories/${editingCategoryId}`, payload, requestConfig);
        Swal.fire('Updated!', 'Category has been updated.', 'success');
      } else {
        const payload = {
          Name: form.name,
          Description: form.description,
          IsActive: form.isActive
        };
        await API.post('/categories', payload, requestConfig);
        Swal.fire('Added!', 'New category created.', 'success');
      }

      setForm(emptyCategory);
      setEditingCategoryId(null);
      await loadCategories();
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Unable to save this category.');
    }
  };

  const editCategory = (category) => {
    setForm({
      name: category.name,
      description: category.description || '',
      isActive: category.isActive
    });
    setEditingCategoryId(category.categoryId);
  };

  const cancelEdit = () => {
    setEditingCategoryId(null);
    setForm(emptyCategory);
  };

  const removeCategory = async (categoryId) => {
    // Changed message to reflect Soft Delete
    Swal.fire({
      title: 'Are you sure?',
      text: "This category will be marked as Inactive and hidden from the store. Historical orders will remain intact.",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Yes, deactivate it!'
    }).then(async (result) => {
      if (result.isConfirmed) {
        setError('');
        try {
          await API.delete(`/categories/${categoryId}`, requestConfig);
          Swal.fire('Deactivated!', 'Category has been marked as inactive.', 'success');
          await loadCategories();
        } catch (requestError) {
          const errorMsg = requestError.response?.data?.message || 'Unable to deactivate this category.';
          setError(errorMsg);
          Swal.fire('Error', errorMsg, 'error');
        }
      }
    });
  };

  const pageNumbers = Array.from({ length: totalPages }, (_, index) => index + 1);

  return (
    <main className="shop-page narrow-page admin-page">
      <UserHeader />
      <br />
      <section>
        <p className="auth-kicker">Catalog || Categories || Category manager</p>
      </section>
      {message && <p className="shop-message" role="status">{message}</p>}
      {error && <p className="auth-error shop-alert" role="alert">{error}</p>}

      <section className="admin-section">
        <div className="admin-section-heading">
          <span>{categories.length} active items</span>
        </div>

        <form className="admin-form category-form" onSubmit={saveCategory}>
          <input name="name" placeholder="Category name" value={form.name} onChange={updateForm} required />
          <input name="description" placeholder="Description" value={form.description} onChange={updateForm} />
          <select name="isActive" value={String(form.isActive)} onChange={updateForm}>
            <option value="true">Active</option>
            <option value="false">Inactive</option>
          </select>
          <button className="summary-action" type="submit">{editingCategoryId ? 'Update category' : 'Add category'}</button>
          
          {editingCategoryId && (
            <button 
              type="button" 
              className="text-button" 
              onClick={cancelEdit}
              style={{ 
                backgroundColor: '#ffcccc', 
                padding: '8px 16px', 
                borderRadius: '4px', 
                border: 'none', 
                color: '#cc0000',
                cursor: 'pointer'
              }}
            >
              Cancel
            </button>
          )}
        </form>

        <div className="admin-grid">
          {visibleCategories.map((category) => (
            <article className="admin-card" key={category.categoryId}>
              <div>
                <strong>{category.name}</strong>
                <span>{category.description || 'No description'} · {category.isActive ? 'Active' : 'Inactive'}</span>
              </div>
              <div className="admin-actions">
                <button 
                  type="button" 
                  onClick={() => editCategory(category)}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#0d6efd', padding: '0 8px' }}
                  title="Edit"
                >
                  <Pencil size={18} />
                </button>
                <button 
                  type="button" 
                  onClick={() => removeCategory(category.categoryId)}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#dc3545', padding: '0 8px' }}
                  title="Deactivate"
                >
                  <Trash2 size={18} />
                </button>
              </div>
            </article>
          ))}
        </div>

        {totalPages > 1 && (
          <nav className="admin-pagination" aria-label="Category pagination">
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

export default CategoryPage;
