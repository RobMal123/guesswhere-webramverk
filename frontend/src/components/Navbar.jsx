import React from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/Navbar.css';

function Navbar({ isLoggedIn, isAdmin, onLogout }) {
  const navigate = useNavigate();

  const handleLogout = () => {
    onLogout();
    navigate('/');
  };

  const handleAdminDashboard = () => {
    navigate('/admin');
  };

  const handlePlay = () => {
    navigate('/');
  };

  return (
    <nav className="navbar">
      <div className="navbar-left">
        <button 
          className="nav-button play-button"
          onClick={handlePlay}
        >
          Play
        </button>
      </div>
      <div className="navbar-center">
        <h1 className="logo">
          Guess<span className="logo-icon">📍</span>
          <span className="logo-highlight">Where</span>
        </h1>
      </div>
      <div className="navbar-right">
        {isAdmin && (
          <button 
            className="nav-button admin-button"
            onClick={handleAdminDashboard}
          >
            Admin Dashboard
          </button>
        )}
        <button 
          className="nav-button"
          onClick={isLoggedIn ? handleLogout : () => navigate('/login')}
        >
          {isLoggedIn ? 'Logout' : 'Login'}
        </button>
      </div>
    </nav>
  );
}

export default Navbar; 