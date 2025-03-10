import React from 'react';
import { useNavigate, Link } from 'react-router-dom';

function Navbar({ isLoggedIn, isAdmin, onLogout }) {
  const navigate = useNavigate();

  const handleLogout = () => {
    onLogout();
    navigate('/');
  };

  const buttonClass = "px-4 py-2 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg shadow-md hover:from-blue-600 hover:to-blue-700 transform hover:scale-105 transition-all duration-200";

  return (
    <nav className="flex justify-between items-center px-8 py-4 bg-white shadow-md">
      <div className="flex items-center gap-8">
        <button 
          className={buttonClass}
          onClick={() => navigate('/')}
        >
          Play
        </button>
      </div>

      <div className="flex items-center">
        <h1 className="text-2xl font-bold">
          Guess
          <span className="mx-1">📍</span>
          <span className="bg-gradient-to-r from-blue-500 to-blue-600 bg-clip-text text-transparent">
            Where
          </span>
        </h1>
      </div>

      <div className="flex items-center gap-4">
        {isLoggedIn && (
          <>
            <button 
              className={buttonClass}
              onClick={() => navigate('/profile')}
            >
              Profile
            </button>
            <button 
              className={buttonClass}
              onClick={() => navigate('/friends')}
            >
              Friends
            </button>
          </>
        )}
        {isAdmin && (
          <button 
            className={buttonClass}
            onClick={() => navigate('/admin')}
          >
            Admin Dashboard
          </button>
        )}
        <button 
          className={buttonClass}
          onClick={isLoggedIn ? handleLogout : () => navigate('/login')}
        >
          {isLoggedIn ? 'Logout' : 'Login'}
        </button>
        <button 
          className={buttonClass}
          onClick={() => navigate('/challenges')}
        >
          Challenges
        </button>
      </div>
    </nav>
  );
}

export default Navbar; 