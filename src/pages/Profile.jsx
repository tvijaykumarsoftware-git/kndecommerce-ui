import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import UserHeader from '../components/UserHeader';
import SiteFooter from '../components/SiteFooter';
import '../App.css';

const API_URL = 'http://localhost:5107/api/auth';
const emptyProfile = { firstName: '', lastName: '', email: '', phoneNumber: '', location: '', image: null };

const Profile = () => {
  const navigate = useNavigate();
  const [form, setForm] = useState(emptyProfile);
  const [imagePreview, setImagePreview] = useState('');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    axios.get(`${API_URL}/profile`, { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } })
      .then(({ data }) => {
        setForm({ ...emptyProfile, ...data });
        if (data.imageUrl) setImagePreview(data.imageUrl.startsWith('http') ? data.imageUrl : `http://localhost:5107${data.imageUrl}`);
      })
      .catch((requestError) => {
        if (requestError.response?.status === 401) navigate('/login');
        else setError(requestError.response?.data?.message || 'Unable to load your profile.');
      });
  }, [navigate]);

  const handleChange = ({ target }) => setForm((current) => ({ ...current, [target.name]: target.value }));

  const handleImageChange = ({ target }) => {
    const image = target.files?.[0] || null;
    setForm((current) => ({ ...current, image }));
    setImagePreview(image ? URL.createObjectURL(image) : '');
  };

  const saveProfile = async (event) => {
    event.preventDefault();
    setError('');
    setMessage('');
    setIsSaving(true);
    try {
      const payload = new FormData();
      Object.entries(form).forEach(([key, value]) => {
        if (key !== 'email' && value !== null && value !== '') payload.append(key, value);
      });
      const { data } = await axios.put(`${API_URL}/profile`, payload, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      localStorage.setItem('userName', data.userName);
      if (data.imageUrl) localStorage.setItem('imageUrl', data.imageUrl);
      else localStorage.removeItem('imageUrl');
      window.dispatchEvent(new Event('profileUpdated'));
      setForm((current) => ({ ...current, ...data, image: null }));
      setMessage('Profile updated.');
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Unable to update your profile.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <main className="shop-page narrow-page admin-page">
      <UserHeader />
      <section className="page-heading"><p className="auth-kicker">Account</p><h1>Edit profile</h1></section>
      {message && <p className="shop-message" role="status">{message}</p>}
      {error && <p className="auth-error shop-alert" role="alert">{error}</p>}
      <section className="profile-layout">
        <div className="profile-portrait">{imagePreview ? <img src={imagePreview} alt="Profile preview" /> : <span>{form.firstName?.[0]}{form.lastName?.[0]}</span>}</div>
        <form className="auth-form profile-form" onSubmit={saveProfile}>
          <div className="auth-name-fields">
            <div><label htmlFor="firstName">First name</label><input id="firstName" name="firstName" value={form.firstName} onChange={handleChange} required /></div>
            <div><label htmlFor="lastName">Last name</label><input id="lastName" name="lastName" value={form.lastName} onChange={handleChange} required /></div>
          </div>
          <label htmlFor="email">Email</label>
          <input id="email" name="email" type="email" value={form.email} readOnly />
          <div className="auth-name-fields">
            <div><label htmlFor="phoneNumber">Phone number</label><input id="phoneNumber" name="phoneNumber" type="tel" value={form.phoneNumber || ''} onChange={handleChange} /></div>
            <div><label htmlFor="location">Location</label><input id="location" name="location" value={form.location || ''} onChange={handleChange} /></div>
          </div>
          <label htmlFor="image">Profile image</label>
          <input id="image" name="image" type="file" accept="image/jpeg,image/png,image/webp,image/gif" onChange={handleImageChange} />
          <button className="auth-submit" type="submit" disabled={isSaving}>{isSaving ? 'Saving...' : 'Save profile'}</button>
        </form>
      </section>
      <SiteFooter />
    </main>
  );
};

export default Profile;
