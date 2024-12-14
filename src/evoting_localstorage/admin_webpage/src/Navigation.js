import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import './Navigation.css';

function Navigation() {
  const navigate = useNavigate();
  const location = useLocation(); // Get current location

  const handleGoBack = () => {
    // If the current page is not the root page, go back
    if (location.pathname !== '/options') {
      navigate(-1); // Go back to the previous page
    } else {
      handleLogout(); // If already on '/', trigger logout
    }
  };

  const handleLogout = () => {
    sessionStorage.removeItem('access_token'); // Clear session storage
    navigate('/'); // Navigate to login page
  };

  const isOnLoginPage = location.pathname === '/'; // Check if on login page

  return (
    <div className="navigation-bar">
      <button 
        onClick={handleGoBack} 
        className="nav-button"
      >
        Go Back
      </button>
      <button 
        onClick={handleLogout} 
        className="nav-button"
        disabled={isOnLoginPage} // Disable logout button when on login page
      >
        Logout
      </button>
    </div>
  );
}

export default Navigation;
