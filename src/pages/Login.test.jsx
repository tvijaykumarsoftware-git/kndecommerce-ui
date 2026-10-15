import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import API from '../api/api';
import Login from './Login';

const mockNavigate = jest.fn();

jest.mock('../api/api', () => ({
  __esModule: true,
  default: { post: jest.fn() }
}));
jest.mock('react-router-dom', () => {
  const ReactRouter = require('react');
  return {
    Link: ({ to, children, ...props }) => ReactRouter.createElement('a', { href: to, ...props }, children),
    useNavigate: () => mockNavigate
  };
});

const renderLogin = () => render(<Login />);

beforeEach(() => {
  localStorage.clear();
  sessionStorage.clear();
  API.post.mockReset();
  mockNavigate.mockReset();
});

test('signs in with the trimmed email and navigates to the catalog', async () => {
  API.post.mockResolvedValue({
    data: {
      token: 'test-token',
      userName: 'Shopper',
      email: 'shopper@example.com',
      role: 'Customer',
      expiration: '2026-10-15T12:00:00Z'
    }
  });
  renderLogin();

  fireEvent.change(screen.getByLabelText(/email/i), { target: { value: ' shopper@example.com ' } });
  fireEvent.change(screen.getByLabelText(/password/i), { target: { value: 'password123' } });
  fireEvent.submit(screen.getByLabelText(/email/i).closest('form'));

  await screen.findByRole('button', { name: /sign in/i });
  expect(mockNavigate).toHaveBeenCalledWith('/catalog');
  expect(API.post).toHaveBeenCalledWith('/auth/login', {
    email: 'shopper@example.com',
    password: 'password123'
  });
  expect(localStorage.getItem('token')).toBe('test-token');
});

test('shows the API message when the credentials are rejected', async () => {
  API.post.mockRejectedValue({
    response: { status: 401, data: { message: 'Invalid email or account is inactive.' } }
  });
  renderLogin();

  fireEvent.change(screen.getByLabelText(/email/i), { target: { value: 'shopper@example.com' } });
  fireEvent.change(screen.getByLabelText(/password/i), { target: { value: 'wrong-password' } });
  fireEvent.click(screen.getByRole('button', { name: /sign in/i }));

  expect(await screen.findByRole('alert')).toHaveTextContent('Invalid email or account is inactive.');
});

test('reports a connection failure separately from invalid credentials', async () => {
  API.post.mockRejectedValue({ request: {} });
  renderLogin();

  fireEvent.change(screen.getByLabelText(/email/i), { target: { value: 'shopper@example.com' } });
  fireEvent.change(screen.getByLabelText(/password/i), { target: { value: 'password123' } });
  fireEvent.click(screen.getByRole('button', { name: /sign in/i }));

  expect(await screen.findByRole('alert')).toHaveTextContent('Unable to reach the sign-in service.');
});
