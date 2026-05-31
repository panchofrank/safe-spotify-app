import React from 'react';
import { render, screen } from '@testing-library/react';
import App from './App';

// axios and query-string ship as pure ESM, which CRA's Jest doesn't transform;
// replace them with light stubs so the module graph loads under the test runner.
jest.mock('axios', () => ({
  __esModule: true,
  default: { get: jest.fn(), post: jest.fn(), put: jest.fn() },
}));
jest.mock('query-string', () => ({
  stringify: (obj: Record<string, string>) => new URLSearchParams(obj).toString(),
}));

test('shows the login screen when not authenticated', () => {
  render(<App />);
  expect(screen.getByText(/Set sail!/i)).toBeInTheDocument();
});
