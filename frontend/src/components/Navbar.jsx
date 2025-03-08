import React from 'react';
import { useNavigate } from 'react-router-dom';

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
    <nav className="flex justify-between items-center px-8 py-4 bg-white shadow-md">
      <div className="flex items-center gap-8">
        <button 
          className="px-4 py-2 bg-gradient-to-r from-blue-500 to-blue-600 
                     text-white rounded-md hover:from-blue-600 hover:to-blue-700 
                     transition-all duration-300 transform hover:scale-105 
                     shadow-md hover:shadow-lg"
          onClick={handlePlay}
        >
          Play
        </button>
      </div>

      <div className="flex items-center">
        <h1 className="text-2xl font-bold">
          Guess
          <span className="mx-1">📍</span>
          <span className="bg-gradient-to-r from-blue-500 to-blue-600 
                         bg-clip-text text-transparent">
            Where
          </span>
        </h1>
      </div>

      <div className="flex items-center gap-4">
        {isLoggedIn && (
          <>
            <button 
              className="px-4 py-2 bg-gradient-to-r from-blue-500 to-blue-600 
                         text-white rounded-md hover:from-blue-600 hover:to-blue-700 
                         transition-all duration-300 transform hover:scale-105 
                         shadow-md hover:shadow-lg"
              onClick={() => navigate('/profile')}
            >
              Profile
            </button>
            <button 
              className="px-4 py-2 bg-gradient-to-r from-blue-500 to-blue-600 
                         text-white rounded-md hover:from-blue-600 hover:to-blue-700 
                         transition-all duration-300 transform hover:scale-105 
                         shadow-md hover:shadow-lg"
              onClick={() => navigate('/friends')}
            >
              Friends
            </button>
          </>
        )}
        {isAdmin && (
          <button 
            className="px-4 py-2 bg-gradient-to-r from-purple-500 to-purple-600 
                       text-white rounded-md hover:from-purple-600 hover:to-purple-700 
                       transition-all duration-300 transform hover:scale-105 
                       shadow-md hover:shadow-lg"
            onClick={handleAdminDashboard}
          >
            Admin Dashboard
          </button>
        )}
        <button 
          className="px-4 py-2 bg-gradient-to-r from-blue-500 to-blue-600 
                     text-white rounded-md hover:from-blue-600 hover:to-blue-700 
                     transition-all duration-300 transform hover:scale-105 
                     shadow-md hover:shadow-lg"
          onClick={isLoggedIn ? handleLogout : () => navigate('/login')}
        >
          {isLoggedIn ? 'Logout' : 'Login'}
        </button>
      </div>
    </nav>
  );
}

export default Navbar; 