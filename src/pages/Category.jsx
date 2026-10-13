import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import UserHeader from '../components/UserHeader';
import SiteFooter from '../components/SiteFooter';
import '../App.css';

const API_URL = 'http://localhost:5107/api';
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
    const { data } = await axios.get(`${API_URL}/categories`);
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
    try {
      if (editingCategoryId) {
        await axios.put(`${API_URL}/categories/${editingCategoryId}`, { ...form, categoryId: editingCategoryId }, requestConfig);
      } else {
        await axios.post(`${API_URL}/categories`, form, requestConfig);
      }

      setForm(emptyCategory);
      setEditingCategoryId(null);
      setMessage('Category saved.');
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
    if (!window.confirm('Delete this category?')) return;

    setError('');
    try {
      await axios.delete(`${API_URL}/categories/${categoryId}`, requestConfig);
      setMessage('Category deleted.');
      await loadCategories();
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Unable to delete this category.');
    }
  };

  const pageNumbers = Array.from({ length: totalPages }, (_, index) => index + 1);

  return (
    <main className="shop-page narrow-page admin-page">
      <UserHeader />
      <section className="page-heading">
        <p className="auth-kicker">Catalog</p>
        <h1>Categories</h1>
      </section>
      {message && <p className="shop-message" role="status">{message}</p>}
      {error && <p className="auth-error shop-alert" role="alert">{error}</p>}

      <section className="admin-section">
        <div className="admin-section-heading">
          <h2>Category manager</h2>
          <span>{categories.length} items</span>
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
            <button type="button" className="text-button" onClick={cancelEdit}>Cancel</button>
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
                <button type="button" onClick={() => editCategory(category)}>Edit</button>
                <button type="button" onClick={() => removeCategory(category.categoryId)}>Delete</button>
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
