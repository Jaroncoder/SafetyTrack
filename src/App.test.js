import { render, screen } from '@testing-library/react';
import App from './App';

test('renders the Serene Safety home screen', () => {
  render(<App />);
  expect(screen.getByText(/Serene Safety/i)).toBeInTheDocument();
  expect(screen.getByText(/Choose your portal to continue/i)).toBeInTheDocument();
});
