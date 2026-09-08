import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Link, useNavigate } from 'react-router-dom';

const API_URL = 'http://localhost:5107/api';
const moreMenuItems = [
  { label: 'Notification Preferences', to: '/notification-preferences' },
  { label: '24x7 Customer Care', to: '/customer-care' },
  { label: 'Advertise', to: '/advertise' }
];

const UserHeader = () => {
  const navigate = useNavigate();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isManageOpen, setIsManageOpen] = useState(false);
  const [isMoreOpen, setIsMoreOpen] = useState(false);
  const [cartCount, setCartCount] = useState(0);
  const [displayName, setDisplayName] = useState(() => localStorage.getItem('userName') || localStorage.getItem('email') || 'Account');
  const [profileImage, setProfileImage] = useState(() => localStorage.getItem('imageUrl'));
  const isSignedIn = Boolean(localStorage.getItem('token'));
  const isAdmin = localStorage.getItem('role') === 'Admin';
  const userName = displayName;
  const userRole = localStorage.getItem('role') || 'Guest';
  const imageUrl = profileImage;
  const imageSource = imageUrl && !imageUrl.startsWith('http') ? `http://localhost:5107${imageUrl}` : imageUrl;
  const initials = userName.split(' ').map((namePart) => namePart[0]).join('').slice(0, 2).toUpperCase();
  const [imageFailed, setImageFailed] = useState(false);

  useEffect(() => {
    if (!isSignedIn) return undefined;

    const loadProfile = async () => {
      try {
        const { data } = await axios.get(`${API_URL}/auth/profile`, {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
        });
        const name = data.userName || `${data.firstName} ${data.lastName}`.trim();
        setDisplayName(name || localStorage.getItem('email') || 'Account');
        setProfileImage(data.imageUrl || null);
        setImageFailed(false);
        localStorage.setItem('userName', name);
        if (data.imageUrl) localStorage.setItem('imageUrl', data.imageUrl);
        else localStorage.removeItem('imageUrl');
      } catch {
        // Keep the cached header profile available when the API is temporarily unavailable.
      }
    };

    const loadCartCount = async () => {
      try {
        const { data } = await axios.get(`${API_URL}/cart`, {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
        });
        setCartCount(data.reduce((total, item) => total + Number(item.quantity || 0), 0));
      } catch {
        setCartCount(0);
      }
    };

    loadProfile();
    loadCartCount();
    window.addEventListener('cartUpdated', loadCartCount);
    return () => window.removeEventListener('cartUpdated', loadCartCount);
  }, [isSignedIn]);

  useEffect(() => {
    const refreshProfile = () => {
      setDisplayName(localStorage.getItem('userName') || localStorage.getItem('email') || 'Account');
      setProfileImage(localStorage.getItem('imageUrl'));
      setImageFailed(false);
    };

    window.addEventListener('profileUpdated', refreshProfile);
    return () => window.removeEventListener('profileUpdated', refreshProfile);
  }, []);

  const signOut = () => {
    closeMenu();
    localStorage.clear();
    navigate('/login');
  };

  const closeMenu = () => {
    setIsMenuOpen(false);
    setIsManageOpen(false);
    setIsMoreOpen(false);
  };

  return (
    <header className="shop-nav">
      <Link className="brand" to="/catalog" onClick={closeMenu}>
        <span className="brand-mark" aria-hidden="true">K@</span>
        <span className="brand-copy"><strong>K@DeCOMMERCE</strong><small>Business marketplace</small></span>
      </Link>
      <button className="menu-toggle" type="button" aria-expanded={isMenuOpen} aria-controls="main-menu" onClick={() => setIsMenuOpen((open) => !open)}>
        <span className="menu-icon" aria-hidden="true"><span /><span /><span /></span>
        <span className="menu-label">Menu</span>
      </button>
      <nav id="main-menu" className={`shop-nav-links${isMenuOpen ? ' is-open' : ''}`} aria-label="Main menu">
        {isAdmin && <Link to="/admin/dashboard" onClick={closeMenu}>Dashboard</Link>}
        <Link to="/catalog" onClick={closeMenu}>Catalog</Link>
        {isAdmin ? <div className={`nav-menu${isManageOpen ? ' is-open' : ''}`}>
          <button type="button" className="nav-menu-trigger" aria-expanded={isManageOpen} aria-haspopup="true" onClick={() => setIsManageOpen((open) => !open)}>
            Manage <span aria-hidden="true">&#x25BE;</span>
          </button>
          <div className="nav-submenu">
            <Link to="/products" onClick={closeMenu}>Products</Link>
            <Link to="/categories" onClick={closeMenu}>Categories</Link>
            <Link to="/orders" onClick={closeMenu}>Orders</Link>
            <Link to="/admin/transactions" onClick={closeMenu}>Transactions</Link>
            <Link to="/admin/invoices" onClick={closeMenu}>Invoices</Link>
          </div>
        </div> : isSignedIn && <Link to="/orders" onClick={closeMenu}>Orders</Link>}
        <Link to="/about" onClick={closeMenu}>About</Link>
        <Link to="/contact" onClick={closeMenu}>Contact</Link>
        <div className={`nav-menu${isMoreOpen ? ' is-open' : ''}`}>
          <button type="button" className="nav-menu-trigger" aria-expanded={isMoreOpen} aria-haspopup="true" onClick={() => setIsMoreOpen((open) => !open)}>
            More <span aria-hidden="true">&#x25BE;</span>
          </button>
          <div className="nav-submenu">
            {moreMenuItems.map((item) => <Link key={item.label} to={item.to} onClick={closeMenu}>{item.label}</Link>)}
          </div>
        </div>
        {isSignedIn && <Link className="cart-nav-link" to="/cart" onClick={closeMenu} aria-label={`Cart, ${cartCount} ${cartCount === 1 ? 'item' : 'items'}`}>
          <svg className="cart-nav-icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M3 4h2l2.1 10.2a2 2 0 0 0 2 1.6h7.8a2 2 0 0 0 1.9-1.4L20.5 8H6" /><circle cx="9" cy="20" r="1.2" /><circle cx="18" cy="20" r="1.2" /></svg>
          <span>Cart</span><span className="cart-count" aria-hidden="true">{cartCount > 99 ? '99+' : cartCount}</span>
        </Link>}
        {isSignedIn ? <>
          <span className="user-profile" title={`${userName} - ${userRole}`}>
            <Link className="user-avatar-link" to="/profile" onClick={closeMenu} aria-label="Edit profile"><span className="user-avatar">{imageSource && !imageFailed ? <img src={imageSource} alt="" onError={() => setImageFailed(true)} /> : initials}</span></Link>
            <span><strong>{userName}</strong><small>{userRole}</small></span>
          </span>
          <button className="sign-out-button" type="button" onClick={signOut}>Sign out</button>
        </> : <Link className="nav-cta" to="/login" onClick={closeMenu}>Sign in</Link>}
      </nav>
    </header>
  );
};

export default UserHeader;
