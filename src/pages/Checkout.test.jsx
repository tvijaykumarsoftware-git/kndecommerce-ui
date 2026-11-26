import React from 'react';
import { render, screen } from '@testing-library/react';
import { useLocation } from 'react-router-dom';
import Checkout from './Checkout';

jest.mock('../api/api', () => ({
  __esModule: true,
  default: { get: jest.fn(), post: jest.fn() }
}));

jest.mock('../components/UserHeader', () => () => null);
jest.mock('../components/SiteFooter', () => () => null);
jest.mock('react-router-dom', () => {
  const mockedReact = require('react');
  return {
    Link: ({ children, ...props }) => mockedReact.createElement('a', props, children),
    useLocation: jest.fn(),
    useNavigate: jest.fn()
  };
});

const renderConfirmation = (emailSent, emailError) => {
  useLocation.mockReturnValue({
    state: {
      paymentProvider: 'Razorpay',
      confirmation: { orderId: 123, invoiceNumber: 'INV-00000123', emailSent, emailError }
    }
  });
  return render(<Checkout />);
};

test('confirms when the order email was sent', () => {
  renderConfirmation(true);

  expect(screen.getByRole('status')).toHaveTextContent('sent to your registered email');
});

test('explains that the order is confirmed when its email could not be sent', () => {
  renderConfirmation(false);

  expect(screen.getByRole('status')).toHaveTextContent('Your order is confirmed');
});

test('shows the SendGrid failure reason when the backend provides one', () => {
  renderConfirmation(false, 'SendGrid rejected its API key.');

  expect(screen.getByRole('status')).toHaveTextContent('Your order is confirmed');
  expect(screen.getByRole('status')).toHaveTextContent('SendGrid rejected its API key.');
});
