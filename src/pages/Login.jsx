import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import API from '../api/api';
import '../App.css';

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
      const { data } = await API.post('/auth/login', {
        email: form.email.trim(),
        password: form.password
      });

      if (!data?.token) throw new Error('The login response did not include a token.');

      localStorage.setItem('token', data.token);
      localStorage.setItem('userName', data.userName);
      localStorage.setItem('email', data.email);
      if (data.imageUrl) localStorage.setItem('imageUrl', data.imageUrl);
      else localStorage.removeItem('imageUrl');
      localStorage.setItem('role', data.role);
      localStorage.setItem('tokenExpiration', data.expiration);

      // Unique session tab identifier
      const currentTabSessionId = `session_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
      sessionStorage.setItem('tabSessionId', currentTabSessionId);

      // Broadcast active session to open tabs
      if ('BroadcastChannel' in window) {
        const channel = new BroadcastChannel('active_sessions_channel');
        channel.postMessage({ type: 'USER_LOGGED_IN', email: data.email, sessionId: currentTabSessionId });
        channel.close();
      }

      navigate(data.role === 'Admin' ? '/admin/dashboard' : '/catalog');
    } catch (requestError) {
      const responseData = requestError.response?.data;
      const serverMessage = typeof responseData === 'string'
        ? responseData
        : responseData?.message || responseData?.error || responseData?.title;
      setError(serverMessage || 'Unable to sign in. Please check your details.');
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