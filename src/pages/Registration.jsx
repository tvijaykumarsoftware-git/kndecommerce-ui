import React, { useState } from 'react';
import axios from 'axios';
import { Link, useNavigate } from 'react-router-dom';
import '../App.css';

const API_URL = 'http://localhost:5107/api/auth';

const Registration = () => {
  const navigate = useNavigate();
  const [form, setForm] = useState({ firstName: '', lastName: '', email: '', password: '', phoneNumber: '', location: '', image: null });
  const [imagePreview, setImagePreview] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = ({ target }) => {
    setForm((current) => ({ ...current, [target.name]: target.value }));
  };

  const handleImageChange = ({ target }) => {
    const image = target.files?.[0] || null;
    setForm((current) => ({ ...current, image }));
    setImagePreview(image ? URL.createObjectURL(image) : '');
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    setIsSubmitting(true);

    try {
      const payload = new FormData();
      Object.entries({ ...form, roleId: 2 }).forEach(([key, value]) => {
        if (value !== null && value !== '') payload.append(key, value);
      });
      await axios.post(`${API_URL}/register`, payload);
      navigate('/login', { state: { message: 'Account created. Please sign in.' } });
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Unable to create your account. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="auth-page registration-page">
      <section className="auth-panel">
        <p className="auth-kicker">K@D Commerce</p>
        <h1>Create your account</h1>
        <p className="auth-subtitle">Join us to keep your orders and cart in one place.</p>

        <form className="auth-form" onSubmit={handleSubmit}>
          <div className="auth-name-fields">
            <div>
              <label htmlFor="firstName">First name</label>
              <input id="firstName" name="firstName" autoComplete="given-name" value={form.firstName} onChange={handleChange} required />
            </div>
            <div>
              <label htmlFor="lastName">Last name</label>
              <input id="lastName" name="lastName" autoComplete="family-name" value={form.lastName} onChange={handleChange} required />
            </div>
          </div>

          <label htmlFor="email">Email</label>
          <input id="email" name="email" type="email" autoComplete="email" value={form.email} onChange={handleChange} required />

          <div className="auth-name-fields">
            <div>
              <label htmlFor="phoneNumber">Phone number</label>
              <input id="phoneNumber" name="phoneNumber" type="tel" autoComplete="tel" placeholder="+1 555 000 0000" value={form.phoneNumber} onChange={handleChange} />
            </div>
            <div>
              <label htmlFor="location">Location</label>
              <input id="location" name="location" autoComplete="address-level2" placeholder="City, country" value={form.location} onChange={handleChange} />
            </div>
          </div>

          <label htmlFor="image">Profile image</label>
          <input id="image" name="image" type="file" accept="image/jpeg,image/png,image/webp,image/gif" onChange={handleImageChange} />
          {imagePreview && <div className="registration-image-preview"><img src={imagePreview} alt="Profile preview" /></div>}

          <label htmlFor="password">Password</label>
          <input id="password" name="password" type="password" autoComplete="new-password" minLength="6" value={form.password} onChange={handleChange} required />

          {error && <p className="auth-error" role="alert">{error}</p>}
          <button className="auth-submit" type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Creating account...' : 'Create account'}
          </button>
        </form>

        <p className="auth-footer">Already have an account? <Link to="/login">Sign in</Link></p>
      </section>
    </main>
  );
};

export default Registration;