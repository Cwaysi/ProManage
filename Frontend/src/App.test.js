import { render, screen } from '@testing-library/react';
import App from './App';

test('renders the ProManage app shell', () => {
  render(<App />);
  // Router is async; assert the login page renders on first load.
  expect(screen.getByLabelText(/username/i)).toBeInTheDocument();
});
