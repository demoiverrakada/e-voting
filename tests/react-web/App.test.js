import React from 'react';
import { render, screen } from '@testing-library/react';
import App from '../App';

// Mock react-router-dom
jest.mock('react-router-dom', () => ({
  BrowserRouter: ({ children }) => <div data-testid="router">{children}</div>,
  Routes: ({ children }) => <div data-testid="routes">{children}</div>,
  Route: ({ path, element }) => <div data-testid={`route-${path}`}>{element}</div>,
  Navigate: ({ to }) => <div data-testid={`navigate-to-${to}`}>Navigate to {to}</div>
}));

// Mock the pages
jest.mock('../pages/FormPage', () => {
  return function MockFormPage() {
    return <div data-testid="form-page">Form Page</div>;
  };
});

jest.mock('../pages/BallotAudit', () => {
  return function MockBallotAudit() {
    return <div data-testid="ballot-audit">Ballot Audit</div>;
  };
});

jest.mock('../pages/DecryptedVotes', () => {
  return function MockDecryptedVotes() {
    return <div data-testid="decrypted-votes">Decrypted Votes</div>;
  };
});

jest.mock('../pages/VerificationResults', () => {
  return function MockVerificationResults() {
    return <div data-testid="verification-results">Verification Results</div>;
  };
});

jest.mock('../pages/ErrorPage', () => {
  return function MockErrorPage() {
    return <div data-testid="error-page">Error Page</div>;
  };
});

describe('Verification Webpage App', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders without crashing', () => {
    render(<App />);
    expect(screen.getByTestId('router')).toBeInTheDocument();
  });

  it('renders the main routes structure', () => {
    render(<App />);
    
    expect(screen.getByTestId('router')).toBeInTheDocument();
    expect(screen.getByTestId('routes')).toBeInTheDocument();
  });

  it('has correct route paths', () => {
    render(<App />);
    
    // Check that all expected routes are present
    expect(screen.getByTestId('route-/')).toBeInTheDocument();
    expect(screen.getByTestId('route-/ballot-audit')).toBeInTheDocument();
    expect(screen.getByTestId('route-/decrypted-votes')).toBeInTheDocument();
    expect(screen.getByTestId('route-/verification-results')).toBeInTheDocument();
    expect(screen.getByTestId('route-*')).toBeInTheDocument();
  });

  it('renders form page as default route', () => {
    render(<App />);
    expect(screen.getByTestId('form-page')).toBeInTheDocument();
  });

  it('has error handling route', () => {
    render(<App />);
    expect(screen.getByTestId('error-page')).toBeInTheDocument();
  });
});