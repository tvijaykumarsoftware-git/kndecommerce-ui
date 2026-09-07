import React, { useState } from 'react';
import axios from 'axios';
import { Link, useNavigate } from 'react-router-dom';
import '../App.css';

const API_URL = 'http://localhost:5107/api/auth';

const Login = () => {
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = ({ target }) => {
    setForm((current) => ({ ...current, [target.name]: target.value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    setIsSubmitting(true);

    try {
      const { data } = await axios.post(`${API_URL}/login`, form);
      localStorage.setItem('token', data.token);
      localStorage.setItem('userName', data.userName);
      localStorage.setItem('email', data.email);
      if (data.imageUrl) localStorage.setItem('imageUrl', data.imageUrl);
      else localStorage.removeItem('imageUrl');
      localStorage.setItem('role', data.role);
      localStorage.setItem('tokenExpiration', data.expiration);
      navigate(data.role === 'Admin' ? '/admin/dashboard' : '/catalog');
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Unable to sign in. Please check your details.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="auth-page login-page">
      <section className="auth-panel">
        <p className="auth-kicker">KN Commerce</p>
        <h1>Welcome back</h1>
        <p className="auth-subtitle">Sign in to continue shopping.</p>

        <form className="auth-form" onSubmit={handleSubmit}>
          <label htmlFor="email">Email</label>
          <input id="email" name="email" type="email" autoComplete="email" value={form.email} onChange={handleChange} required />

          <label htmlFor="password">Password</label>
          <input id="password" name="password" type="password" autoComplete="current-password" value={form.password} onChange={handleChange} required />

          {error && <p className="auth-error" role="alert">{error}</p>}
          <button className="auth-submit" type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Signing in...' : 'Sign in'}
          </button>
        </form>

        <p className="auth-footer">New to KN Commerce? <Link to="/register">Create an account</Link></p>
      </section>
    </main>
  );
};

export default Login;